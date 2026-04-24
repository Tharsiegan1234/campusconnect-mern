import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const AssignRepModal = ({ isOpen, onClose, onConfirm, studentName, initialData }) => {
    const [formData, setFormData] = useState({
        faculty: initialData?.faculty || 'Computing',
        academicYear: initialData?.academicYear || 'Year 1 Sem 1'
    });

    const faculties = ['Computing', 'Engineering', 'Humanities and Sciences', 'Business', 'Architecture', 'Other'];
    const academicYears = [
        'Year 1 Sem 1', 'Year 1 Sem 2',
        'Year 2 Sem 1', 'Year 2 Sem 2',
        'Year 3 Sem 1', 'Year 3 Sem 2',
        'Year 4 Sem 1', 'Year 4 Sem 2'
    ];

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />
                
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden border border-gray-100"
                >
                    <div className="p-8">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-2xl font-black text-text-main font-heading tracking-tight">Assign Batch Rep</h2>
                                <p className="text-text-secondary text-sm font-medium mt-1">
                                    Promoting <span className="text-primary font-bold">{studentName}</span>
                                </p>
                            </div>
                            <button 
                                onClick={onClose}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-xs font-black text-text-secondary uppercase tracking-widest mb-2 ml-1">Faculty</label>
                                <select
                                    value={formData.faculty}
                                    onChange={(e) => setFormData({ ...formData, faculty: e.target.value })}
                                    className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none font-bold text-text-main appearance-none"
                                >
                                    {faculties.map(f => (
                                        <option key={f} value={f}>{f}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-black text-text-secondary uppercase tracking-widest mb-2 ml-1">Academic Year</label>
                                <select
                                    value={formData.academicYear}
                                    onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                                    className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none font-bold text-text-main appearance-none"
                                >
                                    {academicYears.map(year => (
                                        <option key={year} value={year}>{year}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-4 mt-10">
                            <button
                                onClick={onClose}
                                className="flex-1 px-6 py-3.5 rounded-2xl font-bold text-text-secondary hover:bg-gray-50 transition-all border border-gray-100"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => onConfirm(formData)}
                                className="flex-1 px-6 py-3.5 bg-primary hover:bg-primary-dark text-white rounded-2xl font-bold shadow-xl shadow-primary/20 transition-all active:scale-95"
                            >
                                Confirm Promotion
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default AssignRepModal;
