const Club = require('../models/Club');
const ClubRequest = require('../models/ClubRequest');

// @desc    Create a club
// @route   POST /api/clubs
// @access  Private
const createClub = async (req, res) => {
    try {
        const { name, description, coach, maxMembers } = req.body;
        if (!name) return res.status(400).json({ message: 'Club name is required' });
        // name must contain only letters and spaces
        if (!/^[A-Za-z\s]+$/.test(name)) return res.status(400).json({ message: 'Club name may only contain letters and spaces' });
        if (!coach) return res.status(400).json({ message: 'Coach is required' });
        if (!/^[A-Za-z\s]+$/.test(coach)) return res.status(400).json({ message: 'Coach may only contain letters and spaces' });

        let mm;
        if (typeof maxMembers !== 'undefined' && maxMembers !== null && maxMembers !== '') {
            mm = parseInt(maxMembers, 10);
            if (isNaN(mm) || mm < 1) return res.status(400).json({ message: 'maxMembers must be a positive integer' });
        }

        const payload = {
            name,
            description,
            coach,
            maxMembers: mm,
            createdBy: req.user ? req.user._id : undefined,
        };

        if (req.body.nextSession && req.body.nextSession.date) {
            payload.nextSession = {
                date: new Date(req.body.nextSession.date),
                location: req.body.nextSession.location || '',
                description: req.body.nextSession.description || '',
                rsvps: []
            };
        }

        const club = await Club.create(payload);

        res.status(201).json(club);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all clubs
// @route   GET /api/clubs
// @access  Public
const getClubs = async (req, res) => {
    try {
        // Support filtering, search and pagination
        const { page = 1, limit = 10, isActive, createdBy, minMembers, search, sort } = req.query;

        const q = {};
        // isActive filter: expected 'true'|'false'
        if (typeof isActive !== 'undefined') {
            if (isActive === 'true') q.isActive = true;
            else if (isActive === 'false') q.isActive = false;
        }

        if (createdBy) q.createdBy = createdBy;

        if (typeof minMembers !== 'undefined') {
            const n = parseInt(minMembers, 10);
            if (!isNaN(n)) q.members = { $size: { $gte: n } };
        }

        // text search on name/description
        if (search) {
            const re = new RegExp(search, 'i');
            q.$or = [ { name: re }, { description: re } ];
        }

        // Default: if not admin, only active
        if (!(req.user && req.user.role === 'admin') && typeof isActive === 'undefined') {
            q.isActive = true;
        }

        const pageNum = Math.max(parseInt(page, 10) || 1, 1);
        const perPage = Math.max(parseInt(limit, 10) || 10, 1);

        let cursor = Club.find(q).populate('createdBy', 'name email avatar');
        // simple sort handling
        if (sort) {
            cursor = cursor.sort(sort);
        } else {
            cursor = cursor.sort('-createdAt');
        }

        const total = await Club.countDocuments(q);
        const clubs = await cursor.skip((pageNum - 1) * perPage).limit(perPage).exec();

        res.json({ data: clubs, meta: { total, page: pageNum, limit: perPage, pages: Math.ceil(total / perPage) } });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Bulk update clubs (activate/deactivate)
const bulkUpdateClubs = async (req, res) => {
    try {
        // only admin allowed
        if (!req.user || req.user.role !== 'admin') return res.status(403).json({ message: 'Not authorized' });
        const { ids = [], action } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ message: 'No ids provided' });
        if (!['activate', 'deactivate'].includes(action)) return res.status(400).json({ message: 'Invalid action' });

        const isActive = action === 'activate';
        const result = await Club.updateMany({ _id: { $in: ids } }, { $set: { isActive } });
        res.json({ message: 'Bulk update applied', modifiedCount: result.modifiedCount });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Admin: get all clubs including inactive
const getAllClubs = async (req, res) => {
    try {
        // support filtering, search and pagination for admin listing
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const search = (req.query.search || '').trim();
        const isActive = req.query.isActive;
        const minMembers = req.query.minMembers ? parseInt(req.query.minMembers) : null;

        const filter = {};
        if (typeof isActive !== 'undefined') {
            filter.isActive = isActive === 'true' || isActive === '1' || isActive === true;
        }

        // If search includes member emails we need to lookup members
        const pipeline = [];
        if (Object.keys(filter).length) pipeline.push({ $match: filter });

        // Lookup members for potential email search and for minMembers evaluation
        pipeline.push({
            $lookup: {
                from: 'users',
                localField: 'members',
                foreignField: '_id',
                as: 'members'
            }
        });

        if (search) {
            const re = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
            pipeline.push({
                $match: {
                    $or: [
                        { name: re },
                        { description: re },
                        { 'members.email': re }
                    ]
                }
            });
        }

        if (minMembers) {
            pipeline.push({ $addFields: { membersCount: { $size: '$members' } } });
            pipeline.push({ $match: { membersCount: { $gte: minMembers } } });
        }

        // Count total then paginate
        const all = await Club.aggregate(pipeline);
        const total = all.length;
        const totalPages = Math.max(1, Math.ceil(total / limit));
        const start = (page - 1) * limit;
        const dataSlice = all.slice(start, start + limit);

        // populate createdBy for sliced data using mongoose populate on returned docs
        // convert ids to ObjectId docs by querying those club ids
        const ids = dataSlice.map(d => d._id);
        let data = [];
        if (ids.length) {
            data = await Club.find({ _id: { $in: ids } }).populate('createdBy', 'name email avatar');
            // preserve order of dataSlice
            const byId = new Map(data.map(d => [d._id.toString(), d]));
            data = ids.map(id => byId.get(id.toString()) || null).filter(Boolean);
        }

        res.json({ data, meta: { page, limit, total, totalPages } });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single club
// @route   GET /api/clubs/:id
// @access  Public
const getClub = async (req, res) => {
    try {
        const club = await Club.findById(req.params.id)
            .populate('members', 'name email avatar')
            .populate('formerMembers', 'name email avatar')
            .populate('waitlist', 'name email avatar');
        if (!club) return res.status(404).json({ message: 'Club not found' });
        res.json(club);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update a club
// @route   PUT /api/clubs/:id
// @access  Private/Admin or creator
const updateClub = async (req, res) => {
    try {
        const club = await Club.findById(req.params.id);
        if (!club) return res.status(404).json({ message: 'Club not found' });

        // Allow admin or creator to update
        if (req.user.role !== 'admin' && (!club.createdBy || club.createdBy.toString() !== req.user._id.toString())) {
            return res.status(403).json({ message: 'Not authorized to update this club' });
        }

        if (typeof req.body.name !== 'undefined') {
            if (!/^[A-Za-z\s]+$/.test(req.body.name)) return res.status(400).json({ message: 'Club name may only contain letters and spaces' });
            club.name = req.body.name;
        }

        club.description = req.body.description || club.description;

        if (typeof req.body.coach !== 'undefined') {
            if (!req.body.coach) return res.status(400).json({ message: 'Coach is required' });
            if (!/^[A-Za-z\s]+$/.test(req.body.coach)) return res.status(400).json({ message: 'Coach may only contain letters and spaces' });
            club.coach = req.body.coach;
        }

        if (typeof req.body.maxMembers !== 'undefined') {
            if (req.body.maxMembers === null || req.body.maxMembers === '') {
                club.maxMembers = undefined;
            } else {
                const mm = parseInt(req.body.maxMembers, 10);
                if (isNaN(mm) || mm < 1) return res.status(400).json({ message: 'maxMembers must be a positive integer' });
                // ensure new maxMembers is not less than current members count
                if (club.members && club.members.length > mm) return res.status(400).json({ message: 'maxMembers cannot be less than current members count' });
                club.maxMembers = mm;
            }
        }

        if (typeof req.body.isActive === 'boolean') club.isActive = req.body.isActive;

        // Handle nextSession update
        if (req.body.nextSession) {
            club.nextSession = {
                date: req.body.nextSession.date ? new Date(req.body.nextSession.date) : club.nextSession?.date,
                location: typeof req.body.nextSession.location !== 'undefined' ? req.body.nextSession.location : (club.nextSession?.location || ''),
                description: typeof req.body.nextSession.description !== 'undefined' ? req.body.nextSession.description : (club.nextSession?.description || ''),
                rsvps: club.nextSession?.rsvps || []
            };
        }

        const updated = await club.save();

        // If maxMembers increased or space available, promote from waitlist
        if (updated.waitlist && updated.waitlist.length && (typeof updated.maxMembers !== 'number' || updated.members.length < updated.maxMembers)) {
            // reload to operate on arrays
            const fresh = await Club.findById(updated._id);
            while (fresh.waitlist && fresh.waitlist.length && (typeof fresh.maxMembers !== 'number' || fresh.members.length < fresh.maxMembers)) {
                const nextUser = fresh.waitlist.shift();
                if (!fresh.members.map(m => m.toString()).includes(nextUser.toString())) {
                    fresh.members.push(nextUser);
                    await ClubRequest.findOneAndUpdate({ club: fresh._id, user: nextUser, status: 'waitlisted' }, { status: 'approved' });
                }
            }
            await fresh.save();
        }

        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete (deactivate) a club
// @route   DELETE /api/clubs/:id
// @access  Private/Admin or creator
const deleteClub = async (req, res) => {
    try {
        const club = await Club.findById(req.params.id);
        if (!club) return res.status(404).json({ message: 'Club not found' });

        if (req.user.role !== 'admin' && (!club.createdBy || club.createdBy.toString() !== req.user._id.toString())) {
            return res.status(403).json({ message: 'Not authorized to delete this club' });
        }

        club.isActive = false;
        await club.save();
        res.json({ message: 'Club deactivated' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Join a club (adds current user to members)
// @route   POST /api/clubs/:id/join
// @access  Private
const joinClub = async (req, res) => {
    try {
        const club = await Club.findById(req.params.id);
        if (!club) return res.status(404).json({ message: 'Club not found' });

        const userId = req.user._id;
        if (club.members.map(m => m.toString()).includes(userId.toString())) {
            return res.status(400).json({ message: 'Already a member' });
        }

        // Only admins may directly add a member. Other users must submit a join request.
        if (!req.user || req.user.role !== 'admin') {
            const existing = await ClubRequest.findOne({ club: club._id, user: userId, status: { $in: ['pending','waitlisted'] } });
            if (existing) return res.status(400).json({ message: 'Join request already pending or waitlisted' });
            const reqDoc = await ClubRequest.create({ club: club._id, user: userId, message: req.body.message || '' });
            return res.status(201).json({ message: 'Request submitted; pending admin approval', request: reqDoc });
        }

        // Admin immediate add (respect capacity)
        if (typeof club.maxMembers === 'number' && club.members.length >= club.maxMembers) {
            return res.status(400).json({ message: 'Club is full; cannot join even as admin' });
        }
        club.members.push(userId);
        await club.save();
        res.json({ message: 'Joined club' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Request to join (creates a pending request)
const requestToJoin = async (req, res) => {
    try {
        const club = await Club.findById(req.params.id);
        if (!club) return res.status(404).json({ message: 'Club not found' });
        const userId = req.user._id;

        if (club.members.map(m => m.toString()).includes(userId.toString())) return res.status(400).json({ message: 'Already a member' });

        const existing = await ClubRequest.findOne({ club: club._id, user: userId, status: { $in: ['pending','waitlisted'] } });
        if (existing) return res.status(400).json({ message: 'Join request already pending or waitlisted' });

        const reqDoc = await ClubRequest.create({ club: club._id, user: userId, message: req.body.message || '' });
        res.status(201).json({ message: 'Request submitted', request: reqDoc });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Admin: list pending requests for a club
const getRequests = async (req, res) => {
    try {
        const club = await Club.findById(req.params.id);
        if (!club) return res.status(404).json({ message: 'Club not found' });

        if (req.user.role !== 'admin' && (!club.createdBy || club.createdBy.toString() !== req.user._id.toString())) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const requests = await ClubRequest.find({ club: club._id, status: { $in: ['pending', 'waitlisted'] } }).populate('user', 'name email avatar');
        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get current user's pending/waitlisted requests across clubs
// @route   GET /api/clubs/requests/my
// @access  Private
const getMyRequests = async (req, res) => {
    try {
        const userId = req.user._id;
        const requests = await ClubRequest.find({ user: userId, status: { $in: ['pending', 'waitlisted'] } })
            .populate('club', 'name coach')
            .sort('-createdAt');
        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Cancel current user's pending or waitlisted request
// @route   DELETE /api/clubs/requests/:reqId
// @access  Private
const cancelRequest = async (req, res) => {
    try {
        const reqId = req.params.reqId;
        const request = await ClubRequest.findById(reqId);
        if (!request) return res.status(404).json({ message: 'Request not found' });
        if (request.user.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Not authorized to cancel this request' });
        if (!['pending', 'waitlisted'].includes(request.status)) return res.status(400).json({ message: 'Cannot cancel a handled request' });

        // If waitlisted, remove the user from the club waitlist
        if (request.status === 'waitlisted') {
            const Club = require('../models/Club');
            await Club.findByIdAndUpdate(request.club, { $pull: { waitlist: request.user } });
        }

        request.status = 'rejected';
        await request.save();
        res.json({ message: 'Request cancelled' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Admin: get all pending or waitlisted requests across clubs
// @route   GET /api/clubs/admin/requests
// @access  Private/Admin
const getAllRequests = async (req, res) => {
    try {
        const requests = await ClubRequest.find({ status: { $in: ['pending', 'waitlisted'] } })
            .populate('user', 'name email avatar')
            .populate('club', 'name coach')
            .sort('-createdAt');
        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// Approve request
const approveRequest = async (req, res) => {
    try {
        const { id: clubId, reqId } = req.params;
        const club = await Club.findById(clubId);
        if (!club) return res.status(404).json({ message: 'Club not found' });

        if (req.user.role !== 'admin' && (!club.createdBy || club.createdBy.toString() !== req.user._id.toString())) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const request = await ClubRequest.findById(reqId);
        if (!request || request.status === 'rejected') return res.status(404).json({ message: 'Request not found or already rejected' });

        const userId = request.user;
        if (!club.members.map(m => m.toString()).includes(userId.toString())) {
            if (typeof club.maxMembers === 'number' && club.members.length >= club.maxMembers) {
                // add to waitlist instead of failing
                if (!club.waitlist) club.waitlist = [];
                if (!club.waitlist.map(w => w.toString()).includes(userId.toString())) {
                    club.waitlist.push(userId);
                }
                request.status = 'waitlisted';
                await club.save();
                await request.save();
                return res.json({ message: 'Club full; request moved to waitlist' });
            }
            club.members.push(userId);
            await club.save();
        }

        request.status = 'approved';
        await request.save();
        res.json({ message: 'Request approved' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Reject request
const rejectRequest = async (req, res) => {
    try {
        const { id: clubId, reqId } = req.params;
        const club = await Club.findById(clubId);
        if (!club) return res.status(404).json({ message: 'Club not found' });

        if (req.user.role !== 'admin' && (!club.createdBy || club.createdBy.toString() !== req.user._id.toString())) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const request = await ClubRequest.findById(reqId);
        if (!request || request.status !== 'pending') return res.status(404).json({ message: 'Request not found or already handled' });

        request.status = 'rejected';
        await request.save();
        res.json({ message: 'Request rejected' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Admin: remove member
const removeMember = async (req, res) => {
    try {
        const { id: clubId, memberId } = req.params;
        const club = await Club.findById(clubId);
        if (!club) return res.status(404).json({ message: 'Club not found' });

        if (req.user.role !== 'admin' && (!club.createdBy || club.createdBy.toString() !== req.user._id.toString())) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Move the member to formerMembers so we can reactivate later
        const wasMember = club.members.some(m => m.toString() === memberId.toString());
        club.members = club.members.filter(m => m.toString() !== memberId.toString());
        if (wasMember && !club.formerMembers.map(f => f.toString()).includes(memberId.toString())) {
            club.formerMembers.push(memberId);
        }

        // After removal, try to promote from waitlist if space available
        if (club.waitlist && club.waitlist.length && (typeof club.maxMembers !== 'number' || club.members.length < club.maxMembers)) {
            // promote as many as possible
            while (club.waitlist.length && (typeof club.maxMembers !== 'number' || club.members.length < club.maxMembers)) {
                const nextUser = club.waitlist.shift();
                if (!club.members.map(m => m.toString()).includes(nextUser.toString())) {
                    club.members.push(nextUser);
                    // update any existing ClubRequest to approved
                    await ClubRequest.findOneAndUpdate({ club: club._id, user: nextUser, status: 'waitlisted' }, { status: 'approved' });
                }
            }
        }

        await club.save();
        res.json({ message: 'Member removed (deactivated in club)' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Admin: reactivate a former member (move from formerMembers back to members)
const activateMember = async (req, res) => {
    try {
        const { id: clubId, memberId } = req.params;
        const club = await Club.findById(clubId);
        if (!club) return res.status(404).json({ message: 'Club not found' });

        if (req.user.role !== 'admin' && (!club.createdBy || club.createdBy.toString() !== req.user._id.toString())) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // If already a member, nothing to do
        if (club.members.map(m => m.toString()).includes(memberId.toString())) {
            return res.status(400).json({ message: 'User already an active member' });
        }

        // capacity check
        if (typeof club.maxMembers === 'number' && club.members.length >= club.maxMembers) {
            return res.status(400).json({ message: 'Club is full; cannot activate member' });
        }

        // Remove from formerMembers and add back to members
        club.formerMembers = (club.formerMembers || []).filter(f => f.toString() !== memberId.toString());
        club.members.push(memberId);
        await club.save();
        res.json({ message: 'Member re-activated in club' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Admin or creator: activate/reactivate a club
const activateClub = async (req, res) => {
    try {
        const club = await Club.findById(req.params.id);
        if (!club) return res.status(404).json({ message: 'Club not found' });

        if (req.user.role !== 'admin' && (!club.createdBy || club.createdBy.toString() !== req.user._id.toString())) {
            return res.status(403).json({ message: 'Not authorized to activate this club' });
        }

        club.isActive = true;
        await club.save();
        res.json({ message: 'Club activated', club });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Admin: get all members across clubs (aggregated)
const getAllMembers = async (req, res) => {
    try {
        // Only admins should call this; route should enforce authorization
        // Include inactive clubs as requested so admin can see members across all clubs
        const clubs = await Club.find({}).populate('members', 'name email avatar');

        const map = new Map();
        clubs.forEach((club) => {
            const clubName = club.name;
            const clubId = club._id;
            (club.members || []).forEach((m) => {
                const id = m._id.toString();
                if (!map.has(id)) {
                    map.set(id, { user: m, clubs: [{ id: clubId, name: clubName }] });
                } else {
                    map.get(id).clubs.push({ id: clubId, name: clubName });
                }
            });
        });

        const result = Array.from(map.values());
        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Set next session for a club
const setNextSession = async (req, res) => {
    try {
        const club = await Club.findById(req.params.id);
        if (!club) return res.status(404).json({ message: 'Club not found' });
        if (req.user.role !== 'admin' && (!club.createdBy || club.createdBy.toString() !== req.user._id.toString())) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        const { date, location, description } = req.body;
        if (!date) return res.status(400).json({ message: 'Session date is required' });
        club.nextSession = {
            date: new Date(date),
            location: location || '',
            description: description || '',
            rsvps: []
        };
        await club.save();
        res.json({ message: 'Next session set', nextSession: club.nextSession });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Toggle RSVP for next session
const toggleClubRsvp = async (req, res) => {
    try {
        const club = await Club.findById(req.params.id);
        if (!club) return res.status(404).json({ message: 'Club not found' });
        
        // Ensure user is a member, admin, or creator
        const userId = req.user._id.toString();
        const ClubRequest = require('../models/ClubRequest');
        const isMember = club.members && club.members.map(m => m.toString()).includes(userId);
        const isAdmin = req.user.role === 'admin';
        const isCreator = club.createdBy && club.createdBy.toString() === userId;
        
        // Also allow if user has a pending request
        const hasPendingRequest = await ClubRequest.findOne({ club: club._id, user: userId, status: 'pending' });

        if (!isMember && !isAdmin && !isCreator && !hasPendingRequest) {
            return res.status(403).json({ message: 'Only club members or applicants can RSVP for meetings' });
        }

        if (!club.nextSession || !club.nextSession.date) return res.status(400).json({ message: 'No upcoming session scheduled' });

        const { status } = req.body;
        if (!['going', 'not_going'].includes(status)) return res.status(400).json({ message: 'Status must be going or not_going' });

        const existing = club.nextSession.rsvps.find(r => r.user && r.user.toString() === userId);
        if (existing) {
            existing.status = status;
        } else {
            club.nextSession.rsvps.push({ user: req.user._id, status });
        }
        await club.save();
        
        const going = club.nextSession.rsvps.filter(r => r.status === 'going').length;
        const notGoing = club.nextSession.rsvps.filter(r => r.status === 'not_going').length;
        res.json({ message: `RSVP updated to ${status}`, going, notGoing, myStatus: status });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = {
    createClub,
    getClubs,
    getClub,
    updateClub,
    deleteClub,
    joinClub,
    requestToJoin,
    getRequests,
    approveRequest,
    rejectRequest,
    getMyRequests,
    cancelRequest,
    getAllRequests,
    removeMember,
    activateMember,
    activateClub,
    getAllMembers,
    getAllClubs,
    bulkUpdateClubs,
    setNextSession,
    toggleClubRsvp,
};
