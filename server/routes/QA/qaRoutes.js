const express = require("express");
const router = express.Router();
const {
    getGroups,
    joinGroup,
    createQuestion,
    createAnswer,
    getQuestionsByGroup,
    getCommunityMembers,
    updateQuestion,
    deleteQuestion,
    updateAnswer,
    deleteAnswer,
    toggleLikeAnswer,
    markAnswerSolved,
    getProfileQAData,
    leaveGroup,
    getQAStats,
    getRecentActivity,
    getAllQuestions,
    getAllAnswers,
    getAllGroupsAdmin,
    getGroupByIdAdmin,
    getQuestionDetailAdmin,
    adminRemoveMemberFromGroup,
    adminBanUser,
    adminUnbanUser
} = require("../../controllers/QA/qaController");
const { protect } = require("../../middleware/authMiddleware");
const { roleAuthorize } = require("../../middleware/roleMiddleware");

router.use(protect);

router.get("/groups", getGroups);
router.get("/stats", roleAuthorize("admin"), getQAStats);
router.get("/recent-activity", roleAuthorize("admin"), getRecentActivity);
router.get("/admin/questions", roleAuthorize("admin"), getAllQuestions);
router.get("/admin/questions/:id", roleAuthorize("admin"), getQuestionDetailAdmin);
router.get("/admin/answers", roleAuthorize("admin"), getAllAnswers);
router.get("/admin/groups", roleAuthorize("admin"), getAllGroupsAdmin);
router.get("/admin/groups/:id", roleAuthorize("admin"), getGroupByIdAdmin);
router.post("/admin/groups/:groupId/members/:userId/remove", roleAuthorize("admin"), adminRemoveMemberFromGroup);
router.post("/admin/members/:userId/ban", roleAuthorize("admin"), adminBanUser);
router.post("/admin/members/:userId/unban", roleAuthorize("admin"), adminUnbanUser);
router.get("/members", getCommunityMembers);
router.post("/groups/:groupId/join", joinGroup);
router.post("/groups/:groupId/leave", leaveGroup);
router.get("/groups/:groupId/questions", getQuestionsByGroup);
router.get("/profile-data/:userId", getProfileQAData);
router.post("/questions", createQuestion);
router.put("/questions/:id", updateQuestion);
router.delete("/questions/:id", deleteQuestion);
router.post("/questions/:questionId/answers", createAnswer);
router.put("/answers/:id", updateAnswer);
router.delete("/answers/:id", deleteAnswer);
router.post("/answers/:id/like", toggleLikeAnswer);
router.post("/answers/:id/solve", markAnswerSolved);

module.exports = router;
