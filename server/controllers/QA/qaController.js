const Group = require("../../models/QA/Group");
const Question = require("../../models/QA/Question");
const Answer = require("../../models/QA/Answer");
const User = require("../../models/User");
const Notification = require("../../models/QA/Notification");

// @desc    Get all groups
// @route   GET /api/qa/groups
// @access  Private
exports.getGroups = async (req, res) => {
    try {
        const groups = await Group.find();
        res.json(groups);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    Join a group
// @route   POST /api/qa/groups/:groupId/join
// @access  Private
exports.joinGroup = async (req, res) => {
    try {
        const group = await Group.findById(req.params.groupId);
        if (!group) return res.status(404).json({ message: "Group not found" });

        const userId = req.user.id;

        if (!group.members.includes(userId)) {
            group.members.push(userId);
            await group.save();

            await User.findByIdAndUpdate(userId, {
                $addToSet: { joinedGroups: group._id }
            });
        }

        res.json({ message: "Joined successfully", groupId: group._id });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    Leave a group
// @route   POST /api/qa/groups/:groupId/leave
// @access  Private
exports.leaveGroup = async (req, res) => {
    try {
        const group = await Group.findById(req.params.groupId);
        if (!group) return res.status(404).json({ message: "Group not found" });

        const userId = req.user.id;

        // Remove user from group members
        group.members = group.members.filter(m => m.toString() !== userId);
        await group.save();

        // Remove group from user joinedGroups
        await User.findByIdAndUpdate(userId, {
            $pull: { joinedGroups: group._id }
        });

        res.json({ message: "Left group successfully", groupId: group._id });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    Create a question
// @route   POST /api/qa/questions
// @access  Private (Students only)
exports.createQuestion = async (req, res) => {
    try {
        const { title, description, groupId, code, language, topic } = req.body;

        const group = await Group.findById(groupId);
        if (!group) return res.status(404).json({ message: "Group not found" });

        // Check membership
        if (!group.members.includes(req.user.id)) {
            return res.status(403).json({ message: "Join this group first" });
        }

        // Check role
        if (req.user.role !== "student") {
            return res.status(403).json({ message: "Only students can ask questions" });
        }

        // Check ban status
        if (req.user.banStatus?.isBanned) {
            if (req.user.banStatus.bannedUntil && new Date() < new Date(req.user.banStatus.bannedUntil)) {
                return res.status(403).json({ 
                    message: `You are banned from Q&A until ${new Date(req.user.banStatus.bannedUntil).toLocaleString()}. Reason: ${req.user.banStatus.banReason || 'No reason provided'}` 
                });
            } else {
                // Ban expired, lift it
                await User.findByIdAndUpdate(req.user.id, { 'banStatus.isBanned': false });
            }
        }

        const question = await Question.create({
            title,
            description,
            code,
            language,
            topic,
            group: groupId,
            askedBy: req.user.id
        });

        // --- Notification Logic ---
        // Find experts in the group
        const experts = await User.find({ role: 'expert', joinedGroups: groupId });

        if (experts.length > 0) {
            const io = req.app.get('io');
            const userSockets = req.app.get('userSockets');

            const notifications = experts.map(expert => ({
                recipient: expert._id,
                sender: req.user.id,
                type: 'new_question',
                question: question._id,
                group: groupId,
                message: `${req.user.name} asked a new question: "${title}"`
            }));

            await Notification.insertMany(notifications);

            experts.forEach(expert => {
                const socketId = userSockets.get(expert._id.toString());
                if (socketId) {
                    io.to(socketId).emit('new_notification', {
                        type: 'new_question',
                        questionId: question._id,
                        groupId: groupId,
                        message: `${req.user.name} asked a new question in ${group.name}`,
                        title: title
                    });
                }
            });
        }
        // --------------------------

        res.status(201).json(question);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    Create an answer
// @route   POST /api/qa/questions/:questionId/answers
// @access  Private (Experts only)
exports.createAnswer = async (req, res) => {
    try {
        const { content, code, language } = req.body;
        const { questionId } = req.params;

        const question = await Question.findById(questionId);
        if (!question) return res.status(404).json({ message: "Question not found" });

        const group = await Group.findById(question.group);

        // Check membership
        if (!group.members.includes(req.user.id)) {
            return res.status(403).json({ message: "You must join this group" });
        }

        // Check role
        if (req.user.role !== "expert") {
            return res.status(403).json({ message: "Only experts can answer" });
        }

        // Check ban status
        if (req.user.banStatus?.isBanned) {
            if (req.user.banStatus.bannedUntil && new Date() < new Date(req.user.banStatus.bannedUntil)) {
                return res.status(403).json({ 
                    message: `You are banned from Q&A until ${new Date(req.user.banStatus.bannedUntil).toLocaleString()}. Reason: ${req.user.banStatus.banReason || 'No reason provided'}` 
                });
            } else {
                // Ban expired, lift it
                await User.findByIdAndUpdate(req.user.id, { 'banStatus.isBanned': false });
            }
        }

        const answer = await Answer.create({
            content,
            code,
            language,
            question: questionId,
            answeredBy: req.user.id
        });

        // Add answer reference to question
        question.answers.push(answer._id);
        await question.save();

        // --- Notification Logic ---
        // Notify the student who asked the question
        if (question.askedBy.toString() !== req.user.id) {
            const notification = await Notification.create({
                recipient: question.askedBy,
                sender: req.user.id,
                type: 'new_answer',
                question: questionId,
                answer: answer._id,
                group: question.group,
                message: `${req.user.name} answered your question: "${question.title}"`
            });

            const io = req.app.get('io');
            const userSockets = req.app.get('userSockets');
            const socketId = userSockets.get(question.askedBy.toString());

            if (socketId) {
                io.to(socketId).emit('new_notification', {
                    type: 'new_answer',
                    questionId: questionId,
                    answerId: answer._id,
                    message: `${req.user.name} answered your question`,
                    title: question.title
                });
            }
        }
        // --------------------------

        res.status(201).json(answer);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    Get questions by group
// @route   GET /api/qa/groups/:groupId/questions
// @access  Private (Members only)
exports.getQuestionsByGroup = async (req, res) => {
    try {
        const group = await Group.findById(req.params.groupId);
        if (!group) return res.status(404).json({ message: "Group not found" });

        // Check membership
        if (!group.members.includes(req.user.id)) {
            return res.status(403).json({ message: "Access denied. Join the group to view discussion." });
        }

        const { topic } = req.query;
        const query = { group: req.params.groupId };
        if (topic) query.topic = topic;

        const questions = await Question.find(query)
            .populate("askedBy", "name avatar isBatchRep")
            .populate({
                path: "answers",
                populate: { path: "answeredBy", select: "name avatar expertProfile" }
            })
            .sort({ createdAt: -1 });

        res.json(questions);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    Get all community members (students & experts)
// @route   GET /api/qa/members
// @access  Private
exports.getCommunityMembers = async (req, res) => {
    try {
        const students = await User.find({ role: 'student' })
            .select('name avatar joinedGroups academicInfo field isBatchRep')
            .limit(10); // Optionally limit for performance

        const experts = await User.find({ role: 'expert' })
            .select('name avatar professionalInfo')
            .limit(10);

        res.json({ students, experts });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    Update a question
// @route   PUT /api/qa/questions/:id
// @access  Private (Owner only)
exports.updateQuestion = async (req, res) => {
    try {
        const { title, description, code, language } = req.body;
        const question = await Question.findById(req.params.id);

        if (!question) return res.status(404).json({ message: "Question not found" });

        // Check ownership
        if (question.askedBy.toString() !== req.user.id) {
            return res.status(403).json({ message: "Not authorized" });
        }

        // Check time limit (3 minutes)
        const diff = (Date.now() - new Date(question.createdAt).getTime()) / 1000 / 60;
        if (diff > 3) {
            return res.status(403).json({ message: "Edit window (3 mins) has closed" });
        }

        question.title = title || question.title;
        question.description = description || question.description;
        question.code = code !== undefined ? code : question.code;
        question.language = language || question.language;

        await question.save();
        res.json(question);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    Delete a question
// @route   DELETE /api/qa/questions/:id
// @access  Private (Owner only)
exports.deleteQuestion = async (req, res) => {
    try {
        const question = await Question.findById(req.params.id);

        if (!question) return res.status(404).json({ message: "Question not found" });

        // Check ownership
        if (question.askedBy.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: "Not authorized" });
        }

        // Delete associated answers
        await Answer.deleteMany({ question: question._id });
        await Question.findByIdAndDelete(req.params.id);

        res.json({ message: "Question and associated answers removed" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    Update an answer
// @route   PUT /api/qa/answers/:id
// @access  Private (Owner only)
exports.updateAnswer = async (req, res) => {
    try {
        const { content, code, language } = req.body;
        const answer = await Answer.findById(req.params.id);

        if (!answer) return res.status(404).json({ message: "Answer not found" });

        // Check ownership
        if (answer.answeredBy.toString() !== req.user.id) {
            return res.status(403).json({ message: "Not authorized" });
        }

        // Check time limit (3 minutes)
        const diff = (Date.now() - new Date(answer.createdAt).getTime()) / 1000 / 60;
        if (diff > 3) {
            return res.status(403).json({ message: "Edit window (3 mins) has closed" });
        }

        answer.content = content || answer.content;
        answer.code = code !== undefined ? code : answer.code;
        answer.language = language || answer.language;

        await answer.save();
        res.json(answer);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    Delete an answer
// @route   DELETE /api/qa/answers/:id
// @access  Private (Owner only)
exports.deleteAnswer = async (req, res) => {
    try {
        const answer = await Answer.findById(req.params.id);

        if (!answer) return res.status(404).json({ message: "Answer not found" });

        // Check ownership
        if (answer.answeredBy.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: "Not authorized" });
        }

        // Remove reference from question
        await Question.findByIdAndUpdate(answer.question, {
            $pull: { answers: answer._id }
        });

        await Answer.findByIdAndDelete(req.params.id);

        res.json({ message: "Answer removed" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    Toggle like on an answer
// @route   POST /api/qa/answers/:id/like
// @access  Private
exports.toggleLikeAnswer = async (req, res) => {
    try {
        const answer = await Answer.findById(req.params.id);
        if (!answer) return res.status(404).json({ message: "Answer not found" });

        const userId = req.user.id;
        const likeIndex = answer.likes.indexOf(userId);

        if (likeIndex === -1) {
            answer.likes.push(userId);
        } else {
            answer.likes.splice(likeIndex, 1);
        }

        await answer.save();
        res.json({ likes: answer.likes.length, isLiked: answer.likes.includes(userId) });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    Mark an answer as solved
// @route   POST /api/qa/answers/:id/solve
// @access  Private (Question Owner only)
exports.markAnswerSolved = async (req, res) => {
    try {
        const answer = await Answer.findById(req.params.id);
        if (!answer) return res.status(404).json({ message: "Answer not found" });

        const question = await Question.findById(answer.question);
        if (!question) return res.status(404).json({ message: "Question not found" });

        // Check ownership
        if (question.askedBy.toString() !== req.user.id) {
            return res.status(403).json({ message: "Only the person who asked the question can mark it as solved" });
        }

        // Unmark previous solved answer if exists
        if (question.solvedAnswer) {
            await Answer.findByIdAndUpdate(question.solvedAnswer, { isSolved: false });
        }

        // Mark new answer as solved
        answer.isSolved = true;
        await answer.save();

        // Update question
        question.isSolved = true;
        question.solvedAnswer = answer._id;
        await question.save();

        res.json({ message: "Marked as solved", questionId: question._id, answerId: answer._id });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    Get user Q&A stats and content for profile
// @route   GET /api/qa/profile-data/:userId
// @access  Private
exports.getProfileQAData = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        // Get questions asked by user (with their full answers)
        const questions = await Question.find({ askedBy: userId })
            .populate("askedBy", "name avatar isBatchRep")
            .populate({
                path: "answers",
                populate: { path: "answeredBy", select: "name avatar" }
            })
            .sort({ createdAt: -1 });

        // Get answers given by user (with full context question and all other answers)
        const answers = await Answer.find({ answeredBy: userId })
            .populate({
                path: "question",
                populate: [
                    { path: "askedBy", select: "name avatar isBatchRep" },
                    { path: "answers", populate: { path: "answeredBy", select: "name avatar" } }
                ]
            })
            .sort({ createdAt: -1 });

        // Reputation stats
        const solvedSolutionsCount = await Answer.countDocuments({ answeredBy: userId, isSolved: true });
        const solvedQuestionsAskedCount = await Question.countDocuments({ askedBy: userId, isSolved: true });

        let totalLikes = 0;
        answers.forEach(ans => {
            totalLikes += ans.likes.length;
        });

        res.json({
            questions,
            answers,
            stats: {
                totalPosts: questions.length,
                totalAnswers: answers.length,
                solvedSolutions: solvedSolutionsCount,
                solvedQuestions: solvedQuestionsAskedCount,
                helpfulLikes: totalLikes
            }
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
// @desc    Get overall QA stats for dashboard
// @route   GET /api/qa/stats
// @access  Private (Admin)
exports.getQAStats = async (req, res) => {
    try {
        const [
            totalQuestions,
            resolvedQuestions,
            totalAnswers,
            totalGroups,
            totalExperts,
            totalStudents
        ] = await Promise.all([
            Question.countDocuments(),
            Question.countDocuments({ isSolved: true }),
            Answer.countDocuments(),
            Group.countDocuments(),
            User.countDocuments({ role: 'expert' }),
            User.countDocuments({ role: 'student' })
        ]);

        res.json({
            totalQuestions,
            resolvedQuestions,
            totalAnswers,
            totalGroups,
            totalExperts,
            totalStudents
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    Get recent QA activity for dashboard
// @route   GET /api/qa/recent-activity
// @access  Private (Admin)
exports.getRecentActivity = async (req, res) => {
    try {
        const [recentQuestions, recentAnswers, activeGroups] = await Promise.all([
            Question.find()
                .sort({ createdAt: -1 })
                .limit(5)
                .populate("askedBy", "name avatar")
                .populate("group", "name"),
            Answer.find()
                .sort({ createdAt: -1 })
                .limit(5)
                .populate("answeredBy", "name avatar")
                .populate("question", "title"),
            Group.find()
                .sort({ createdAt: -1 })
                .limit(5)
        ]);

        res.json({
            recentQuestions,
            recentAnswers,
            activeGroups
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    Get all questions (Admin)
// @route   GET /api/qa/admin/questions
// @access  Private (Admin)
exports.getAllQuestions = async (req, res) => {
    try {
        const questions = await Question.find()
            .populate("askedBy", "name email avatar isBatchRep")
            .populate("group", "name")
            .sort({ createdAt: -1 });
        res.json(questions);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    Get all answers (Admin)
// @route   GET /api/qa/admin/answers
// @access  Private (Admin)
exports.getAllAnswers = async (req, res) => {
    try {
        const answers = await Answer.find()
            .populate("answeredBy", "name email avatar")
            .populate({
                path: "question",
                select: "title",
                populate: { path: "askedBy", select: "name" }
            })
            .sort({ createdAt: -1 });
        res.json(answers);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    Get all groups (Admin)
// @route   GET /api/qa/admin/groups
// @access  Private (Admin)
exports.getAllGroupsAdmin = async (req, res) => {
    try {
        const groups = await Group.find()
            .populate("members", "name role")
            .sort({ name: 1 });
        res.json(groups);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    Get group by ID (Admin)
// @route   GET /api/qa/admin/groups/:id
// @access  Private (Admin)
exports.getGroupByIdAdmin = async (req, res) => {
    try {
        const group = await Group.findById(req.params.id)
            .populate("members", "name email role avatar");
        if (!group) return res.status(404).json({ message: "Group not found" });
        res.json(group);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    Get question detail with answers (Admin)
// @route   GET /api/qa/admin/questions/:id
// @access  Private (Admin)
exports.getQuestionDetailAdmin = async (req, res) => {
    try {
        const question = await Question.findById(req.params.id)
            .populate("askedBy", "name email avatar isBatchRep")
            .populate("group", "name")
            .populate({
                path: "answers",
                populate: { path: "answeredBy", select: "name email avatar" }
            });
        
        if (!question) return res.status(404).json({ message: "Question not found" });
        res.json(question);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    Remove a member from a group (Admin)
// @route   POST /api/qa/admin/groups/:groupId/members/:userId/remove
// @access  Private (Admin)
exports.adminRemoveMemberFromGroup = async (req, res) => {
    try {
        const { groupId, userId } = req.params;

        const group = await Group.findById(groupId);
        if (!group) return res.status(404).json({ message: "Group not found" });

        // Remove user from group members
        group.members = group.members.filter(m => m.toString() !== userId);
        await group.save();

        // Remove group from user joinedGroups
        await User.findByIdAndUpdate(userId, {
            $pull: { joinedGroups: groupId }
        });

        res.json({ message: "Member removed from group successfully", userId, groupId });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    Ban a member from Q&A (Admin)
// @route   POST /api/qa/admin/members/:userId/ban
// @access  Private (Admin)
exports.adminBanUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const { duration, reason } = req.body; // duration in hours, 0 for permanent

        let bannedUntil = null;
        if (duration && duration > 0) {
            bannedUntil = new Date();
            bannedUntil.setHours(bannedUntil.getHours() + parseInt(duration));
        }

        await User.findByIdAndUpdate(userId, {
            banStatus: {
                isBanned: true,
                bannedUntil,
                banReason: reason
            }
        });

        // --- Notification Logic ---
        const message = `You have been banned from Q&A ${duration && duration > 0 ? `until ${bannedUntil.toLocaleString()}` : 'permanently'}. Reason: ${reason || 'No reason provided'}`;
        
        await Notification.create({
            recipient: userId,
            sender: req.user.id,
            type: 'ban',
            message: message
        });

        const io = req.app.get('io');
        const userSockets = req.app.get('userSockets');
        const socketId = userSockets.get(userId.toString());

        if (socketId) {
            io.to(socketId).emit('new_notification', {
                type: 'ban',
                message: message,
                bannedUntil: bannedUntil
            });
        }
        // --------------------------

        res.json({ message: "User banned from Q&A successfully", userId, bannedUntil });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    Unban a member from Q&A (Admin)
// @route   POST /api/qa/admin/members/:userId/unban
// @access  Private (Admin)
exports.adminUnbanUser = async (req, res) => {
    try {
        const { userId } = req.params;

        await User.findByIdAndUpdate(userId, {
            'banStatus.isBanned': false,
            'banStatus.bannedUntil': null
        });

        // --- Notification Logic ---
        const message = `Your Q&A ban has been lifted. You can now participate again.`;
        
        await Notification.create({
            recipient: userId,
            sender: req.user.id,
            type: 'unban',
            message: message
        });

        const io = req.app.get('io');
        const userSockets = req.app.get('userSockets');
        const socketId = userSockets.get(userId.toString());

        if (socketId) {
            io.to(socketId).emit('new_notification', {
                type: 'unban',
                message: message
            });
        }
        // --------------------------

        res.json({ message: "User unbanned from Q&A successfully", userId });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
