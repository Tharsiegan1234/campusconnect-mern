import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const SkillList = () => {
    const navigate = useNavigate();
    const [skills, setSkills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    // Handle both admin and normal login storage formats
    const [currentUser] = useState(
        JSON.parse(localStorage.getItem('user')) || JSON.parse(localStorage.getItem('userInfo'))
    );
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState('all'); // all, offer, request

    useEffect(() => {
        if (!currentUser || currentUser.role !== 'admin') {
            navigate('/login');
            return;
        }
        fetchSkills();
    }, [currentUser, navigate]);

    const fetchSkills = async () => {
        try {
            setLoading(true);
            const res = await axios.get('http://localhost:5000/api/peer-skills');
            setSkills(res.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch skills');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this listing?')) {
            try {
                const token = localStorage.getItem('token') || currentUser?.token;
                await axios.delete(`http://localhost:5000/api/peer-skills/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setSkills(skills.filter(skill => skill._id !== id));
            } catch (err) {
                alert(err.response?.data?.message || 'Failed to delete listing');
            }
        }
    };

    const handleEdit = (id) => {
        navigate(`/skills/edit/${id}`);
    };

    const handleCreate = () => {
        // Ensure userInfo exists for the CreateSkill component to auth correctly
        if (!localStorage.getItem('userInfo') && currentUser) {
            localStorage.setItem('userInfo', JSON.stringify({
                ...currentUser,
                token: localStorage.getItem('token') || currentUser.token
            }));
        }
        navigate('/skills/create');
    };

    const filteredSkills = skills.filter(skill => {
        const matchesType = filter === 'all' || skill.type === filter;
        const matchesSearch = skill.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            skill.category.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesType && matchesSearch;
    });

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
            <div className="font-bold text-primary animate-pulse">Loading Skills Data...</div>
        </div>
    );

    return (
        <div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div>
                    <h1 className="text-4xl font-black text-text-main font-heading tracking-tight mb-2">Peer Skill Exchange</h1>
                    <p className="text-text-secondary text-sm font-medium">Manage student skill offers and requests.</p>
                </div>
                <div className="flex items-center gap-4">
                    {error && <span className="text-error text-sm font-bold bg-red-50 px-4 py-2 rounded-xl border border-red-100 italic">{error}</span>}
                    <button
                        onClick={handleCreate}
                        className="bg-primary hover:bg-primary-dark text-white px-5 py-2 rounded-xl text-sm font-bold shadow-xl shadow-primary/20 transition-all active:scale-95 flex items-center gap-2 group"
                    >
                        <span className="text-xl group-hover:rotate-90 transition-transform">+</span>
                        Create New Listing
                    </button>
                </div>
            </div>

            {/* Filters and Actions */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
                {/* Tabs */}
                <div className="flex gap-2 bg-gray-100/50 p-1.5 rounded-[22px] w-fit">
                    {['all', 'offer', 'request'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => { setFilter(tab); setSearchTerm(''); }}
                            className={`px-6 py-2 rounded-[18px] text-sm font-bold transition-all capitalize ${filter === tab
                                ? 'bg-white text-primary shadow-sm ring-1 ring-black/5'
                                : 'text-text-secondary hover:text-text-main hover:bg-gray-100'
                                }`}
                        >
                            {tab}
                            <span className={`ml-2 px-2 py-0.5 rounded-lg text-[10px] ${filter === tab ? 'bg-primary/10 text-primary' : 'bg-gray-200 text-gray-500'}`}>
                                {tab === 'all' ? skills.length : skills.filter(s => s.type === tab).length}
                            </span>
                        </button>
                    ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-4 items-center">
                    <div className="relative w-full sm:w-80">
                        <input
                            type="text"
                            placeholder="Search skills or categories..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-6 py-2 bg-white rounded-2xl border border-gray-100 shadow-sm focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none font-medium"
                        />
                        <svg className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>
            </div>

            <motion.div
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[32px] shadow-2xl shadow-gray-200/50 overflow-hidden border border-gray-100"
            >
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50 border-b border-gray-100">
                            <tr>
                                <th className="px-8 py-5 text-xs font-black text-text-secondary uppercase tracking-widest">Listing Details</th>
                                <th className="px-8 py-5 text-xs font-black text-text-secondary uppercase tracking-widest">Type</th>
                                <th className="px-8 py-5 text-xs font-black text-text-secondary uppercase tracking-widest">Creator</th>
                                <th className="px-8 py-5 text-xs font-black text-text-secondary uppercase tracking-widest">Management</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            <AnimatePresence mode='popLayout'>
                                {filteredSkills.map((skill) => (
                                    <motion.tr
                                        layout
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        key={skill._id}
                                        className="hover:bg-gray-50/80 transition-colors group"
                                    >
                                        <td className="px-8 py-5">
                                            <div className="font-bold text-text-main flex items-center gap-2">
                                                {skill.title}
                                            </div>
                                            <div className="text-[11px] text-text-secondary font-semibold uppercase tracking-wider">{skill.category}</div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${skill.type === 'offer' ? 'bg-green-50 text-green-600 ring-1 ring-green-100' : 'bg-purple-50 text-purple-600 ring-1 ring-purple-100'}`}>
                                                {skill.type}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm overflow-hidden">
                                                    {skill.createdBy?.profilePicture ? (
                                                        <img src={`http://localhost:5000${skill.createdBy.profilePicture}`} alt="profile" className="w-full h-full object-cover" />
                                                    ) : (
                                                        skill.createdBy?.firstName?.charAt(0) || 'U'
                                                    )}
                                                </div>
                                                <div className="text-sm font-medium text-text-secondary">
                                                    {skill.createdBy?.firstName} {skill.createdBy?.lastName}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex gap-4 opacity-0 group-hover:opacity-100 transition-opacity text-sm">
                                                <button
                                                    onClick={() => handleEdit(skill._id)}
                                                    className="text-primary hover:text-primary-dark font-bold uppercase tracking-wider transition-colors"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(skill._id)}
                                                    className="text-error/60 hover:text-error font-bold uppercase tracking-wider transition-colors"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                            {filteredSkills.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="px-8 py-20 text-center">
                                        <div className="text-gray-300 mb-4">
                                            <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                            </svg>
                                        </div>
                                        <p className="text-text-secondary font-bold text-lg">No skills found</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </div>
    );
};

export default SkillList;
