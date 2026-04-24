// In controllers/StudyGroups/StudyGroups.js
const createStudyGroup = async (req, res) => {
  const { name, description, type, faculty, academicYear, participantLimit } = req.body;

  try {
    console.log('\n=== 🚀 CREATE STUDY GROUP ===');
    console.log('User:', req.user.id, req.user.name);
    console.log('Request body:', req.body);

    // Check if user is student
    if (req.user.role !== 'student') {
      console.log('❌ User is not a student:', req.user.role);
      return res.status(403).json({ message: 'Only students can create study groups' });
    }

    // Validate required fields
    if (!name || !description) {
      console.log('❌ Missing required fields');
      return res.status(400).json({ message: 'Name and description are required' });
    }

    // Check if user is already in 10 groups
    const userGroups = await StudyGroup.find({
      'members.user': req.user.id,
      'members.status': 'approved'
    });

    if (userGroups.length >= 10) {
      console.log('❌ User already in 10 groups');
      return res.status(400).json({ message: 'You are already in 10 study groups. Leave one to create a new group.' });
    }

    // Create the group
    const studyGroupData = {
      name: name.trim(),
      description: description.trim(),
      type: type || 'open',
      faculty: faculty || 'Computing',
      academicYear: academicYear || 'Year 1',
      owner: req.user.id,
      participantLimit: type === 'private' ? participantLimit || 20 : null,
      members: [{
        user: req.user.id,
        status: 'approved',
        joinedAt: Date.now()
      }],
      isActive: true  // Explicitly set isActive to true
    };

    console.log('Creating group with data:', studyGroupData);

    const studyGroup = await StudyGroup.create(studyGroupData);

    console.log('✅ Study group created successfully!');
    console.log('Group ID:', studyGroup._id);
    console.log('Group Name:', studyGroup.name);
    console.log('Is Active:', studyGroup.isActive);

    // Populate owner info before sending response
    const populatedGroup = await StudyGroup.findById(studyGroup._id)
      .populate('owner', 'name avatar');

    res.status(201).json(populatedGroup);
  } catch (error) {
    console.error('❌ Error creating study group:', error);
    res.status(500).json({ 
      message: error.message,
      details: error.errors 
    });
  }
};