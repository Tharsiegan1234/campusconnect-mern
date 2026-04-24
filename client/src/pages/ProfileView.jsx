import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import CodeBlock from '../components/CodeBlock';

const ProfileView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [qaData, setQaData] = useState({ questions: [], answers: [], stats: {} });
    const [selectedQA, setSelectedQA] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const token = localStorage.getItem('token');
                const [userRes, qaRes] = await Promise.all([
                    axios.get(`/api/users/${id}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    }),
                    axios.get(`/api/qa/profile-data/${id}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    })
                ]);
                setUser(userRes.data);
                setQaData(qaRes.data);
            } catch (err) {
                console.error("Failed to fetch user data:", err);
                setError(err.response?.data?.message || 'User not found');
            } finally {
                setLoading(false);
            }
        };
        fetchUserData();
    }, [id]);

    if (loading) return (
        <div className="flex justify-center items-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
    );

    if (error || !user) return (
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
            <div className="text-6xl mb-6">🔍</div>
            <h2 className="text-2xl font-bold text-text-main mb-2">Profile not found</h2>
            <p className="text-text-secondary mb-8">{error || "The user you are looking for doesn't exist or you don't have permission to view their profile."}</p>
            <button
                onClick={() => navigate(-1)}
                className="bg-primary text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all"
            >
                Go Back
            </button>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100"
            >
                {/* Header/Cover */}
                <div className={`h-32 relative transition-all duration-500 ${user.role === 'admin'
                    ? 'bg-gradient-to-r from-slate-950 via-primary-dark to-slate-950 px-8 flex items-center'
                    : 'bg-gradient-to-r from-primary to-accent'
                    }`}>
                    {user.role === 'admin' && (
                        <div className="hidden sm:block">
                            <h2 className="text-white/20 text-5xl font-black tracking-tighter uppercase italic">Administrator</h2>
                        </div>
                    )}
                </div>

                <div className="px-8 pb-8">
                    <div className="relative -top-12 flex flex-col items-center sm:items-start sm:flex-row gap-6">
                        <div className="relative group">
                            <img
                                src={`/${user.avatar}`}
                                alt="profile"
                                className={`w-32 h-32 rounded-3xl border-4 shadow-xl object-cover bg-white ${user.role === 'admin' ? 'border-accent' : 'border-white'
                                    }`}
                            />
                        </div>
                        <div className="mt-14 sm:mt-12 text-center sm:text-left flex-1">
                            <h1 className="text-3xl font-bold text-text-main font-heading">{user.name}</h1>
                            <p className="text-text-secondary font-medium">{user.email}</p>
                            <div className="flex flex-wrap justify-center sm:justify-start gap-3 mt-3">
                                <span className={`whitespace-nowrap px-4 py-1 text-xs font-black rounded-full uppercase tracking-widest shadow-sm ${user.role === 'admin' ? 'bg-accent text-primary' : (user.isBatchRep ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-primary')
                                    }`}>
                                    {user.isBatchRep ? 'Batch Rep' : user.role}
                                </span>
                                {user.role !== 'admin' && user.field && (
                                    <span className="px-3 py-1 bg-green-50 text-green-600 text-xs font-bold rounded-full uppercase tracking-wider">
                                        Field: {user.field}
                                    </span>
                                )}
                                {user.role !== 'admin' && user.registerNumber && (
                                    <span className="px-3 py-1 bg-purple-50 text-purple-600 text-xs font-bold rounded-full uppercase tracking-wider">
                                        ID: {user.registerNumber}
                                    </span>
                                )}
                                {user.role === 'admin' && (
                                    <span className="px-3 py-1 bg-slate-900 text-accent text-[10px] font-black rounded-full uppercase tracking-widest border border-accent/20">
                                        System Authority
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-gray-100 mt-4 pt-8">
                        <div className="space-y-8 animate-in fade-in duration-500">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-2">About</h3>
                                        <p className="text-text-main leading-relaxed">
                                            {user.bio || "No bio added yet."}
                                        </p>
                                    </div>

                                    <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                                        <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-4">
                                            {user.role === 'admin' ? 'System Permissions' :
                                                user.role === 'student' ? 'Academic Details' : 'Professional Background'}
                                        </h3>
                                        <div className="space-y-4">
                                            {user.role === 'admin' ? (
                                                <div className="space-y-3">
                                                    <div className="flex justify-between items-center bg-white p-2 rounded-lg border border-gray-100">
                                                        <span className="text-xs font-bold text-text-secondary">Security Clearance</span>
                                                        <span className="text-[10px] font-black bg-slate-900 text-accent px-2 py-0.5 rounded uppercase">Level 10</span>
                                                    </div>
                                                </div>
                                            ) : user.role === 'student' ? (
                                                <>
                                                    <div className="flex justify-between">
                                                        <span className="text-text-secondary font-medium">Year</span>
                                                        <span className="text-text-main font-bold">{user.academicInfo?.year || '-'}. Year</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-text-secondary font-medium">Semester</span>
                                                        <span className="text-text-main font-bold">Semester {user.academicInfo?.semester || '-'}</span>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="space-y-4">
                                                    {Array.isArray(user.professionalInfo) && user.professionalInfo.map((info, idx) => (
                                                        <div key={idx} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                                            <div className="flex justify-between items-start mb-2">
                                                                <span className="text-xs font-black text-primary uppercase tracking-widest italic">Experience #{idx + 1}</span>
                                                                <span className="text-[10px] font-bold bg-blue-50 text-primary px-2 py-0.5 rounded-full">{info.experienceYears} Years</span>
                                                            </div>
                                                            <h4 className="font-bold text-text-main">{info.jobTitle || 'No Title'}</h4>
                                                            <p className="text-sm text-text-secondary font-medium">{info.company || 'Private'}</p>
                                                        </div>
                                                    ))}
                                                    {(!user.professionalInfo || (Array.isArray(user.professionalInfo) && user.professionalInfo.length === 0)) && (
                                                        <p className="text-xs text-text-secondary italic">No professional experience listed</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-2xl p-6 border border-primary/10">
                                        <h3 className="text-sm font-bold text-primary uppercase tracking-wider mb-4">
                                            {user.role === 'expert' ? 'Expert Reputation' : 'Platform Stats'}
                                        </h3>
                                        <div className={`grid gap-4 ${user.role === 'expert' ? 'grid-cols-3' : 'grid-cols-2'}`}>
                                            {user.role !== 'expert' && (
                                                <div className="bg-white rounded-xl p-4 shadow-sm text-center">
                                                    <div className="text-xl font-bold text-text-main">
                                                        {qaData.stats.totalPosts || 0}
                                                    </div>
                                                    <div className="text-xs text-text-secondary uppercase font-bold tracking-tighter">
                                                        Posts
                                                    </div>
                                                </div>
                                            )}
                                            <div className="bg-white rounded-xl p-4 shadow-sm text-center">
                                                <div className="text-xl font-bold text-text-main uppercase">
                                                    {user.role === 'admin' ? 'Live' :
                                                        (user.role === 'student' ? (qaData.stats.solvedQuestions || 0) : (qaData.stats.totalAnswers || 0))}
                                                </div>
                                                <div className="text-xs text-text-secondary uppercase font-bold tracking-tighter">
                                                    {user.role === 'expert' ? 'Contribute' : 'Solved Questions'}
                                                </div>
                                            </div>
                                            {user.role === 'expert' && (
                                                <>
                                                    <div className="bg-white rounded-xl p-4 shadow-sm text-center border-t-2 border-green-500/20">
                                                        <div className="text-xl font-bold text-green-600">
                                                            {qaData.stats.solvedSolutions || 0}
                                                        </div>
                                                        <div className="text-xs text-text-secondary uppercase font-bold tracking-tighter">
                                                            Solved
                                                        </div>
                                                    </div>
                                                    <div className="bg-white rounded-xl p-4 shadow-sm text-center border-t-2 border-primary/20">
                                                        <div className="text-xl font-bold text-primary">
                                                            {qaData.stats.helpfulLikes || 0}
                                                        </div>
                                                        <div className="text-xs text-text-secondary uppercase font-bold tracking-tighter">
                                                            Liked
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* User Activity Feed */}
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-2">
                                            Recent Activity
                                        </h3>
                                        {user.role === 'student' ? (
                                            <div className="space-y-3">
                                                {qaData.questions.length > 0 ? qaData.questions.slice(0, 5).map(q => (
                                                    <button
                                                        onClick={() => setSelectedQA(q)}
                                                        key={q._id}
                                                        className="w-full text-left block bg-white p-4 rounded-xl border border-gray-100 hover:border-primary/30 transition-all group"
                                                    >
                                                        <div className="flex justify-between items-start mb-1">
                                                            <span className="text-[10px] font-black text-primary uppercase tracking-widest italic">Question</span>
                                                            {q.isSolved && <span className="text-green-500 font-bold text-xs uppercase italic">Solved ✅</span>}
                                                        </div>
                                                        <h4 className="font-bold text-text-main group-hover:text-primary transition-colors line-clamp-1">{q.title}</h4>
                                                    </button>
                                                )) : <p className="text-xs text-text-secondary italic">No questions posted yet</p>}
                                            </div>
                                        ) : user.role === 'expert' ? (
                                            <div className="space-y-3">
                                                {qaData.answers.length > 0 ? qaData.answers.slice(0, 5).map(a => (
                                                    <button
                                                        onClick={() => setSelectedQA(a.question)}
                                                        key={a._id}
                                                        className="w-full text-left block bg-white p-4 rounded-xl border border-gray-100 hover:border-primary/30 transition-all group"
                                                    >
                                                        <div className="flex justify-between items-start mb-1">
                                                            <span className="text-[10px] font-black text-primary uppercase tracking-widest italic">Provided Answer</span>
                                                            {a.isSolved && <span className="text-green-500 font-bold text-xs uppercase italic">Accepted Solution 💡</span>}
                                                        </div>
                                                        <h4 className="text-xs font-medium text-text-secondary mb-1">Re: {a.question?.title}</h4>
                                                        <p className="text-sm text-text-main line-clamp-2">{a.content}</p>
                                                    </button>
                                                )) : <p className="text-xs text-text-secondary italic">No answers provided yet</p>}
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Q&A Detail Modal */}
            <AnimatePresence>
                {selectedQA && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
                        onClick={() => setSelectedQA(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white rounded-[2.5rem] w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="p-8 max-h-[90vh] flex flex-col">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-primary/10 p-3 rounded-2xl">
                                            <span className="text-2xl">❓</span>
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-black text-text-main tracking-tight line-clamp-2">{selectedQA.title}</h2>
                                            <div className="flex items-center gap-2 mt-1">
                                                <img src={`/${selectedQA.askedBy?.avatar}`} alt="" className="w-5 h-5 rounded-full border" />
                                                <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Asked by {selectedQA.askedBy?.name}</span>
                                                {selectedQA.isSolved && (
                                                    <span className="text-[10px] font-black bg-green-500 text-white px-2 py-0.5 rounded-full uppercase tracking-tighter ml-2 italic">Solved ✅</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setSelectedQA(null)}
                                        className="bg-gray-100 hover:bg-gray-200 text-text-secondary p-2 rounded-xl transition-colors"
                                    >
                                        ✕
                                    </button>
                                </div>

                                <div className="flex-grow overflow-y-auto pr-2 space-y-6 min-h-0">
                                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                                        <p className="text-text-main leading-relaxed mb-4">{selectedQA.description}</p>
                                        {selectedQA.code && <CodeBlock code={selectedQA.code} language={selectedQA.language} />}
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="text-xs font-black text-primary uppercase tracking-[0.2em] px-2 flex items-center gap-2">
                                            <span>Expert Solutions</span>
                                            <div className="h-px flex-grow bg-primary/10"></div>
                                        </h3>

                                        {selectedQA.answers && selectedQA.answers.length > 0 ? (
                                            selectedQA.answers.map(answer => (
                                                <div key={answer._id} className={`p-6 rounded-3xl border transition-all ${answer.isSolved
                                                    ? 'bg-green-50/50 border-green-200 ring-2 ring-green-500/10'
                                                    : 'bg-white border-gray-100'
                                                    }`}>
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <img src={`/${answer.answeredBy?.avatar}`} alt="" className="w-6 h-6 rounded-full border" />
                                                        <span className="text-sm font-bold text-text-main">{answer.answeredBy?.name}</span>
                                                        <span className="text-[10px] font-black bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase tracking-tighter italic">Verified Expert</span>
                                                        {answer.isSolved && (
                                                            <span className="text-[10px] font-black text-green-600 uppercase tracking-widest ml-auto italic">Accepted Solution</span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-text-secondary leading-relaxed mb-4 font-medium">{answer.content}</p>
                                                    {answer.code && <CodeBlock code={answer.code} language={answer.language} />}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-8 bg-gray-50 rounded-3xl border border-dashed border-gray-200 text-text-muted font-bold italic">
                                                No answers provided yet.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ProfileView;
