import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';

const SkillForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditMode = Boolean(id);

    const [formData, setFormData] = useState({
        title: '',
        type: 'offer',
        category: 'Technology',
        description: ''
    });

    const [loading, setLoading] = useState(isEditMode);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isEditMode) {
            fetchSkillData();
        }
    }, [id]);

    const fetchSkillData = async () => {
        try {
            const res = await axios.get(`http://localhost:5000/api/peer-skills/${id}`);
            const { title, type, category, description } = res.data;
            setFormData({ title, type, category, description });
            setLoading(false);
        } catch (error) {
            console.error('Error fetching skill:', error);
            setError('Failed to load skill data.');
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                }
            };

            if (isEditMode) {
                await axios.put(`http://localhost:5000/api/peer-skills/${id}`, formData, config);
            } else {
                await axios.post('http://localhost:5000/api/peer-skills', formData, config);
            }

            navigate('/admin/skills-events');
        } catch (err) {
            console.error('Error saving skill:', err);
            setError(err.response?.data?.message || 'Error saving skill listing.');
            setSubmitting(false);
        }
    };

    if (loading) return <div className="text-center py-20 text-text-secondary italic">Loading listing details...</div>;

    return (
        <div className="max-w-2xl mx-auto py-6">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100"
            >
                <div className="mb-8">
                    <button 
                        onClick={() => navigate('/admin/skills-events')}
                        className="text-text-secondary hover:text-primary text-xs font-bold flex items-center gap-1 mb-4 transition-colors"
                    >
                        ← Back to Skill Repository
                    </button>
                    <h2 className="text-2xl font-bold text-text-main font-heading">
                        {isEditMode ? 'Edit Skill Listing' : 'Create New Skill Listing'}
                    </h2>
                    <p className="text-sm text-text-secondary mt-1">
                        {isEditMode ? 'Update the details for this student listing.' : 'Create a new skill listing to help students connect.'}
                    </p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm font-bold rounded-xl border border-red-100">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">Listing Title</label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="e.g., Python Tutoring or Help with Calculus"
                            required
                            className="w-full px-4 py-3 bg-bg-main border-none rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">Listing Type</label>
                            <select
                                name="type"
                                value={formData.type}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-bg-main border-none rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 transition-all font-bold text-text-main"
                            >
                                <option value="offer">Skill Offer</option>
                                <option value="request">Skill Request</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">Category</label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-bg-main border-none rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 transition-all font-bold text-text-main"
                            >
                                <option value="Technology">Technology</option>
                                <option value="Academic">Academic</option>
                                <option value="Creative">Creative</option>
                                <option value="Language">Language</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">Detailed Description</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows="5"
                            placeholder="Provide details about what you're offering or looking for..."
                            required
                            className="w-full px-4 py-3 bg-bg-main border-none rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                        ></textarea>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={submitting}
                            className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg ${
                                submitting 
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                                : 'bg-[#EA580C] text-white hover:bg-[#C2410C] shadow-[#EA580C]/20 hover:-translate-y-1'
                            }`}
                        >
                            {submitting ? 'Processing...' : (isEditMode ? 'Save Changes' : 'Publish Listing')}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default SkillForm;
