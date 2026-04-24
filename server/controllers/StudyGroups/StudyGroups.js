// controllers/StudyGroups/StudyGroups.js
const StudyGroup = require('../../models/StudyGroups/StudyGroups');
const User = require('../../models/User');

// @desc    Create a new study group
// @route   POST /api/study-groups
// @access  Private
const createStudyGroup = async (req, res) => {
  const { name, description, type, faculty, academicYear, participantLimit } = req.body;

  try {
    console.log('📝 Creating study group for user:', req.user.id);
    console.log('📝 Request body:', req.body);

    // Check if user is student
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can create study groups' });
    }

    // Check if user is already in 10 groups
    const userGroups = await StudyGroup.find({
      'members.user': req.user.id,
      'members.status': 'approved'
    });

    if (userGroups.length >= 10) {
      return res.status(400).json({ message: 'You are already in 10 study groups. Leave one to create a new group.' });
    }

    const studyGroup = await StudyGroup.create({
      name,
      description,
      type: type || 'open',
      faculty: faculty || 'Computing',
      academicYear: academicYear || 'Year 1',
      owner: req.user.id,
      participantLimit: type === 'private' ? participantLimit || 20 : null,
      members: [{
        user: req.user.id,
        status: 'approved',
        joinedAt: Date.now()
      }]
    });

    console.log('✅ Study group created:', studyGroup._id);
    res.status(201).json(studyGroup);
  } catch (error) {
    console.error('❌ Error creating study group:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all study groups with filtering
// @route   GET /api/study-groups
// @access  Private
const getAllStudyGroups = async (req, res) => {
  try {
    const { faculty, type, academicYear, search } = req.query;
    let filter = { isActive: true };

    console.log('\n=== 🔍 GET ALL STUDY GROUPS ===');
    console.log('📥 Query params:', { faculty, type, academicYear, search });

    if (faculty && faculty !== 'all') {
      filter.faculty = faculty;
      console.log('✓ Applied faculty filter:', faculty);
    }

    if (type && type !== 'all') {
      filter.type = type;
      console.log('✓ Applied type filter:', type);
    }

    if (academicYear && academicYear !== 'all') {
      filter.academicYear = academicYear;
      console.log('✓ Applied academic year filter:', academicYear);
    }
    
    if (search && search.trim() !== '') {
      const searchTerm = search.trim();
      console.log('🔎 Applying search filter for:', searchTerm);
      filter.$or = [
        { name: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } }
      ];
    }

    const studyGroups = await StudyGroup.find(filter)
      .populate('owner', 'name avatar')
      .populate('members.user', 'name avatar')
      .sort('-createdAt');

    console.log(`📊 Found ${studyGroups.length} group(s) matching criteria`);

    const groupsWithDetails = studyGroups.map(group => {
      const userMembership = group.members.find(m => 
        m.user && m.user._id && m.user._id.toString() === req.user.id
      );
      return {
        ...group.toObject(),
        memberCount: group.members.filter(m => m.status === 'approved').length,
        userStatus: userMembership ? userMembership.status : null
      };
    });

    res.json(groupsWithDetails);
  } catch (error) {
    console.error('❌ Error getting study groups:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user's study groups
// @route   GET /api/study-groups/my-groups
// @access  Private
const getMyStudyGroups = async (req, res) => {
  try {
    const studyGroups = await StudyGroup.find({
      'members.user': req.user.id,
      'members.status': 'approved'
    })
      .populate('owner', 'name avatar')
      .populate('members.user', 'name avatar')
      .sort('-updatedAt');

    const groupsWithDetails = studyGroups.map(group => ({
      ...group.toObject(),
      memberCount: group.members.filter(m => m.status === 'approved').length,
      isOwner: group.owner && group.owner._id && group.owner._id.toString() === req.user.id
    }));

    res.json(groupsWithDetails);
  } catch (error) {
    console.error('❌ Error getting my study groups:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get pending group requests
// @route   GET /api/study-groups/pending-requests
// @access  Private
const getPendingRequests = async (req, res) => {
  try {
    const groups = await StudyGroup.find({
      owner: req.user.id,
      'members.status': 'pending'
    })
      .populate('members.user', 'name avatar')
      .select('name members');

    const pendingRequests = groups.flatMap(group => 
      group.members
        .filter(m => m.status === 'pending')
        .map(request => ({
          groupId: group._id,
          groupName: group.name,
          userId: request.user._id,
          userName: request.user.name,
          userAvatar: request.user.avatar,
          requestedAt: request.joinedAt
        }))
    );

    res.json(pendingRequests);
  } catch (error) {
    console.error('❌ Error getting pending requests:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Request to join a study group
// @route   POST /api/study-groups/:groupId/request
// @access  Private
const requestToJoin = async (req, res) => {
  try {
    const studyGroup = await StudyGroup.findById(req.params.groupId);

    if (!studyGroup) {
      return res.status(404).json({ message: 'Study group not found' });
    }

    if (!studyGroup.isActive) {
      return res.status(400).json({ message: 'Study group is no longer active' });
    }

    const existingMembership = studyGroup.members.find(
      m => m.user.toString() === req.user.id
    );

    if (existingMembership) {
      if (existingMembership.status === 'approved') {
        return res.status(400).json({ message: 'You are already a member of this group' });
      } else if (existingMembership.status === 'pending') {
        return res.status(400).json({ message: 'Your request is already pending' });
      }
    }

    const userGroups = await StudyGroup.find({
      'members.user': req.user.id,
      'members.status': 'approved'
    });

    if (userGroups.length >= 10) {
      return res.status(400).json({ message: 'You cannot join more than 10 study groups' });
    }

    if (studyGroup.type === 'open') {
      const approvedMembers = studyGroup.members.filter(m => m.status === 'approved');
      if (studyGroup.participantLimit && approvedMembers.length >= studyGroup.participantLimit) {
        return res.status(400).json({ message: 'Group has reached maximum capacity' });
      }

      studyGroup.members.push({
        user: req.user.id,
        status: 'approved',
        joinedAt: Date.now()
      });
      await studyGroup.save();
      
      return res.json({ message: 'Successfully joined the group', status: 'approved' });
    }

    studyGroup.members.push({
      user: req.user.id,
      status: 'pending',
      joinedAt: Date.now()
    });
    await studyGroup.save();

    res.json({ message: 'Request sent to group owner', status: 'pending' });
  } catch (error) {
    console.error('❌ Error joining group:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Handle join request (approve/reject)
// @route   PUT /api/study-groups/:groupId/handle-request/:userId
// @access  Private (Owner only)
const handleJoinRequest = async (req, res) => {
  const { groupId, userId } = req.params;
  const { action } = req.body;

  try {
    const studyGroup = await StudyGroup.findById(groupId);

    if (!studyGroup) {
      return res.status(404).json({ message: 'Study group not found' });
    }

    if (studyGroup.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only group owner can handle requests' });
    }

    const memberIndex = studyGroup.members.findIndex(
      m => m.user.toString() === userId && m.status === 'pending'
    );

    if (memberIndex === -1) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (action === 'approve') {
      studyGroup.members[memberIndex].status = 'approved';
      studyGroup.members[memberIndex].joinedAt = Date.now();
      await studyGroup.save();
      res.json({ message: 'Request approved' });
    } else if (action === 'reject') {
      studyGroup.members.splice(memberIndex, 1);
      await studyGroup.save();
      res.json({ message: 'Request rejected' });
    } else {
      res.status(400).json({ message: 'Invalid action' });
    }
  } catch (error) {
    console.error('❌ Error handling request:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Leave a study group
// @route   DELETE /api/study-groups/:groupId/leave
// @access  Private
const leaveGroup = async (req, res) => {
  try {
    const studyGroup = await StudyGroup.findById(req.params.groupId);

    if (!studyGroup) {
      return res.status(404).json({ message: 'Study group not found' });
    }

    const memberIndex = studyGroup.members.findIndex(
      m => m.user.toString() === req.user.id && m.status === 'approved'
    );

    if (memberIndex === -1) {
      return res.status(404).json({ message: 'You are not a member of this group' });
    }

    if (studyGroup.owner.toString() === req.user.id) {
      const otherMembers = studyGroup.members.filter(
        m => m.user.toString() !== req.user.id && m.status === 'approved'
      );

      if (otherMembers.length === 0) {
        await studyGroup.deleteOne();
        return res.json({ message: 'Group deleted as you were the only member' });
      } else {
        studyGroup.owner = otherMembers[0].user;
        studyGroup.members.splice(memberIndex, 1);
        await studyGroup.save();
        return res.json({ message: 'You left the group and transferred ownership to the next member' });
      }
    }

    studyGroup.members.splice(memberIndex, 1);
    await studyGroup.save();

    res.json({ message: 'Successfully left the group' });
  } catch (error) {
    console.error('❌ Error leaving group:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete study group
// @route   DELETE /api/study-groups/:groupId
// @access  Private (Owner only)
const deleteStudyGroup = async (req, res) => {
  try {
    const studyGroup = await StudyGroup.findById(req.params.groupId);

    if (!studyGroup) {
      return res.status(404).json({ message: 'Study group not found' });
    }

    if (studyGroup.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only group owner can delete the group' });
    }

    await studyGroup.deleteOne();
    res.json({ message: 'Study group deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting group:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get study group details
// @route   GET /api/study-groups/:groupId
// @access  Private
const getStudyGroupDetails = async (req, res) => {
  try {
    const studyGroup = await StudyGroup.findById(req.params.groupId)
      .populate('owner', 'name avatar')
      .populate('members.user', 'name avatar')
      .populate('studyMaterials.uploadedBy', 'name avatar')
      .populate('studySessions.createdBy', 'name avatar')
      .populate('messages.user', 'name avatar');

    if (!studyGroup) {
      return res.status(404).json({ message: 'Study group not found' });
    }

    const userMembership = studyGroup.members.find(
      m => m.user && m.user._id && m.user._id.toString() === req.user.id
    );

    const groupDetails = {
      ...studyGroup.toObject(),
      memberCount: studyGroup.members.filter(m => m.status === 'approved').length,
      userStatus: userMembership ? userMembership.status : null,
      isOwner: studyGroup.owner && studyGroup.owner._id && studyGroup.owner._id.toString() === req.user.id
    };

    res.json(groupDetails);
  } catch (error) {
    console.error('❌ Error getting group details:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add study material to group
// @route   POST /api/study-groups/:groupId/materials
// @access  Private (Members only)
const addStudyMaterial = async (req, res) => {
  const { title, description, fileUrl, fileName, fileType, fileSize } = req.body;

  try {
    const studyGroup = await StudyGroup.findById(req.params.groupId);

    if (!studyGroup) {
      return res.status(404).json({ message: 'Study group not found' });
    }

    const isMember = studyGroup.members.some(
      m => m.user.toString() === req.user.id && m.status === 'approved'
    );

    if (!isMember && studyGroup.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only group members can add study materials' });
    }

    studyGroup.studyMaterials.push({
      title,
      description,
      fileUrl,
      fileName,
      fileType,
      fileSize,
      uploadedBy: req.user.id
    });

    await studyGroup.save();
    res.status(201).json({ 
      message: 'Study material added successfully', 
      material: studyGroup.studyMaterials[studyGroup.studyMaterials.length - 1] 
    });
  } catch (error) {
    console.error('❌ Error adding study material:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete study material
// @route   DELETE /api/study-groups/:groupId/materials/:materialId
// @access  Private (Uploader or owner)
const deleteStudyMaterial = async (req, res) => {
  const { groupId, materialId } = req.params;

  try {
    const studyGroup = await StudyGroup.findById(groupId);

    if (!studyGroup) {
      return res.status(404).json({ message: 'Study group not found' });
    }

    const materialIndex = studyGroup.studyMaterials.findIndex(
      m => m._id.toString() === materialId
    );

    if (materialIndex === -1) {
      return res.status(404).json({ message: 'Study material not found' });
    }

    const material = studyGroup.studyMaterials[materialIndex];
    
    if (material.uploadedBy.toString() !== req.user.id && studyGroup.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only delete your own materials' });
    }

    studyGroup.studyMaterials.splice(materialIndex, 1);
    await studyGroup.save();

    res.json({ message: 'Study material deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting study material:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add study session
// @route   POST /api/study-groups/:groupId/sessions
// @access  Private (Members only)
const addStudySession = async (req, res) => {
  const { title, description, date, duration, location, resources } = req.body;

  try {
    const studyGroup = await StudyGroup.findById(req.params.groupId);

    if (!studyGroup) {
      return res.status(404).json({ message: 'Study group not found' });
    }

    const isMember = studyGroup.members.some(
      m => m.user.toString() === req.user.id && m.status === 'approved'
    );

    if (!isMember && studyGroup.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only group members can add study sessions' });
    }

    studyGroup.studySessions.push({
      title,
      description,
      date: new Date(date),
      duration,
      location,
      resources: resources || [],
      createdBy: req.user.id
    });

    await studyGroup.save();
    res.status(201).json({ 
      message: 'Study session added successfully', 
      session: studyGroup.studySessions[studyGroup.studySessions.length - 1] 
    });
  } catch (error) {
    console.error('❌ Error adding study session:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete study session
// @route   DELETE /api/study-groups/:groupId/sessions/:sessionId
// @access  Private (Creator or owner)
const deleteStudySession = async (req, res) => {
  const { groupId, sessionId } = req.params;

  try {
    const studyGroup = await StudyGroup.findById(groupId);

    if (!studyGroup) {
      return res.status(404).json({ message: 'Study group not found' });
    }

    const sessionIndex = studyGroup.studySessions.findIndex(
      s => s._id.toString() === sessionId
    );

    if (sessionIndex === -1) {
      return res.status(404).json({ message: 'Study session not found' });
    }

    const session = studyGroup.studySessions[sessionIndex];
    
    if (session.createdBy.toString() !== req.user.id && studyGroup.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You can only delete your own sessions' });
    }

    studyGroup.studySessions.splice(sessionIndex, 1);
    await studyGroup.save();

    res.json({ message: 'Study session deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting study session:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Send message in group chat
// @route   POST /api/study-groups/:groupId/messages
// @access  Private (Members only)
const sendMessage = async (req, res) => {
  const { text } = req.body;

  try {
    const studyGroup = await StudyGroup.findById(req.params.groupId);

    if (!studyGroup) {
      return res.status(404).json({ message: 'Study group not found' });
    }

    const isMember = studyGroup.members.some(
      m => m.user.toString() === req.user.id && m.status === 'approved'
    );

    if (!isMember && studyGroup.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only group members can send messages' });
    }

    studyGroup.messages.push({
      text,
      user: req.user.id,
      userName: req.user.name,
      userAvatar: req.user.avatar,
      createdAt: new Date()
    });

    await studyGroup.save();
    
    const newMessage = studyGroup.messages[studyGroup.messages.length - 1];
    res.status(201).json(newMessage);
  } catch (error) {
    console.error('❌ Error sending message:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get group messages
// @route   GET /api/study-groups/:groupId/messages
// @access  Private (Members only)
const getMessages = async (req, res) => {
  try {
    const studyGroup = await StudyGroup.findById(req.params.groupId)
      .populate('messages.user', 'name avatar');

    if (!studyGroup) {
      return res.status(404).json({ message: 'Study group not found' });
    }

    const isMember = studyGroup.members.some(
      m => m.user.toString() === req.user.id && m.status === 'approved'
    );

    if (!isMember && studyGroup.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only group members can view messages' });
    }

    res.json(studyGroup.messages);
  } catch (error) {
    console.error('❌ Error getting messages:', error);
    res.status(500).json({ message: error.message });
  }
};

// Placeholder functions for backward compatibility
const addMeeting = async (req, res) => {
  res.json({ message: 'Add meeting - use study sessions instead' });
};

const addSession = async (req, res) => {
  res.json({ message: 'Add session - use study sessions instead' });
};

module.exports = {
  createStudyGroup,
  getAllStudyGroups,
  getMyStudyGroups,
  getPendingRequests,
  requestToJoin,
  handleJoinRequest,
  leaveGroup,
  deleteStudyGroup,
  getStudyGroupDetails,
  addMeeting,
  addSession,
  addStudyMaterial,
  deleteStudyMaterial,
  addStudySession,
  deleteStudySession,
  sendMessage,
  getMessages
};