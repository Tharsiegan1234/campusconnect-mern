const express = require('express');
const router = express.Router();
const {
  getBuddyNotifications,
  getMaterialsWithTags,
  getWeeklySummary,
  getUpcomingSessions
} = require('../../controllers/StudyGroups/StudyBuddyController');

// Get all buddy notifications for a group
router.get('/notifications/:groupId', getBuddyNotifications);

// Get materials with auto-tags
router.get('/materials/:groupId', getMaterialsWithTags);

// Get weekly summary stats
router.get('/summary/:groupId', getWeeklySummary);

// Get upcoming session reminders
router.get('/upcoming-sessions/:groupId', getUpcomingSessions);

module.exports = router;