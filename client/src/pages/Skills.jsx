import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const Skills = () => {
    const [skills, setSkills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [isDeleting, setIsDeleting] = useState(null);
    const user = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
        fetchSkills();
    }, []);

    const fetchSkills = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/peer-skills');
            setSkills(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            const msg = err.response?.data?.details || err.response?.data?.message || err.message;
            setError(`Server Connection Problem: ${msg}. If you are on a mobile hotspot, please turn on a VPN.`);
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this listing?')) return;
        setIsDeleting(id);
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            };
            await axios.delete(`http://localhost:5000/api/peer-skills/${id}`, config);
            setSkills(skills.filter(s => s._id !== id));
            setIsDeleting(null);
        } catch (err) {
            console.error(err);
            alert('Failed to delete. ' + (err.response?.data?.message || ''));
            setIsDeleting(null);
        }
    };

    if (loading) return <div className="text-center py-20 text-text-secondary">Loading skills...</div>;
    if (error) return <div className="text-center py-20 text-error bg-error-light/10 rounded-xl p-4">{error}</div>;

    return (
        <div className="max-w-6xl mx-auto">
            <header className="mb-10 text-center relative">
                <h1 className="text-4xl font-bold text-primary mb-2">Peer Skill Exchange</h1>
                <p className="text-text-secondary">Empower yourself by teaching others or learning something new from your peers.</p>
                <div className="mt-6">
                    <Link to="/create-skill" className="bg-primary text-white px-8 py-3 rounded-2xl font-bold hover:bg-primary-dark transition-all shadow-sm hover:shadow-md inline-block">
                        + Post a Skill
                    </Link>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {skills.length > 0 ? (
                    skills.map((skill) => (
                        <div key={skill._id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col relative group">
                            {/* Owner Actions */}
                            {user && skill.createdBy?._id === user._id && (
                                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Link 
                                        to={`/edit-skill/${skill._id}`}
                                        className="p-2 bg-white rounded-full shadow-sm border border-gray-100 text-text-secondary hover:text-primary transition-colors"
                                        title="Edit"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                        </svg>
                                    </Link>
                                    <button 
                                        onClick={() => handleDelete(skill._id)}
                                        disabled={isDeleting === skill._id}
                                        className="p-2 bg-white rounded-full shadow-sm border border-gray-100 text-text-secondary hover:text-error transition-colors"
                                        title="Delete"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v2m3 4h.01" />
                                        </svg>
                                    </button>
                                </div>
                            )}

                            <div className="flex justify-between items-start mb-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                                    skill.type === 'offer' ? 'bg-success-light/20 text-success' : 'bg-warning-light/20 text-warning'
                                }`}>
                                    {skill.type}
                                </span>
                                <span className="text-xs text-text-secondary bg-bg-main px-2 py-1 rounded italic mr-8">
                                    {skill.category}
                                </span>
                            </div>
                            <h2 className="text-xl font-bold mb-2 text-primary">{skill.title}</h2>
                            <p className="text-text-secondary text-sm mb-6 line-clamp-3">{skill.description}</p>
                            
                            <div className="flex items-center mt-auto border-t border-gray-50 pt-4">
                                <img 
                                    src={skill.createdBy?.avatar || '/avatars/avatar1.png'} 
                                    alt={skill.createdBy?.name} 
                                    className="w-10 h-10 rounded-full border-2 border-white shadow-sm mr-3"
                                />
                                <div className="text-xs">
                                    <p className="font-bold text-text-main">{skill.createdBy?.name || 'Anonymous'}</p>
                                    <p className="text-text-secondary">{new Date(skill.createdAt).toLocaleDateString()}</p>
                                </div>
                                <button className="ml-auto text-primary text-sm font-bold hover:underline">
                                    Contact
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full text-center py-20 bg-bg-main rounded-3xl border-2 border-dashed border-gray-200">
                        <p className="text-text-secondary mb-4">No skill listings found yet.</p>
                        <Link to="/create-skill" className="bg-primary text-white px-6 py-2 rounded-xl font-bold hover:bg-primary-dark transition-colors">
                            Post First Skill
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Skills;
