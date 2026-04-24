// controllers/Workshops/RequestController.js
const WorkshopRequest = require('../../models/Workshops/WorkshopRequest');
const Workshop = require('../../models/Workshops/Workshops');
const User = require('../../models/User');

const isBatchRep = (user) => {
  return user && user.isBatchRep === true;
};

const isLecturer = (user) => {
  return user && user.email && user.email.match(/^ept\d{3}@sliitplatform\.com$/);
};

const getBatchRepsForFacultyYear = async (faculty, academicYear) => {
  const batchReps = await User.find({
    isBatchRep: true,
    'batchRepDetails.faculty': faculty,
    'batchRepDetails.academicYear': academicYear
  });
  return batchReps;
};

// @desc    Request a workshop
// @route   POST /api/workshops/requests
// @access  Private
const requestWorkshop = async (req, res) => {
  const { topic, description, category, faculty, academicYear } = req.body;

  try {
    const user = await User.findById(req.user.id);
    
    const batchReps = await getBatchRepsForFacultyYear(faculty, academicYear);
    
    if (batchReps.length === 0) {
      return res.status(404).json({ 
        message: `No batch representative found for ${faculty} - ${academicYear}. Please contact an admin.` 
      });
    }
    
    const request = await WorkshopRequest.create({
      topic,
      description,
      category: category || 'Technical',
      faculty,
      academicYear,
      requestedBy: req.user.id,
      requestedByName: user.name,
      requestedByEmail: user.email,
      status: 'pending',
      assignedTo: batchReps[0]._id,
      assignedToName: batchReps[0].name,
      assignedToEmail: batchReps[0].email
    });

    res.status(201).json({ 
      message: 'Workshop request submitted successfully!',
      request 
    });
  } catch (error) {
    console.error('Error requesting workshop:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get workshop requests
// @route   GET /api/workshops/requests
// @access  Private
const getWorkshopRequests = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    let query = {};
    
    if (isBatchRep(user)) {
      query = {
        faculty: user.batchRepDetails.faculty,
        academicYear: user.batchRepDetails.academicYear,
        status: 'pending'
      };
    } else if (isLecturer(user) || user.role === 'admin') {
      query = { status: 'pending' };
    } else {
      query = { requestedBy: req.user.id };
    }
    
    const requests = await WorkshopRequest.find(query)
      .populate('requestedBy', 'name email avatar')
      .populate('assignedTo', 'name email')
      .sort('-createdAt');
    
    res.json(requests);
  } catch (error) {
    console.error('Error getting requests:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Approve workshop request
// @route   PUT /api/workshops/requests/:id/approve
// @access  Private
const approveWorkshopRequest = async (req, res) => {
  const { date, duration, location, capacity } = req.body;

  try {
    const user = await User.findById(req.user.id);
    const isAuthorized = isBatchRep(user) || isLecturer(user) || user.role === 'admin';
    
    if (!isAuthorized) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    const request = await WorkshopRequest.findById(req.params.id);
    
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }
    
    if (isBatchRep(user) && 
        (request.faculty !== user.batchRepDetails.faculty || 
         request.academicYear !== user.batchRepDetails.academicYear)) {
      return res.status(403).json({ message: 'Not authorized for this batch' });
    }
    
    const workshop = await Workshop.create({
      title: request.topic,
      description: request.description,
      category: request.category,
      date: new Date(date),
      duration,
      location,
      capacity: capacity || 50,
      academicYear: request.academicYear,
      faculty: request.faculty,
      createdBy: req.user.id,
      createdByEmail: user.email,
      workshopType: 'upcoming'
    });
    
    request.status = 'approved';
    request.responseMessage = `Workshop scheduled for ${new Date(date).toLocaleDateString()}`;
    request.respondedAt = new Date();
    request.scheduledWorkshop = workshop._id;
    await request.save();
    
    res.json({ 
      message: 'Workshop request approved',
      workshop,
      request
    });
  } catch (error) {
    console.error('Error approving request:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reject workshop request
// @route   PUT /api/workshops/requests/:id/reject
// @access  Private
const rejectWorkshopRequest = async (req, res) => {
  const { responseMessage } = req.body;
  
  try {
    const user = await User.findById(req.user.id);
    const isAuthorized = isBatchRep(user) || isLecturer(user) || user.role === 'admin';
    
    if (!isAuthorized) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    const request = await WorkshopRequest.findById(req.params.id);
    
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }
    
    if (isBatchRep(user) && 
        (request.faculty !== user.batchRepDetails.faculty || 
         request.academicYear !== user.batchRepDetails.academicYear)) {
      return res.status(403).json({ message: 'Not authorized for this batch' });
    }
    
    request.status = 'rejected';
    request.responseMessage = responseMessage || 'Request not approved at this time.';
    request.respondedAt = new Date();
    await request.save();
    
    res.json({ message: 'Request rejected', request });
  } catch (error) {
    console.error('Error rejecting request:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  requestWorkshop,
  getWorkshopRequests,
  approveWorkshopRequest,
  rejectWorkshopRequest
};