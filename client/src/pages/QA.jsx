import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import CodeBlock from '../components/CodeBlock';
import { useSocket } from '../context/SocketContext';

const CATEGORY_ICONS = {
    "Programming": (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
    ),
    "Web & Mobile": (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
        </svg>
    ),
    "Database": (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
        </svg>
    ),
    "Networking": (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071a9.5 9.5 0 0113.858 0M6.228 6.228A14.5 14.5 0 0112 3c1.259 0 2.455.155 3.595.448m3.123 3.123A14.505 14.505 0 0121 12c0 1.259-.155 2.455-.448 3.595M3.052 14.548a14.537 14.537 0 01-.052-2.548c0-1.259.155-2.455.448-3.595m3.123-3.123L12 12l7.778 7.778" />
        </svg>
    ),
    "Software Engineering": (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
    ),
    "AI": (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
    ),
    "Data Science": (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
    ),
    "Cyber Security": (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
    ),
    "default": (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
    )
};

const GROUP_TOPICS = {
    "Programming": [
        "Java", "Python", "C", "C++", "C#", "JavaScript", "TypeScript", "Go", "Rust", "Kotlin",
        "Swift", "PHP", "Dart", "Data Structures", "Algorithms", "OOP", "Design Patterns",
        "Multithreading", "File Handling", "Exception Handling"
    ],
    "Web & Mobile": [
        "HTML", "CSS", "JavaScript", "React", "Angular", "Vue", "Bootstrap", "Tailwind CSS",
        "Node.js", "Express.js", "Spring Boot", "Laravel", "Django", "ASP.NET",
        "Android (Java)", "Android (Kotlin)", "Flutter", "React Native", "Swift (iOS)"
    ],
    "Database": [
        "MySQL", "MongoDB", "PostgreSQL", "Oracle", "SQL Server", "Firebase", "Redis",
        "SQLite", "SQL Queries", "PL/SQL", "Normalization", "ER Diagrams", "Transactions", "Indexing"
    ],
    "Networking": [
        "OSI Model", "TCP/IP", "IP Addressing", "Subnetting", "Routing", "Switching",
        "Cisco", "Network Security", "Firewalls", "DNS", "DHCP"
    ],
    "Software Engineering": [
        "SDLC", "Agile", "Scrum", "Waterfall Model", "UML", "Use Case Diagrams",
        "Sequence Diagrams", "Design Patterns", "Software Testing", "DevOps", "Git", "GitHub"
    ],
    "AI": [
        "Machine Learning", "Deep Learning", "Neural Networks", "NLP", "Computer Vision",
        "TensorFlow", "PyTorch"
    ],
    "Data Science": [
        "Data Analysis", "Data Visualization", "Pandas", "NumPy", "R Programming",
        "Big Data", "Power BI", "Tableau"
    ],
    "Cyber Security": [
        "Ethical Hacking", "Penetration Testing", "Cryptography", "Web Security",
        "Network Security", "Kali Linux", "Malware Analysis", "Encryption"
    ]
};

