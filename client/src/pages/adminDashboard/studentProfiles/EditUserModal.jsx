import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const FACULTIES = [
    {
        name: "Faculty of Computing",
        departments: [
            "Information Technology (IT)",
            "Software Engineering (SE)",
            "Computer Science (CS)",
            "Cyber Security",
            "Data Science",
            "Interactive Media / Multimedia"
        ]
    },
    {
        name: "Faculty of Engineering",
        departments: [
            "Civil Engineering",
            "Electrical & Electronic Engineering",
            "Mechanical Engineering",
            "Mechatronics Engineering"
        ]
    },
    {
        name: "Faculty of Business",
        departments: [
            "Business Management",
            "Accounting & Finance",
            "Marketing",
            "Human Resource Management (HRM)",
            "Logistics & Supply Chain Management"
        ]
    },
    {
        name: "Faculty of Hospitality & Culinary",
        departments: [
            "Hospitality Management",
            "Tourism Management",
            "Culinary Arts"
        ]
    },
    {
        name: "Faculty of Humanities & Sciences",
        departments: [
            "Psychology",
            "Law",
            "Biomedical Science",
            "Nursing"
        ]
    }
];

const EditUserModal = ({ isOpen, onClose, user, onUserUpdated }) => {
    const [formData, setFormData] = useState({
        name: '',
        field: '',
        role: '',
        realEmail: '',
        academicInfo: {
            year: 1,
            semester: 1
        }
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                field: user.field || '',
                role: user.role || '',
                realEmail: user.realEmail || '',
                academicInfo: {
                    year: user.academicInfo?.year || 1,
                    semester: user.academicInfo?.semester || 1
                }
            });
        }
    }, [user]);

    const handleChange = (e) => {
        const { name, value } = e.target;

        // Special case for name field: block numbers and special characters
        if (name === 'name') {
            const lettersOnly = value.replace(/[^A-Za-z\s]/g, '');
            if (value !== lettersOnly) {
                setFieldErrors(prev => ({ ...prev, [name]: "Full Name can only contain letters and spaces" }));
                return; // Block the update if it contains invalid characters
            }
        }

        if (name === 'year' || name === 'semester') {
            setFormData({
                ...formData,
                academicInfo: {
                    ...formData.academicInfo,
                    [name]: parseInt(value)
                }
            });
        } else {
            setFormData({ ...formData, [name]: value });
        }

        // Clear field error when user starts typing
        if (fieldErrors[name]) {
            setFieldErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const errors = {};
        const nameRegex = /^[A-Za-z\s]+$/;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!nameRegex.test(formData.name)) {
            errors.name = "Full Name can only contain letters and spaces";
        }

        if (formData.role === 'expert') {
            if (!emailRegex.test(formData.realEmail)) {
                errors.realEmail = "Invalid personal email format";
            }
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setFieldErrors({});

        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            const res = await axios.put(`/api/users/${user._id}`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            onUserUpdated(res.data);
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update user');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
                    >
                        <div className="p-8">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-text-main">Edit User</h2>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {error && (
                                <div className="mb-6 p-4 bg-red-50 text-error text-sm font-bold rounded-2xl border border-red-100 italic">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-text-secondary mb-1.5 ml-1">Full Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        required
                                        value={formData.name}
                                        onChange={handleChange}
                                        className={`w-full px-5 py-3 rounded-2xl border ${fieldErrors.name ? 'border-red-500' : 'border-gray-200'} focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none`}
                                    />
                                    {fieldErrors.name && <p className="text-red-500 text-[10px] mt-1 ml-1 font-bold">{fieldErrors.name}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-text-secondary mb-1.5 ml-1">
                                        {formData.role === 'expert' ? 'Expertise Field' : 'Department/Field'}
                                    </label>
                                    {formData.role === 'student' ? (
                                        <select
                                            name="field"
                                            required
                                            value={formData.field}
                                            onChange={handleChange}
                                            className="w-full px-5 py-3 rounded-2xl border border-gray-200 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none bg-white font-medium"
                                        >
                                            <option value="">Select Department/Field</option>
                                            {FACULTIES.map(faculty => (
                                                <optgroup key={faculty.name} label={faculty.name}>
                                                    {faculty.departments.map(dept => (
                                                        <option key={dept} value={dept}>{dept}</option>
                                                    ))}
                                                </optgroup>
                                            ))}
                                        </select>
                                    ) : (
                                        <input
                                            type="text"
                                            name="field"
                                            required
                                            value={formData.field}
                                            onChange={handleChange}
                                            className="w-full px-5 py-3 rounded-2xl border border-gray-200 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                                        />
                                    )}
                                </div>

                                {formData.role === 'expert' && (
                                    <div>
                                        <label className="block text-sm font-bold text-text-secondary mb-1.5 ml-1">Personal Email</label>
                                        <input
                                            type="email"
                                            name="realEmail"
                                            required
                                            value={formData.realEmail}
                                            onChange={handleChange}
                                            className={`w-full px-5 py-3 rounded-2xl border ${fieldErrors.realEmail ? 'border-red-500' : 'border-gray-200'} focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none`}
                                        />
                                        {fieldErrors.realEmail && <p className="text-red-500 text-[10px] mt-1 ml-1 font-bold">{fieldErrors.realEmail}</p>}
                                    </div>
                                )}

                                {formData.role === 'student' && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-text-secondary mb-1.5 ml-1">Academic Year</label>
                                            <select
                                                name="year"
                                                value={formData.academicInfo.year}
                                                onChange={handleChange}
                                                className="w-full px-5 py-3 rounded-2xl border border-gray-200 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none bg-white font-medium"
                                            >
                                                {[1, 2, 3, 4].map(y => (
                                                    <option key={y} value={y}>Year {y}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-text-secondary mb-1.5 ml-1">Semester</label>
                                            <select
                                                name="semester"
                                                value={formData.academicInfo.semester}
                                                onChange={handleChange}
                                                className="w-full px-5 py-3 rounded-2xl border border-gray-200 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none bg-white font-medium"
                                            >
                                                {[1, 2].map(s => (
                                                    <option key={s} value={s}>Semester {s}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                )}

                                <div className="pt-4">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full bg-primary hover:bg-primary-dark text-white py-4 rounded-2xl font-bold shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        {loading ? 'Updating...' : 'Save Changes'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default EditUserModal;
