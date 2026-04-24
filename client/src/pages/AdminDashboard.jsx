import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [user] = useState(JSON.parse(localStorage.getItem('user')));
    const [stats, setStats] = useState({
        users: 0,
        posts: 0,
        events: 0
    });

    useEffect(() => {
        if (!user || user.role !== 'admin') {
            navigate('/login');
        }
        // Mock stats for now
        setStats({
            users: 12,
            posts: 45,
            events: 8
        });
    }, [user, navigate]);

    const adminNavItems = [
        {
            title: 'User Management',
            path: '/admin/users',
            icon: (
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            )
        },
        {
            title: 'Skill Exchange',
            path: '/admin/skills-events',
            icon: (
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
            )
        },
        {
            title: 'Q&A Knowledge',
            path: '/admin/qa-dashboard',
            icon: (
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            )
        },
        {
            title: 'Platform Statistics',
            path: '#',
            icon: (
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            )
        },
        {
            title: 'All Members',
            path: '/admin/all-members',
            icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                    <path d="M16 11c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3z" />
                    <path d="M6 21v-2a4 4 0 014-4h4" />
                </svg>
            )
        },
        {
            title: 'System Settings',
            path: '#',
            icon: (
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            )
        },
    ];

    return (
        <div>
            <header className="mb-6">
                <h1 className="text-2xl font-bold text-text-main font-heading mb-1">Admin Control Center</h1>
                <p className="text-sm text-text-secondary">Welcome back, {user?.name}. Manage your platform from here.</p>
            </header>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {Object.entries(stats).map(([label, value]) => (
                    <motion.div
                        key={label}
                        whileHover={{ scale: 1.02 }}
                        className="bg-white p-5 rounded-2xl shadow-lg border border-gray-100"
                    >
                        <div className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-0.5">{label}</div>
                        <div className="text-2xl font-bold text-primary">{value}</div>
                    </motion.div>
                ))}
            </div>

            {/* Management Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {adminNavItems.map((item, index) => (
                    <Link to={item.path} key={index} className="group">
                        <motion.div
                            whileHover={{ y: -5 }}
                            className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100 h-full flex flex-col items-center text-center gap-4 transition-all hover:shadow-2xl hover:border-[#EA580C]/20"
                        >
                            <div className="w-14 h-14 bg-[#EA580C]/10 text-[#EA580C] rounded-2xl flex items-center justify-center p-3.5 shadow-sm group-hover:scale-110 transition-transform">
                                {item.icon}
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-text-main mb-1">{item.title}</h3>
                                <p className="text-xs text-text-secondary leading-relaxed px-2">
                                    Manage and monitor the platform's {item.title.toLowerCase()}.
                                </p>
                            </div>
                            <div className="mt-auto pt-4 text-[#EA580C] text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                Open Module <span>→</span>
                            </div>
                        </motion.div>
                    </Link>
                ))}
            </div>

        </div>
    );
};

export default AdminDashboard;
