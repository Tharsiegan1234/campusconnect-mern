import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Sports.css';

// Live countdown timer component
const CountdownTimer = ({ targetDate }) => {
    const calcTimeLeft = useCallback(() => {
        const diff = new Date(targetDate) - new Date();
        if (diff <= 0) return null;
        return {
            days: Math.floor(diff / (1000 * 60 * 60 * 24)),
            hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
            mins: Math.floor((diff / (1000 * 60)) % 60),
            secs: Math.floor((diff / 1000) % 60)
        };
    }, [targetDate]);

    const [timeLeft, setTimeLeft] = useState(calcTimeLeft);

    useEffect(() => {
        const timer = setInterval(() => setTimeLeft(calcTimeLeft()), 1000);
        return () => clearInterval(timer);
    }, [calcTimeLeft]);

    if (!timeLeft) return <span className="text-xs text-red-500 font-bold">Session started!</span>;

    return (
        <div className="flex gap-1.5">
            {[['D', timeLeft.days], ['H', timeLeft.hours], ['M', timeLeft.mins], ['S', timeLeft.secs]].map(([label, val]) => (
                <div key={label} className="flex flex-col items-center bg-[#1E3A8A] text-white rounded-lg px-2 py-1 min-w-[36px] shadow-sm">
                    <span className="text-sm font-black leading-tight">{String(val).padStart(2, '0')}</span>
                    <span className="text-[9px] uppercase tracking-wider opacity-80">{label}</span>
                </div>
            ))}
        </div>
    );
};

