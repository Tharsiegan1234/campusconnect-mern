import { useEffect, useState } from 'react';
import { useToast } from '../../../context/ToastContext';
import ClubForm from './ClubForm';
import '../adminListTheme.css';

const TrashIcon = () => (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
        <path fill="currentColor" d="M9 3.75A1.75 1.75 0 0 0 7.25 5.5V6H4.75a.75.75 0 0 0 0 1.5h.76l.8 10.2A2.75 2.75 0 0 0 9.05 20h5.9a2.75 2.75 0 0 0 2.74-2.3l.8-10.2h.76a.75.75 0 0 0 0-1.5h-2.5v-.5A1.75 1.75 0 0 0 15 3.75H9Zm1.25 2.25v-.5c0-.138.112-.25.25-.25h3.5c.138 0 .25.112.25.25V6H10.25Zm-1.49 4.5a.75.75 0 0 1 .79.7l.5 6a.75.75 0 1 1-1.5.1l-.5-6a.75.75 0 0 1 .7-.8Zm5.48.7a.75.75 0 1 0-1.5-.1l-.5 6a.75.75 0 1 0 1.5.1l.5-6Z"/>
    </svg>
);

const ClubList = () => {
    const { showToast } = useToast();
const askConfirm = async (message) => window.confirm(message);
    const [clubs, setClubs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [managing, setManaging] = useState(null);
    const [showScheduleOverview, setShowScheduleOverview] = useState(false);
    const [members, setMembers] = useState([]);
    const [formerMembers, setFormerMembers] = useState([]);
    const [requests, setRequests] = useState([]);
    const [adminRequests, setAdminRequests] = useState([]);
    const [showAllMembers, setShowAllMembers] = useState(false);
    const [allMembers, setAllMembers] = useState([]);
    const [allMembersError, setAllMembersError] = useState('');
    // filters / pagination / bulk
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(12);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterIsActive, setFilterIsActive] = useState('any');
    const [minMembers, setMinMembers] = useState('');
    const [selectedIds, setSelectedIds] = useState([]);
    const [bulkLoading, setBulkLoading] = useState(false);

    const buildQuery = () => {
        const qs = new URLSearchParams();
        if (page) qs.set('page', page);
        if (limit) qs.set('limit', limit);
        if (searchTerm) qs.set('search', searchTerm);
        if (filterIsActive && filterIsActive !== 'any') qs.set('isActive', filterIsActive === 'active');
        if (minMembers) qs.set('minMembers', minMembers);
        return qs.toString();
    };

    const loadClubs = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const qs = buildQuery();
            // prefer admin paginated endpoint if token present
            if (token) {
                const adminUrl = `/api/clubs/admin/all-clubs${qs ? `?${qs}` : ''}`;
                const resAdmin = await fetch(adminUrl, { headers: { Authorization: `Bearer ${token}` } });
                if (resAdmin.ok) {
                    const body = await resAdmin.json();
                    // support both array responses and { data, meta }
                    if (Array.isArray(body)) {
                        setClubs(body);
                        setTotal(body.length);
                        setTotalPages(1);
                    } else if (body && body.data) {
                        setClubs(body.data);
                        setTotal(body.meta?.total || 0);
                        setTotalPages(body.meta?.totalPages || 1);
                    }
                    setLoading(false);
                    return;
                }

                // If admin endpoint forbidden, fall back to authenticated public list
                if (resAdmin.status === 401 || resAdmin.status === 403) {
                    try {
                        const resAuth = await fetch(`/api/clubs${qs ? `?${qs}` : ''}`, { headers: { Authorization: `Bearer ${token}` } });
                        if (resAuth.ok) {
                            const body = await resAuth.json();
                            if (Array.isArray(body)) {
                                setClubs(body);
                                setTotal(body.length);
                                setTotalPages(1);
                            } else if (body && body.data) {
                                setClubs(body.data);
                                setTotal(body.meta?.total || 0);
                                setTotalPages(body.meta?.totalPages || 1);
                            }
                            setLoading(false);
                            return;
                        }
                    } catch (e) {
                        // fall through to public fetch
                    }
                }
            }

            const res = await fetch(`/api/clubs${qs ? `?${qs}` : ''}`);
            const data = await res.json();
            if (Array.isArray(data)) {
                setClubs(data);
                setTotal(data.length);
                setTotalPages(1);
            } else if (data && data.data) {
                setClubs(data.data);
                setTotal(data.meta?.total || 0);
                setTotalPages(data.meta?.totalPages || 1);
            }
        } catch (err) {
            console.error('Error loading clubs', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadClubs(); }, [page, limit, searchTerm, filterIsActive, minMembers]);

    useEffect(() => {
        // load global admin requests for quick approvals
        const fetchAdminRequests = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;
            try {
                const res = await fetch('/api/clubs/admin/requests', { headers: { Authorization: `Bearer ${token}` } });
                if (!res.ok) return setAdminRequests([]);
                const data = await res.json();
                setAdminRequests(Array.isArray(data) ? data : []);
            } catch (e) {
                setAdminRequests([]);
            }
        };
        fetchAdminRequests();
    }, [/* refresh when clubs list changes */ page, limit]);

    const handleCreate = () => { setEditing(null); setShowForm(true); };
    const handleEdit = (club) => { setEditing(club); setShowForm(true); };
    const handleSaved = (saved) => { setShowForm(false); setEditing(null); loadClubs(); };

    const handleDeactivate = async (club) => {
        if (!confirm('Deactivate this club?')) return;
        const token = localStorage.getItem('token');
        try {
            const id = club._id || club.id;
            const res = await fetch(`/api/clubs/${id}`, { method: 'PUT', headers: { 'Content-Type':'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ isActive: false }) });
            if (!res.ok) throw new Error('Failed');
            showToast('Deactivated', 'success');
            loadClubs();
        } catch (err) { showToast(err.message || 'Failed', 'error'); }
    };

    const handleDelete = async (club) => {
        if (!confirm('Delete this club?')) return;
        const token = localStorage.getItem('token');
        try {
            const id = club._id || club.id;
            const res = await fetch(`/api/clubs/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
            const body = await res.json();
            if (!res.ok) throw new Error(body.message || 'Delete failed');
            showToast(body.message || 'Deleted', 'success');
            loadClubs();
        } catch (err) { showToast(err.message || 'Delete failed', 'error'); }
    };

    const handleGlobalApprove = async (clubId, reqId) => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`/api/clubs/${clubId}/requests/${reqId}/approve`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) throw new Error('Approve failed');
            showToast('Approved', 'success');
            loadClubs();
        } catch (e) { showToast(e.message, 'error'); }
    };

    const handleGlobalReject = async (clubId, reqId) => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`/api/clubs/${clubId}/requests/${reqId}/reject`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) throw new Error('Reject failed');
            showToast('Rejected', 'success');
            loadClubs();
        } catch (e) { showToast(e.message, 'error'); }
    };

    const loadAllMembers = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('/api/clubs/all-members', { headers: { Authorization: `Bearer ${token}` } });
            const contentType = res.headers.get('content-type') || '';
            if (!res.ok) {
                let errMsg = `Failed to load members (${res.status})`;
                if (contentType.includes('application/json')) {
                    const body = await res.json().catch(() => null);
                    if (body && body.message) errMsg = body.message;
                } else {
                    const text = await res.text().catch(() => null);
                    if (text) errMsg = text;
                }
                setAllMembers([]);
                setAllMembersError(errMsg);
                setShowAllMembers(true);
                return;
            }

            let data = [];
            if (contentType.includes('application/json')) {
                data = await res.json().catch(() => []);
            } else {
                // unexpected response type
                setAllMembersError('Unexpected response from server');
                setAllMembers([]);
                setShowAllMembers(true);
                return;
            }

            setAllMembers(data || []);
            setAllMembersError('');
            setShowAllMembers(true);
        } catch (err) {
            setAllMembers([]);
            setAllMembersError(err.message || 'Could not load members');
            setShowAllMembers(true);
        }
    };

    const openManage = async (club) => {
        setManaging(club);
        const id = club._id || club.id;
        try {
            const res1 = await fetch(`/api/clubs/${id}`);
            const c = await res1.json();
            setMembers(c.members || []);
            setFormerMembers(c.formerMembers || []);
        } catch (e) { setMembers([]); }

        try {
            const token = localStorage.getItem('token');
            const res2 = await fetch(`/api/clubs/${id}/requests`, { headers: { Authorization: `Bearer ${token}` } });
            if (res2.ok) {
                const reqs = await res2.json();
                setRequests(reqs || []);
            } else {
                setRequests([]);
            }
        } catch (e) { setRequests([]); }
    };

    const activateClub = async (club) => {
        if (!confirm('Activate this club?')) return;
        const token = localStorage.getItem('token');
        const id = club._id || club.id;
        try {
            const res = await fetch(`/api/clubs/${id}/activate`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
            const body = await res.json();
            if (!res.ok) throw new Error(body.message || 'Activate failed');
            showToast(body.message || 'Club activated', 'success');
            loadClubs();
        } catch (err) { showToast(err.message || 'Activate failed', 'error'); }
    };

    const approve = async (reqId) => {
        const id = managing._id || managing.id;
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`/api/clubs/${id}/requests/${reqId}/approve`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
            const body = await res.json();
            if (!res.ok) throw new Error(body.message || 'Approve failed');
            showToast(body.message || 'Approved', 'success');
            openManage(managing);
        } catch (err) { showToast(err.message || 'Approve failed', 'error'); }
    };

    const reject = async (reqId) => {
        const id = managing._id || managing.id;
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`/api/clubs/${id}/requests/${reqId}/reject`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
            const body = await res.json();
            if (!res.ok) throw new Error(body.message || 'Reject failed');
            showToast(body.message || 'Rejected', 'success');
            openManage(managing);
        } catch (err) { showToast(err.message || 'Reject failed', 'error'); }
    };

    const removeMember = async (memberId) => {
        if (!(await askConfirm('Are you sure you want to remove this member from the club?'))) return;
        const id = managing._id || managing.id;
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`/api/clubs/${id}/members/${memberId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
            const body = await res.json();
            if (!res.ok) throw new Error(body.message || 'Remove failed');
            showToast(body.message || 'Removed', 'success');
            openManage(managing);
        } catch (err) { showToast(err.message || 'Remove failed', 'error'); }
    };

    const activateMember = async (memberId) => {
        if (!confirm('Activate this member in the club?')) return;
        const id = managing._id || managing.id;
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`/api/clubs/${id}/members/${memberId}/activate`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
            const body = await res.json();
            if (!res.ok) throw new Error(body.message || 'Activate failed');
            showToast(body.message || 'Activated', 'success');
            openManage(managing);
        } catch (err) { showToast(err.message || 'Activate failed', 'error'); }
    };
     //jghjghjgjg
    const handleBulkAction = async (action) => {
        if (!selectedIds.length) return;
        if (!confirm(`Confirm ${action} selected clubs?`)) return;
        setBulkLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/clubs/bulk', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ ids: selectedIds, action }) });
            const body = await res.json();
            if (!res.ok) throw new Error(body.message || 'Bulk failed');
            showToast(body.message || 'Bulk completed', 'success');
            setSelectedIds([]);
            loadClubs();
        } catch (err) {
            showToast(err.message || 'Bulk failed', 'error');
        } finally {
            setBulkLoading(false);
        }
    };

    return (
        <div >
            <div className="admin-list-header">
                <h2 className="admin-list-title">Clubs & Societies Management</h2>
                <div className="admin-list-toolbar">
                    <input value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setPage(1); }} placeholder="Search clubs or member emails" className="input admin-filter-input" />
                    <select value={filterIsActive} onChange={e => { setFilterIsActive(e.target.value); setPage(1); }} className="input admin-filter-input">
                        <option value="any">Any</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                    <select value={limit} onChange={e => { setLimit(Number(e.target.value)); setPage(1); }} className="input admin-filter-input w-32">
                        <option value={6}>6</option>
                        <option value={12}>12</option>
                        <option value={24}>24</option>
                    </select>
                    <button onClick={() => setShowScheduleOverview(true)} className="btn-outline admin-btn flex items-center gap-2">
                        <span>📅</span> Schedules
                    </button>
                    <button onClick={handleCreate} className="btn-primary admin-btn">Create Club</button>
                    <button onClick={loadAllMembers} className="btn-outline admin-btn">All Members</button>
                </div>
            </div>

            {showForm && (
                <div className="mb-6">
                    <ClubForm club={editing} onSaved={handleSaved} onCancel={() => { setShowForm(false); setEditing(null); }} />
                </div>
            )}

            {loading ? (
                <div>Loading clubs...</div>
            ) : (
                <>
                    {/* Admin quick-approval panel */}
                    {adminRequests && adminRequests.length > 0 && (
                        <div className="admin-requests-panel mb-6 p-6 shadow-sm">
                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-orange-900">
                                <span>⏳</span> Pending Join Requests
                            </h3>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {adminRequests.map(r => (
                                    <div key={r._id} className="admin-request-card p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                                        <div>
                                            <h4 className="font-bold text-gray-800 text-lg">{r.user?.name || 'Unknown User'}</h4>
                                            <p className="text-sm text-gray-500">{r.user?.email}</p>
                                            <div className="mt-3 text-xs font-bold px-3 py-1 bg-blue-50 text-[#1E3A8A] border border-blue-100 rounded-lg inline-block">
                                                Club: {r.club?.name || '—'}
                                            </div>
                                            <div className="text-xs font-bold px-3 py-1 bg-orange-100 text-orange-800 border border-orange-200 rounded-lg inline-block ml-2">
                                                Status: {r.status}
                                            </div>
                                            {r.message && <p className="mt-3 text-sm italic text-gray-600 bg-gray-50 p-2 rounded-lg">"{r.message}"</p>}
                                        </div>
                                        <div className="mt-4 flex gap-2">
                                            <button onClick={async () => {
                                                try {
                                                    const token = localStorage.getItem('token');
                                                    const res = await fetch(`/api/clubs/${r.club._id}/requests/${r._id}/approve`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
                                                    const body = await res.json();
                                                    if (!res.ok) throw new Error(body.message || 'Approve failed');
                                                    alert(body.message || 'Approved');
                                                    loadClubs();
                                                    const rres = await fetch('/api/clubs/admin/requests', { headers: { Authorization: `Bearer ${token}` } });
                                                    if (rres.ok) setAdminRequests(await rres.json());
                                                } catch (err) { alert(err.message || 'Approve failed'); }
                                            }} className="flex-1 bg-[#F97316] hover:bg-[#EA580C] text-white font-bold py-2 rounded-lg transition-colors text-sm shadow-sm">Approve</button>
                                            <button onClick={async () => {
                                                try {
                                                    const token = localStorage.getItem('token');
                                                    const res = await fetch(`/api/clubs/${r.club._id}/requests/${r._id}/reject`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
                                                    const body = await res.json();
                                                    if (!res.ok) throw new Error(body.message || 'Reject failed');
                                                    alert(body.message || 'Rejected');
                                                    loadClubs();
                                                    const rres = await fetch('/api/clubs/admin/requests', { headers: { Authorization: `Bearer ${token}` } });
                                                    if (rres.ok) setAdminRequests(await rres.json());
                                                } catch (err) { alert(err.message || 'Reject failed'); }
                                            }} className="flex-1 bg-white border border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-gray-700 font-bold py-2 rounded-lg transition-colors text-sm shadow-sm">Reject</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    <div className="admin-bulk-bar mb-2 flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-2">
                            <label className="flex items-center gap-2">
                                <input type="checkbox" checked={selectedIds.length === clubs.length && clubs.length > 0} onChange={e => {
                                    if (e.target.checked) setSelectedIds(clubs.map(c => c._id || c.id)); else setSelectedIds([]);
                                }} /> Select All
                            </label>
                            <button disabled={selectedIds.length === 0 || bulkLoading} onClick={() => handleBulkAction('activate')} className="btn-primary admin-btn text-sm">Activate Selected</button>
                            <button disabled={selectedIds.length === 0 || bulkLoading} onClick={() => handleBulkAction('deactivate')} className="btn-outline admin-btn text-sm">Deactivate Selected</button>
                        </div>
                        <div className="text-sm text-text-secondary">Total: {total}</div>
                    </div>

                    <div className="admin-list-grid">
                        {clubs.map((c) => (
                            <div key={c._id || c.id} className="admin-list-card">
                                <div className="admin-card-top">
                                    <div className="flex items-start gap-3 min-w-0">
                                        <input type="checkbox" checked={selectedIds.includes(c._id || c.id)} onChange={e => {
                                            const realId = c._id || c.id;
                                            if (e.target.checked) setSelectedIds(prev => Array.from(new Set([...prev, realId])));
                                            else setSelectedIds(prev => prev.filter(x => x !== realId));
                                        }} />
                                        <div className="min-w-0">
                                            <h3 className="admin-card-title font-bold">{c.name}</h3>
                                            <div className="admin-card-meta">
                                                <span className="admin-card-pill">Type: {c.type || 'General'}</span>
                                                <span className={`admin-card-pill ${c.nextSession?.date ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'}`}>
                                                    {c.nextSession?.date ? `📅 ${new Date(c.nextSession.date).toLocaleDateString()}` : '⏳ Pending session'}
                                                </span>
                                                {c.maxMembers ? <span className="admin-card-pill">Max: {c.maxMembers}</span> : null}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="admin-card-actions">
                                    <button onClick={() => handleEdit(c)} className="text-sm btn-outline admin-btn">Edit</button>
                                    <button onClick={() => openManage(c)} className="text-sm btn-primary admin-btn">Manage Members</button>
                                </div>
                                <p className="admin-card-description">{c.description}</p>
                                <div className="mt-4 flex flex-wrap gap-2 justify-end items-center">
                                    {!c.isActive ? (
                                        <>
                                            <span className="text-xs text-text-secondary mr-2">Inactive</span>
                                            <button onClick={() => activateClub(c)} className="text-sm btn-primary admin-btn">Activate</button>
                                        </>
                                    ) : (
                                        <button onClick={() => handleDeactivate(c)} className="text-sm text-error">Deactivate</button>
                                    )}
                                    <button onClick={() => handleDelete(c)} className="inline-flex items-center gap-2 text-sm px-3 py-2 rounded-xl border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 transition-colors">
                                        <TrashIcon />
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="admin-pagination mt-4 flex items-center justify-center gap-3 flex-wrap">
                        <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="btn-outline admin-btn">Prev</button>
                        <div className="text-sm">Page {page} / {totalPages}</div>
                        <button disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} className="btn-outline admin-btn">Next</button>
                    </div>
                </>
            )}

            {managing && (
                <div className="admin-manage-panel mt-6 p-4">
                    <div className="flex justify-between items-center gap-3 flex-wrap">
                        <h4 className="font-bold">Manage Members — {managing.name}</h4>
                        <button onClick={() => { setManaging(null); setMembers([]); setRequests([]); }} className="btn-outline admin-btn">Close</button>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                        <div>
                            <h5 className="font-semibold">Current Members</h5>
                            {members.length === 0 ? <p className="text-text-secondary">No members</p> : (
                                <ul className="mt-2 space-y-2">
                                    {members.map(m => (
                                        <li key={m._id} className="flex items-center justify-between">
                                            <div>
                                                <strong>{m.name}</strong>
                                                <div className="text-xs text-text-secondary">{m.email}</div>
                                            </div>
                                            <div>
                                                <button onClick={() => removeMember(m._id)} className="text-sm text-error">Remove</button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <div>
                            <h5 className="font-semibold">Deactivated Members</h5>
                            {formerMembers.length === 0 ? <p className="text-text-secondary">No deactivated members</p> : (
                                <ul className="mt-2 space-y-2">
                                    {formerMembers.map(m => (
                                        <li key={m._id} className="flex items-center justify-between">
                                            <div>
                                                <strong>{m.name}</strong>
                                                <div className="text-xs text-text-secondary">{m.email}</div>
                                            </div>
                                            <div>
                                                <button onClick={() => activateMember(m._id)} className="text-sm btn-primary admin-btn">Activate</button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <div>
                            <h5 className="font-semibold">Pending Requests</h5>
                            {requests.length === 0 ? <p className="text-text-secondary">No pending requests (or you may not have permission)</p> : (
                                <ul className="mt-2 space-y-2">
                                    {requests.map(r => (
                                        <li key={r._id} className="flex items-center justify-between">
                                            <div>
                                                <strong>{r.user.name}</strong>
                                                <div className="text-xs text-text-secondary">{r.user.email}</div>
                                                {r.message && <div className="text-xs mt-1">"{r.message}"</div>}
                                            </div>
                                            <div className="flex gap-2">
                                                <div className="text-xs text-text-secondary mr-2">{r.status}</div>
                                                <button onClick={() => approve(r._id)} className="btn-primary admin-btn text-sm">Approve</button>
                                                <button onClick={() => reject(r._id)} className="btn-outline admin-btn text-sm">Reject</button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {showAllMembers && (
                <div className="admin-all-members-panel mt-6 p-4">
                    <div className="flex justify-between items-center gap-3 flex-wrap">
                        <h4 className="font-bold">All Club Members</h4>
                        <button onClick={() => setShowAllMembers(false)} className="btn-outline admin-btn">Close</button>
                    </div>
                    <div className="mt-4">
                                {allMembersError ? (
                                    <p className="text-error">{allMembersError}</p>
                                ) : allMembers.length === 0 ? (
                                    <p className="text-text-secondary">No members found.</p>
                                ) : (
                                    <ul className="space-y-3">
                                        {allMembers.map((entry) => (
                                            <li key={entry.user._id} className="flex items-start justify-between bg-gray-50 p-3 rounded">
                                                <div>
                                                    <strong>{entry.user.name}</strong>
                                                    <div className="text-xs text-text-secondary">{entry.user.email}</div>
                                                    <div className="text-xs mt-1">Clubs: {entry.clubs.map(c => c.name).join(', ')}</div>
                                                </div>
                                                <div>
                                                    {/* Optional actions could go here */}
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                    </div>
                </div>
            )}

            {/* Global Meeting Overview Modal */}
            {showScheduleOverview && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden">
                        <div className="bg-[#1E3A8A] p-6 text-white flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-bold">📅 Upcoming Meetings Overview</h3>
                                <p className="text-blue-100 text-xs mt-1">Platform-wide meeting monitoring</p>
                            </div>
                            <button onClick={() => setShowScheduleOverview(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20">✕</button>
                        </div>
                        <div className="p-4 max-h-[60vh] overflow-y-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-100">
                                        <th className="py-3 px-4 text-[10px] font-bold text-gray-400 uppercase">Club</th>
                                        <th className="py-3 px-4 text-[10px] font-bold text-gray-400 uppercase">Next Meeting</th>
                                        <th className="py-3 px-4 text-[10px] font-bold text-gray-400 uppercase">Location</th>
                                        <th className="py-3 px-4 text-[10px] font-bold text-gray-400 uppercase">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {clubs.map(c => (
                                        <tr key={c._id || c.id} className="border-b border-gray-50 hover:bg-blue-50/30">
                                            <td className="py-4 px-4 font-bold text-gray-800 text-sm">{c.name}</td>
                                            <td className="py-4 px-4">
                                                {c.nextSession?.date ? (
                                                    <span className="text-xs font-bold text-gray-700">{new Date(c.nextSession.date).toLocaleString()}</span>
                                                ) : (
                                                    <span className="text-xs font-bold text-orange-500">Pending</span>
                                                )}
                                            </td>
                                            <td className="py-4 px-4 text-xs text-gray-600 truncate max-w-[120px]">{c.nextSession?.location || '—'}</td>
                                            <td className="py-4 px-4">
                                                <button onClick={() => { handleEdit(c); setShowScheduleOverview(false); }} className="text-xs font-bold text-blue-600 hover:underline">Edit</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-6 bg-gray-50 text-center">
                            <button onClick={() => setShowScheduleOverview(false)} className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl text-xs hover:bg-gray-100 transition-all shadow-sm">Done</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClubList;
