// controllers/Workshops/Workshops.js
const Workshop = require('../../models/Workshops/Workshops');
const User = require('../../models/User');

const isBatchRep = (user) => {
  return user && user.isBatchRep === true;
};

const isLecturer = (user) => {
  return user && user.email && user.email.match(/^ept\d{3}@sliitplatform\.com$/);
};

// @desc    Create a new workshop
// @route   POST /api/workshops
// @access  Private (Batch Reps, Lecturers, Admins)
const createWorkshop = async (req, res) => {
  const { title, description, category, date, duration, location, capacity, academicYear, faculty } = req.body;

  try {
    const user = await User.findById(req.user.id);
    const isAuthorized = isBatchRep(user) || isLecturer(user) || user.role === 'admin';

    if (!isAuthorized) {
      return res.status(403).json({ message: 'Only batch representatives and lecturers can create workshops' });
    }

    const workshop = await Workshop.create({
      title,
      description,
      category: category || 'Technical',
      date: new Date(date),
      duration,
      location,
      capacity: capacity || 50,
      academicYear: academicYear || 'Year 3 Sem 2',
      faculty: faculty || 'Computing',
      createdBy: req.user.id,
      createdByEmail: user.email,
      workshopType: new Date(date) > new Date() ? 'upcoming' : 'ended'
    });

    res.status(201).json(workshop);
  } catch (error) {
    console.error('Error creating workshop:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all workshops with filtering
// @route   GET /api/workshops
// @access  Private
const getAllWorkshops = async (req, res) => {
  try {
    const { type, category, faculty, academicYear, search } = req.query;
    let filter = { isActive: true };

    if (type && type !== 'all') filter.workshopType = type;
    if (category && category !== 'all') filter.category = category;
    if (faculty && faculty !== 'all') filter.faculty = faculty;
    if (academicYear && academicYear !== 'all') filter.academicYear = academicYear;
    
    if (search && search.trim() !== '') {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const workshops = await Workshop.find(filter)
      .populate('createdBy', 'name email avatar isBatchRep batchRepDetails')
      .populate('registeredStudents', 'name avatar')
      .populate('materials.uploadedBy', 'name')
      .populate('videos.uploadedBy', 'name')
      .sort({ date: 1 });

    const workshopsWithDetails = workshops.map(workshop => {
      const isRegistered = workshop.registeredStudents.some(
        student => student._id && student._id.toString() === req.user.id
      );
      const isOnWaitlist = workshop.waitlist.some(
        student => student.toString() === req.user.id
      );
      
      return {
        ...workshop.toObject(),
        isRegistered,
        isOnWaitlist,
        registrationCount: workshop.registeredStudents.length
      };
    });

    res.json(workshopsWithDetails);
  } catch (error) {
    console.error('Error getting workshops:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get workshop by ID
// @route   GET /api/workshops/:id
// @access  Private
const getWorkshopById = async (req, res) => {
  try {
    const workshop = await Workshop.findById(req.params.id)
      .populate('createdBy', 'name email avatar isBatchRep batchRepDetails')
      .populate('registeredStudents', 'name avatar email')
      .populate('waitlist', 'name avatar email')
      .populate('materials.uploadedBy', 'name')
      .populate('videos.uploadedBy', 'name');

    if (!workshop) {
      return res.status(404).json({ message: 'Workshop not found' });
    }

    const isRegistered = workshop.registeredStudents.some(
      student => student._id.toString() === req.user.id
    );
    const isOnWaitlist = workshop.waitlist.some(
      student => student.toString() === req.user.id
    );

    res.json({
      ...workshop.toObject(),
      isRegistered,
      isOnWaitlist,
      registrationCount: workshop.registeredStudents.length
    });
  } catch (error) {
    console.error('Error getting workshop:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Register for workshop
// @route   POST /api/workshops/:id/register
// @access  Private
const registerForWorkshop = async (req, res) => {
  try {
    const workshop = await Workshop.findById(req.params.id);

    if (!workshop) {
      return res.status(404).json({ message: 'Workshop not found' });
    }

    if (workshop.workshopType === 'ended') {
      return res.status(400).json({ message: 'This workshop has already ended' });
    }

    if (workshop.registeredStudents.includes(req.user.id)) {
      return res.status(400).json({ message: 'You are already registered' });
    }

    if (workshop.registeredStudents.length < workshop.capacity) {
      workshop.registeredStudents.push(req.user.id);
      await workshop.save();
      res.json({ message: 'Successfully registered!', status: 'registered' });
    } else {
      workshop.waitlist.push(req.user.id);
      await workshop.save();
      res.json({ message: 'Added to waitlist', status: 'waitlisted' });
    }
  } catch (error) {
    console.error('Error registering:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Cancel registration
// @route   DELETE /api/workshops/:id/cancel
// @access  Private
const cancelRegistration = async (req, res) => {
  try {
    const workshop = await Workshop.findById(req.params.id);

    if (!workshop) {
      return res.status(404).json({ message: 'Workshop not found' });
    }

    const registeredIndex = workshop.registeredStudents.indexOf(req.user.id);
    if (registeredIndex !== -1) {
      workshop.registeredStudents.splice(registeredIndex, 1);
      
      if (workshop.waitlist.length > 0) {
        const firstOnWaitlist = workshop.waitlist.shift();
        workshop.registeredStudents.push(firstOnWaitlist);
      }
      
      await workshop.save();
      res.json({ message: 'Registration cancelled' });
    } else {
      const waitlistIndex = workshop.waitlist.indexOf(req.user.id);
      if (waitlistIndex !== -1) {
        workshop.waitlist.splice(waitlistIndex, 1);
        await workshop.save();
        res.json({ message: 'Removed from waitlist' });
      } else {
        res.status(400).json({ message: 'Not registered' });
      }
    }
  } catch (error) {
    console.error('Error cancelling:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Upload video
// @route   POST /api/workshops/:id/videos
// @access  Private (Batch Reps, Lecturers, Admins)
const uploadVideo = async (req, res) => {
  const { title, description, videoUrl, platform } = req.body;

  try {
    const workshop = await Workshop.findById(req.params.id);
    const user = await User.findById(req.user.id);
    const isAuthorized = isBatchRep(user) || isLecturer(user) || user.role === 'admin';

    if (!isAuthorized) {
      return res.status(403).json({ message: 'Only batch reps and lecturers can upload videos' });
    }

    workshop.videos.push({
      title,
      description,
      videoUrl,
      platform: platform || 'youtube',
      uploadedBy: req.user.id
    });

    await workshop.save();
    res.status(201).json({ 
      message: 'Video added successfully', 
      video: workshop.videos[workshop.videos.length - 1] 
    });
  } catch (error) {
    console.error('Error uploading video:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Upload material
// @route   POST /api/workshops/:id/materials
// @access  Private (Batch Reps, Lecturers, Admins)
const uploadMaterial = async (req, res) => {
  const { title, description, fileUrl, fileName, fileType, fileSize } = req.body;

  try {
    const workshop = await Workshop.findById(req.params.id);
    const user = await User.findById(req.user.id);
    const isAuthorized = isBatchRep(user) || isLecturer(user) || user.role === 'admin';

    if (!isAuthorized) {
      return res.status(403).json({ message: 'Only batch reps and lecturers can upload materials' });
    }

    workshop.materials.push({
      title,
      description,
      fileUrl,
      fileName,
      fileType,
      fileSize,
      uploadedBy: req.user.id
    });

    await workshop.save();
    res.status(201).json({ 
      message: 'Material added successfully', 
      material: workshop.materials[workshop.materials.length - 1] 
    });
  } catch (error) {
    console.error('Error uploading material:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update workshop status
// @route   PUT /api/workshops/:id/status
// @access  Private (Batch Reps, Lecturers, Admins)
const updateWorkshopStatus = async (req, res) => {
  const { status } = req.body;

  try {
    const workshop = await Workshop.findById(req.params.id);
    const user = await User.findById(req.user.id);
    const isAuthorized = isBatchRep(user) || isLecturer(user) || user.role === 'admin';

    if (!isAuthorized) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    workshop.workshopType = status;
    await workshop.save();

    res.json({ message: 'Status updated', workshop });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createWorkshop,
  getAllWorkshops,
  getWorkshopById,
  registerForWorkshop,
  cancelRegistration,
  uploadMaterial,
  uploadVideo,
  updateWorkshopStatus
};