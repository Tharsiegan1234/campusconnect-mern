import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, Link, useNavigate } from 'react-router-dom';

const SkillDetails = () => {
    const [skill, setSkill] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [replyMessage, setReplyMessage] = useState('');
    const [replyLoading, setReplyLoading] = useState(false);
    const [replySuccess, setReplySuccess] = useState('');

    const { id } = useParams();
    const navigate = useNavigate();

    // Handle both 'user' and 'userInfo' local storage formats
    const userInfo = JSON.parse(localStorage.getItem('user')) || JSON.parse(localStorage.getItem('userInfo'));

    useEffect(() => {
        fetchSkill();
    }, [id]);

    const fetchSkill = async () => {
        try {
            const { data } = await axios.get(`http://localhost:5000/api/peer-skills/${id}`);
            setSkill(data);
            setLoading(false);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch skill details');
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this listing?')) {
            try {
                const token = localStorage.getItem('token') || userInfo?.token;
                await axios.delete(`http://localhost:5000/api/peer-skills/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                navigate(userInfo.role === 'admin' ? '/admin/skills-events' : '/skills');
            } catch (err) {
                alert(err.response?.data?.message || 'Failed to delete listing');
            }
        }
    };

    const handleReplySubmit = async (e) => {
        e.preventDefault();
        if (!replyMessage.trim()) return;

        setReplyLoading(true);
        setReplySuccess('');
        try {
            const token = localStorage.getItem('token') || userInfo?.token;
            await axios.post(`http://localhost:5000/api/peer-skills/reply/${id}`, { message: replyMessage }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setReplySuccess('Your reply has been sent! The student will receive a formal email notification.');
            setReplyMessage('');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send reply');
        } finally {
            setReplyLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-600 text-xl">Loading skill details...</div>;

    if (error) return (
        <div className="container mx-auto px-4 py-8 text-center">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 max-w-lg mx-auto">{error}</div>
            <Link to="/skills" className="text-blue-600 hover:underline">Back to Skills Listings</Link>
        </div>
    );

    if (!skill) return null;

    const isOwner = userInfo && (userInfo._id === skill.createdBy?._id || userInfo.id === skill.createdBy?._id);
    const isAdmin = userInfo && userInfo.role === 'admin';

    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl">
            <div className="mb-6 flex justify-between items-center">
                <button onClick={() => navigate(-1)} className="text-blue-600 hover:text-blue-800 font-medium flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                    Back
                </button>
                
                {(isOwner || isAdmin) && (
                    <div className="flex gap-3">
                        <Link 
                            to={`/skills/edit/${id}`}
                            className="bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold py-2 px-6 rounded-lg transition"
                        >
                            Edit
                        </Link>
                        <button 
                            onClick={handleDelete}
                            className="bg-red-50 text-red-600 hover:bg-red-100 font-bold py-2 px-6 rounded-lg transition"
                        >
                            Delete
                        </button>
                    </div>
                )}
            </div>

            <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 mb-8">
                <div className={`h-24 ${skill.type === 'offer' ? 'bg-green-600' : 'bg-purple-600'}`}></div>
                <div className="px-8 pb-8 relative">
                    <div className="flex justify-between items-end mb-6 -mt-12">
                        <div className="w-24 h-24 rounded-full bg-white border-4 border-white flex items-center justify-center text-gray-400 text-3xl font-bold shadow-md overflow-hidden">
                            {skill.createdBy?.profilePicture ? (
                                <img src={`http://localhost:5000${skill.createdBy.profilePicture}`} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                skill.createdBy?.firstName?.charAt(0) || 'U'
                            )}
                        </div>
                        <span className={`px-4 py-1.5 font-bold rounded-full text-sm shadow-sm ${skill.type === 'offer' ? 'bg-green-100 text-green-800 border box-border border-green-200' : 'bg-purple-100 text-purple-800 border box-border border-purple-200'}`}>
                            {skill.type === 'offer' ? 'Offering to Teach' : 'Requesting to Learn'}
                        </span>
                    </div>

                    <div className="mb-8">
                        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">{skill.title}</h1>
                        <p className="text-lg text-blue-600 font-semibold mb-6 flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path></svg>
                            {skill.category}
                        </p>

                        <h2 className="text-2xl font-bold text-gray-800 mb-3 border-b border-gray-200 pb-2">Description</h2>
                        <div className="text-gray-700 leading-relaxed whitespace-pre-line text-lg bg-gray-50 p-6 rounded-lg border border-gray-100">
                            {skill.description}
                        </div>
                    </div>

                    <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Posted By</h3>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-white font-bold mr-4 overflow-hidden">
                                    {skill.createdBy?.profilePicture ? (
                                        <img src={`http://localhost:5000${skill.createdBy.profilePicture}`} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        skill.createdBy?.firstName?.charAt(0) || 'U'
                                    )}
                                </div>
                                <div>
                                    <p className="text-xl font-bold text-gray-900">{skill.createdBy?.firstName} {skill.createdBy?.lastName}</p>
                                    <p className="text-gray-500 text-sm">Joined Student</p>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3">
                                <a
                                    href={`mailto:${skill.createdBy?.email}?subject=Regarding your Skill Listing: ${skill.title}`}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300 shadow-md flex items-center"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                                    Connect via Email
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Expert Reply Section */}
            {(userInfo?.role === 'expert' || userInfo?.role === 'admin') && skill.type === 'request' && !isOwner && (
                <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                        <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"></path></svg>
                        Professional Expert Response
                    </h2>
                    
                    {replySuccess ? (
                        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                            {replySuccess}
                        </div>
                    ) : (
                        <form onSubmit={handleReplySubmit}>
                            <p className="text-gray-600 mb-4">Provide your guidance or expertise to help this student. A formal institutional email with your response will be sent to them automatically.</p>
                            <textarea
                                className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none mb-4 min-h-[150px]"
                                placeholder="Enter your detailed response here..."
                                value={replyMessage}
                                onChange={(e) => setReplyMessage(e.target.value)}
                                required
                            />
                            <button
                                type="submit"
                                disabled={replyLoading || !replyMessage.trim()}
                                className={`w-full py-3 rounded-lg font-bold text-white transition decoration-300 ${replyLoading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700 shadow-md'}`}
                            >
                                {replyLoading ? 'Sending Response...' : 'Send Formal Response'}
                            </button>
                        </form>
                    )}
                </div>
            )}
        </div>
    );
};

export default SkillDetails;
