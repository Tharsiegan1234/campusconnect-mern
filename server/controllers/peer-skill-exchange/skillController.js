const Skill = require('../../models/peer-skill-exchange/Skill');
const Response = require('../../models/peer-skill-exchange/Response');
const { sendSkillReplyEmail } = require('../../utils/emailUtils');
<<<<<<< HEAD
=======
>>>>>>> 9b0a3de (feat: complete peer skill exchange and admin dashboard, security: untrack .env)
=======
>>>>>>> 367d6a9 (fix DB connection)

// @desc    Create a new skill listing
// @route   POST /api/peer-skills
// @access  Private
const createSkill = async (req, res) => {
    try {
        const { title, type, category, description } = req.body;

        const skill = await Skill.create({
            title,
            type,
            category,
            description,
            createdBy: req.user.id
        });

        res.status(201).json(skill);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
<<<<<<< HEAD
=======
        res.status(500).json({ message: 'Database Connection Error', details: error.message });
>>>>>>> 9b0a3de (feat: complete peer skill exchange and admin dashboard, security: untrack .env)
=======
>>>>>>> 367d6a9 (fix DB connection)
    }
};

// @desc    Get all skill listings
// @route   GET /api/peer-skills
// @access  Public/Private
const getAllSkills = async (req, res) => {
    try {
        const skills = await Skill.find().populate('createdBy', 'firstName lastName email profilePicture');
        res.status(200).json(skills);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
<<<<<<< HEAD
=======
        const skills = await Skill.find().populate('createdBy', 'name email avatar');
        res.status(200).json(skills);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Database Connection Error', details: error.message });
>>>>>>> 9b0a3de (feat: complete peer skill exchange and admin dashboard, security: untrack .env)
=======
>>>>>>> 367d6a9 (fix DB connection)
    }
};

// @desc    Get skill listing by ID
// @route   GET /api/peer-skills/:id
// @access  Public/Private
const getSkillById = async (req, res) => {
    try {
        const skill = await Skill.findById(req.params.id).populate('createdBy', 'firstName lastName email profilePicture');
<<<<<<< HEAD
=======
        const skill = await Skill.findById(req.params.id).populate('createdBy', 'name email avatar');
>>>>>>> 9b0a3de (feat: complete peer skill exchange and admin dashboard, security: untrack .env)
=======
>>>>>>> 367d6a9 (fix DB connection)

        if (!skill) {
            return res.status(404).json({ message: 'Skill listing not found' });
        }

        res.status(200).json(skill);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
<<<<<<< HEAD
=======
        res.status(500).json({ message: 'Database Connection Error', details: error.message });
>>>>>>> 9b0a3de (feat: complete peer skill exchange and admin dashboard, security: untrack .env)
=======
>>>>>>> 367d6a9 (fix DB connection)
    }
};

// @desc    Update a skill listing
// @route   PUT /api/peer-skills/:id
// @access  Private
const updateSkill = async (req, res) => {
    try {
        let skill = await Skill.findById(req.params.id);

        if (!skill) {
            return res.status(404).json({ message: 'Skill listing not found' });
        }

        // Check if user is the creator or an admin
        if (skill.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ message: 'User not authorized to update this listing' });
        }

        // Update fields explicitly
        skill.title = req.body.title || skill.title;
        skill.type = req.body.type || skill.type;
        skill.category = req.body.category || skill.category;
        skill.description = req.body.description || skill.description;

        const updatedSkill = await skill.save();

        res.status(200).json(updatedSkill);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
<<<<<<< HEAD
=======
        res.status(500).json({ message: 'Database Connection Error', details: error.message });
>>>>>>> 9b0a3de (feat: complete peer skill exchange and admin dashboard, security: untrack .env)
=======
>>>>>>> 367d6a9 (fix DB connection)
    }
};

// @desc    Delete a skill listing
// @route   DELETE /api/peer-skills/:id
// @access  Private
const deleteSkill = async (req, res) => {
    try {
        const skill = await Skill.findById(req.params.id);

        if (!skill) {
            return res.status(404).json({ message: 'Skill listing not found' });
        }

        // Check if user is the creator or an admin
        if (skill.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ message: 'User not authorized to delete this listing' });
        }

        await skill.deleteOne();

        res.status(200).json({ message: 'Skill listing removed' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Reply to a skill request (Expert only)
// @route   POST /api/peer-skills/reply/:id
// @access  Private (Expert)
const replyToSkillRequest = async (req, res) => {
    try {
        const { message } = req.body;
        const skill = await Skill.findById(req.params.id).populate('createdBy', 'firstName lastName email');

        if (!skill) {
            return res.status(404).json({ message: 'Skill request not found' });
        }

        if (skill.type !== 'request') {
            return res.status(400).json({ message: 'Can only reply to skill requests' });
        }

        // Check if user is an expert
        if (req.user.role !== 'expert' && req.user.role !== 'admin') {
            return res.status(401).json({ message: 'Only experts can reply to skill requests' });
        }

        const response = await Response.create({
            skillRequest: req.params.id,
            expert: req.user.id,
            message
        });

        // Send formal email notification to the student
        await sendSkillReplyEmail(
            skill.createdBy.email,
            `${skill.createdBy.firstName} ${skill.createdBy.lastName}`,
            `${req.user.firstName} ${req.user.lastName}`,
            skill.title,
            message
        );

        res.status(201).json({
            message: 'Reply sent successfully and student notified via email',
            response
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
<<<<<<< HEAD
=======
        res.status(500).json({ message: 'Database Connection Error', details: error.message });
>>>>>>> 9b0a3de (feat: complete peer skill exchange and admin dashboard, security: untrack .env)
=======
>>>>>>> 367d6a9 (fix DB connection)
    }
};

module.exports = {
    createSkill,
    getAllSkills,
    getSkillById,
    updateSkill,
    deleteSkill,
    replyToSkillRequest
<<<<<<< HEAD
=======
    deleteSkill
>>>>>>> 9b0a3de (feat: complete peer skill exchange and admin dashboard, security: untrack .env)
=======
>>>>>>> 367d6a9 (fix DB connection)
};
