// routes/StudyGroups/StudyGroups.js
const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/study-materials/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'), false);
  }
};

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: fileFilter
});

const {
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
  getMessages,
  requestStudySession,
  getSessionRequests,
  approveSessionRequest,
  rejectSessionRequest,
  uploadStudyMaterial
} = require('../../controllers/StudyGroups/StudyGroups');

// Debug middleware
router.use((req, res, next) => {
  console.log(`Study Group Route: ${req.method} ${req.originalUrl}`);
  next();
});

// DEBUG ROUTE - Add this endpoint
router.get('/debug/all', protect, async (req, res) => {
  try {
    const StudyGroup = require('../../models/StudyGroups/StudyGroups');
    const allGroups = await StudyGroup.find({})
      .populate('owner', 'name avatar')
      .populate('members.user', 'name avatar');
    
    console.log('\n=== 🔍 DEBUG - All groups in database ===');
    console.log(`Total groups: ${allGroups.length}`);
    
    const groupsData = allGroups.map(g => ({
      id: g._id,
      name: g.name,
      isActive: g.isActive,
      type: g.type,
      faculty: g.faculty,
      academicYear: g.academicYear,
      memberCount: g.members.filter(m => m.status === 'approved').length,
      owner: g.owner ? g.owner.name : 'Unknown'
    }));
    
    console.log('Groups:', groupsData);
    res.json({ 
      total: allGroups.length,
      groups: groupsData
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Add a simple test endpoint without authentication for testing
router.get('/public/all', async (req, res) => {
  try {
    const StudyGroup = require('../../models/StudyGroups/StudyGroups');
    const allGroups = await StudyGroup.find({})
      .populate('owner', 'name avatar')
      .limit(10);
    
    res.json({ 
      total: allGroups.length,
      groups: allGroups.map(g => ({
        id: g._id,
        name: g.name,
        description: g.description,
        type: g.type,
        faculty: g.faculty,
        isActive: g.isActive,
        memberCount: g.members.length
      }))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.route('/')
  .get(protect, getAllStudyGroups)
  .post(protect, createStudyGroup);

router.get('/my-groups', protect, getMyStudyGroups);
router.get('/pending-requests', protect, getPendingRequests);

router.post('/:groupId/request', protect, requestToJoin);
router.put('/:groupId/handle-request/:userId', protect, handleJoinRequest);
router.delete('/:groupId/leave', protect, leaveGroup);
router.delete('/:groupId', protect, deleteStudyGroup);
router.get('/:groupId', protect, getStudyGroupDetails);

// Study Materials routes
router.post('/:groupId/materials', protect, upload.single('file'), uploadStudyMaterial);
router.delete('/:groupId/materials/:materialId', protect, deleteStudyMaterial);

// Study Sessions routes
router.post('/:groupId/sessions', protect, addStudySession);
router.delete('/:groupId/sessions/:sessionId', protect, deleteStudySession);

// Session Requests routes
router.post('/:groupId/session-requests', protect, requestStudySession);
router.get('/:groupId/session-requests', protect, getSessionRequests);
router.put('/:groupId/session-requests/:requestId/approve', protect, approveSessionRequest);
router.delete('/:groupId/session-requests/:requestId', protect, rejectSessionRequest);

// Chat routes
router.post('/:groupId/messages', protect, sendMessage);
router.get('/:groupId/messages', protect, getMessages);

// Keep old routes for compatibility
router.post('/:groupId/meetings', protect, addMeeting);
router.post('/:groupId/sessions', protect, addSession);

module.exports = router;