import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import AvatarSelector from '../components/AvatarSelector';
import CodeBlock from '../components/CodeBlock';

const Profiles = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));
    const [avatar, setAvatar] = useState(user?.avatar || '/avatars/avatar1.png');
    const [updating, setUpdating] = useState(false);
    const [message, setMessage] = useState('');
    const [isEditMode, setIsEditMode] = useState(false);
    const [loading, setLoading] = useState(true);
    const [qaData, setQaData] = useState({ stats: {} });
    const [selectedQA, setSelectedQA] = useState(null);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    setLoading(false);
                    return;
                }
                const res = await axios.get('/api/users/me', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setUser(res.data);
                localStorage.setItem('user', JSON.stringify(res.data));

                // Update avatar state too
                setAvatar(res.data.avatar || '/avatars/avatar1.png');

                // Update formData
                setFormData({
                    name: res.data.name || '',
                    bio: res.data.bio || '',
                    year: res.data.academicInfo?.year || '',
                    semester: res.data.academicInfo?.semester || '',
                    professionalInfo: (res.data.role === 'expert' && Array.isArray(res.data.professionalInfo))
                        ? res.data.professionalInfo
                        : [{ company: '', jobTitle: '', experienceYears: '' }],
                });

                // Fetch QA stats
                const qaRes = await axios.get(`/api/qa/profile-data/${res.data._id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setQaData(qaRes.data);
            } catch (err) {
                console.error("Failed to fetch user data:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchUserData();
    }, []);

    // Profile form state
    const [formData, setFormData] = useState({
        name: user?.name || '',
        bio: user?.bio || '',
        year: user?.academicInfo?.year || '',
        semester: user?.academicInfo?.semester || '',
        professionalInfo: (user?.role === 'expert' && Array.isArray(user?.professionalInfo))
            ? user.professionalInfo
            : (user?.role === 'expert' && user?.professionalInfo && !Array.isArray(user?.professionalInfo))
                ? [user.professionalInfo] // Wrap old object in array
                : [{ company: '', jobTitle: '', experienceYears: '' }],
    });

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name === 'name') {
            const lettersOnly = value.replace(/[^a-zA-Z\s]/g, '');
            setFormData({ ...formData, [name]: lettersOnly });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleProfessionalInfoChange = (index, e) => {
        const { name, value } = e.target;
        const updatedProfessionalInfo = [...formData.professionalInfo];
        updatedProfessionalInfo[index] = {
            ...updatedProfessionalInfo[index],
            [name]: name === 'experienceYears' ? (parseInt(value) || 0) : value
        };
        setFormData({ ...formData, professionalInfo: updatedProfessionalInfo });
    };

    const addProfessionalInfo = () => {
        setFormData({
            ...formData,
            professionalInfo: [...formData.professionalInfo, { company: '', jobTitle: '', experienceYears: '' }]
        });
    };

    const removeProfessionalInfo = (index) => {
        const updatedProfessionalInfo = formData.professionalInfo.filter((_, i) => i !== index);
        setFormData({ ...formData, professionalInfo: updatedProfessionalInfo });
    };

    const onUpdateProfile = async (e) => {
        if (e) e.preventDefault();
        setUpdating(true);
        setMessage('');
        try {
            const token = localStorage.getItem('token');
            const res = await axios.put('/api/users/profile', {
                ...formData,
                avatar
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Update local storage and state
            localStorage.setItem('user', JSON.stringify(res.data));
            setUser(res.data);
            setMessage('Profile updated successfully!');
            setIsEditMode(false);

            // Auto hide message
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            console.error(err);
            setMessage(err.response?.data?.message || 'Failed to update profile');
        } finally {
            setUpdating(false);
        }
    };

    if (loading) return <div className="text-center mt-10">Loading profile...</div>;
    if (!user) return <div className="text-center mt-10">Please login to view your profile.</div>;

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
                    <button
                        onClick={() => setIsEditMode(!isEditMode)}
                        className="absolute bottom-4 right-8 z-20 px-6 py-2 bg-white/20 backdrop-blur-md border border-white/30 text-white font-bold rounded-xl hover:bg-white/30 transition-all shadow-lg"
                    >
                        {isEditMode ? "Cancel" : "Edit Profile"}
                    </button>
                </div>

                <div className="px-8 pb-8">
                    <div className="relative -top-12 flex flex-col items-center sm:items-start sm:flex-row gap-6">
                        <div className="relative group">
                            <img
                                src={user.role === 'admin'
                                    ? '/src/assets/images/avatars/admin.png'
                                    : (isEditMode ? avatar : user.avatar)}
                                alt="profile"
                                className={`w-32 h-32 rounded-3xl border-4 shadow-xl object-cover bg-white ${user.role === 'admin' ? 'border-accent' : 'border-white'
                                    }`}
                            />
                            {isEditMode && (
                                <div className="absolute inset-0 bg-black/40 rounded-3xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                    <span className="text-white text-xs font-bold">Select Avatar</span>
                                </div>
                            )}
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
                        {message && (
                            <div className={`mb-6 p-4 rounded-2xl text-center font-bold text-sm ${message.includes('success') ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-error border border-red-100'}`}>
                                {message}
                            </div>
                        )}

                        {isEditMode ? (
                            <form onSubmit={onUpdateProfile} className="space-y-8">
                                {user.role !== 'admin' ? (
                                    <div>
                                        <h2 className="text-xl font-bold text-text-main mb-6 flex items-center gap-2">
                                            <span className="w-2 h-8 bg-primary rounded-full"></span>
                                            {user.role === 'expert' ? 'Choose Professional Avatar' : 'Customize Your Identity'}
                                        </h2>
                                        <AvatarSelector
                                            selectedAvatar={avatar}
                                            setSelectedAvatar={setAvatar}
                                            role={user.role}
                                        />
                                    </div>
                                ) : (
                                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 uppercase tracking-tight">
                                            <span className="text-accent text-xl">🛡️</span> Security Protocols
                                        </h2>
                                        <p className="text-sm text-text-secondary mt-2">
                                            Avatar and System ID are locked for Administrative accounts. Profile name and bio can still be customized.
                                        </p>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-bold text-text-main">General Info</h3>
                                        <div>
                                            <label className="block text-sm font-bold text-text-secondary mb-2">Display Name</label>
                                            <input
                                                type="text"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                                placeholder="Enter your name"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-text-secondary mb-2">Bio</label>
                                            <textarea
                                                name="bio"
                                                value={formData.bio}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all h-24 resize-none"
                                                placeholder="Tell us about yourself..."
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="text-lg font-bold text-text-main">
                                            {user.role === 'admin' ? 'Administrative Access' :
                                                user.role === 'student' ? 'Academic Details' : 'Professional Details'}
                                        </h3>
                                        {user.role === 'admin' ? (
                                            <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
                                                <ul className="text-xs space-y-2 text-text-secondary font-bold uppercase tracking-wide">
                                                    <li className="flex items-center gap-2 text-primary">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-primary" /> User Management: ENABLED
                                                    </li>
                                                    <li className="flex items-center gap-2 text-primary">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-primary" /> Content Moderation: ENABLED
                                                    </li>
                                                    <li className="flex items-center gap-2 text-primary">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-primary" /> System Logs: READ-ONLY
                                                    </li>
                                                </ul>
                                            </div>
                                        ) : user.role === 'student' ? (
                                            <>
                                                <div>
                                                    <label className="block text-sm font-bold text-text-secondary mb-2">Year</label>
                                                    <select
                                                        name="year"
                                                        value={formData.year}
                                                        onChange={handleInputChange}
                                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                                    >
                                                        <option value="">Select Year</option>
                                                        <option value="1">1st Year</option>
                                                        <option value="2">2nd Year</option>
                                                        <option value="3">3rd Year</option>
                                                        <option value="4">4th Year</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-bold text-text-secondary mb-2">Semester</label>
                                                    <select
                                                        name="semester"
                                                        value={formData.semester}
                                                        onChange={handleInputChange}
                                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                                    >
                                                        <option value="">Select Semester</option>
                                                        <option value="1">Semester 1</option>
                                                        <option value="2">Semester 2</option>
                                                    </select>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="space-y-6">
                                                {formData.professionalInfo.map((info, index) => (
                                                    <div key={index} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 relative group">
                                                        <div className="flex justify-between items-center mb-4">
                                                            <h4 className="text-sm font-black text-primary uppercase tracking-widest">Entry #{index + 1}</h4>
                                                            {formData.professionalInfo.length > 1 && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeProfessionalInfo(index)}
                                                                    className="text-error hover:text-red-700 p-1 rounded-lg hover:bg-red-50 transition-colors"
                                                                >
                                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                    </svg>
                                                                </button>
                                                            )}
                                                        </div>
                                                        <div className="space-y-4">
                                                            <div>
                                                                <label className="block text-sm font-bold text-text-secondary mb-2">Company</label>
                                                                <input
                                                                    type="text"
                                                                    name="company"
                                                                    value={info.company}
                                                                    onChange={(e) => handleProfessionalInfoChange(index, e)}
                                                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                                                    placeholder="Where do you work?"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-sm font-bold text-text-secondary mb-2">Job Title</label>
                                                                <input
                                                                    type="text"
                                                                    name="jobTitle"
                                                                    value={info.jobTitle}
                                                                    onChange={(e) => handleProfessionalInfoChange(index, e)}
                                                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                                                    placeholder="What's your role?"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-sm font-bold text-text-secondary mb-2">Experience (Years)</label>
                                                                <input
                                                                    type="number"
                                                                    name="experienceYears"
                                                                    min="0"
                                                                    value={info.experienceYears}
                                                                    onChange={(e) => handleProfessionalInfoChange(index, e)}
                                                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                                                    placeholder="How many years?"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                                <button
                                                    type="button"
                                                    onClick={addProfessionalInfo}
                                                    className="w-full py-3 rounded-xl border-2 border-dashed border-gray-300 text-text-secondary font-bold hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-2"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                                    </svg>
                                                    Add Professional Experience
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-4 items-center justify-end pt-6">
                                    <button
                                        type="button"
                                        onClick={() => setIsEditMode(false)}
                                        className="px-8 py-3 rounded-xl font-bold text-text-secondary border-2 border-gray-200 hover:bg-gray-50 transition-all active:scale-95"
                                    >
                                        Discard Changes
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={updating}
                                        className="px-10 py-3 rounded-xl font-bold text-white bg-primary hover:bg-primary-dark shadow-lg shadow-primary/30 transition-all transform hover:-translate-y-1 active:scale-95 disabled:bg-gray-300 disabled:shadow-none"
                                    >
                                        {updating ? "Saving Changes..." : "Update Profile"}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="space-y-8 animate-in fade-in duration-500">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-2">About Me</h3>
                                            <p className="text-text-main leading-relaxed">
                                                {user.bio || "No bio added yet. Tell people about yourself!"}
                                            </p>
                                        </div>

                                        <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                                            <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wider mb-4">
                                                {user.role === 'admin' ? 'System Permissions' :
                                                    user.role === 'student' ? 'Academic Progress' : 'Professional Background'}
                                            </h3>
                                            <div className="space-y-4">
                                                {user.role === 'admin' ? (
                                                    <div className="space-y-3">
                                                        <div className="flex justify-between items-center bg-white p-2 rounded-lg border border-gray-100">
                                                            <span className="text-xs font-bold text-text-secondary">Security Clearance</span>
                                                            <span className="text-[10px] font-black bg-slate-900 text-accent px-2 py-0.5 rounded uppercase">Level 10</span>
                                                        </div>
                                                        <div className="flex justify-between items-center bg-white p-2 rounded-lg border border-gray-100">
                                                            <span className="text-xs font-bold text-text-secondary">API Status</span>
                                                            <span className="text-[10px] font-black bg-green-50 text-green-600 px-2 py-0.5 rounded uppercase">Encrypted</span>
                                                        </div>
                                                        <div className="flex justify-between items-center bg-white p-2 rounded-lg border border-gray-100">
                                                            <span className="text-xs font-bold text-text-secondary">Access Token</span>
                                                            <span className="text-[10px] font-bold text-text-muted">•••• •••• ••••</span>
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
                                                        {Array.isArray(user.professionalInfo) ? (
                                                            user.professionalInfo.map((info, idx) => (
                                                                <div key={idx} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                                                    <div className="flex justify-between items-start mb-2">
                                                                        <span className="text-xs font-black text-primary uppercase tracking-widest italic">Experience #{idx + 1}</span>
                                                                        <span className="text-[10px] font-bold bg-blue-50 text-primary px-2 py-0.5 rounded-full">{info.experienceYears} Years</span>
                                                                    </div>
                                                                    <h4 className="font-bold text-text-main">{info.jobTitle || 'No Title'}</h4>
                                                                    <p className="text-sm text-text-secondary font-medium">{info.company || 'Private'}</p>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            user.professionalInfo && (
                                                                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                                                    <div className="flex justify-between items-start mb-2">
                                                                        <span className="text-xs font-black text-primary uppercase tracking-widest italic">Experience</span>
                                                                        <span className="text-[10px] font-bold bg-blue-50 text-primary px-2 py-0.5 rounded-full">{user.professionalInfo.experienceYears} Years</span>
                                                                    </div>
                                                                    <h4 className="font-bold text-text-main">{user.professionalInfo.jobTitle || 'No Title'}</h4>
                                                                    <p className="text-sm text-text-secondary font-medium">{user.professionalInfo.company || 'Private'}</p>
                                                                </div>
                                                            )
                                                        )}
                                                        {(!user.professionalInfo || (Array.isArray(user.professionalInfo) && user.professionalInfo.length === 0)) && (
                                                            <p className="text-xs text-text-secondary italic text-center py-4">No professional experience listed</p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-2xl p-6 border border-primary/10">
                                            <h3 className="text-sm font-bold text-primary uppercase tracking-wider mb-4">
                                                {user.role === 'admin' ? 'System Overview' : 'Platform Stats'}
                                            </h3>
                                            <div className={`grid gap-4 ${user.role === 'expert' ? 'grid-cols-3' : 'grid-cols-2'}`}>
                                                {user.role !== 'expert' && (
                                                    <div className="bg-white rounded-xl p-4 shadow-sm text-center">
                                                        <div className="text-xl font-bold text-text-main">
                                                            {user.role === 'admin' ? 'ALL' : (qaData.stats.totalPosts || 0)}
                                                        </div>
                                                        <div className="text-xs text-text-secondary uppercase font-bold tracking-tighter">
                                                            {user.role === 'admin' ? 'Access' : 'Posts'}
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="bg-white rounded-xl p-4 shadow-sm text-center">
                                                    <div className="text-xl font-bold text-text-main uppercase">
                                                        {user.role === 'admin' ? 'Live' :
                                                            (user.role === 'student' ? (qaData.stats.solvedQuestions || 0) : (qaData.stats.totalAnswers || 0))}
                                                    </div>
                                                    <div className="text-xs text-text-secondary uppercase font-bold tracking-tighter">
                                                        {user.role === 'admin' ? 'Service' : (user.role === 'expert' ? 'Contribute' : 'Solved Questions')}
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
                                                    {(qaData.questions && qaData.questions.length > 0) ? qaData.questions.slice(0, 5).map(q => (
                                                        <button
                                                            key={q._id}
                                                            onClick={() => setSelectedQA(q)}
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
                                                    {(qaData.answers && qaData.answers.length > 0) ? qaData.answers.slice(0, 5).map(a => (
                                                        <button
                                                            key={a._id}
                                                            onClick={() => setSelectedQA(a.question)}
                                                            className="w-full text-left block bg-white p-4 rounded-xl border border-gray-100 hover:border-primary/30 transition-all group"
                                                        >
                                                            <div className="flex justify-between items-start mb-1">
                                                                <span className="text-[10px] font-black text-primary uppercase tracking-widest italic">Provided Answer</span>
                                                                {a.isSolved && <span className="text-green-500 font-bold text-xs uppercase italic">Accepted Solution 💡</span>}
                                                            </div>
                                                            <h4 className="text-xs font-medium text-text-secondary mb-1">Re: {a.question?.title}</h4>
                                                            <p className="text-sm text-text-main font-bold line-clamp-2">{a.content}</p>
                                                        </button>
                                                    )) : <p className="text-xs text-text-secondary italic">No answers provided yet</p>}
                                                </div>
                                            ) : null}
                                        </div>

                                        <div className="flex justify-center sm:justify-start">
                                            <button
                                                onClick={handleLogout}
                                                className="px-5 py-2 rounded-lg font-bold text-error border border-error hover:bg-error hover:text-white transition-all transform hover:shadow-md active:scale-95 flex items-center justify-center gap-2 text-sm"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                                </svg>
                                                Logout
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
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

export default Profiles;
