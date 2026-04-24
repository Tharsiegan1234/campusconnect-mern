const Sport = require('../models/Sport');
const SportRequest = require('../models/SportRequest');
const User = require('../models/User');

// Create sport/team
const createSport = async (req, res) => {
    try {
        const { name, sportType, description, coach, maxMembers } = req.body;
        if (!name) return res.status(400).json({ message: 'Name is required' });
        // name must contain only letters and spaces
        if (!/^[A-Za-z\s]+$/.test(name)) return res.status(400).json({ message: 'Team name may only contain letters and spaces' });
        let mm;
        if (typeof maxMembers !== 'undefined' && maxMembers !== null && maxMembers !== '') {
            mm = parseInt(maxMembers, 10);
            if (isNaN(mm) || mm < 1) return res.status(400).json({ message: 'maxMembers must be a positive integer' });
        }
        const payload = { 
            name, 
            sportType: sportType || 'General', 
            description, 
            coach, 
            maxMembers: mm, 
            createdBy: req.user ? req.user._id : undefined 
        };

        if (req.body.nextSession && req.body.nextSession.date) {
            payload.nextSession = {
                date: new Date(req.body.nextSession.date),
                location: req.body.nextSession.location || '',
                description: req.body.nextSession.description || '',
                rsvps: []
            };
        }

        const sport = await Sport.create(payload);
        res.status(201).json(sport);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get all sports
const getSports = async (req, res) => {
    try {
        const sports = await Sport.find({ isActive: true }).populate('createdBy', 'name email avatar');
        res.json(sports);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get single sport
const getSport = async (req, res) => {
    try {
        const sport = await Sport.findById(req.params.id)
            .populate('members', 'name email avatar')
            .populate('formerMembers', 'name email avatar')
            .populate('waitlist', 'name email avatar');
        if (!sport) return res.status(404).json({ message: 'Not found' });
        res.json(sport);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Update sport
const updateSport = async (req, res) => {
    try {
        const sport = await Sport.findById(req.params.id);
        if (!sport) return res.status(404).json({ message: 'Not found' });
        if (req.user.role !== 'admin' && (!sport.createdBy || sport.createdBy.toString() !== req.user._id.toString())) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        if (typeof req.body.name !== 'undefined') {
            if (!/^[A-Za-z\s]+$/.test(req.body.name)) return res.status(400).json({ message: 'Team name may only contain letters and spaces' });
            sport.name = req.body.name;
        }
        if (typeof req.body.sportType !== 'undefined') {
            sport.sportType = req.body.sportType;
        }
        sport.description = req.body.description || sport.description;
        sport.coach = req.body.coach || sport.coach;
        if (typeof req.body.maxMembers !== 'undefined') {
            if (req.body.maxMembers === null || req.body.maxMembers === '') {
                sport.maxMembers = undefined;
            } else {
                const mm = parseInt(req.body.maxMembers, 10);
                if (isNaN(mm) || mm < 1) return res.status(400).json({ message: 'maxMembers must be a positive integer' });
                // ensure new maxMembers is not less than current members count
                if (sport.members && sport.members.length > mm) return res.status(400).json({ message: 'maxMembers cannot be less than current members count' });
                sport.maxMembers = mm;
            }
        }
        if (typeof req.body.isActive === 'boolean') sport.isActive = req.body.isActive;

        // Handle nextSession update
        if (req.body.nextSession) {
            sport.nextSession = {
                date: req.body.nextSession.date ? new Date(req.body.nextSession.date) : sport.nextSession?.date,
                location: typeof req.body.nextSession.location !== 'undefined' ? req.body.nextSession.location : (sport.nextSession?.location || ''),
                description: typeof req.body.nextSession.description !== 'undefined' ? req.body.nextSession.description : (sport.nextSession?.description || ''),
                rsvps: sport.nextSession?.rsvps || []
            };
        }

        const updated = await sport.save();

        // If space available after update, promote from waitlist
        if (updated.waitlist && updated.waitlist.length && (typeof updated.maxMembers !== 'number' || updated.members.length < updated.maxMembers)) {
            const fresh = await Sport.findById(updated._id);
            while (fresh.waitlist && fresh.waitlist.length && (typeof fresh.maxMembers !== 'number' || fresh.members.length < fresh.maxMembers)) {
                const nextUser = fresh.waitlist.shift();
                if (!fresh.members.map(m => m.toString()).includes(nextUser.toString())) {
                    fresh.members.push(nextUser);
                    await SportRequest.findOneAndUpdate({ sport: fresh._id, user: nextUser, status: 'waitlisted' }, { status: 'approved' });
                }
            }
            await fresh.save();
        }

        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Deactivate sport
const deleteSport = async (req, res) => {
    try {
        const sport = await Sport.findById(req.params.id);
        if (!sport) return res.status(404).json({ message: 'Not found' });
        if (req.user.role !== 'admin' && (!sport.createdBy || sport.createdBy.toString() !== req.user._id.toString())) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        sport.isActive = false;
        await sport.save();
        res.json({ message: 'Deactivated' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Join sport
const joinSport = async (req, res) => {
    try {
        const sport = await Sport.findById(req.params.id);
        if (!sport) return res.status(404).json({ message: 'Not found' });
        const userId = req.user._id;
        if (sport.members.map(m => m.toString()).includes(userId.toString())) return res.status(400).json({ message: 'Already a member' });

        // Non-admins submit a request instead of immediate join
        if (!req.user || req.user.role !== 'admin') {
            const existing = await SportRequest.findOne({ sport: sport._id, user: userId, status: 'pending' });
            if (existing) return res.status(400).json({ message: 'Join request already pending' });
            const reqDoc = await SportRequest.create({ sport: sport._id, user: userId, message: req.body.message || '' });
            return res.status(201).json({ message: 'Request submitted; pending admin approval', request: reqDoc });
        }

        // Admin immediate add
        if (typeof sport.maxMembers === 'number' && sport.members.length >= sport.maxMembers) {
            return res.status(400).json({ message: 'Team is full; cannot join even as admin' });
        }
        sport.members.push(userId);
        await sport.save();
        res.json({ message: 'Joined sport' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Request to join (creates a pending request instead of auto-join)
const requestToJoin = async (req, res) => {
    try {
        const sport = await Sport.findById(req.params.id);
        if (!sport) return res.status(404).json({ message: 'Not found' });
        const userId = req.user._id;

        // check already member
        if (sport.members.map(m => m.toString()).includes(userId.toString())) return res.status(400).json({ message: 'Already a member' });

            // check existing pending request
            const existing = await SportRequest.findOne({ sport: sport._id, user: userId, status: 'pending' });
        if (existing) return res.status(400).json({ message: 'Join request already pending' });

        const reqDoc = await SportRequest.create({ sport: sport._id, user: userId, message: req.body.message || '' });
        res.status(201).json({ message: 'Request submitted', request: reqDoc });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Admin: get pending requests for a sport
const getRequests = async (req, res) => {
    try {
        const sport = await Sport.findById(req.params.id);
        if (!sport) return res.status(404).json({ message: 'Not found' });

        // only admin or creator
        if (req.user.role !== 'admin' && (!sport.createdBy || sport.createdBy.toString() !== req.user._id.toString())) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const requests = await SportRequest.find({ sport: sport._id, status: { $in: ['pending', 'waitlisted'] } }).populate('user', 'name email avatar');
        res.json(requests);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Approve a request (admin/creator)
const approveRequest = async (req, res) => {
    try {
        const { id: sportId, reqId } = req.params;
        const sport = await Sport.findById(sportId);
        if (!sport) return res.status(404).json({ message: 'Not found' });
        if (req.user.role !== 'admin' && (!sport.createdBy || sport.createdBy.toString() !== req.user._id.toString())) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const request = await SportRequest.findById(reqId);
        if (!request || request.status !== 'pending') return res.status(404).json({ message: 'Request not found or already handled' });

        // add member
        const userId = request.user;
        if (!sport.members.map(m => m.toString()).includes(userId.toString())) {
            if (typeof sport.maxMembers === 'number' && sport.members.length >= sport.maxMembers) {
                // add to waitlist instead
                if (!sport.waitlist) sport.waitlist = [];
                if (!sport.waitlist.map(w => w.toString()).includes(userId.toString())) {
                    sport.waitlist.push(userId);
                }
                request.status = 'waitlisted';
                await sport.save();
                await request.save();
                return res.json({ message: 'Team full; request moved to waitlist' });
            }
            sport.members.push(userId);
            await sport.save();
        }

        request.status = 'approved';
        await request.save();

        res.json({ message: 'Request approved' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Reject a request (admin/creator)
const rejectRequest = async (req, res) => {
    try {
        const { id: sportId, reqId } = req.params;
        const sport = await Sport.findById(sportId);
        if (!sport) return res.status(404).json({ message: 'Not found' });
        if (req.user.role !== 'admin' && (!sport.createdBy || sport.createdBy.toString() !== req.user._id.toString())) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const request = await SportRequest.findById(reqId);
        if (!request || request.status !== 'pending') return res.status(404).json({ message: 'Request not found or already handled' });

        request.status = 'rejected';
        await request.save();

        res.json({ message: 'Request rejected' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Admin: remove a member from team
const removeMember = async (req, res) => {
    try {
        const { id: sportId, memberId } = req.params;
        const sport = await Sport.findById(sportId);
        if (!sport) return res.status(404).json({ message: 'Not found' });
        if (req.user.role !== 'admin' && (!sport.createdBy || sport.createdBy.toString() !== req.user._id.toString())) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        // Move to formerMembers for potential reactivation
        const wasMember = sport.members.some(m => m.toString() === memberId.toString());
        sport.members = sport.members.filter(m => m.toString() !== memberId.toString());
        if (wasMember && !sport.formerMembers.map(f => f.toString()).includes(memberId.toString())) {
            sport.formerMembers.push(memberId);
        }

        // After removal, try to promote from waitlist if space available
        if (sport.waitlist && sport.waitlist.length && (typeof sport.maxMembers !== 'number' || sport.members.length < sport.maxMembers)) {
            while (sport.waitlist.length && (typeof sport.maxMembers !== 'number' || sport.members.length < sport.maxMembers)) {
                const nextUser = sport.waitlist.shift();
                if (!sport.members.map(m => m.toString()).includes(nextUser.toString())) {
                    sport.members.push(nextUser);
                    await SportRequest.findOneAndUpdate({ sport: sport._id, user: nextUser, status: 'waitlisted' }, { status: 'approved' });
                }
            }
        }

        await sport.save();
        res.json({ message: 'Member removed (deactivated in team)' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Admin: reactivate a former member into the team
const activateMember = async (req, res) => {
    try {
        const { id: sportId, memberId } = req.params;
        const sport = await Sport.findById(sportId);
        if (!sport) return res.status(404).json({ message: 'Not found' });
        if (req.user.role !== 'admin' && (!sport.createdBy || sport.createdBy.toString() !== req.user._id.toString())) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        if (sport.members.map(m => m.toString()).includes(memberId.toString())) return res.status(400).json({ message: 'Already a member' });

        // capacity check
        if (typeof sport.maxMembers === 'number' && sport.members.length >= sport.maxMembers) {
            return res.status(400).json({ message: 'Team is full; cannot activate member' });
        }

        sport.formerMembers = (sport.formerMembers || []).filter(f => f.toString() !== memberId.toString());
        sport.members.push(memberId);
        await sport.save();
        res.json({ message: 'Member re-activated in team' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Admin: list all sports including inactive
const getAllSports = async (req, res) => {
    try {
        // support filtering, search, pagination for admin listing
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const search = (req.query.search || '').trim();
        const isActive = req.query.isActive;
        const minMembers = req.query.minMembers ? parseInt(req.query.minMembers) : null;

        const filter = {};
        if (typeof isActive !== 'undefined') {
            filter.isActive = isActive === 'true' || isActive === '1' || isActive === true;
        }

        if (search) {
            const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
            filter.$or = [ { name: rx }, { description: rx } ];
        }

        // base query
        let query = Sport.find(filter).populate('createdBy', 'name email avatar');

        // apply minMembers by aggregation-like filtering after count
        if (minMembers) {
            // fetch all then filter by members length (acceptable for admin lists)
            const all = await Sport.find(filter).populate('createdBy', 'name email avatar');
            const filtered = all.filter(s => (s.members || []).length >= minMembers);
            const total = filtered.length;
            const totalPages = Math.ceil(total / limit) || 1;
            const start = (page - 1) * limit;
            const data = filtered.slice(start, start + limit);
            return res.json({ data, meta: { page, limit, total, totalPages } });
        }

        const total = await Sport.countDocuments(filter);
        const totalPages = Math.ceil(total / limit) || 1;
        const data = await query.skip((page - 1) * limit).limit(limit).exec();
        res.json({ data, meta: { page, limit, total, totalPages } });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Admin: activate a sport
const activateSport = async (req, res) => {
    try {
        const sport = await Sport.findById(req.params.id);
        if (!sport) return res.status(404).json({ message: 'Not found' });
        if (req.user.role !== 'admin' && (!sport.createdBy || sport.createdBy.toString() !== req.user._id.toString())) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        sport.isActive = true;
        await sport.save();
        res.json({ message: 'Sport activated', sport });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Admin: get all members across sports (aggregated)
const getAllMembers = async (req, res) => {
    try {
        // include inactive teams
        const sports = await Sport.find({}).populate('members', 'name email avatar');

        const map = new Map();
        sports.forEach((sport) => {
            const sportName = sport.name;
            const sportId = sport._id;
            (sport.members || []).forEach((m) => {
                const id = m._id.toString();
                if (!map.has(id)) {
                    map.set(id, { user: m, sports: [{ id: sportId, name: sportName }] });
                } else {
                    map.get(id).sports.push({ id: sportId, name: sportName });
                }
            });
        });

        const result = Array.from(map.values());
        res.json(result);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Admin: bulk activate/deactivate sports
const bulkUpdateSports = async (req, res) => {
    try {
        const { ids, action } = req.body;
        if (!Array.isArray(ids) || !ids.length) return res.status(400).json({ message: 'ids required' });
        if (!['activate', 'deactivate'].includes(action)) return res.status(400).json({ message: 'Invalid action' });

        const isActive = action === 'activate';
        const result = await Sport.updateMany({ _id: { $in: ids } }, { $set: { isActive } });
        res.json({ message: 'Bulk update completed', modifiedCount: result.nModified || result.modifiedCount || 0 });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Admin: bulk add members to a specific sport by email list
const bulkAddMembers = async (req, res) => {
    try {
        const { id } = req.params;
        const { members } = req.body; // expect [{ email }, ...]
        if (!Array.isArray(members) || !members.length) return res.status(400).json({ message: 'members array required' });

        const sport = await Sport.findById(id);
        if (!sport) return res.status(404).json({ message: 'Sport not found' });
        if (req.user.role !== 'admin' && (!sport.createdBy || sport.createdBy.toString() !== req.user._id.toString())) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const report = { added: [], missing: [], already: [], capacityReached: [] };
        for (const m of members) {
            const email = (m.email || '').toLowerCase().trim();
            if (!email) continue;
            // stop if capacity reached
            if (typeof sport.maxMembers === 'number' && sport.members.length >= sport.maxMembers) {
                report.capacityReached.push(email);
                continue;
            }
            const user = await User.findOne({ email });
            if (!user) {
                report.missing.push(email);
                continue;
            }
            const uid = user._id.toString();
            if (sport.members.map(x => x.toString()).includes(uid)) {
                report.already.push(email);
                continue;
            }
            sport.members.push(user._id);
            report.added.push(email);
        }

        await sport.save();
        res.json({ message: 'Bulk add completed', report });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Set next session for a sport/team
const setNextSession = async (req, res) => {
    try {
        const sport = await Sport.findById(req.params.id);
        if (!sport) return res.status(404).json({ message: 'Not found' });
        if (req.user.role !== 'admin' && (!sport.createdBy || sport.createdBy.toString() !== req.user._id.toString())) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        const { date, location, description } = req.body;
        if (!date) return res.status(400).json({ message: 'Session date is required' });
        sport.nextSession = {
            date: new Date(date),
            location: location || '',
            description: description || '',
            rsvps: []
        };
        await sport.save();
        res.json({ message: 'Next session set', nextSession: sport.nextSession });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Toggle RSVP for next session
const toggleRsvp = async (req, res) => {
    try {
        const sport = await Sport.findById(req.params.id);
        if (!sport) return res.status(404).json({ message: 'Not found' });
        
        // Ensure user is a member, admin, or creator
        const userId = req.user._id.toString();
        const SportRequest = require('../models/SportRequest');
        const isMember = sport.members && sport.members.map(m => m.toString()).includes(userId);
        const isAdmin = req.user.role === 'admin';
        const isCreator = sport.createdBy && sport.createdBy.toString() === userId;
        
        // Also allow if user has a pending request
        const hasPendingRequest = await SportRequest.findOne({ sport: sport._id, user: userId, status: 'pending' });

        if (!isMember && !isAdmin && !isCreator && !hasPendingRequest) {
            return res.status(403).json({ message: 'Only team members or applicants can RSVP for sessions' });
        }

        if (!sport.nextSession || !sport.nextSession.date) return res.status(400).json({ message: 'No upcoming session scheduled' });

        const { status } = req.body; // 'going' or 'not_going'
        if (!['going', 'not_going'].includes(status)) return res.status(400).json({ message: 'Status must be going or not_going' });

        const existing = sport.nextSession.rsvps.find(r => r.user && r.user.toString() === userId);
        if (existing) {
            existing.status = status;
        } else {
            sport.nextSession.rsvps.push({ user: req.user._id, status });
        }
        await sport.save();
        
        const going = sport.nextSession.rsvps.filter(r => r.status === 'going').length;
        const notGoing = sport.nextSession.rsvps.filter(r => r.status === 'not_going').length;
        res.json({ message: `RSVP updated to ${status}`, going, notGoing, myStatus: status });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { createSport, getSports, getSport, updateSport, deleteSport, joinSport, requestToJoin, getRequests, approveRequest, rejectRequest, removeMember, activateMember, getAllSports, activateSport, getAllMembers, bulkUpdateSports, bulkAddMembers, setNextSession, toggleRsvp };
