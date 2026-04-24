const SkillRequest = require('../../models/SkillExchange/SkillRequest');
const Skill = require('../../models/SkillExchange/Skill');
const User = require('../../models/User');
const { sendSkillReplyEmail } = require('../../utils/emailUtils');

// =======================
// SKILL REQUESTS (STUDENTS)
// =======================

// @desc    Create a new skill request
// @route   POST /api/skills/requests
// @access  Private (Student only)
exports.createSkillRequest = async (req, res) => {
    try {
        if (req.user.role !== 'student') {
            return res.status(403).json({ message: "Only students can create skill requests" });
        }

        const { title, description, skillsNeeded } = req.body;
        
        const skillRequest = await SkillRequest.create({
            title,
            description,
            skillsNeeded,
            requestedBy: req.user._id
        });

        const newRequest = await SkillRequest.findById(skillRequest._id).populate('requestedBy', 'name avatar role');
        res.status(201).json(newRequest);
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// @desc    Get all skill requests
// @route   GET /api/skills/requests
// @access  Private
exports.getSkillRequests = async (req, res) => {
    try {
        const requests = await SkillRequest.find()
            .populate('requestedBy', 'name avatar role')
            .populate('replies.expert', 'name avatar role')
            .sort({ createdAt: -1 });
        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// @desc    Update a skill request
// @route   PUT /api/skills/requests/:id
// @access  Private (Owner only)
exports.updateSkillRequest = async (req, res) => {
    try {
        const request = await SkillRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ message: "Request not found" });

        // Verify ownership
        if (request.requestedBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized to update this request" });
        }

        const { title, description, skillsNeeded } = req.body;
        request.title = title || request.title;
        request.description = description || request.description;
        if (skillsNeeded) request.skillsNeeded = skillsNeeded;

        await request.save();
        const updatedRequest = await SkillRequest.findById(request._id).populate('requestedBy', 'name avatar role');
        res.json(updatedRequest);
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// @desc    Delete a skill request
// @route   DELETE /api/skills/requests/:id
// @access  Private (Owner only)
exports.deleteSkillRequest = async (req, res) => {
    try {
        const request = await SkillRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ message: "Request not found" });

        // Verify ownership OR Admin Role
        if (req.user.role !== 'admin') {
            if (!request.requestedBy || request.requestedBy.toString() !== req.user._id.toString()) {
                return res.status(403).json({ message: "Not authorized to delete this request" });
            }
        }

        await request.deleteOne();
        res.json({ message: "Request removed" });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// @desc    Reply to a skill request (Expert only) trigger email
// @route   POST /api/skills/requests/:id/reply
// @access  Private (Expert only)
exports.replyToSkillRequest = async (req, res) => {
    try {
        if (req.user.role !== 'expert') {
            return res.status(403).json({ message: "Only experts can reply to requests" });
        }

        const request = await SkillRequest.findById(req.params.id).populate('requestedBy', 'name email');
        if (!request) return res.status(404).json({ message: "Request not found" });

        const { message } = req.body;
        if (!message) return res.status(400).json({ message: "Reply message is required" });

        // Save reply locally
        request.replies.push({
            expert: req.user._id,
            message
        });
        await request.save();

        // Send email to student
        const student = request.requestedBy;
        await sendSkillReplyEmail(student.email, student.name, req.user.name, message);

        res.json({ message: "Reply sent successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// =======================
// SKILLS (EXPERTS)
// =======================

// @desc    Publish a new skill
// @route   POST /api/skills/offers
// @access  Private (Expert only)
exports.createSkill = async (req, res) => {
    try {
        if (req.user.role !== 'expert') {
            return res.status(403).json({ message: "Only experts can publish skills" });
        }

        const { title, description, skillsOffered } = req.body;
        
        const skill = await Skill.create({
            title,
            description,
            skillsOffered,
            publishedBy: req.user._id
        });

        const newSkill = await Skill.findById(skill._id).populate('publishedBy', 'name avatar role');
        res.status(201).json(newSkill);
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// @desc    Get all published skills
// @route   GET /api/skills/offers
// @access  Private
exports.getSkills = async (req, res) => {
    try {
        const skills = await Skill.find()
            .populate('publishedBy', 'name avatar role email')
            .populate('interestedStudents', 'name avatar role email')
            .sort({ createdAt: -1 });
        res.json(skills);
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// @desc    Get a single published skill by ID
// @route   GET /api/skills/offers/:id
// @access  Private
exports.getSkillById = async (req, res) => {
    try {
        const skill = await Skill.findById(req.params.id)
            .populate('publishedBy', 'name avatar role email phone')
            .populate('interestedStudents', 'name avatar role email phone');
        if (!skill) return res.status(404).json({ message: "Skill not found" });
        res.json(skill);
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// @desc    Update a skill
// @route   PUT /api/skills/offers/:id
// @access  Private (Owner only)
exports.updateSkill = async (req, res) => {
    try {
        const skill = await Skill.findById(req.params.id);
        if (!skill) return res.status(404).json({ message: "Skill not found" });

        // Verify ownership
        if (skill.publishedBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Not authorized to update this skill" });
        }

        const { title, description, skillsOffered } = req.body;
        skill.title = title || skill.title;
        skill.description = description || skill.description;
        if (skillsOffered) skill.skillsOffered = skillsOffered;

        await skill.save();
        const updatedSkill = await Skill.findById(skill._id).populate('publishedBy', 'name avatar role');
        res.json(updatedSkill);
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// @desc    Delete a skill
// @route   DELETE /api/skills/offers/:id
// @access  Private (Owner only)
exports.deleteSkill = async (req, res) => {
    try {
        const skill = await Skill.findById(req.params.id);
        if (!skill) return res.status(404).json({ message: "Skill not found" });

        // Verify ownership OR Admin Role
        if (req.user.role !== 'admin') {
            if (!skill.publishedBy || skill.publishedBy.toString() !== req.user._id.toString()) {
                return res.status(403).json({ message: "Not authorized to delete this skill" });
            }
        }

        await skill.deleteOne();
        res.json({ message: "Skill removed" });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};

// @desc    Enroll/Express interest in a skill
// @route   POST /api/skills/offers/:id/enroll
// @access  Private (Student only)
exports.enrollInSkill = async (req, res) => {
    try {
        if (req.user.role !== 'student') {
            return res.status(403).json({ message: "Only students can enroll in skills" });
        }

        const skill = await Skill.findById(req.params.id);
        if (!skill) return res.status(404).json({ message: "Skill not found" });

        // Check if already enrolled
        if (skill.interestedStudents.includes(req.user._id)) {
            return res.status(400).json({ message: "Already enrolled" });
        }

        skill.interestedStudents.push(req.user._id);
        await skill.save();

        res.json({ message: "Successfully enrolled in skill module" });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
};
