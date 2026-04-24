const express = require('express');
const router = express.Router();
const { 
    createSkillRequest, 
    getSkillRequests, 
    updateSkillRequest, 
    deleteSkillRequest, 
    replyToSkillRequest,
    createSkill,
    getSkills,
    updateSkill,
    deleteSkill,
    enrollInSkill
} = require('../../controllers/SkillExchange/skillController');

const { protect } = require('../../middleware/authMiddleware');

// Skill Requests Routes
router.route('/requests')
    .post(protect, createSkillRequest)
    .get(protect, getSkillRequests);

router.route('/requests/:id')
    .put(protect, updateSkillRequest)
    .delete(protect, deleteSkillRequest);

router.post('/requests/:id/reply', protect, replyToSkillRequest);

// Skills (Offers) Routes
router.route('/offers')
    .post(protect, createSkill)
    .get(protect, getSkills);

// Enroll in skill
router.post('/enroll/:id', protect, enrollInSkill);

router.route('/offers/:id')
    .put(protect, updateSkill)
    .delete(protect, deleteSkill);

module.exports = router;
