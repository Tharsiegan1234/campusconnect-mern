import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { Link } from 'react-router-dom';

const ManageAnswers = () => {
    const [answers, setAnswers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchAnswers = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const res = await axios.get('/api/qa/admin/answers', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAnswers(res.data);
            setLoading(false);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to load answers");
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnswers();
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this answer?")) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`/api/qa/answers/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAnswers(answers.filter(a => a._id !== id));
        } catch (err) {
            alert(err.response?.data?.message || "Delete failed");
        }
    };

    if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div></div>;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-black text-text-main">Manage Answers</h1>
                    <p className="text-text-secondary">Monitor expert responses and moderator activity.</p>
                </div>
                <Link to="/admin/qa-dashboard" className="text-primary font-bold flex items-center gap-2 hover:underline">
                    ← Back to Dashboard
                </Link>
            </div>

            {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6">{error}</div>}

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50/50">
                            <th className="p-4 text-xs font-black uppercase tracking-widest text-text-muted border-b border-gray-100">Answer Content</th>
                            <th className="p-4 text-xs font-black uppercase tracking-widest text-text-muted border-b border-gray-100">Expert</th>
                            <th className="p-4 text-xs font-black uppercase tracking-widest text-text-muted border-b border-gray-100">Question</th>
                            <th className="p-4 text-xs font-black uppercase tracking-widest text-text-muted border-b border-gray-100">Status</th>
                            <th className="p-4 text-xs font-black uppercase tracking-widest text-text-muted border-b border-gray-100 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {answers.map((a) => (
                            <tr key={a._id} className="hover:bg-gray-50/30 transition-colors">
                                <td className="p-4 max-w-xs">
                                    <div className="text-sm text-text-main line-clamp-2 italic font-medium">"{a.content}"</div>
                                    <div className="text-[10px] text-text-muted mt-1">{new Date(a.createdAt).toLocaleDateString()}</div>
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs overflow-hidden shrink-0">
                                            {a.answeredBy?.avatar ? (
                                                <img 
                                                    src={a.answeredBy.avatar.startsWith('/') ? a.answeredBy.avatar : `/${a.answeredBy.avatar}`} 
                                                    alt="" 
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }}
                                                />
                                            ) : null}
                                            <span style={{ display: a.answeredBy?.avatar ? 'none' : 'block' }}>{a.answeredBy?.name?.[0]}</span>
                                        </div>
                                        <div>
                                            <div className="text-sm font-semibold">{a.answeredBy?.name}</div>
                                            <div className="text-[10px] text-text-muted">{a.answeredBy?.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="text-[10px] text-text-muted">For Question:</div>
                                    <div className="text-xs font-bold text-primary line-clamp-1">{a.question?.title}</div>
                                </td>
                                <td className="p-4">
                                    {a.isSolved ? (
                                        <span className="px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-green-100 text-green-700">
                                            Solution
                                        </span>
                                    ) : (
                                        <span className="px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-gray-100 text-text-muted">
                                            Regular
                                        </span>
                                    )}
                                </td>
                                <td className="p-4 text-right">
                                    <button 
                                        onClick={() => handleDelete(a._id)}
                                        className="text-red-500 hover:text-red-700 p-2 transition-colors"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </motion.div>
    );
};

export default ManageAnswers;
