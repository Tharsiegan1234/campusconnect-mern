import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';

const CreateSkill = () => {
    const [title, setTitle] = useState('');
    const [type, setType] = useState('offer');
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isEdit, setIsEdit] = useState(false);

    const navigate = useNavigate();
    const { id } = useParams();

    // Handle both 'user' and 'userInfo' local storage formats
    const userInfo = JSON.parse(localStorage.getItem('user')) || JSON.parse(localStorage.getItem('userInfo'));

    useEffect(() => {
        if (!userInfo) {
            navigate('/login');
        }

        if (id) {
            setIsEdit(true);
            fetchSkill();
        }
    }, [id, navigate]); // Removed userInfo from dependencies to prevent infinite loops

    const fetchSkill = async () => {
        try {
            const { data } = await axios.get(`http://localhost:5000/api/peer-skills/${id}`);
            setTitle(data.title);
            setType(data.type);
            setCategory(data.category);
            setDescription(data.description);

            // Check if current user is the owner or an admin
            if (userInfo._id !== data.createdBy._id && userInfo.role !== 'admin') {
                navigate('/skills');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch skill details');
        }
    };

    const submitHandler = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            };

            const skillData = { title, type, category, description };

            if (isEdit) {
                await axios.put(`http://localhost:5000/api/peer-skills/${id}`, skillData, config);
            } else {
                await axios.post('http://localhost:5000/api/peer-skills', skillData, config);
            }

            setLoading(false);
            if (userInfo.role === 'admin') {
                navigate('/admin/skills-events');
            } else {
                navigate(`/skills/${id || ''}`);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong');
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-2xl">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">{isEdit ? 'Edit Skill Listing' : 'Create New Skill Listing'}</h1>

            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">{error}</div>}

            <form onSubmit={submitHandler} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="title">
                        Title
                    </label>
                    <input
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        id="title"
                        type="text"
                        placeholder="e.g., Advanced React Hooks, Spanish Conversation Practice"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                    />
                </div>

                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="type">
                        Listing Type
                    </label>
                    <div className="relative">
                        <select
                            className="block appearance-none w-full bg-white border border-gray-300 text-gray-700 py-2 px-3 pr-8 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500 shadow-sm"
                            id="type"
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                        >
                            <option value="offer">I am offering to teach this skill</option>
                            <option value="request">I am requesting to learn this skill</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                        </div>
                    </div>
                </div>

                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="category">
                        Category
                    </label>
                    <input
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        id="category"
                        type="text"
                        placeholder="e.g., Programming, Languages, Music, Subtopics..."
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        required
                    />
                </div>

                <div className="mb-6">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="description">
                        Description
                    </label>
                    <textarea
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        id="description"
                        placeholder="Provide details about what you know or what you want to learn..."
                        rows="5"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                    />
                </div>

                <div className="flex items-center justify-between">
                    <button
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-300 w-full"
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? 'Processing...' : (isEdit ? 'Update Listing' : 'Create Listing')}
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate(userInfo.role === 'admin' ? '/admin/skills-events' : '/skills')}
                        className="ml-4 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-300"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateSkill;
