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

const AddUserModal = ({ isOpen, onClose, onUserAdded, initialRole = 'student' }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        realEmail: '',
        password: '',
        role: initialRole,
        field: '',
        year: 1,
        semester: 1
    });
    const [expertCount, setExpertCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});

    useEffect(() => {
        if (isOpen) {
            console.log('--- Modal Opened --- Initial Role:', initialRole);
            setFormData(prev => ({
                ...prev,
                name: '',
                password: '',
                field: '',
                role: initialRole,
                email: '',
                realEmail: '',
                year: 1,
                semester: 1
            }));
            fetchExpertCount();
        }
    }, [isOpen, initialRole]);

    // Automatically update email when role or expertCount changes
    useEffect(() => {
        if (formData.role === 'expert') {
            const nextId = (expertCount + 1).toString().padStart(3, '0');
            const generated = `ept${nextId}@sliitplatform.com`;
            console.log('--- Auto-generating email ---:', generated);
            setFormData(prev => ({ ...prev, email: generated }));
        } else if (formData.role === 'student' || formData.role === 'admin') {
            // Only clear if it was an auto-generated one
            setFormData(prev => {
                if (prev.email.includes('@sliitplatform.com')) {
                    return { ...prev, email: '' };
                }
                return prev;
            });
        }
    }, [formData.role, expertCount]);

    const fetchExpertCount = async () => {
        console.log('--- Fetching Expert Count ---');
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.warn('--- No token found in localStorage ---');
                return;
            }
            const res = await axios.get('/api/users/expert-count', {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('--- Expert Count Received ---:', res.data.count);
            setExpertCount(res.data.count);
        } catch (err) {
            console.error('--- Failed to fetch expert count ---', err);
            setError('Could not connect to server to generate expert email. Please check your connection.');
        }
    };

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

        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear field error when user starts typing valid content
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

        if (formData.role !== 'expert') {
            if (!emailRegex.test(formData.email)) {
                errors.email = "Invalid login email format";
            }
        }

        if (formData.role === 'expert') {
            if (!emailRegex.test(formData.realEmail)) {
                errors.realEmail = "Invalid personal email format";
            }
        }

        if (formData.password.length < 6) {
            errors.password = "Password must be at least 6 characters long";
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
        console.log('--- Submitting User Data ---', formData);

        try {
            const token = localStorage.getItem('token');
            const res = await axios.post('/api/users/admin-create', formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            onUserAdded(res.data);
            onClose();
            setFormData({ name: '', email: '', realEmail: '', password: '', role: initialRole, field: '', year: 1, semester: 1 });
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create user');
        } finally {
            setLoading(false);
        }
    };

    const roles = [
        { id: 'student', label: 'Student' },
        { id: 'expert', label: 'Expert' },
        { id: 'admin', label: 'Admin' }
    ];

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
                                <h2 className="text-xl font-bold text-text-main capitalize">Add New {formData.role}</h2>
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
                                    <label className="block text-sm font-bold text-text-secondary mb-1.5 ml-1">Account Role</label>
                                    <select
                                        name="role"
                                        value={formData.role}
                                        onChange={handleChange}
                                        className="w-full px-5 py-3 rounded-2xl border border-gray-200 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none bg-white font-medium"
                                    >
                                        {roles.map(role => (
                                            <option key={role.id} value={role.id}>{role.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-text-secondary mb-1.5 ml-1">Full Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        required
                                        value={formData.name}
                                        onChange={handleChange}
                                        className={`w-full px-5 py-3 rounded-2xl border ${fieldErrors.name ? 'border-red-500' : 'border-gray-200'} focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none`}
                                        placeholder={`Enter ${formData.role}'s name`}
                                    />
                                    {fieldErrors.name && <p className="text-red-500 text-[10px] mt-1 ml-1 font-bold">{fieldErrors.name}</p>}
                                </div>

                                {formData.role !== 'expert' ? (
                                    <div>
                                        <label className="block text-sm font-bold text-text-secondary mb-1.5 ml-1">Login Email</label>
                                        <input
                                            type="email"
                                            name="email"
                                            required
                                            value={formData.email}
                                            onChange={handleChange}
                                            className={`w-full px-5 py-3 rounded-2xl border ${fieldErrors.email ? 'border-red-500' : 'border-gray-200'} focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none`}
                                            placeholder="user@my.sliit.lk"
                                        />
                                        {fieldErrors.email && <p className="text-red-500 text-[10px] mt-1 ml-1 font-bold">{fieldErrors.email}</p>}
                                    </div>
                                ) : (
                                    <>
                                        <div>
                                            <label className="block text-sm font-bold text-text-secondary mb-1.5 ml-1 italic">Generated Login Email (Auto)</label>
                                            <input
                                                type="text"
                                                readOnly
                                                value={formData.email || 'Generating expert email...'}
                                                className="w-full px-5 py-3 rounded-2xl border border-gray-100 bg-gray-50 text-gray-400 font-mono text-xs outline-none cursor-not-allowed italic"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-text-secondary mb-1.5 ml-1">Personal Email (Credentials Recipient)</label>
                                            <input
                                                type="email"
                                                name="realEmail"
                                                required
                                                value={formData.realEmail}
                                                onChange={handleChange}
                                                className={`w-full px-5 py-3 rounded-2xl border ${fieldErrors.realEmail ? 'border-red-500' : 'border-gray-200'} focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none`}
                                                placeholder="personal@gmail.com"
                                            />
                                            {fieldErrors.realEmail && <p className="text-red-500 text-[10px] mt-1 ml-1 font-bold">{fieldErrors.realEmail}</p>}
                                            <p className="text-[10px] text-text-secondary mt-1 ml-1 font-medium italic">Credentials will be sent to this personal email.</p>
                                        </div>
                                    </>
                                )}

                                <div>
                                    <label className="block text-sm font-bold text-text-secondary mb-1.5 ml-1">Password</label>
                                    <input
                                        type="password"
                                        name="password"
                                        required
                                        value={formData.password}
                                        onChange={handleChange}
                                        className={`w-full px-5 py-3 rounded-2xl border ${fieldErrors.password ? 'border-red-500' : 'border-gray-200'} focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none`}
                                        placeholder="••••••••"
                                    />
                                    {fieldErrors.password && <p className="text-red-500 text-[10px] mt-1 ml-1 font-bold">{fieldErrors.password}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-text-secondary mb-1.5 ml-1">{formData.role === 'expert' ? 'Field/Expertise' : 'Department/Field'}</label>
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
                                            placeholder="e.g. IT, Software Engineering"
                                        />
                                    )}
                                </div>

                                {formData.role === 'student' && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-text-secondary mb-1.5 ml-1">Academic Year</label>
                                            <select
                                                name="year"
                                                value={formData.year}
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
                                                value={formData.semester}
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
                                        className="w-full bg-primary hover:bg-primary-dark text-white py-4 rounded-2xl font-bold shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                                    >
                                        {loading ? `Creating ${formData.role}...` : `Add ${formData.role}`}
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

export default AddUserModal;
