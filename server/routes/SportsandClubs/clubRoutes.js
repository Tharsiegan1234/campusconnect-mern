const express = require('express');
const router = express.Router();
const { createClub, getClubs, getClub, updateClub, deleteClub, joinClub, requestToJoin, getRequests, approveRequest, rejectRequest, removeMember, activateMember, getAllMembers, getAllClubs, activateClub, bulkUpdateClubs, getMyRequests, cancelRequest, getAllRequests, setNextSession, toggleClubRsvp } = require('../controllers/clubController');
const { protect, optionalProtect } = require('../middleware/authMiddleware');
const { roleAuthorize } = require('../middleware/roleMiddleware');

// allow optional auth so admins see all clubs while keeping public access for non-auth users
router.get('/', optionalProtect, getClubs);
// user endpoints for their own requests (place before '/:id' to avoid collision)
router.get('/requests/my', protect, getMyRequests);
router.delete('/requests/:reqId', protect, cancelRequest);
// admin aggregated requests for quick approval
router.get('/admin/requests', protect, roleAuthorize('admin'), getAllRequests);
// bulk actions
router.post('/bulk', protect, roleAuthorize('admin'), bulkUpdateClubs);
// Admin: aggregated members view
router.get('/members', protect, roleAuthorize('admin'), getAllMembers);
// alternate path to avoid route collision with '/:id'
router.get('/all-members', protect, roleAuthorize('admin'), getAllMembers);
// Admin: list all clubs (including inactive) - use a distinct admin path to avoid '/:id' collision
router.get('/admin/all-clubs', protect, roleAuthorize('admin'), getAllClubs);
router.get('/:id', getClub);
router.post('/', protect, createClub);
// activate club
router.post('/:id/activate', protect, activateClub);
router.put('/:id', protect, updateClub);
router.delete('/:id', protect, deleteClub);
// public request to join (creates pending request)
router.post('/:id/request', protect, requestToJoin);
router.post('/:id/join', protect, joinClub); // keep immediate join for compatibility

// allow partial updates
router.patch('/:id', protect, updateClub);

// admin/creator endpoints for managing requests and members
router.get('/:id/requests', protect, getRequests);
router.post('/:id/requests/:reqId/approve', protect, approveRequest);
router.post('/:id/requests/:reqId/reject', protect, rejectRequest);
router.delete('/:id/members/:memberId', protect, removeMember);
// reactivate former member
router.post('/:id/members/:memberId/activate', protect, activateMember);
router.post('/:id/next-session', protect, setNextSession);
router.post('/:id/rsvp', protect, toggleClubRsvp);

module.exports = router;
