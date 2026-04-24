import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Calendar = ({ freeDates = [] }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthName = currentDate.toLocaleString('default', { month: 'long' });

    const totalDays = daysInMonth(year, month);
    const startDay = firstDayOfMonth(year, month);

    const days = [];
    // Add empty slots for the first week
    for (let i = 0; i < startDay; i++) {
        days.push(null);
    }
    // Add actual days
    for (let i = 1; i <= totalDays; i++) {
        days.push(i);
    }

    const isToday = (day) => {
        const today = new Date();
        return today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
    };

    const isFreeDate = (day) => {
        if (!day) return false;
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        // Simple heuristic: weekends are free
        const dayOfWeek = new Date(year, month, day).getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        
        return isWeekend || freeDates.includes(dateStr);
    };

    return (
        <div className="bg-primary-dark/40 backdrop-blur-md rounded-2xl p-4 border border-white/10 shadow-2xl max-w-sm font-body">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-heading font-semibold text-lg">{monthName} {year}</h3>
                <div className="flex space-x-2">
                    <button onClick={prevMonth} className="p-1 hover:bg-white/10 rounded-full transition-colors text-white">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <button onClick={nextMonth} className="p-1 hover:bg-white/10 rounded-full transition-colors text-white">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                </div>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
                    <span key={d} className="text-primary-light text-xs font-bold">{d}</span>
                ))}
            </div>
            <AnimatePresence mode="wait">
                <motion.div
                    key={`${month}-${year}`}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className="grid grid-cols-7 gap-1"
                >
                    {days.map((day, idx) => (
                        <div
                            key={idx}
                            className={`relative h-8 w-8 flex items-center justify-center text-sm rounded-lg transition-all
                                ${day ? 'cursor-default' : 'invisible'}
                                ${isToday(day) ? 'bg-primary-light text-white font-bold' : 'text-gray-300 hover:bg-white/5'}
                                ${isFreeDate(day) && !isToday(day) ? 'text-accent border border-accent/30' : ''}
                            `}
                        >
                            {day}
                            {isFreeDate(day) && (
                                <motion.span
                                    layoutId="dot"
                                    className="absolute bottom-1 h-1 w-1 bg-accent rounded-full"
                                />
                            )}
                        </div>
                    ))}
                </motion.div>
            </AnimatePresence>
            <div className="mt-4 flex items-center justify-center space-x-4 text-[10px] text-gray-400">
                <div className="flex items-center space-x-1">
                    <div className="h-2 w-2 bg-primary-light rounded-full" />
                    <span>Today</span>
                </div>
                <div className="flex items-center space-x-1">
                    <div className="h-2 w-2 bg-accent rounded-full" />
                    <span>Free Day</span>
                </div>
            </div>
        </div>
    );
};

export default Calendar;
