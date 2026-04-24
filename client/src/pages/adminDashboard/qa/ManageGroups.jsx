import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { Link } from 'react-router-dom';

const ManageGroups = () => {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchGroups = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const res = await axios.get('/api/qa/admin/groups', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setGroups(res.data);
            setLoading(false);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to load groups");
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGroups();
    }, []);

    if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div></div>;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-black text-text-main">Manage QA Groups</h1>
                    <p className="text-text-secondary">Topic-based academic discussion channels.</p>
                </div>
                <Link to="/admin/qa-dashboard" className="text-primary font-bold flex items-center gap-2 hover:underline">
                    ← Back to Dashboard
                </Link>
            </div>

            {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6">{error}</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groups.map((g) => (
                    <div key={g._id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center font-bold text-xl">
                                {g.name[0]}
                            </div>
                            <span className="bg-gray-100 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-text-muted">
                                Channel
                            </span>
                        </div>
                        <h3 className="text-xl font-bold text-text-main mb-1">{g.name}</h3>
                        <p className="text-sm text-text-muted mb-6">{g.members?.length || 0} Platform Members</p>
                        
                        <div className="flex flex-wrap gap-2 mb-6">
                             {g.members?.slice(0, 3).map(m => (
                                <div key={m._id} className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 -ml-2 first:ml-0 flex items-center justify-center text-[10px] font-bold overflow-hidden" title={m.name}>
                                    {m.avatar ? (
                                        <img 
                                            src={m.avatar.startsWith('/') ? m.avatar : `/${m.avatar}`} 
                                            alt="" 
                                            className="w-full h-full object-cover"
                                            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }}
                                        />
                                    ) : null}
                                    <span style={{ display: m.avatar ? 'none' : 'block' }}>{m.name?.[0]}</span>
                                </div>
                             ))}
                             {g.members?.length > 3 && (
                                <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-50 -ml-2 flex items-center justify-center text-[10px] font-bold text-text-muted">
                                    +{g.members.length - 3}
                                </div>
                             )}
                        </div>

                        <Link 
                            to={`/admin/qa/groups/${g._id}`}
                            className="w-full py-3 bg-gray-50 text-text-main font-bold rounded-xl text-sm border border-gray-100 hover:bg-gray-100 transition-all block text-center"
                        >
                            View Member List
                        </Link>
                    </div>
                ))}
            </div>
        </motion.div>
    );
};

export default ManageGroups;
