import { useEffect, useState } from 'react';
import SportsTeamForm from './SportsTeamForm';

const SportsTeamList = () => {
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [managing, setManaging] = useState(null); // team being managed
    const [members, setMembers] = useState([]);
    const [formerMembers, setFormerMembers] = useState([]);
    const [requests, setRequests] = useState([]);
    const [globalRequests, setGlobalRequests] = useState([]);
    const [showAllMembers, setShowAllMembers] = useState(false);
    const [allMembers, setAllMembers] = useState([]);
    const [allMembersError, setAllMembersError] = useState('');
    // filters / pagination / bulk
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(12);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [filterIsActive, setFilterIsActive] = useState('any');
    const [minMembers, setMinMembers] = useState('');
    const [selectedIds, setSelectedIds] = useState([]);
    const [bulkLoading, setBulkLoading] = useState(false);
    const [csvFile, setCsvFile] = useState(null);

    const buildQuery = (searchValue) => {
        const qs = new URLSearchParams();
        if (page) qs.set('page', page);
        if (limit) qs.set('limit', limit);
        if (searchValue) qs.set('search', searchValue);
        if (filterIsActive && filterIsActive !== 'any') qs.set('isActive', filterIsActive === 'active');
        if (minMembers) qs.set('minMembers', minMembers);
        return qs.toString();
    };

    const loadTeams = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const qs = buildQuery(debouncedSearch);
            if (token) {
                const adminUrl = `/api/sports/admin/all-teams${qs ? `?${qs}` : ''}`;
                console.debug('SportsTeamList: fetching admin URL', adminUrl);
                const resAdmin = await fetch(adminUrl, { headers: { Authorization: `Bearer ${token}` } });
                if (resAdmin.ok) {
                    const body = await resAdmin.json();
                    console.debug('SportsTeamList: admin response', body);
                    if (Array.isArray(body)) {
                        setTeams(body);
                        setTotal(body.length);
                        setTotalPages(1);
                    } else if (body && body.data) {
                        setTeams(body.data);
                        setTotal(body.meta?.total || 0);
                        setTotalPages(body.meta?.totalPages || 1);
                    }
                    setLoading(false);
                    return;
                }
                if (resAdmin.status === 401 || resAdmin.status === 403) {
                    try {
                        const publicUrl = `/api/sports${qs ? `?${qs}` : ''}`;
                        console.debug('SportsTeamList: admin forbidden, fetching public URL', publicUrl);
                        const resAuth = await fetch(publicUrl, { headers: { Authorization: `Bearer ${token}` } });
                        if (resAuth.ok) {
                            const body = await resAuth.json();
                            console.debug('SportsTeamList: public response with auth', body);
                            if (Array.isArray(body)) {
                                setTeams(body);
                                setTotal(body.length);
                                setTotalPages(1);
                            } else if (body && body.data) {
                                setTeams(body.data);
                                setTotal(body.meta?.total || 0);
                                setTotalPages(body.meta?.totalPages || 1);
                            }
                            setLoading(false);
                            return;
                        }
                    } catch (e) {}
                }
            }

            const res = await fetch(`/api/sports${qs ? `?${qs}` : ''}`);
                console.debug('SportsTeamList: fetching public URL without token', `/api/sports${qs ? `?${qs}` : ''}`);
            const data = await res.json();
                console.debug('SportsTeamList: public response', data);
            if (Array.isArray(data)) {
                setTeams(data);
                setTotal(data.length);
                setTotalPages(1);
            } else if (data && data.data) {
                setTeams(data.data);
                setTotal(data.meta?.total || 0);
                setTotalPages(data.meta?.totalPages || 1);
            }
        } catch (err) {
            console.error('Error loading teams', err);
        } finally {
            setLoading(false);
        }
    };

    const loadAllMembers = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('/api/sports/admin/all-members', { headers: { Authorization: `Bearer ${token}` } });
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

    // debounce search input so typing updates don't fire too many requests and ensure correct query is used
    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 300);
        return () => clearTimeout(t);
    }, [searchTerm]);

    useEffect(() => { loadTeams(); }, [page, limit, debouncedSearch, filterIsActive, minMembers]);

    const fetchGlobalRequests = async (sportsArray) => {
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
            const allReqs = [];
            await Promise.all(sportsArray.map(async (sp) => {
                const id = sp._id || sp.id;
                try {
                    const res = await fetch(`/api/sports/${id}/requests`, { headers: { Authorization: `Bearer ${token}` } });
                    if (res.ok) {
                        const reqs = await res.json();
                        if (Array.isArray(reqs)) {
                            reqs.forEach(r => {
                                r.sportName = sp.name;
                                r.sportId = id;
                                allReqs.push(r);
                            });
                        }
                    }
                } catch(e) {}
            }));
            setGlobalRequests(allReqs);
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        if (teams.length > 0) {
            fetchGlobalRequests(teams);
        } else {
            setGlobalRequests([]);
        }
    }, [teams]);

    const handleGlobalApprove = async (sportId, reqId) => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`/api/sports/${sportId}/requests/${reqId}/approve`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) throw new Error('Approve failed');
            alert('Approved');
            loadTeams();
        } catch (e) { alert(e.message); }
    };

    const handleGlobalReject = async (sportId, reqId) => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`/api/sports/${sportId}/requests/${reqId}/reject`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) throw new Error('Reject failed');
            alert('Rejected');
            loadTeams();
        } catch (e) { alert(e.message); }
    };

    const handleCreate = () => { setEditing(null); setShowForm(true); };

    const handleEdit = (team) => { setEditing(team); setShowForm(true); };

    const handleSaved = (saved) => {
        setShowForm(false);
        setEditing(null);
        loadTeams();
    };

    const handleDeactivate = async (team) => {
        if (!confirm('Deactivate this team?')) return;
        const token = localStorage.getItem('token');
        try {
            const id = team._id || team.id;
            const res = await fetch(`/api/sports/${id}`, { method: 'PUT', headers: { 'Content-Type':'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ isActive: false }) });
            if (!res.ok) throw new Error('Failed');
            alert('Deactivated');
            loadTeams();
        } catch (err) { alert(err.message || 'Failed'); }
    };

    const openManage = async (team) => {
        setManaging(team);
        const id = team._id || team.id;
        try {
            const res1 = await fetch(`/api/sports/${id}`);
            const t = await res1.json();
            setMembers(t.members || []);
            setFormerMembers(t.formerMembers || []);
        } catch (e) { setMembers([]); }

        try {
            const token = localStorage.getItem('token');
            const res2 = await fetch(`/api/sports/${id}/requests`, { headers: { Authorization: `Bearer ${token}` } });
            if (res2.ok) {
                const reqs = await res2.json();
                setRequests(reqs || []);
            } else {
                setRequests([]);
            }
        } catch (e) { setRequests([]); }
    };

    const activateMember = async (memberId) => {
        if (!confirm('Activate this member in the team?')) return;
        const id = managing._id || managing.id;
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`/api/sports/${id}/members/${memberId}/activate`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
            const body = await res.json();
            if (!res.ok) throw new Error(body.message || 'Activate failed');
            alert(body.message || 'Activated');
            openManage(managing);
        } catch (err) { alert(err.message || 'Activate failed'); }
    };

    const activateTeam = async (team) => {
        if (!confirm('Activate this team?')) return;
        const token = localStorage.getItem('token');
        const id = team._id || team.id;
        try {
            const res = await fetch(`/api/sports/${id}/activate`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
            const body = await res.json();
            if (!res.ok) throw new Error(body.message || 'Activate failed');
            alert(body.message || 'Team activated');
            loadTeams();
        } catch (err) { alert(err.message || 'Activate failed'); }
    };

    const approve = async (reqId) => {
        const id = managing._id || managing.id;
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`/api/sports/${id}/requests/${reqId}/approve`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
            const body = await res.json();
            if (!res.ok) throw new Error(body.message || 'Approve failed');
            alert(body.message || 'Approved');
            openManage(managing);
        } catch (err) { alert(err.message || 'Approve failed'); }
    };

    const reject = async (reqId) => {
        const id = managing._id || managing.id;
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`/api/sports/${id}/requests/${reqId}/reject`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
            const body = await res.json();
            if (!res.ok) throw new Error(body.message || 'Reject failed');
            alert(body.message || 'Rejected');
            openManage(managing);
        } catch (err) { alert(err.message || 'Reject failed'); }
    };

    const removeMember = async (memberId) => {
        if (!confirm('Remove this member?')) return;
        const id = managing._id || managing.id;
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`/api/sports/${id}/members/${memberId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
            const body = await res.json();
            if (!res.ok) throw new Error(body.message || 'Remove failed');
            alert(body.message || 'Removed');
            openManage(managing);
        } catch (err) { alert(err.message || 'Remove failed'); }
    };

    const handleBulkAction = async (action) => {
        if (!selectedIds.length) return;
        if (!confirm(`Confirm ${action} selected teams?`)) return;
        setBulkLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/sports/bulk', { method: 'POST', headers: { 'Content-Type':'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ ids: selectedIds, action }) });
            const body = await res.json();
            if (!res.ok) throw new Error(body.message || 'Bulk failed');
            alert(body.message || 'Bulk completed');
            setSelectedIds([]);
            loadTeams();
        } catch (err) {
            alert(err.message || 'Bulk failed');
        } finally { setBulkLoading(false); }
    };

    const parseCsvText = (text) => {
        const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        if (!lines.length) return [];
        const header = lines[0].split(',').map(h => h.trim().toLowerCase());
        const emailIdx = header.indexOf('email');
        const rows = lines.slice(1).map(line => line.split(',').map(c => c.trim()));
        const result = [];
        for (const r of rows) {
            if (emailIdx >= 0) {
                const email = r[emailIdx];
                if (email) result.push({ email });
            } else {
                // assume first column is email
                if (r[0]) result.push({ email: r[0] });
            }
        }
        return result;
    };

    const handleImportCsv = async () => {
        if (!managing) return alert('Open a team to import members into');
        if (!csvFile) return alert('Select a CSV file');
        const reader = new FileReader();
        reader.onload = async (e) => {
            const txt = e.target.result;
            const members = parseCsvText(txt);
            if (!members.length) return alert('No emails found in CSV');
            const token = localStorage.getItem('token');
            try {
                const res = await fetch(`/api/sports/${managing._id || managing.id}/bulk-members`, { method: 'POST', headers: { 'Content-Type':'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ members }) });
                const body = await res.json();
                if (!res.ok) throw new Error(body.message || 'Import failed');
                alert('Import completed: ' + JSON.stringify(body.report || body));
                openManage(managing);
            } catch (err) {
                alert(err.message || 'Import failed');
            }
        };
        reader.readAsText(csvFile);
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Sports Management</h2>
                <div className="flex items-center gap-2">
                    <input value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setPage(1); }} placeholder="Search teams or member emails" className="input" />
                    <select value={filterIsActive} onChange={e => { setFilterIsActive(e.target.value); setPage(1); }} className="input">
                        <option value="any">Any</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                    <input type="number" min="0" value={minMembers} onChange={e => { setMinMembers(e.target.value); setPage(1); }} placeholder="Min members" className="input w-32" />
                    <select value={limit} onChange={e => { setLimit(Number(e.target.value)); setPage(1); }} className="input w-32">
                        <option value={6}>6</option>
                        <option value={12}>12</option>
                        <option value={24}>24</option>
                    </select>
                    <button onClick={handleCreate} className="btn-primary">Create Team</button>
                    <button onClick={loadAllMembers} className="btn-outline ml-2">All Members</button>
                </div>
            </div>

            {globalRequests.length > 0 && (
                <div className="mb-6 bg-orange-50 p-6 rounded-2xl border border-orange-200 shadow-sm">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-orange-900">
                        <span>⏳</span> Pending Join Requests
                    </h3>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {globalRequests.map(r => (
                            <div key={r._id} className="bg-white p-5 rounded-xl border border-orange-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                                <div>
                                    <h4 className="font-bold text-gray-800 text-lg">{r.user?.name || 'Unknown User'}</h4>
                                    <p className="text-sm text-gray-500">{r.user?.email}</p>
                                    <div className="mt-3 text-xs font-bold px-3 py-1 bg-blue-50 text-[#1E3A8A] border border-blue-100 rounded-lg inline-block">
                                        Team: {r.sportName}
                                    </div>
                                    <div className="text-xs font-bold px-3 py-1 bg-orange-100 text-orange-800 border border-orange-200 rounded-lg inline-block ml-2">
                                        Status: {r.status}
                                    </div>
                                    {r.message && <p className="mt-3 text-sm italic text-gray-600 bg-gray-50 p-2 rounded-lg">"{r.message}"</p>}
                                </div>
                                <div className="mt-4 flex gap-2">
                                    <button onClick={() => handleGlobalApprove(r.sportId, r._id)} className="flex-1 bg-[#F97316] hover:bg-[#EA580C] text-white font-bold py-2 rounded-lg transition-colors text-sm shadow-sm">Approve</button>
                                    <button onClick={() => handleGlobalReject(r.sportId, r._id)} className="flex-1 bg-white border border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-gray-700 font-bold py-2 rounded-lg transition-colors text-sm shadow-sm">Reject</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {showForm && (
                <div className="mb-6">
                    <SportsTeamForm team={editing} onSaved={handleSaved} onCancel={() => { setShowForm(false); setEditing(null); }} />
                </div>
            )}

            {loading ? (
                <div>Loading teams...</div>
            ) : (
                <>
                    <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <label className="flex items-center gap-2">
                                <input type="checkbox" checked={selectedIds.length === teams.length && teams.length > 0} onChange={e => {
                                    if (e.target.checked) setSelectedIds(teams.map(t => t._id || t.id)); else setSelectedIds([]);
                                }} /> Select All
                            </label>
                            <button disabled={selectedIds.length === 0 || bulkLoading} onClick={() => handleBulkAction('activate')} className="btn-primary text-sm">Activate Selected</button>
                            <button disabled={selectedIds.length === 0 || bulkLoading} onClick={() => handleBulkAction('deactivate')} className="btn-outline text-sm">Deactivate Selected</button>
                        </div>
                        <div className="text-sm text-text-secondary">Total: {total}</div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                        {teams.map((t) => (
                            <div key={t._id || t.id} className="bg-white p-4 rounded-lg border shadow-sm">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-start gap-3">
                                        <input type="checkbox" checked={selectedIds.includes(t._id || t.id)} onChange={e => {
                                            const realId = t._id || t.id;
                                            if (e.target.checked) setSelectedIds(prev => Array.from(new Set([...prev, realId])));
                                            else setSelectedIds(prev => prev.filter(x => x !== realId));
                                        }} />
                                        <div>
                                            <h3 className="font-bold">{t.name}</h3>
                                            <p className="text-sm text-text-secondary">Coach: {t.coach || '—'}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleEdit(t)} className="text-sm btn-outline">Edit</button>
                                        <button onClick={() => openManage(t)} className="text-sm btn-primary">Manage Members</button>
                                    </div>
                                </div>
                                <p className="mt-3 text-text-secondary">{t.description}</p>
                                <div className="mt-3 flex gap-2 justify-end items-center">
                                    {!t.isActive ? (
                                        <>
                                            <span className="text-xs text-text-secondary mr-2">Inactive</span>
                                            <button onClick={() => activateTeam(t)} className="text-sm btn-primary">Activate</button>
                                        </>
                                    ) : (
                                        <button onClick={() => handleDeactivate(t)} className="text-sm text-error">Deactivate</button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-4 flex items-center justify-center gap-3">
                        <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="btn-outline">Prev</button>
                        <div className="text-sm">Page {page} / {totalPages}</div>
                        <button disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} className="btn-outline">Next</button>
                    </div>
                </>
            )}

            {managing && (
                <div className="mt-6 bg-white p-4 rounded-lg border">
                    <div className="flex justify-between items-center">
                        <h4 className="font-bold">Manage Members — {managing.name}</h4>
                        <button onClick={() => { setManaging(null); setMembers([]); setRequests([]); }} className="btn-outline">Close</button>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                        <div className="md:col-span-2">
                            <label className="block mb-2 font-semibold">Import Members (CSV)</label>
                            <div className="flex items-center gap-2">
                                <input type="file" accept="text/csv" onChange={e => setCsvFile(e.target.files?.[0] || null)} />
                                <button onClick={handleImportCsv} className="btn-primary">Import CSV</button>
                                <div className="text-xs text-text-secondary">CSV should contain an 'email' column or email in first column.</div>
                            </div>
                        </div>
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
                                                <button onClick={() => activateMember(m._id)} className="text-sm btn-primary">Activate</button>
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
                                                <button onClick={() => approve(r._id)} className="btn-primary text-sm">Approve</button>
                                                <button onClick={() => reject(r._id)} className="btn-outline text-sm">Reject</button>
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
                <div className="mt-6 bg-white p-4 rounded-lg border">
                    <div className="flex justify-between items-center">
                        <h4 className="font-bold">All Team Members</h4>
                        <button onClick={() => setShowAllMembers(false)} className="btn-outline">Close</button>
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
                                            <div className="text-xs mt-1">Teams: {entry.sports.map(s => s.name).join(', ')}</div>
                                        </div>
                                        <div />
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SportsTeamList;
