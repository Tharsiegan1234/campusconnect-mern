const express = require('express');
const router = express.Router();
const {
    createSkill,
    getAllSkills,
    getSkillById,
    updateSkill,
    deleteSkill,
    replyToSkillRequest
} = require('../../controllers/peer-skill-exchange/skillController');
const { protect } = require('../../middleware/authMiddleware');

router.route('/')
    .post(protect, createSkill)
    .get(getAllSkills);

router.post('/reply/:id', protect, replyToSkillRequest);
router.route('/:id')
    .get(getSkillById)
    .put(protect, updateSkill)
    .delete(protect, deleteSkill);

module.exports = router;
