import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { Link } from 'react-router-dom';

const ManageQuestions = () => {
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchQuestions = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const res = await axios.get('/api/qa/admin/questions', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setQuestions(res.data);
            setLoading(false);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to load questions");
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchQuestions();
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this question? This will also delete all associated answers.")) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`/api/qa/questions/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setQuestions(questions.filter(q => q._id !== id));
        } catch (err) {
            alert(err.response?.data?.message || "Delete failed");
        }
    };

    if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div></div>;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-black text-text-main">Manage Questions</h1>
                    <p className="text-text-secondary">Review and moderate all platform questions.</p>
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
                            <th className="p-4 text-xs font-black uppercase tracking-widest text-text-muted border-b border-gray-100">Question Title</th>
                            <th className="p-4 text-xs font-black uppercase tracking-widest text-text-muted border-b border-gray-100">Asked By</th>
                            <th className="p-4 text-xs font-black uppercase tracking-widest text-text-muted border-b border-gray-100">Group</th>
                            <th className="p-4 text-xs font-black uppercase tracking-widest text-text-muted border-b border-gray-100">Status</th>
                            <th className="p-4 text-xs font-black uppercase tracking-widest text-text-muted border-b border-gray-100 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {questions.map((q) => (
                            <tr key={q._id} className="hover:bg-gray-50/30 transition-colors">
                                <td className="p-4">
                                    <Link to={`/admin/qa/questions/${q._id}`} className="font-bold text-text-main hover:text-primary transition-colors block">
                                        {q.title}
                                    </Link>
                                    <div className="text-[10px] text-text-muted">{new Date(q.createdAt).toLocaleDateString()}</div>
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs overflow-hidden shrink-0">
                                            {q.askedBy?.avatar ? (
                                                <img 
                                                    src={q.askedBy.avatar.startsWith('/') ? q.askedBy.avatar : `/${q.askedBy.avatar}`} 
                                                    alt="" 
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }}
                                                />
                                            ) : null}
                                            <span style={{ display: q.askedBy?.avatar ? 'none' : 'block' }}>{q.askedBy?.name?.[0]}</span>
                                        </div>
                                        <div>
                                            <div className="text-sm font-semibold">{q.askedBy?.name}</div>
                                            <div className="text-[10px] text-text-muted">{q.askedBy?.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className="text-xs font-medium bg-gray-100 px-2 py-1 rounded-full">{q.group?.name}</span>
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${q.isSolved ? 'bg-green-100 text-green-700' : 'bg-primary/10 text-primary'}`}>
                                        {q.isSolved ? 'Solved' : 'Open'}
                                    </span>
                                </td>
                                <td className="p-4 text-right flex items-center justify-end gap-2">
                                    <Link 
                                        to={`/admin/qa/questions/${q._id}`}
                                        className="text-primary hover:bg-primary/5 p-2 rounded-lg transition-colors"
                                        title="View Details"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    </Link>
                                    <button 
                                        onClick={() => handleDelete(q._id)}
                                        className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                        title="Delete Question"
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

export default ManageQuestions;
