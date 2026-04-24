// routes/Workshops/Workshops.js
const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/authMiddleware');
const {
  createWorkshop,
  getAllWorkshops,
  getWorkshopById,
  registerForWorkshop,
  cancelRegistration,
  uploadMaterial,
  uploadVideo,
  updateWorkshopStatus
} = require('../../controllers/Workshops/Workshops');

const {
  requestWorkshop,
  getWorkshopRequests,
  approveWorkshopRequest,
  rejectWorkshopRequest
} = require('../../controllers/Workshops/RequestController');

// ALL ROUTES REQUIRE AUTHENTICATION
router.get('/', protect, getAllWorkshops);
router.get('/:id', protect, getWorkshopById);
router.post('/', protect, createWorkshop);
router.put('/:id/status', protect, updateWorkshopStatus);
router.post('/:id/register', protect, registerForWorkshop);
router.delete('/:id/cancel', protect, cancelRegistration);
router.post('/:id/materials', protect, uploadMaterial);
router.post('/:id/videos', protect, uploadVideo);
router.post('/requests', protect, requestWorkshop);
router.get('/requests', protect, getWorkshopRequests);
router.put('/requests/:id/approve', protect, approveWorkshopRequest);
router.put('/requests/:id/reject', protect, rejectWorkshopRequest);

module.exports = router;