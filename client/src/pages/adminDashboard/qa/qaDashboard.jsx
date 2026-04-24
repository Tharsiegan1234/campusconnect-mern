import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import axios from 'axios';

const QADashboard = () => {
    const [stats, setStats] = useState({
        totalQuestions: 0,
        resolvedQuestions: 0,
        totalAnswers: 0,
        totalGroups: 0,
        totalExperts: 0,
        totalStudents: 0
    });

    const [recentActivity, setRecentActivity] = useState({
        recentQuestions: [],
        recentAnswers: [],
        activeGroups: []
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('token');
                const config = {
                    headers: { Authorization: `Bearer ${token}` }
                };

                const [statsRes, activityRes] = await Promise.all([
                    axios.get('/api/qa/stats', config),
                    axios.get('/api/qa/recent-activity', config)
                ]);

                setStats(statsRes.data);
                setRecentActivity(activityRes.data);
                setLoading(false);
            } catch (err) {
                console.error("Error fetching dashboard data:", err);
                setError("Failed to load dashboard data. Please try again later.");
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const qaNavItems = [
        {
            title: 'Questions',
            count: stats.totalQuestions,
            path: '/admin/qa/questions',
            icon: (
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )
        },
        {
            title: 'Answers',
            count: stats.totalAnswers,
            path: '/admin/qa/answers',
            icon: (
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )
        },
        {
            title: 'Groups',
            count: stats.totalGroups,
            path: '/admin/qa/groups',
            icon: (
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            )
        },
        {
            title: 'Experts',
            count: stats.totalExperts,
            path: '/admin/users?role=expert',
            icon: (
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
            )
        },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8 pb-10"
        >
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-text-main tracking-tight">QA Knowledge Dashboard</h1>
                    <p className="text-text-secondary mt-1 text-lg">Real-time insights into platform discussions and expert engagement.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-white text-text-main rounded-xl text-sm font-bold border border-gray-100 shadow-sm hover:shadow-md transition-all flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Refresh Data
                    </button>
                </div>
            </header>

            {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl flex items-center gap-3">
                    <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                </div>
            )}

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {qaNavItems.map((item, idx) => (
                    <Link to={item.path} key={idx}>
                        <motion.div
                            whileHover={{ y: -5 }}
                            className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-5 transition-all hover:shadow-xl group"
                        >
                            <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center p-3.5 group-hover:bg-primary group-hover:text-white transition-all">
                                {item.icon}
                            </div>
                            <div>
                                <p className="text-xs font-bold text-text-muted uppercase tracking-wider">{item.title}</p>
                                <p className="text-2xl font-black text-text-main tabular-nums">{item.count}</p>
                            </div>
                        </motion.div>
                    </Link>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Activity Feed */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Recent Questions */}
                    <section className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-text-main flex items-center gap-2">
                                <span className="w-2 h-6 bg-primary rounded-full" />
                                Recent Questions
                            </h2>
                            <Link to="/admin/qa/questions" className="text-primary text-sm font-bold hover:underline">View All</Link>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {recentActivity.recentQuestions.length > 0 ? (
                                recentActivity.recentQuestions.map((q) => (
                                    <div key={q._id} className="p-6 hover:bg-gray-50/50 transition-colors">
                                        <div className="flex items-start justify-between gap-4 mb-2">
                                            <h3 className="font-bold text-text-main line-clamp-1">{q.title}</h3>
                                            <span className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${q.isSolved ? 'bg-green-100 text-green-700' : 'bg-primary/10 text-primary'}`}>
                                                {q.isSolved ? 'Solved' : 'Open'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 text-xs text-text-muted">
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                                                    {q.askedBy?.avatar ? (
                                                        <img 
                                                            src={q.askedBy.avatar.startsWith('/') ? q.askedBy.avatar : `/${q.askedBy.avatar}`} 
                                                            alt="" 
                                                            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }}
                                                        />
                                                    ) : null}
                                                    <span className="text-[10px] font-bold" style={{ display: q.askedBy?.avatar ? 'none' : 'block' }}>{q.askedBy?.name?.[0]}</span>
                                                </div>
                                                <span className="font-semibold text-text-secondary">{q.askedBy?.name}</span>
                                            </div>
                                            <span>•</span>
                                            <span className="font-medium">{q.group?.name}</span>
                                            <span>•</span>
                                            <span>{new Date(q.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-10 text-center text-text-muted">No questions found</div>
                            )}
                        </div>
                    </section>

                    {/* Active Groups */}
                    <section className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-text-main flex items-center gap-2">
                                <span className="w-2 h-6 bg-orange-500 rounded-full" />
                                Trending Topics
                            </h2>
                        </div>
                        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {recentActivity.activeGroups.map((g) => (
                                <div key={g._id} className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-between hover:border-orange-500/30 transition-all">
                                    <div>
                                        <h4 className="font-bold text-text-main">{g.name}</h4>
                                        <p className="text-xs text-text-muted">{g.members?.length || 0} Members</p>
                                    </div>
                                    <Link to={`/admin/qa/groups/${g._id}`} className="p-2 text-text-muted hover:text-orange-500 transition-colors">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Sidebar Activity */}
                <div className="space-y-8">
                    {/* Important Stats / Needs Attention */}
                    <div className="bg-gradient-to-br from-primary to-orange-600 rounded-3xl p-6 text-white shadow-lg shadow-primary/20">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Needs Attention
                        </h3>
                        <div className="space-y-4">
                            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
                                <p className="text-sm font-bold opacity-80 uppercase tracking-widest text-[10px]">Unsolved Questions</p>
                                <p className="text-3xl font-black tabular-nums">{stats.totalQuestions - stats.resolvedQuestions}</p>
                            </div>
                            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
                                <p className="text-sm font-bold opacity-80 uppercase tracking-widest text-[10px]">Expert Response Rate</p>
                                <p className="text-3xl font-black tabular-nums">{Math.round((stats.totalAnswers / (stats.totalQuestions || 1)) * 100)}%</p>
                            </div>
                        </div>
                    </div>

                    {/* Recent Answers */}
                    <section className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-50">
                            <h2 className="text-lg font-bold text-text-main">Expert Activity</h2>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {recentActivity.recentAnswers.length > 0 ? (
                                recentActivity.recentAnswers.map((a) => (
                                    <div key={a._id} className="p-4 hover:bg-gray-50/50 transition-colors">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs overflow-hidden">
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
                                            <div className="overflow-hidden">
                                                <p className="text-xs font-bold text-text-main truncate">{a.answeredBy?.name}</p>
                                                <p className="text-[10px] text-text-muted">Replied to {a.question?.title?.substring(0, 20)}...</p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-8 text-center text-text-muted text-xs">No recent answers</div>
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </motion.div>
    );
};

export default QADashboard;
