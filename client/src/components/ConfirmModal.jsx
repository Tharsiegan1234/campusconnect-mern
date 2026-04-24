import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ConfirmModal = ({ show, title, message, type, onConfirm, onCancel }) => {
    if (!show) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="bg-white w-full max-w-sm rounded-[2rem] p-8 shadow-2xl relative overflow-hidden text-center"
                >
                    {/* Visual Indicator */}
                    <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-6 ${
                        ['delete', 'remove', 'ban'].includes(type) 
                        ? 'bg-red-50 text-red-500' 
                        : 'bg-primary/10 text-primary'
                    }`}>
                        {['delete', 'remove', 'ban'].includes(type) ? (
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4h6v3M4 7h16" />
                            </svg>
                        ) : type === 'success' ? (
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        ) : (
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        )}
                    </div>

                    <h2 className="text-2xl font-black text-text-main mb-2 tracking-tight">{title}</h2>
                    <p className="text-text-secondary text-sm font-medium leading-relaxed mb-8">
                        {message}
                    </p>

                    <div className="flex gap-3">
                        <button
                            onClick={onCancel}
                            className="flex-1 py-3.5 bg-gray-50 text-text-secondary font-bold rounded-2xl hover:bg-gray-100 transition-all active:scale-95"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            className={`flex-1 py-3.5 text-white font-bold rounded-2xl shadow-lg transition-all active:scale-95 ${
                                ['delete', 'remove', 'ban'].includes(type)
                                ? 'bg-red-500 shadow-red-500/20 hover:bg-red-600'
                                : 'bg-primary shadow-primary/20 hover:bg-primary-dark'
                            }`}
                        >
                            Confirm
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default ConfirmModal;
