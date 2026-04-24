import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const GroupMembers = () => {
    const { id } = useParams();
    const [group, setGroup] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isBanModalOpen, setIsBanModalOpen] = useState(false);
    const [selectedUserForBan, setSelectedUserForBan] = useState(null);
    const [banDuration, setBanDuration] = useState('24');
    const [banReason, setBanReason] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        const fetchGroupDetails = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('token');
                const res = await axios.get(`/api/qa/admin/groups/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setGroup(res.data);
                setLoading(false);
            } catch (err) {
                setError(err.response?.data?.message || "Failed to load group details");
                setLoading(false);
            }
        };

        fetchGroupDetails();
    }, [id]);

    const handleRemoveMember = async (userId, userName) => {
        if (!window.confirm(`Are you sure you want to remove ${userName} from this group?`)) return;

        try {
            setActionLoading(true);
            const token = localStorage.getItem('token');
            await axios.post(`/api/qa/admin/groups/${id}/members/${userId}/remove`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setGroup(prev => ({
                ...prev,
                members: prev.members.filter(m => m._id !== userId)
            }));
            setActionLoading(false);
        } catch (err) {
            alert(err.response?.data?.message || "Failed to remove member");
            setActionLoading(false);
        }
    };

    const handleUnbanUser = async (userId) => {
        try {
            setActionLoading(true);
            const token = localStorage.getItem('token');
            await axios.post(`/api/qa/admin/members/${userId}/unban`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Update local state to reflect unban
            setGroup(prev => ({
                ...prev,
                members: prev.members.map(m => m._id === userId ? { ...m, banStatus: { ...m.banStatus, isBanned: false } } : m)
            }));
            setActionLoading(false);
        } catch (err) {
            alert(err.response?.data?.message || "Failed to unban user");
            setActionLoading(false);
        }
    };

    const handleBanSubmit = async () => {
        if (!selectedUserForBan) return;
        try {
            setActionLoading(true);
            const token = localStorage.getItem('token');
            await axios.post(`/api/qa/admin/members/${selectedUserForBan._id}/ban`, {
                duration: banDuration,
                reason: banReason
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Update local state
            setGroup(prev => ({
                ...prev,
                members: prev.members.map(m => m._id === selectedUserForBan._id ? { 
                    ...m, 
                    banStatus: { 
                        isBanned: true, 
                        bannedUntil: banDuration === '0' ? null : new Date(Date.now() + banDuration * 3600000).toISOString(),
                        banReason: banReason
                    } 
                } : m)
            }));

            setIsBanModalOpen(false);
            setSelectedUserForBan(null);
            setBanReason('');
            setActionLoading(false);
        } catch (err) {
            alert(err.response?.data?.message || "Failed to ban user");
            setActionLoading(false);
        }
    };

    if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div></div>;

    if (error) return (
        <div className="p-6">
            <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
            </div>
            <Link to="/admin/qa/groups" className="mt-4 inline-block text-primary font-bold hover:underline">← Back to Groups</Link>
        </div>
    );

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-black text-text-main">{group.name} Members</h1>
                    <p className="text-text-secondary">Viewing all students and experts in this group.</p>
                </div>
                <Link to="/admin/qa/groups" className="text-primary font-bold flex items-center gap-2 hover:underline">
                    ← Back to Groups
                </Link>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/30">
                    <h2 className="text-lg font-bold text-text-main">Member List ({group.members?.length || 0})</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50">
                                <th className="p-4 text-xs font-black uppercase tracking-widest text-text-muted border-b border-gray-100">Member</th>
                                <th className="p-4 text-xs font-black uppercase tracking-widest text-text-muted border-b border-gray-100">Email</th>
                                <th className="p-4 text-xs font-black uppercase tracking-widest text-text-muted border-b border-gray-100">Role</th>
                                <th className="p-4 text-xs font-black uppercase tracking-widest text-text-muted border-b border-gray-100">Joined Date</th>
                                <th className="p-4 text-xs font-black uppercase tracking-widest text-text-muted border-b border-gray-100">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {group.members?.map((member) => (
                                <tr key={member._id} className="hover:bg-gray-50/30 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold overflow-hidden border-2 border-white shrink-0">
                                                {member.avatar ? (
                                                    <img 
                                                        src={member.avatar.startsWith('/') ? member.avatar : `/${member.avatar}`} 
                                                        alt="" 
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }}
                                                    />
                                                ) : null}
                                                <span style={{ display: member.avatar ? 'none' : 'block' }}>{member.name?.[0]}</span>
                                            </div>
                                            <span className="font-bold text-text-main">{member.name}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-sm text-text-secondary">{member.email}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${member.role === 'expert' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                            {member.role}
                                        </span>
                                    </td>
                                    <td className="p-4 text-xs text-text-muted">
                                        {/* Since group membership doesn't have a joined date in the schema, we use a placeholder or remove it */}
                                        --
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={() => handleRemoveMember(member._id, member.name)}
                                                disabled={actionLoading}
                                                className="px-3 py-1 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors disabled:opacity-50"
                                            >
                                                Remove
                                            </button>
                                            {member.banStatus?.isBanned ? (
                                                <button 
                                                    onClick={() => handleUnbanUser(member._id)}
                                                    disabled={actionLoading}
                                                    className="px-3 py-1 bg-green-50 text-green-600 rounded-lg text-xs font-bold hover:bg-green-100 transition-colors disabled:opacity-50"
                                                >
                                                    Unban
                                                </button>
                                            ) : (
                                                <button 
                                                    onClick={() => { setSelectedUserForBan(member); setIsBanModalOpen(true); }}
                                                    disabled={actionLoading}
                                                    className="px-3 py-1 bg-gray-50 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-100 transition-colors disabled:opacity-50"
                                                >
                                                    Ban
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Ban Modal */}
            <AnimatePresence>
                {isBanModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
                        >
                            <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                                <h2 className="text-xl font-black text-text-main text-center w-full">Ban {selectedUserForBan?.name}</h2>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-text-secondary mb-1">Duration</label>
                                    <select 
                                        value={banDuration}
                                        onChange={(e) => setBanDuration(e.target.value)}
                                        className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-primary transition-colors text-sm font-medium"
                                    >
                                        <option value="24">24 Hours</option>
                                        <option value="72">3 Days</option>
                                        <option value="168">1 Week</option>
                                        <option value="720">1 Month</option>
                                        <option value="0">Permanent</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-text-secondary mb-1">Reason</label>
                                    <textarea 
                                        value={banReason}
                                        onChange={(e) => setBanReason(e.target.value)}
                                        placeholder="Enter reason for ban..."
                                        rows={3}
                                        className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:border-primary transition-colors text-sm font-medium resize-none"
                                    ></textarea>
                                </div>
                            </div>
                            <div className="p-6 bg-gray-50 flex gap-3">
                                <button 
                                    onClick={() => { setIsBanModalOpen(false); setSelectedUserForBan(null); }}
                                    className="flex-1 py-3 px-4 bg-white border border-gray-200 rounded-xl text-sm font-bold text-text-secondary hover:bg-gray-100 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleBanSubmit}
                                    disabled={actionLoading}
                                    className="flex-1 py-3 px-4 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary-dark transition-colors disabled:opacity-50"
                                >
                                    {actionLoading ? 'Banning...' : 'Confirm Ban'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default GroupMembers;