const Sports = () => {
    const navigate = useNavigate();
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedType, setSelectedType] = useState('All');
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [loadingMembers, setLoadingMembers] = useState(false);
    const [joinSuccess, setJoinSuccess] = useState(null);
    const [isEditingSession, setIsEditingSession] = useState(false);
    const [editDate, setEditDate] = useState('');
    const [editLocation, setEditLocation] = useState('');
    const [isSavingSession, setIsSavingSession] = useState(false);
    const [showScheduleOverview, setShowScheduleOverview] = useState(false);

    const currentUser = JSON.parse(localStorage.getItem('user'));
    const isAdmin = currentUser && (currentUser.role === 'admin' || currentUser.role === 'expert');
    const isStudent = currentUser && currentUser.role === 'student';

    useEffect(() => {
        const fetchTeams = async () => {
            try {
                const res = await fetch('/api/sports');
                if (!res.ok) throw new Error('no-sports-endpoint');
                let data = await res.json();
                
                // Initialize RSVP status and counts for each team
                if (Array.isArray(data)) {
                    data = data.map(t => {
                        let _rsvpStatus = null;
                        let _going = 0;
                        let _notGoing = 0;
                        
                        if (t.nextSession && t.nextSession.rsvps) {
                            _going = t.nextSession.rsvps.filter(r => r.status === 'going').length;
                            _notGoing = t.nextSession.rsvps.filter(r => r.status === 'not_going').length;
                            if (currentUser) {
                                const myRsvp = t.nextSession.rsvps.find(r => 
                                    (r.user && r.user._id === (currentUser._id || currentUser.id)) || 
                                    (r.user === (currentUser._id || currentUser.id))
                                );
                                if (myRsvp) _rsvpStatus = myRsvp.status;
                            }
                        }
                        
                        return { ...t, _rsvpStatus, _going, _notGoing };
                    });
                }
                setTeams(data);
            } catch (err) {
                setTeams([
                    { id: 1, name: 'Football Team', sportType: 'Football', description: 'Inter-college fixtures and training.' },
                    { id: 2, name: 'Basketball Team', sportType: 'Basketball', description: 'Practice and tournaments.' },
                    { id: 3, name: 'Badminton Club', sportType: 'Badminton', description: 'Friendly matches and coaching.' },
                ]);
            } finally {
                setLoading(false);
            }
        };
        fetchTeams();
    }, []);

    const handleViewMembers = async (teamId) => {
        setLoadingMembers(teamId);
        try {
            const res = await fetch(`/api/sports/${teamId}`);
            if (!res.ok) throw new Error('Failed to fetch team details');
            const data = await res.json();
            setSelectedTeam(data);
        } catch (err) {
            alert('Could not load team members');
        } finally {
            setLoadingMembers(false);
        }
    };

    const uniqueTypes = ['All', ...new Set(teams.map(t => t.sportType || 'General'))];
    const filteredTeams = teams.filter(t => selectedType === 'All' || (t.sportType || 'General') === selectedType);

    return (
        <div className="sports-page">
            <header className="sports-hero relative overflow-hidden bg-gradient-to-br from-[#1E3A8A] to-[#172554] rounded-3xl mx-4 mt-4 mb-8 shadow-xl">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="absolute -top-24 -right-24 w-80 h-80 bg-blue-500 rounded-full mix-blend-overlay filter blur-3xl opacity-30 animate-pulse-slow"></div>
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-400 rounded-full mix-blend-overlay filter blur-3xl opacity-30"></div>
                
                <div className="relative container mx-auto px-6 py-10 md:py-12 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md text-white text-xs font-bold uppercase tracking-widest mb-4">
                        <span>🏆</span> Campus Athletics
                    </div>
                    <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-4 tracking-tight drop-shadow-md">
                        Sports Teams <span className="text-blue-300">&</span> Activities
                    </h1>
                    <p className="text-blue-100 text-base md:text-lg max-w-2xl mx-auto mb-8 leading-relaxed font-medium">
                        Join athletic teams, view fixtures and participate in campus sports activities managed by student leaders and administrators.
                    </p>
                    <div className="flex gap-4 justify-center">
                        <a href="#teams" className="bg-white hover:bg-gray-100 text-[#1E3A8A] px-6 py-2.5 rounded-xl font-bold text-base shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                            Explore Teams ↓
                        </a>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10 pt-6 border-t border-white/10">
                        <div className="flex flex-col items-center justify-center">
                            <span className="text-4xl font-black text-white drop-shadow-md">12+</span>
                            <span className="text-blue-200 text-xs font-bold uppercase tracking-wider mt-2">Active Teams</span>
                        </div>
                        <div className="flex flex-col items-center justify-center">
                            <span className="text-4xl font-black text-white drop-shadow-md">500+</span>
                            <span className="text-blue-200 text-xs font-bold uppercase tracking-wider mt-2">Athletes</span>
                        </div>
                        <div className="flex flex-col items-center justify-center">
                            <span className="text-4xl font-black text-white drop-shadow-md">30+</span>
                            <span className="text-blue-200 text-xs font-bold uppercase tracking-wider mt-2">Events / Year</span>
                        </div>
                        <div className="flex flex-col items-center justify-center">
                            <span className="text-4xl font-black text-white drop-shadow-md">8</span>
                            <span className="text-blue-200 text-xs font-bold uppercase tracking-wider mt-2">Sport Venues</span>
                        </div>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-6 py-12 grid gap-8 lg:grid-cols-2 items-start">
                <section className="bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-blue-50 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow duration-300">
                    <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center text-2xl mb-6 shadow-inner">🎯</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 font-heading">What Students Can Do</h2>
                    <ul className="space-y-4">
                        <li className="flex items-start gap-3 text-gray-600"><span className="text-orange-500 mt-1 flex-shrink-0">✦</span> Discover and join sports teams.</li>
                        <li className="flex items-start gap-3 text-gray-600"><span className="text-orange-500 mt-1 flex-shrink-0">✦</span> View fixture schedules and training times.</li>
                        <li className="flex items-start gap-3 text-gray-600"><span className="text-orange-500 mt-1 flex-shrink-0">✦</span> Apply to be a team captain or coach assistant.</li>
                        <li className="flex items-start gap-3 text-gray-600"><span className="text-orange-500 mt-1 flex-shrink-0">✦</span> Manage team events if an executive.</li>
                    </ul>
                </section>

                <section className="bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-blue-50 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow duration-300">
                    <div className="w-14 h-14 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center text-2xl mb-6 shadow-inner">⚡</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 font-heading">Key Features</h2>
                    <ul className="space-y-4">
                        <li className="flex items-start gap-3 text-gray-600"><span className="text-blue-500 mt-1 flex-shrink-0">✦</span> Team profiles and member lists</li>
                        <li className="flex items-start gap-3 text-gray-600"><span className="text-blue-500 mt-1 flex-shrink-0">✦</span> Register for tryouts and matches</li>
                        <li className="flex items-start gap-3 text-gray-600"><span className="text-blue-500 mt-1 flex-shrink-0">✦</span> Manage schedules and announcements</li>
                        <li className="flex items-start gap-3 text-gray-600"><span className="text-blue-500 mt-1 flex-shrink-0">✦</span> Admin controls for teams and events</li>
                    </ul>
                </section>

                <section className="col-span-full mt-6 bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50" id="teams">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-4 border-b border-gray-100">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <h1 className="text-4xl font-extrabold text-[#1E3A8A] tracking-tight">Sports Teams</h1>
                            {isAdmin && (
                                <button 
                                    onClick={() => setShowScheduleOverview(true)}
                                    className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center gap-2"
                                >
                                    <span>📅</span> All Schedules
                                </button>
                            )}
                        </div>
                        {isStudent && (
                            !loading && <span className="px-4 py-1 bg-blue-50 text-blue-700 font-bold rounded-full text-sm border border-blue-100 shadow-sm">{filteredTeams.length}</span>
                        )}
                        </div>
                        
                        {!loading && uniqueTypes.length > 1 && (
                            <div className="relative">
                                <select
                                    value={selectedType}
                                    onChange={(e) => setSelectedType(e.target.value)}
                                    className="appearance-none bg-white border border-gray-200 text-[#1E3A8A] py-2 pl-5 pr-10 rounded-full font-bold shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent cursor-pointer hover:border-[#1E3A8A] transition-colors"
                                >
                                    {uniqueTypes.map(type => (
                                        <option key={type} value={type}>
                                            {type === 'All' ? 'All Sports' : type}
                                        </option>
                                    ))}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-[#1E3A8A]">
                                    <svg className="fill-current w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
                                </div>
                            </div>
                        )}
                    </div>
                    {loading ? (
                        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 animate-pulse">
                            {[1, 2, 3].map(n => <div key={n} className="h-48 bg-gray-100 rounded-2xl"></div>)}
                        </div>
                    ) : filteredTeams.length === 0 ? (
                        <div className="text-center py-12 px-4 border-2 border-dashed border-gray-200 rounded-2xl">
                            <div className="text-4xl mb-4">👻</div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">No teams found</h3>
                            <p className="text-gray-500">There are no teams matching the selected sport type.</p>
                            <button onClick={() => setSelectedType('All')} className="mt-4 text-[#1E3A8A] font-bold hover:underline">View all teams</button>
                        </div>
                    ) : (
                        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {filteredTeams.map((t) => {
                                const teamId = t._id || t.id;
                                const isMember = currentUser && t.members && (t.members.includes(currentUser._id) || t.members.includes(currentUser.id));
                                const isAdmin = currentUser && currentUser.role === 'admin';
                                const isCreator = currentUser && t.createdBy && (t.createdBy._id === (currentUser._id || currentUser.id) || t.createdBy === (currentUser._id || currentUser.id));

                                return (
                                    <article key={teamId} className="group flex flex-col items-start bg-gradient-to-b from-white to-gray-50/50 p-6 rounded-2xl border border-gray-100 hover:border-blue-200 shadow-sm hover:shadow-xl transition-all duration-300">
                                        <div className="flex items-center justify-between w-full mb-4">
                                            <div className="w-12 h-12 bg-blue-50 text-blue-800 rounded-xl flex items-center justify-center font-bold text-xl group-hover:scale-110 transition-transform duration-300 shadow-sm">
                                                {t.name.charAt(0)}
                                            </div>
                                            <span className="text-xs font-bold px-2.5 py-1 bg-orange-100 text-orange-700 rounded-lg">{t.sportType || 'General'}</span>
                                        </div>
                                        <h4 className="text-xl font-bold text-gray-800 mb-2 font-heading">{t.name}</h4>
                                        <p className="text-gray-500 text-sm leading-relaxed mb-4 flex-grow">{t.description}</p>
                                        <div className="flex gap-3 w-full mt-auto">
                                            {isMember ? (
                                                <div className="flex gap-2 flex-1">
                                                    <div className="flex-[0.6] bg-green-50 text-green-700 font-bold py-2.5 px-2 rounded-lg text-xs border border-green-200 flex items-center justify-center gap-1">
                                                        <span>✓</span> Member
                                                    </div>
                                                    <button 
                                                        className="flex-1 bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold py-2.5 px-2 rounded-lg text-xs border border-orange-200 transition-colors duration-200 shadow-sm flex items-center justify-center gap-1"
                                                        onClick={() => setJoinSuccess({
                                                            name: t.name,
                                                            id: teamId,
                                                            message: t.nextSession?.date ? 'Get ready for our next activity! Check the details and RSVP below.' : 'No upcoming session is currently scheduled for this team.',
                                                            nextSession: t.nextSession,
                                                            isMember: true,
                                                            isAdmin: isAdmin || isCreator,
                                                            isCreator: isCreator,
                                                            _rsvpStatus: t._rsvpStatus,
                                                            _going: t._going,
                                                            _notGoing: t._notGoing,
                                                            isExistingMember: true
                                                        })}
                                                    >
                                                        <span>📅</span> Session
                                                    </button>
                                                </div>
                                            ) : (isAdmin || isCreator) ? (
                                                <div className="flex gap-2 flex-1">
                                                    <button
                                                        className="flex-[0.6] bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-3 rounded-lg text-sm transition-colors duration-200 shadow-md flex items-center justify-center gap-1"
                                                        onClick={async () => {
                                                            const token = localStorage.getItem('token');
                                                            if (!token) return navigate('/login');
                                                            try {
                                                                const res = await fetch(`/api/sports/${teamId}/join`, {
                                                                    method: 'POST',
                                                                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                                                                });
                                                                const body = await res.json();
                                                                if (!res.ok) throw new Error(body.message || 'Could not join');
                                                                const isNowMember = body.message?.toLowerCase().includes('joined');
                                                                if (isNowMember) {
                                                                    const updatedMembers = [...(t.members || []), (currentUser._id || currentUser.id)];
                                                                    setTeams(prev => prev.map(tm => (tm._id || tm.id) === teamId ? {...tm, members: updatedMembers} : tm));
                                                                }
                                                                setJoinSuccess({ 
                                                                    name: t.name, id: teamId, message: body.message, nextSession: t.nextSession, isMember: isNowMember,
                                                                    isAdmin: isAdmin || isCreator,
                                                                    isCreator: isCreator,
                                                                    _rsvpStatus: t._rsvpStatus, _going: t._going, _notGoing: t._notGoing, isExistingMember: false
                                                                });
                                                            } catch (err) { alert(err.message); }
                                                        }}
                                                    >
                                                        <span>✚</span> Join
                                                    </button>
                                                    <button 
                                                        className="flex-1 bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold py-2.5 px-2 rounded-lg text-xs border border-orange-200 transition-colors duration-200 shadow-sm flex items-center justify-center gap-1"
                                                        onClick={() => setJoinSuccess({
                                                            name: t.name, id: teamId, 
                                                            message: t.nextSession?.date ? 'Management view. Oversee RSVPs and session details.' : 'No session is currently scheduled. You can set one from the Admin Dashboard.', 
                                                            nextSession: t.nextSession, isMember: false,
                                                            isAdmin: true,
                                                            isCreator: isCreator,
                                                            _rsvpStatus: t._rsvpStatus, _going: t._going, _notGoing: t._notGoing, isExistingMember: true
                                                        })}
                                                    >
                                                        <span>📅</span> Session
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-3 rounded-lg text-sm transition-colors duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                                                    onClick={async () => {
                                                        const token = localStorage.getItem('token');
                                                        if (!token) return navigate('/login');
                                                        try {
                                                            const res = await fetch(`/api/sports/${teamId}/join`, {
                                                                method: 'POST',
                                                                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                                                            });
                                                            const body = await res.json();
                                                            if (!res.ok) throw new Error(body.message || 'Could not join');
                                                            const isNowMember = body.message?.toLowerCase().includes('joined');
                                                            if (isNowMember) {
                                                                const updatedMembers = [...(t.members || []), (currentUser._id || currentUser.id)];
                                                                setTeams(prev => prev.map(tm => (tm._id || tm.id) === teamId ? {...tm, members: updatedMembers} : tm));
                                                            }
                                                            setJoinSuccess({ 
                                                                name: t.name, id: teamId, message: body.message, nextSession: t.nextSession, isMember: isNowMember,
                                                                isAdmin: isAdmin || isCreator,
                                                                isCreator: isCreator,
                                                                _rsvpStatus: t._rsvpStatus, _going: t._going, _notGoing: t._notGoing, isExistingMember: false
                                                            });
                                                        } catch (err) { alert(err.message); }
                                                    }}
                                                >
                                                    <span>✚</span> Join
                                                </button>
                                            )}
                                            <button 
                                                className="flex-1 bg-white hover:bg-gray-50 text-gray-700 font-semibold py-2.5 px-3 rounded-lg text-sm border border-gray-200 transition-colors duration-200 shadow-sm flex items-center justify-center gap-2"
                                                onClick={() => handleViewMembers(teamId)}
                                                disabled={loadingMembers === teamId}
                                            >
                                                <span>👥</span> {loadingMembers === teamId ? 'Loading...' : 'Members'}
                                            </button>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </section>
            </main>

            {selectedTeam && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col transform transition-all">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800">{selectedTeam.name} Members</h2>
                                <p className="text-sm text-gray-500 mt-1">{selectedTeam.members?.length || 0} active members</p>
                            </div>
                            <button 
                                onClick={() => setSelectedTeam(null)}
                                className="w-10 h-10 rounded-full bg-white border border-gray-200 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-colors shadow-sm"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto custom-scrollbar flex-grow">
                            {selectedTeam.members && selectedTeam.members.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {selectedTeam.members.map(member => (
                                        <div key={member._id} className="flex flex-col items-center gap-3 p-5 border border-gray-100 rounded-2xl hover:border-[#1E3A8A]/30 transition-colors bg-white shadow-sm hover:shadow-md text-center">
                                            <img src={member.avatar ? `/${member.avatar}` : '/avatars/avatar1.png'} alt={member.name} className="w-16 h-16 rounded-full border-2 border-[#1E3A8A]/10 object-cover shadow-sm" />
                                            <div>
                                                <h4 className="font-bold text-gray-800 text-sm w-full truncate px-2">{member.name}</h4>
                                                <p className="text-xs text-gray-500 w-full truncate px-2 mt-1">{member.email}</p>
                                            </div>
                                            <Link to={`/profile/${member._id}`} className="mt-2 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg w-full">View Profile</Link>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl mx-4 my-2">
                                    <div className="text-4xl mb-4">📭</div>
                                    <h3 className="text-lg font-bold text-gray-700">No Members Yet</h3>
                                    <p className="text-gray-500 text-sm mt-2">There are currently no users in this team.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {joinSuccess && (
                <div className="fixed inset-0 bg-[#0F172A]/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl transform animate-in zoom-in-95 duration-300 border border-white/20">
                        <div className="h-32 bg-gradient-to-br from-[#1E3A8A] to-[#3B82F6] flex items-center justify-center relative overflow-hidden">
                            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] text-white"></div>
                            <div className="w-20 h-20 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center text-4xl border border-white/30 shadow-inner animate-bounce-slow text-white">
                                {joinSuccess.isExistingMember ? '📅' : '🎉'}
                            </div>
                        </div>
                        <div className="p-8 text-center">
                            <h3 className="text-2xl font-black text-gray-900 mb-2 font-heading tracking-tight">
                                {joinSuccess.isExistingMember ? 'Next Activity!' : 'Success!'}
                            </h3>
                            <p className="text-gray-600 mb-1 font-medium">
                                {joinSuccess.isExistingMember ? 'Scheduled for' : (joinSuccess.isMember ? 'You are now a member of' : 'Your application is sent for')}
                            </p>
                            <div className="inline-block px-4 py-1.5 bg-blue-50 text-[#1E3A8A] font-bold rounded-lg text-lg mb-6 border border-blue-100 shadow-sm">
                                {joinSuccess.name}
                            </div>
                            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                                {joinSuccess.message}
                            </p>
                            {joinSuccess.nextSession && joinSuccess.nextSession.date && !isEditingSession ? (
                                <div className="w-full mb-8 p-4 bg-orange-50/50 border border-orange-100 rounded-2xl text-left">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-orange-700 uppercase tracking-wider flex items-center gap-1.5">📅 Training Session RSVP</span>
                                            {joinSuccess.isAdmin && (
                                                <button 
                                                    onClick={() => {
                                                        setIsEditingSession(true);
                                                        setEditDate(new Date(joinSuccess.nextSession.date).toISOString().slice(0, 16));
                                                        setEditLocation(joinSuccess.nextSession.location || '');
                                                    }}
                                                    className="text-[10px] text-blue-600 font-bold hover:underline mt-0.5 text-left"
                                                >
                                                    ✏️ Update Info
                                                </button>
                                            )}
                                        </div>
                                        <CountdownTimer targetDate={joinSuccess.nextSession.date} />
                                    </div>
                                    <div className="space-y-1 mb-4">
                                        {joinSuccess.nextSession.location && <p className="text-xs text-gray-700 font-medium">📍 {joinSuccess.nextSession.location}</p>}
                                        {joinSuccess.nextSession.description && <p className="text-xs text-gray-500 italic">"{joinSuccess.nextSession.description}"</p>}
                                    </div>
                                    
                                    <div className="flex gap-2">
                                        <button
                                            className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all duration-200 shadow-sm flex items-center justify-center gap-2 ${
                                                joinSuccess._rsvpStatus === 'going'
                                                    ? 'bg-green-500 text-white shadow-green-100'
                                                    : 'bg-white border border-green-200 text-green-700 hover:bg-green-50'
                                            }`}
                                            onClick={async () => {
                                                const token = localStorage.getItem('token');
                                                try {
                                                    const res = await fetch(`/api/sports/${joinSuccess.id}/rsvp`, {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                                                        body: JSON.stringify({ status: 'going' })
                                                    });
                                                    const body = await res.json();
                                                    if (!res.ok) throw new Error(body.message);
                                                    setJoinSuccess(prev => ({...prev, _rsvpStatus: 'going', _going: body.going, _notGoing: body.notGoing }));
                                                    setTeams(prev => prev.map(tm => (tm._id || tm.id) === joinSuccess.id ? {...tm, _rsvpStatus: 'going', _going: body.going, _notGoing: body.notGoing } : tm));
                                                } catch (err) { alert(err.message); }
                                            }}
                                        >
                                            {joinSuccess._rsvpStatus === 'going' && <span>✓</span>} Join Training Session {joinSuccess._going ? `(${joinSuccess._going})` : ''}
                                        </button>
                                        <button
                                            className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all duration-200 shadow-sm flex items-center justify-center gap-2 ${
                                                joinSuccess._rsvpStatus === 'not_going'
                                                    ? 'bg-red-500 text-white shadow-red-100'
                                                    : 'bg-white border border-red-200 text-red-700 hover:bg-red-50'
                                            }`}
                                            onClick={async () => {
                                                const token = localStorage.getItem('token');
                                                try {
                                                    const res = await fetch(`/api/sports/${joinSuccess.id}/rsvp`, {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                                                        body: JSON.stringify({ status: 'not_going' })
                                                    });
                                                    const body = await res.json();
                                                    if (!res.ok) throw new Error(body.message);
                                                    setJoinSuccess(prev => ({...prev, _rsvpStatus: 'not_going', _going: body.going, _notGoing: body.notGoing }));
                                                    setTeams(prev => prev.map(tm => (tm._id || tm.id) === joinSuccess.id ? {...tm, _rsvpStatus: 'not_going', _going: body.going, _notGoing: body.notGoing } : tm));
                                                } catch (err) { alert(err.message); }
                                            }}
                                        >
                                            {joinSuccess._rsvpStatus === 'not_going' && <span>✕</span>} Can't Attend {joinSuccess._notGoing ? `(${joinSuccess._notGoing})` : ''}
                                        </button>
                                    </div>
                                </div>
                            ) : isEditingSession ? (
                                <div className="w-full mb-8 p-5 bg-blue-50/50 border border-blue-100 rounded-2xl text-left animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <h4 className="text-sm font-bold text-blue-900 mb-4 flex items-center gap-2">
                                        <span>📅</span> {joinSuccess.nextSession?.date ? 'Update Session' : 'Schedule Next Session'}
                                    </h4>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-[10px] font-bold text-blue-700 uppercase mb-1 ml-1">Date & Time</label>
                                            <input 
                                                type="datetime-local" 
                                                value={editDate}
                                                onChange={(e) => setEditDate(e.target.value)}
                                                className="w-full bg-white border border-blue-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-gray-700"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-blue-700 uppercase mb-1 ml-1">Location / Venue</label>
                                            <input 
                                                type="text" 
                                                placeholder="e.g. Main Ground, Court 1"
                                                value={editLocation}
                                                onChange={(e) => setEditLocation(e.target.value)}
                                                className="w-full bg-white border border-blue-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-gray-700"
                                            />
                                        </div>
                                        <div className="flex gap-2 pt-2">
                                            <button 
                                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl text-xs shadow-lg shadow-blue-200 transition-all disabled:opacity-50"
                                                disabled={isSavingSession || !editDate}
                                                onClick={async () => {
                                                    setIsSavingSession(true);
                                                    const token = localStorage.getItem('token');
                                                    try {
                                                        const res = await fetch(`/api/sports/${joinSuccess.id}/next-session`, {
                                                            method: 'PUT',
                                                            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                                                            body: JSON.stringify({ date: editDate, location: editLocation })
                                                        });
                                                        const body = await res.json();
                                                        if (!res.ok) throw new Error(body.message);
                                                        
                                                        // Update local states
                                                        setJoinSuccess(prev => ({...prev, nextSession: body.nextSession }));
                                                        setTeams(prev => prev.map(tm => (tm._id || tm.id) === joinSuccess.id ? {...tm, nextSession: body.nextSession } : tm));
                                                        setIsEditingSession(false);
                                                    } catch (err) { alert(err.message); }
                                                    finally { setIsSavingSession(false); }
                                                }}
                                            >
                                                {isSavingSession ? 'Saving...' : 'Confirm Schedule'}
                                            </button>
                                            <button 
                                                className="px-5 bg-white border border-gray-200 text-gray-500 font-bold py-3 rounded-xl text-xs hover:bg-gray-50 transition-all"
                                                onClick={() => setIsEditingSession(false)}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="w-full mb-8 p-6 bg-gray-50 border border-gray-100 rounded-2xl text-center">
                                    <div className="text-3xl mb-3">⏳</div>
                                    <p className="text-sm font-bold text-gray-800 mb-1">Session Pending</p>
                                    <p className="text-xs text-gray-500 mb-4">The organizer hasn't scheduled the next activity yet. Please check back later!</p>
                                    {joinSuccess.isAdmin && (
                                        <button 
                                            onClick={() => {
                                                setIsEditingSession(true);
                                                setEditDate('');
                                                setEditLocation('');
                                            }}
                                            className="px-6 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-100 hover:bg-blue-700 transition-all transform hover:-translate-y-0.5 flex items-center gap-2 mx-auto"
                                        >
                                            <span>📅</span> Schedule Now
                                        </button>
                                    )}
                                </div>
                            )}

                            <button 
                                onClick={() => setJoinSuccess(null)}
                                className="w-full bg-[#1E3A8A] hover:bg-[#1e4fc2] text-white font-bold py-4 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-blue-200 hover:-translate-y-0.5"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Schedule Overview Modal */}
            {showScheduleOverview && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="bg-[#1E3A8A] p-6 text-white flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-bold">📅 Training Schedule Overview</h3>
                                <p className="text-blue-100 text-xs mt-1">Global view of all upcoming team sessions</p>
                            </div>
                            <button 
                                onClick={() => setShowScheduleOverview(false)}
                                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                            >
                                ✕
                            </button>
                        </div>
                        
                        <div className="p-4 max-h-[60vh] overflow-y-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-100">
                                        <th className="py-3 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Team</th>
                                        <th className="py-3 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Date & Time</th>
                                        <th className="py-3 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Location</th>
                                        <th className="py-3 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {teams.map(t => (
                                        <tr key={t._id || t.id} className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors">
                                            <td className="py-4 px-4 font-bold text-gray-800 text-sm">{t.name}</td>
                                            <td className="py-4 px-4">
                                                {t.nextSession?.date ? (
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-gray-700">{new Date(t.nextSession.date).toLocaleDateString()}</span>
                                                        <span className="text-[10px] text-gray-500">{new Date(t.nextSession.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs font-bold text-orange-500">Pending</span>
                                                )}
                                            </td>
                                            <td className="py-4 px-4 text-xs text-gray-600 truncate max-w-[120px]">
                                                {t.nextSession?.location || '—'}
                                            </td>
                                            <td className="py-4 px-4">
                                                <button 
                                                    onClick={() => {
                                                        const isCreator = currentUser && t.createdBy && (t.createdBy._id === (currentUser._id || currentUser.id) || t.createdBy === (currentUser._id || currentUser.id));
                                                        setJoinSuccess({
                                                            name: t.name, id: t._id || t.id, 
                                                            message: t.nextSession?.date ? 'Management view.' : 'Schedule session.', 
                                                            nextSession: t.nextSession, isMember: false,
                                                            isAdmin: true, isCreator,
                                                            _rsvpStatus: t._rsvpStatus, _going: t._going, _notGoing: t._notGoing, isExistingMember: true
                                                        });
                                                        setShowScheduleOverview(false);
                                                    }}
                                                    className="text-xs font-bold text-blue-600 hover:underline"
                                                >
                                                    {t.nextSession?.date ? 'View' : 'Schedule'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        
                        <div className="p-6 bg-gray-50 text-center">
                            <button 
                                onClick={() => setShowScheduleOverview(false)}
                                className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl text-xs hover:bg-gray-100 transition-all shadow-sm"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Sports;
