const express = require('express');
const router = express.Router();
const {
    createSkill,
    getAllSkills,
    getSkillById,
    updateSkill,
<<<<<<< HEAD
    deleteSkill,
    replyToSkillRequest
=======
    deleteSkill
>>>>>>> 9b0a3de (feat: complete peer skill exchange and admin dashboard, security: untrack .env)
} = require('../../controllers/peer-skill-exchange/skillController');
const { protect } = require('../../middleware/authMiddleware');

router.route('/')
    .post(protect, createSkill)
    .get(getAllSkills);

<<<<<<< HEAD
router.post('/reply/:id', protect, replyToSkillRequest);

=======
>>>>>>> 9b0a3de (feat: complete peer skill exchange and admin dashboard, security: untrack .env)
router.route('/:id')
    .get(getSkillById)
    .put(protect, updateSkill)
    .delete(protect, deleteSkill);

module.exports = router;