const QA = () => {
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));
    const [groups, setGroups] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [community, setCommunity] = useState({ students: [], experts: [] });
    const [loading, setLoading] = useState(true);
    const [joining, setJoining] = useState(false);
    const [showAskModal, setShowAskModal] = useState(false);
    const [showAnswerModal, setShowAnswerModal] = useState(null); // Question object
    const [editingQuestion, setEditingQuestion] = useState(null);
    const [editingAnswer, setEditingAnswer] = useState(null);
    const [newQuestion, setNewQuestion] = useState({ title: '', description: '', code: '', language: 'javascript', topic: '' });
    const [newAnswer, setNewAnswer] = useState({ content: '', code: '', language: 'javascript' });
    const [topicFilter, setTopicFilter] = useState('');
    const [memberSearch, setMemberSearch] = useState('');
    const [communityView, setCommunityView] = useState('category'); // 'category' or 'all'
    const [message, setMessage] = useState('');
    const [confirmModal, setConfirmModal] = useState({ 
        show: false, 
        id: null, 
        type: '', // 'question', 'answer', 'solve', 'leave'
        title: '', 
        message: '' 
    });
    const location = useLocation();
    const navigate = useNavigate();
    const { onlineUsers } = useSocket() || { onlineUsers: [] };

    useEffect(() => {
        fetchGroups();
        fetchCommunity();
    }, []);

    useEffect(() => {
        if (selectedGroup) {
            setTopicFilter(''); // Reset filter when group changes
            fetchQuestions(selectedGroup._id);
        }
    }, [selectedGroup]);

    useEffect(() => {
        if (selectedGroup) {
            fetchQuestions(selectedGroup._id, topicFilter);
        }
    }, [topicFilter]);

    const fetchGroups = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('/api/qa/groups', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setGroups(res.data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching groups:", error);
            setLoading(false);
        }
    };

    const fetchCommunity = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('/api/qa/members', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setCommunity(res.data);
        } catch (error) {
            console.error("Error fetching community members:", error);
        }
    };

    const fetchQuestions = async (groupId, topic = '') => {
        try {
            const token = localStorage.getItem('token');
            const url = `/api/qa/groups/${groupId}/questions${topic ? `?topic=${encodeURIComponent(topic)}` : ''}`;
            const res = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setQuestions(res.data);
        } catch (error) {
            console.error("Error fetching questions:", error);
            if (error.response?.status === 403) {
                setQuestions([]); // Not a member
            }
        }
    };

    const scrollToQuestion = (questionId) => {
        setTimeout(() => {
            const el = document.getElementById(`question-${questionId}`);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                el.classList.add('ring-4', 'ring-primary', 'ring-offset-2', 'transition-all', 'duration-500');
                setTimeout(() => {
                    el.classList.remove('ring-4', 'ring-primary', 'ring-offset-2');
                }, 3000);

                // Clear state so it doesn't trigger again on subsequent re-renders
                navigate('/qa', { replace: true, state: {} });
            }
        }, 500); // 500ms allows React DOM rendering to complete
    };

    // Watch for location state changes (from notifications) to auto-select and auto-scroll
    useEffect(() => {
        if (location.state?.targetGroupId && groups.length > 0) {
            // Find the group to select
            const target = groups.find(g => g._id === location.state.targetGroupId);

            if (target && target._id !== selectedGroup?._id) {
                setSelectedGroup(target);
            } else if (target && target._id === selectedGroup?._id) {
                // Group is already selected, now just try to scroll
                if (location.state?.targetQuestionId && questions.length > 0) {
                    scrollToQuestion(location.state.targetQuestionId);
                }
            }
        }
    }, [location.state, groups, selectedGroup, questions]);

    const handleJoinGroup = async (groupId) => {
        setJoining(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post(`/api/qa/groups/${groupId}/join`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Update user in local storage to reflect joined group
            const updatedUser = { ...user, joinedGroups: [...(user.joinedGroups || []), groupId] };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);

            // Refresh groups to update member count/status locally if needed
            fetchGroups();
            // Fetch questions now that user is a member
            fetchQuestions(groupId);
            setMessage("Successfully joined the group!");
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            console.error("Error joining group:", error);
            setMessage(error.response?.data?.message || "Failed to join group");
        } finally {
            setJoining(false);
        }
    };

    const handleLeaveGroup = (groupId) => {
        setConfirmModal({
            show: true,
            id: groupId,
            type: 'leave',
            title: 'Leave Group?',
            message: 'Are you sure you want to leave this group? You will lose access to its discussions.'
        });
    };

    const inferLanguage = (topic) => {
        if (!topic) return 'javascript';
        const t = topic.toLowerCase();
        if (t.includes('python')) return 'python';
        if (t.includes('java') && !t.includes('javascript')) return 'java';
        if (t.includes('javascript') || t.includes('react') || t.includes('node') || t.includes('express')) return 'javascript';
        if (t.includes('cpp') || t.includes('c++')) return 'cpp';
        if (t.includes('html')) return 'html';
        if (t.includes('css')) return 'css';
        if (t.includes('sql') || t.includes('mysql') || t.includes('mongodb')) return 'sql';
        if (t.includes('c#')) return 'csharp';
        if (t.includes('php')) return 'php';
        if (t.includes('swift')) return 'swift';
        if (t.includes('dart') || t.includes('flutter')) return 'dart';
        if (t.includes('go')) return 'go';
        if (t.includes('rust')) return 'rust';
        if (t.includes('kotlin')) return 'kotlin';
        return 'javascript';
    };

    const handleAskQuestion = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.post('/api/qa/questions', {
                ...newQuestion,
                language: inferLanguage(newQuestion.topic),
                groupId: selectedGroup._id
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNewQuestion({ title: '', description: '', code: '', language: 'javascript', topic: '' });
            setShowAskModal(false);
            fetchQuestions(selectedGroup._id);
            setMessage("Question posted!");
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            setMessage(error.response?.data?.message || "Failed to post question");
        }
    };

    const handleAnswerQuestion = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.post(`/api/qa/questions/${showAnswerModal._id}/answers`, {
                ...newAnswer,
                language: inferLanguage(showAnswerModal.topic)
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNewAnswer({ content: '', code: '', language: 'javascript' });
            setShowAnswerModal(null);
            fetchQuestions(selectedGroup._id);
            setMessage("Answer submitted!");
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            setMessage(error.response?.data?.message || "Failed to submit answer");
        }
    };

    const handleUpdateQuestion = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const dataToUpdate = {
                ...newQuestion,
                language: inferLanguage(newQuestion.topic)
            };
            await axios.put(`/api/qa/questions/${editingQuestion._id}`, dataToUpdate, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setEditingQuestion(null);
            setNewQuestion({ title: '', description: '', code: '', language: 'javascript', topic: '' });
            fetchQuestions(selectedGroup._id);
            setMessage("Question updated!");
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            setMessage(error.response?.data?.message || "Failed to update question");
        }
    };

    const handleDeleteQuestion = async (id) => {
        setConfirmModal({
            show: true,
            id,
            type: 'question',
            title: 'Delete Question?',
            message: 'This will permanently remove your question and all of its answers. This action cannot be undone.'
        });
    };

    const handleUpdateAnswer = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            // When updating an answer, we use the topic from the parent question stored in showAnswerModal
            const dataToUpdate = {
                ...newAnswer,
                language: inferLanguage(showAnswerModal.topic)
            };
            await axios.put(`/api/qa/answers/${editingAnswer._id}`, dataToUpdate, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setEditingAnswer(null);
            setNewAnswer({ content: '', code: '', language: 'javascript' });
            fetchQuestions(selectedGroup._id);
            setMessage("Answer updated!");
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            setMessage(error.response?.data?.message || "Failed to update answer");
        }
    };

    const handleDeleteAnswer = async (id) => {
        setConfirmModal({
            show: true,
            id,
            type: 'answer',
            title: 'Delete Answer?',
            message: 'This will permanently remove your answer. This action cannot be undone.'
        });
    };

    const canEdit = (createdAt) => {
        const diff = (Date.now() - new Date(createdAt).getTime()) / 1000 / 60;
        return diff < 3;
    };

    const handleLikeAnswer = async (answerId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(`/api/qa/answers/${answerId}/like`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchQuestions(selectedGroup._id);
        } catch (error) {
            setMessage(error.response?.data?.message || "Failed to like answer");
        }
    };

    const handleMarkSolved = (answerId) => {
        setConfirmModal({
            show: true,
            id: answerId,
            type: 'solve',
            title: 'Accept Solution?',
            message: 'Mark this answer as the accepted solution for your question?'
        });
    };

    const executeConfirmAction = async () => {
        const { id, type } = confirmModal;
        setConfirmModal({ ...confirmModal, show: false });
        const token = localStorage.getItem('token');

        try {
            if (type === 'question') {
                await axios.delete(`/api/qa/questions/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                fetchQuestions(selectedGroup._id);
                setMessage("Question deleted");
            } else if (type === 'answer') {
                await axios.delete(`/api/qa/answers/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                fetchQuestions(selectedGroup._id);
                setMessage("Answer deleted");
            } else if (type === 'solve') {
                await axios.post(`/api/qa/answers/${id}/solve`, {}, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                fetchQuestions(selectedGroup._id);
                setMessage("Question marked as solved!");
            } else if (type === 'leave') {
                await axios.post(`/api/qa/groups/${id}/leave`, {}, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const updatedUser = {
                    ...user,
                    joinedGroups: user.joinedGroups.filter(gid => gid !== id)
                };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                setUser(updatedUser);
                fetchGroups();
                setQuestions([]);
                setMessage("Successfully left the group");
            }
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            setMessage(error.response?.data?.message || `Failed to perform action`);
            setTimeout(() => setMessage(''), 3000);
        }
    };

    const isMember = (groupId) =>
        user?.joinedGroups?.includes(groupId) ||
        groups.find(g => g._id === groupId)?.members?.includes(user?._id);

    const filteredExperts = community.experts.filter(expert => {
        const matchesSearch = expert.name.toLowerCase().includes(memberSearch.toLowerCase());
        const isGroupMember = communityView === 'all' || !selectedGroup || selectedGroup.members.includes(expert._id);
        return matchesSearch && isGroupMember;
    });

    const filteredStudents = community.students.filter(student => {
        const matchesSearch = student.name.toLowerCase().includes(memberSearch.toLowerCase());
        const isGroupMember = communityView === 'all' || !selectedGroup || selectedGroup.members.includes(student._id);
        return matchesSearch && isGroupMember;
    });

    if (loading) return <div className="flex justify-center items-center h-screen font-bold text-primary">Loading Knowledge Hub...</div>;

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6">
            <div className="max-w-7xl mx-auto text-center mb-10">
                <h1 className="text-4xl font-black text-text-main mb-4 tracking-tight">Academic Knowledge Hub</h1>
                <p className="text-text-secondary max-w-2xl mx-auto font-medium">
                    Join specialized groups to exchange knowledge. Students ask, Experts answer.
                </p>
                {message && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 p-3 bg-primary/10 text-primary rounded-xl font-bold border border-primary/20 inline-block">
                        {message}
                    </motion.div>
                )}
            </div>

            <div className="max-w-8xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-15 gap-8">
                {/* Sidebar Left: Groups (Categories) */}
                <div className="md:col-span-1 lg:col-span-3 space-y-4 lg:sticky lg:top-24 lg:self-start">
                    <h2 className="text-lg font-bold text-text-main flex items-center gap-2 px-2">
                        <span className="w-2 h-6 bg-primary rounded-full"></span>
                        Categories
                    </h2>
                    <div className="space-y-2">
                        {groups.map(group => (
                            <button
                                key={group._id}
                                onClick={() => setSelectedGroup(group)}
                                className={`w-full text-left p-4 rounded-2xl transition-all border group flex items-start gap-4 ${selectedGroup?._id === group._id
                                    ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-[1.02]'
                                    : 'bg-white text-text-main border-gray-100 hover:border-primary/30 hover:bg-primary/5'
                                    }`}
                            >
                                <div className={`p-2 rounded-xl transition-colors ${selectedGroup?._id === group._id ? 'bg-white/20 text-white' : 'bg-accent/10 text-accent'}`}>
                                    {CATEGORY_ICONS[group.name] || CATEGORY_ICONS.default}
                                </div>
                                <div className="flex-grow">
                                    <div className="font-bold">{group.name}</div>
                                    <div className={`text-[10px] uppercase tracking-widest mt-1 font-black ${selectedGroup?._id === group._id ? 'text-white/70' : 'text-primary'}`}>
                                        {group.members?.length || 0} Members
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Content: Questions */}
                <div className="md:col-span-1 lg:col-span-9">
                    {!selectedGroup ? (
                        <div className="bg-white rounded-[2rem] p-12 text-center border-2 border-dashed border-gray-100 flex flex-col items-center justify-center min-h-[400px]">
                            <div className="text-6xl mb-6">📂</div>
                            <h2 className="text-2xl font-bold text-text-main mb-2">Select a category</h2>
                            <p className="text-text-secondary">Choose a field on the left to start exploring discussions</p>
                        </div>
                    ) : (
                        <div className="flex flex-col h-full min-h-[calc(100vh-120px)]">
                            {/* Group Header */}
                            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-6 mb-6">
                                <div>
                                    <h2 className="text-3xl font-black text-text-main mb-2">{selectedGroup.name}</h2>
                                    <p className="text-text-secondary font-medium">{selectedGroup.description || "Official academic discussion group."}</p>
                                </div>
                                {!isMember(selectedGroup._id) ? (
                                    <button
                                        onClick={() => handleJoinGroup(selectedGroup._id)}
                                        disabled={joining}
                                        className="bg-primary text-white px-6 py-2 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all transform hover:scale-105 active:scale-95 disabled:bg-gray-300"
                                    >
                                        {joining ? "Joining..." : "+ Join Category"}
                                    </button>
                                ) : (
                                    <div className="flex items-center gap-4 flex-col">
                                        {user?.role === 'student' && (
                                            <button
                                                onClick={() => setShowAskModal(true)}
                                                className="bg-accent text-white px-6 py-2 rounded-2xl font-bold shadow-lg shadow-accent/20 hover:brightness-95 transition-all transform hover:scale-105 active:scale-95"
                                            >
                                                + Ask a Question
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleLeaveGroup(selectedGroup._id)}
                                            className="bg-red-50 text-red-600 px-4 py-1 rounded-2xl font-bold border border-red-100 hover:bg-red-100 transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                            </svg>
                                            Leave
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Topic Filter Section */}
                            {isMember(selectedGroup._id) && GROUP_TOPICS[selectedGroup.name] && (
                                <div className="mb-6 flex items-center gap-4 overflow-x-auto pb-2 custom-scrollbar flex-shrink-0">
                                    <button
                                        onClick={() => setTopicFilter('')}
                                        className={`px-4 py-2 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all whitespace-nowrap border ${topicFilter === ''
                                            ? 'bg-primary text-white border-primary shadow-md shadow-primary/20'
                                            : 'bg-white text-text-secondary border-gray-100 hover:border-primary/30'
                                            }`}
                                    >
                                        All Topics
                                    </button>
                                    {GROUP_TOPICS[selectedGroup.name].map(topic => (
                                        <button
                                            key={topic}
                                            onClick={() => setTopicFilter(topic)}
                                            className={`px-4 py-2 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all whitespace-nowrap border ${topicFilter === topic
                                                ? 'bg-primary text-white border-primary shadow-md shadow-primary/20'
                                                : 'bg-white text-text-secondary border-gray-100 hover:border-primary/30'
                                                }`}
                                        >
                                            {topic}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Questions Feed */}
                            <div className="flex-grow lg:overflow-y-auto lg:custom-scrollbar lg:pr-2 space-y-4 ">
                                {!isMember(selectedGroup._id) ? (
                                    <div className="bg-blue-50 p-12 rounded-[2rem] text-center border border-blue-100">
                                        <div className="text-4xl mb-4 flex justify-center items-center">
                                            🔐
                                            {/* <span className="text-yellow-500">
                                            <svg
                                                className="w-10 h-10 "
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                d="M12 11c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm6-2h-1V7a5 5 0 00-10 0v2H6a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2v-8a2 2 0 00-2-2zm-9-2a3 3 0 016 0v2H9V7z"
                                                />
                                            </svg>
                                            </span> */}
                                        </div>
                                        <h3 className="text-xl font-bold text-primary mb-2">Private Access Only</h3>
                                        <p className="text-blue-600/70 font-medium">You must be a member of this group to view or participate in discussions.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {questions.length === 0 ? (
                                            <div className="text-center py-12 opacity-50 font-bold">No questions asked yet in this category.</div>
                                        ) : (
                                            questions.map(question => (
                                                <motion.div
                                                    key={question._id}
                                                    id={`question-${question._id}`}
                                                    layout
                                                    className="bg-white p-6 rounded-3xl shadow-sm border border-gray-300"
                                                >
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div className="flex items-center gap-2">
                                                            <img src={`/${question.askedBy?.avatar || 'src/assets/images/Avatars/avatar1.png'}`} alt="" className="w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex-shrink-0 object-cover" />
                                                            <div>
                                                                <div className="text-sm font-bold text-text-main">{question.askedBy?.name || "Unknown User"}</div>
                                                                <div className={`text-[10px] font-bold uppercase tracking-wider ${question.askedBy?.isBatchRep ? 'text-orange-500' : 'text-text-muted'}`}>
                                                                    {question.askedBy?.isBatchRep ? 'Batch Rep' : 'Student'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            {question.isSolved && (
                                                                <div className="flex items-center gap-1 bg-green-50 text-green-600 px-3 py-1 rounded-full border border-green-100 shadow-sm animate-pulse-slow">
                                                                    <span className="text-xs font-black uppercase tracking-widest italic">Solved</span>
                                                                    {/* <span className="text-sm">✅</span> */}
                                                                    <span className="text-green-500">
                                                                        <svg
                                                                            className="w-5 h-5"
                                                                            fill="none"
                                                                            stroke="currentColor"
                                                                            viewBox="0 0 24 24"
                                                                        >
                                                                            <path
                                                                            strokeLinecap="round"
                                                                            strokeLinejoin="round"
                                                                            strokeWidth="2"
                                                                            d="M5 13l4 4L19 7"
                                                                            />
                                                                        </svg>
                                                                    </span>
                                                                </div>
                                                            )}
                                                            <span className="text-[12px] font-black text-gray-500 uppercase tracking-widest">{new Date(question.createdAt).toLocaleDateString()}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div className="flex flex-col gap-2">
                                                            {question.topic && (
                                                                <span className="inline-block self-start px-3 py-1 bg-primary/5 text-primary text-[10px] font-black rounded-full uppercase tracking-widest border border-primary/10">
                                                                    {question.topic}
                                                                </span>
                                                            )}
                                                            <h3 className="text-xl font-bold text-text-main">{question.title}</h3>
                                                        </div>
                                                        {user?._id === question.askedBy?._id && (
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => {
                                                                        if (canEdit(question.createdAt)) {
                                                                            setEditingQuestion(question);
                                                                            setNewQuestion({
                                                                                title: question.title,
                                                                                description: question.description,
                                                                                code: question.code,
                                                                                language: question.language,
                                                                                topic: question.topic
                                                                            });
                                                                            setShowAskModal(true);
                                                                        } else {
                                                                            setMessage("The 3-minute edit window has closed.");
                                                                            setTimeout(() => setMessage(''), 3000);
                                                                        }
                                                                    }}
                                                                    className={`p-1 transition-all ${canEdit(question.createdAt)
                                                                        ? 'text-primary hover:text-primary-dark'
                                                                        : 'text-gray-300 cursor-not-allowed opacity-50'
                                                                        }`}
                                                                    title={canEdit(question.createdAt) ? "Edit Question" : "Edit Window Closed"}
                                                                >
                                                                    {/* ✏️ */}
                                                                    <svg
                                                                        className="w-5 h-5"
                                                                        fill="none"
                                                                        stroke="currentColor"
                                                                        viewBox="0 0 24 24"
                                                                    >
                                                                        <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        strokeWidth="2"
                                                                        d="M16.862 3.487a2.1 2.1 0 113.03 2.91L7.5 18.79 3 21l2.21-4.5L16.862 3.487z"
                                                                        />
                                                                        <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        strokeWidth="2"
                                                                        d="M15 5l4 4"
                                                                        />
                                                                    </svg>
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteQuestion(question._id)}
                                                                    className="text-red-500 hover:text-red-700 p-1"
                                                                    title="Delete Question"
                                                                >
                                                                    {/* 🗑️ */}
                                                                     <svg
                                                                        className="w-5 h-5"
                                                                        fill="none"
                                                                        stroke="currentColor"
                                                                        viewBox="0 0 24 24"
                                                                    >
                                                                        <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        strokeWidth="2"
                                                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4h6v3M4 7h16"
                                                                        />
                                                                    </svg>
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <p className="text-text-secondary mb-2 leading-relaxed">{question.description}</p>
                                                    {question.code && <CodeBlock code={question.code} language={question.language} />}

                                                    {/* Answers Section */}
                                                    <div className="border-t border-gray-50 pt-6 mt-4 space-y-4">
                                                        {question.answers.map(answer => (
                                                            <div key={answer._id} className={`p-6 rounded-2xl border transition-all hover:bg-white hover:shadow-md group ${answer.isSolved
                                                                ? 'bg-green-100/50 border-green-200 ring-2 ring-green-500/10'
                                                                : 'bg-slate-100 border-slate-100 ring-2 ring-slate-500/10'
                                                                }`}>
                                                                <div className="flex items-center justify-between mb-3">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="relative flex-shrink-0">
                                                                            <img src={`/${answer.answeredBy?.avatar || 'src/assets/images/Avatars/expert1.png'}`} alt="" className="w-6 h-6 rounded-full border border-primary/20 object-cover" />
                                                                            {answer.isSolved && (
                                                                                <div className="absolute -bottom-1 -right-1 bg-green-500 text-white rounded-full w-3 h-3 flex items-center justify-center text-[6px] border border-white shadow-sm">✓</div>
                                                                            )}
                                                                        </div>
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-sm font-bold text-primary">{answer.answeredBy?.name || "Expert"}</span>
                                                                            <span className="text-[10px] font-black bg-primary text-white px-2 py-0.5 rounded-full uppercase italic tracking-tighter">Verified Expert</span>
                                                                            {answer.isSolved && (
                                                                                <span className="text-[10px] font-black text-green-600 uppercase italic tracking-widest ml-2">Accepted Solution</span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        {user?._id === answer.answeredBy?._id && (
                                                                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                                <button
                                                                                    onClick={() => {
                                                                                        if (canEdit(answer.createdAt)) {
                                                                                            setEditingAnswer(answer);
                                                                                            setNewAnswer({ content: answer.content, code: answer.code, language: answer.language });
                                                                                            setShowAnswerModal(question);
                                                                                        } else {
                                                                                            setMessage("The 3-minute edit window has closed.");
                                                                                            setTimeout(() => setMessage(''), 3000);
                                                                                        }
                                                                                    }}
                                                                                    className={`p-1 transition-all ${canEdit(answer.createdAt)
                                                                                        ? 'text-primary hover:text-primary-dark'
                                                                                        : 'text-gray-300 cursor-not-allowed opacity-50'
                                                                                        }`}
                                                                                    title={canEdit(answer.createdAt) ? "Edit Answer" : "Edit Window Closed"}
                                                                                >
                                                                                    {/* ✏️ */}
                                                                                     <svg
                                                                                        className="w-5 h-5"
                                                                                        fill="none"
                                                                                        stroke="currentColor"
                                                                                        viewBox="0 0 24 24"
                                                                                    >
                                                                                        <path
                                                                                        strokeLinecap="round"
                                                                                        strokeLinejoin="round"
                                                                                        strokeWidth="2"
                                                                                        d="M16.862 3.487a2.1 2.1 0 113.03 2.91L7.5 18.79 3 21l2.21-4.5L16.862 3.487z"
                                                                                        />
                                                                                        <path
                                                                                        strokeLinecap="round"
                                                                                        strokeLinejoin="round"
                                                                                        strokeWidth="2"
                                                                                        d="M15 5l4 4"
                                                                                        />
                                                                                    </svg>
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => handleDeleteAnswer(answer._id)}
                                                                                    className="text-red-500 hover:text-red-700 p-1"
                                                                                    title="Delete Answer"
                                                                                >
                                                                                    {/* 🗑️ */}
                                                                                     <svg
                                                                                        className="w-5 h-5"
                                                                                        fill="none"
                                                                                        stroke="currentColor"
                                                                                        viewBox="0 0 24 24"
                                                                                    >
                                                                                        <path
                                                                                        strokeLinecap="round"
                                                                                        strokeLinejoin="round"
                                                                                        strokeWidth="2"
                                                                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4h6v3M4 7h16"
                                                                                        />
                                                                                    </svg>
                                                                                </button>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <p className="text-sm text-text-main font-medium leading-relaxed mb-4">{answer.content}</p>
                                                                {answer.code && <div className="mb-4"><CodeBlock code={answer.code} language={answer.language} /></div>}

                                                                {/* Engagement Actions */}
                                                                <div className="flex items-center justify-between pt-4 border-t border-gray-100/50">
                                                                    <div className="flex items-center gap-4">
                                                                        <button
                                                                            onClick={() => handleLikeAnswer(answer._id)}
                                                                            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all font-bold text-xs uppercase tracking-wider ${answer.likes?.includes(user?._id)
                                                                                ? 'bg-primary text-white shadow-md shadow-primary/20 scale-105'
                                                                                : 'bg-white text-text-secondary hover:bg-gray-50 border border-gray-100'
                                                                                }`}
                                                                        >
                                                                            <span>{answer.likes?.includes(user?._id) ?  <svg
                                                                                className="w-5 h-5 text-red-500"
                                                                                fill="currentColor"
                                                                                viewBox="0 0 24 24"
                                                                                >
                                                                                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 6
                                                                                        4 4 6.5 4c1.74 0 3.41 1.01
                                                                                        4.22 2.09C11.09 5.01 12.76 4
                                                                                        14.5 4 17 4 19 6 19 8.5c0
                                                                                        3.78-3.4 6.86-8.55
                                                                                        11.54L12 21.35z" />
                                                                                </svg>: <svg
                                                                                className="w-5 h-5 text-gray-400 hover:text-red-500 transition"
                                                                                fill="none"
                                                                                stroke="currentColor"
                                                                                strokeWidth="2"
                                                                                viewBox="0 0 24 24"
                                                                                >
                                                                                <path
                                                                                    strokeLinecap="round"
                                                                                    strokeLinejoin="round"
                                                                                    d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28
                                                                                    2 8.5 2 6 4 4 6.5 4c1.74 0
                                                                                    3.41 1.01 4.22 2.09C11.09
                                                                                    5.01 12.76 4 14.5 4 17 4
                                                                                    19 6 19 8.5c0 3.78-3.4
                                                                                    6.86-8.55 11.54L12 21.35z"
                                                                                />
                                                                                </svg>}
                                                                            </span>
                                                                            {/* <span>{answer.likes?.includes(user?._id) ? '❤️' : '🤍'}</span> */}
                                                                            <span>{answer.likes?.length || 0} Helpful</span>
                                                                        </button>

                                                                        {user?._id === question.askedBy?._id && !question.isSolved && (
                                                                            <button
                                                                                onClick={() => handleMarkSolved(answer._id)}
                                                                                className="flex items-center gap-2 px-3 py-1.5 bg-white text-green-600 hover:bg-green-50 border border-green-100 rounded-xl transition-all font-bold text-xs uppercase tracking-widest"
                                                                            >
                                                                                {/* <span>💡</span>  */}
                                                                                <span className="text-yellow-400 hover:text-yellow-500 transition">
                                                                                    <svg
                                                                                        className="w-5 h-5"
                                                                                        fill="currentColor"
                                                                                        viewBox="0 0 24 24"
                                                                                    >
                                                                                        <path d="M12 2a7 7 0 00-4 12c.5.5 1 1.5 1
                                                                                                2h6c0-.5.5-1.5 1-2a7 7 0
                                                                                                00-4-12zM10 18h4v2h-4z"/>
                                                                                    </svg>
                                                                                </span>
                                                                                Mark Solved
                                                                            </button>
                                                                        )}
                                                                    </div>

                                                                    {answer.isSolved && (
                                                                        <div className="flex items-center gap-1.5 text-green-600">
                                                                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                                                                            <span className="text-[10px] font-black uppercase tracking-widest">Problem Solved</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}

                                                        {user?.role === 'expert' && isMember(selectedGroup._id) && (
                                                            <button
                                                                onClick={() => setShowAnswerModal(question)}
                                                                className="text-primary font-black text-xs uppercase tracking-widest flex items-center gap-2 py-2 hover:opacity-70 transition-opacity"
                                                            >
                                                                <span>✚</span> Post an Answer
                                                            </button>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar Right: Community */}
                <div className="hidden lg:block lg:col-span-3 space-y-6 lg:sticky lg:top-24 lg:self-start">
                    {/* Sidebar Navigation Toggles */}
                    <div className="flex p-1 bg-gray-100/50 rounded-2xl border border-gray-100 shadow-sm">
                        <button
                            onClick={() => setCommunityView('category')}
                            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all ${communityView === 'category'
                                ? 'bg-white text-primary shadow-sm'
                                : 'text-text-muted hover:text-text-main'
                                }`}
                        >
                            {selectedGroup ? `${selectedGroup.name} Members` : 'Category'}
                        </button>
                        <button
                            onClick={() => setCommunityView('all')}
                            className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all ${communityView === 'all'
                                ? 'bg-white text-primary shadow-sm'
                                : 'text-text-muted hover:text-text-main'
                                }`}
                        >
                            All Members
                        </button>
                    </div>

                    {/* Search Community */}
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                            <svg className="w-4 h-4 text-text-muted transition-colors group-focus-within:text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            placeholder="Search community..."
                            value={memberSearch}
                            onChange={(e) => setMemberSearch(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-100 rounded-2xl text-sm font-bold text-text-main shadow-sm transition-all focus:ring-4 focus:ring-accent/10 focus:border-accent outline-none placeholder:text-text-muted/60"
                        />
                    </div>

                    {/* Experts List */}
                    <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                        <h4 className="text-sm font-black text-text-main uppercase tracking-widest mb-4 flex items-center justify-between">
                            <span className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                                Verified Experts
                            </span>
                            <span className="text-[10px] bg-gray-50 px-2 py-0.5 rounded-full text-text-muted">{filteredExperts.length}</span>
                        </h4>
                        <div className="space-y-4">
                            {filteredExperts.length === 0 ? (
                                <div className="text-center py-4 text-xs font-bold text-text-muted opacity-50 italic">No experts found</div>
                            ) : (
                                filteredExperts.map(expert => {
                                    const isOnline = onlineUsers?.includes(expert._id);
                                    return (
                                        <Link to={`/profile/${expert._id}`} key={expert._id} className="flex items-center gap-3 p-2 rounded-xl transition-colors hover:bg-gray-50 group">
                                            <div className="relative flex-shrink-0">
                                                <img src={`/${expert.avatar}`} alt="" className="w-10 h-10 rounded-full border border-primary/10 object-cover" />
                                                <div className={`absolute bottom-0 left-0 w-3 h-3 rounded-full border-2 border-white ${isOnline ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-primary text-white text-[8px] flex items-center justify-center rounded-full border-2 border-white font-black">✓</div>
                                            </div>
                                            <div className="flex-grow min-w-0">
                                                <div className="text-sm font-bold text-text-main truncate group-hover:text-primary transition-colors">{expert.name}</div>
                                                <div className="text-[10px] text-text-secondary truncate">
                                                    {expert.professionalInfo && expert.professionalInfo.length > 0
                                                        ? expert.professionalInfo[expert.professionalInfo.length - 1]?.jobTitle
                                                        : "Verified Academic"}
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Students List */}
                    <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                        <h4 className="text-sm font-black text-text-main uppercase tracking-widest mb-4 flex items-center justify-between">
                            <span className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                                Active Students
                            </span>
                            <span className="text-[10px] bg-gray-50 px-2 py-0.5 rounded-full text-text-muted">{filteredStudents.length}</span>
                        </h4>
                        <div className="space-y-4">
                            {filteredStudents.length === 0 ? (
                                <div className="text-center py-4 text-xs font-bold text-text-muted opacity-50 italic">No students found</div>
                            ) : (
                                filteredStudents.map(student => {
                                    const isOnline = onlineUsers?.includes(student._id);
                                    return (
                                        <Link to={`/profile/${student._id}`} key={student._id} className="flex items-center gap-3 p-2 rounded-xl transition-colors hover:bg-gray-50 group">
                                            <div className="relative flex-shrink-0">
                                                <img src={`/${student.avatar}`} alt="" className="w-10 h-10 rounded-full border border-gray-100 object-cover" />
                                                <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${isOnline ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                            </div>
                                            <div className="flex-grow min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <div className="text-sm font-bold text-text-main truncate group-hover:text-primary transition-colors">{student.name}</div>
                                                    {student.isBatchRep && (
                                                        <span className="text-[8px] font-black bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded-full uppercase tracking-tighter border border-orange-100 flex-shrink-0">Rep</span>
                                                    )}
                                                </div>
                                                <div className="text-[9px] text-text-muted font-bold flex flex-wrap items-center gap-1 mt-1">
                                                    {student.academicInfo?.year && (
                                                        <span className="bg-blue-50 text-primary px-1.5 py-0.5 rounded-lg border border-blue-100">
                                                            Y{student.academicInfo.year} S{student.academicInfo.semester}
                                                        </span>
                                                    )}
                                                    {student.field && (
                                                        <span className="bg-green-50 text-green-600 px-1.5 py-0.5 rounded-lg border border-green-100 truncate max-w-[70px]">
                                                            {student.field}
                                                        </span>
                                                    )}
                                                    <span className="bg-gray-50 text-text-muted px-1.5 py-0.5 rounded-lg border border-gray-100 italic">
                                                        {student.joinedGroups?.length || 0} Groups
                                                    </span>
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Ask Question Modal */}
            <AnimatePresence>
                {showAskModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl"
                        >
                            <h2 className="text-2xl font-black text-text-main mb-6">
                                {editingQuestion ? `Edit Question` : `Ask ${selectedGroup.name} Question`}
                            </h2>
                            <form onSubmit={editingQuestion ? handleUpdateQuestion : handleAskQuestion} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-text-secondary mb-2 uppercase tracking-wider">Question Title</label>
                                    <input
                                        required
                                        type="text"
                                        value={newQuestion.title}
                                        onChange={e => setNewQuestion({ ...newQuestion, title: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                        placeholder="What is your question about?"
                                    />
                                </div>
                                <div>
                                    <textarea
                                        required
                                        value={newQuestion.description}
                                        onChange={e => setNewQuestion({ ...newQuestion, description: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all h-32 resize-none"
                                        placeholder="Explain your question in detail..."
                                    />
                                </div>
                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-text-muted mb-2 uppercase tracking-widest">Select Topic</label>
                                        <select
                                            required
                                            value={newQuestion.topic}
                                            onChange={e => setNewQuestion({ ...newQuestion, topic: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold text-sm"
                                        >
                                            <option value="">Select Topic</option>
                                            {GROUP_TOPICS[selectedGroup.name]?.map(topic => (
                                                <option key={topic} value={topic}>{topic}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-[10px] font-black text-text-muted mb-2 uppercase tracking-widest">Code Snippet (Optional)</label>
                                        <textarea
                                            value={newQuestion.code}
                                            onChange={e => setNewQuestion({ ...newQuestion, code: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-900 text-green-400 font-mono text-xs border-none rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all h-40 resize-none shadow-2xl"
                                            placeholder="// Paste your code here..."
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowAskModal(false);
                                            setEditingQuestion(null);
                                            setNewQuestion({ title: '', description: '', code: '', language: 'javascript', topic: '' });
                                        }}
                                        className="flex-1 py-3 font-bold text-text-secondary rounded-2xl hover:bg-gray-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 py-3 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all"
                                    >
                                        {editingQuestion ? "Update Question" : "Post Question"}
                                    </button>
                                </div>
                            </form>
                        </motion.div >
                    </div >
                )}

                {/* Answer Modal */}
                {
                    showAnswerModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl"
                            >
                                <div className="mb-6">
                                    <span className="text-[10px] font-black text-primary uppercase tracking-widest italic">
                                        {editingAnswer ? "Editing Answer" : "Replying to Question"}
                                    </span>
                                    <h2 className="text-xl font-bold text-text-main mt-1 line-clamp-1">{showAnswerModal.title}</h2>
                                </div>
                                <form onSubmit={editingAnswer ? handleUpdateAnswer : handleAnswerQuestion} className="space-y-4">
                                    <div>
                                        <textarea
                                            required
                                            value={newAnswer.content}
                                            onChange={e => setNewAnswer({ ...newAnswer, content: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all h-32 resize-none shadow-inner"
                                            placeholder="Provide a clear, academic answer..."
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="col-span-2">
                                            <label className="block text-[10px] font-black text-text-muted mb-2 uppercase tracking-widest">Code Snippet (Optional)</label>
                                            <textarea
                                                value={newAnswer.code}
                                                onChange={e => setNewAnswer({ ...newAnswer, code: e.target.value })}
                                                className="w-full px-4 py-3 bg-gray-900 text-green-400 font-mono text-xs border-none rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none transition-all h-40 resize-none shadow-2xl"
                                                placeholder="// Paste your code here..."
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-4 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowAnswerModal(null);
                                                setEditingAnswer(null);
                                                setNewAnswer({ content: '', code: '', language: 'javascript' });
                                            }}
                                            className="flex-1 py-3 font-bold text-text-secondary rounded-2xl hover:bg-gray-50 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="flex-1 py-3 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:bg-primary-dark transition-all"
                                        >
                                            {editingAnswer ? "Update Answer" : "Submit Answer"}
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        </div>
                    )
                }
                {/* Confirm Action Modal */}
                {confirmModal.show && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white w-full max-w-sm rounded-[2rem] p-8 shadow-2xl relative overflow-hidden text-center"
                        >
                            {/* Visual Indicator */}
                            <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-6 ${
                                ['question', 'answer'].includes(confirmModal.type) 
                                ? 'bg-red-50 text-red-500' 
                                : 'bg-primary/10 text-primary'
                            }`}>
                                {['question', 'answer'].includes(confirmModal.type) ? (
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4h6v3M4 7h16" />
                                    </svg>
                                ) : confirmModal.type === 'solve' ? (
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                ) : (
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                )}
                            </div>

                            <h2 className="text-2xl font-black text-text-main mb-2">{confirmModal.title}</h2>
                            <p className="text-text-secondary text-sm font-medium leading-relaxed mb-8">
                                {confirmModal.message}
                            </p>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setConfirmModal({ ...confirmModal, show: false })}
                                    className="flex-1 py-3.5 bg-gray-50 text-text-secondary font-bold rounded-2xl hover:bg-gray-100 transition-all active:scale-95"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={executeConfirmAction}
                                    className={`flex-1 py-3.5 text-white font-bold rounded-2xl shadow-lg transition-all active:scale-95 ${
                                        ['question', 'answer'].includes(confirmModal.type)
                                        ? 'bg-red-500 shadow-red-500/20 hover:bg-red-600'
                                        : 'bg-primary shadow-primary/20 hover:bg-primary-dark'
                                    }`}
                                >
                                    Confirm
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence >
        </div >
    );
};

export default QA;