// components/Header.jsx
import { Link, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import NotificationsDropdown from './NotificationsDropdown';
import logo from '../assets/images/Avatars/logo.png';
const Header = () => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user'));
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleDropdownToggle = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };

    const handleNavigation = (path) => {
        setIsDropdownOpen(false);
        navigate(path);
    };

    return (
        <header className="bg-primary text-white shadow-md sticky top-0 z-50 font-heading">
            <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                <Link to="/" className="text-2xl font-bold tracking-wide hover:text-accent transition-colors">
                    {/* CampusConnect */}
                     <img src={logo} alt="CampusConnect Logo" className="h-11 object-cover" />

                </Link>
               

                <nav className="hidden md:flex space-x-8 text-sm font-medium">
                    <Link to="/" className="hover:text-accent transition-colors">Home</Link>
                    <Link to="/skills" className="hover:text-accent transition-colors">Skills</Link>
                    
                    {/* Dropdown for Study Groups & Workshops */}
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={handleDropdownToggle}
                            className="hover:text-accent transition-colors flex items-center gap-1 focus:outline-none"
                        >
                            Study Groups & Workshops
                            <svg
                                className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        
                        {isDropdownOpen && (
                            <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-2 z-50 animate-fadeIn">
                                <button
                                    onClick={() => handleNavigation('/groups')}
                                    className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-primary transition-colors flex items-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                    </svg>
                                    Study Groups
                                </button>
                                <button
                                    onClick={() => handleNavigation('/workshops')}
                                    className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-primary transition-colors flex items-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2v16z" />
                                    </svg>
                                    Workshops
                                </button>
                            </div>
                        )}
                    </div>
                    
                    <Link to="/clubs" className="hover:text-accent transition-colors">Clubs</Link>
                    <Link to="/sports" className="hover:text-accent transition-colors">Sports</Link>
                    <Link to="/qa" className="hover:text-accent transition-colors">Q&A</Link>
                </nav>

                <div className="flex items-center space-x-5">
                    {user ? (
                        <div className="flex items-center gap-4">
                            <NotificationsDropdown />
                            {user.role === 'admin' && (
                                <Link
                                    to="/admin/dashboard"
                                    className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition-all group flex items-center justify-center relative shadow-lg hover:scale-110 active:scale-95 border border-white/5"
                                    title="Admin Dashboard"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 group-hover:text-accent transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                    </svg>
                                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#EA580C] rounded-full border-2 border-primary shadow-[0_0_8px_rgba(234,88,12,0.6)] animate-pulse"></span>
                                </Link>
                            )}
                            <Link
                                to="/profiles"
                                className={`flex items-center gap-2 group p-1 pr-4 rounded-full transition-all ${user.role === 'admin'
                                    ? 'bg-white/5 border border-[#EA580C]/20 hover:bg-white/10'
                                    : 'hover:bg-white/5'
                                    }`}
                            >
                                <div className="relative shrink-0">
                                    <img
                                        src={user.role === 'admin' ? "/src/assets/images/avatars/admin.png" : (user.avatar || "/src/assets/images/avatars/avatar1.png")}
                                        alt="Profile"
                                        className={`w-9 h-9 rounded-full border-2 object-cover transition-all ${user.role === 'admin'
                                            ? 'border-[#EA580C] shadow-sm'
                                            : 'border-white'
                                            }`}
                                    />
                                    {user.role === 'admin' && (
                                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-[#EA580C] rounded-full border-2 border-primary flex items-center justify-center text-[7px] font-black text-white">
                                            ✓
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col items-start leading-tight">
                                    <span className="text-sm font-bold group-hover:text-accent transition-colors">
                                        {user.name.split(' ')[0]}
                                    </span>
                                    <span className={`text-[8px] font-black uppercase tracking-widest ${user.role === 'admin' ? 'text-accent' : 'opacity-70 text-white'}`}>
                                        {user.role}
                                    </span>
                                </div>
                            </Link>
                        </div>

                    ) : (
                        <div className="flex items-center space-x-4">
                            <Link to="/login" className="text-sm font-bold hover:text-accent transition-colors">
                                Sign In
                            </Link>
                            <Link
                                to="/register"
                                className="bg-white text-primary px-6 py-2 rounded-full text-sm font-bold hover:bg-gray-100 transition-all transform hover:scale-105 shadow-md"
                            >
                                Join Now
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;