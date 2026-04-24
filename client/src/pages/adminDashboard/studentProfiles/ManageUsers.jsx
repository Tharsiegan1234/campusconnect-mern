import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import AddUserModal from './AddUserModal';
import EditUserModal from './EditUserModal';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const ManageUsers = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentUser] = useState(JSON.parse(localStorage.getItem('user')));
    const [activeTab, setActiveTab] = useState('student'); // Default to students
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const tabs = [
        { id: 'admin', label: 'Admins' },
        { id: 'expert', label: 'Experts' },
        { id: 'student', label: 'Students' },
    ];

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const res = await axios.get('/api/users/all', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(res.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!currentUser || currentUser.role !== 'admin') {
            navigate('/login');
            return;
        }
        fetchUsers();
    }, [currentUser, navigate]);

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            try {
                const token = localStorage.getItem('token');
                await axios.delete(`/api/users/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setUsers(users.filter(user => user._id !== id));
            } catch (err) {
                alert(err.response?.data?.message || 'Failed to delete user');
            }
        }
    };

    const handleUserAdded = (newUser) => {
        setUsers([...users, newUser]);
        setActiveTab(newUser.role);
    };

    const handleEdit = (user) => {
        setSelectedUser(user);
        setIsEditModalOpen(true);
    };

    const handleUserUpdated = (updatedUser) => {
        setUsers(users.map(user => user._id === updatedUser._id ? { ...user, ...updatedUser } : user));
    };

    const handleToggleRep = async (user) => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.put(`/api/users/toggle-rep/${user._id}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(users.map(u => u._id === user._id ? { ...u, isBatchRep: res.data.isBatchRep } : u));
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update representative status');
        }
    };

    const handleExportPDF = () => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;

        // --- 1. Header Section ---
        doc.setFillColor(37, 99, 235); // Primary Blue
        doc.rect(0, 0, pageWidth, 40, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text("CampusConnect", 14, 25);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text("Official Platform Management Report", 14, 32);

        doc.setTextColor(255, 255, 255);
        doc.text(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, pageWidth - 70, 25);

        // --- 2. Report Details ---
        doc.setTextColor(100, 116, 139); // Gray-500
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(`${activeTab.toUpperCase()} DIRECTORY`, 14, 55);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Total Records: ${filteredUsers.length}`, 14, 62);

        if (searchTerm) {
            doc.text(`Filter Active: "${searchTerm}"`, 14, 67);
        }

        // --- 3. Table Data ---
        const tableColumn = ["#", "Full Name", "Login Email", "Personal Email", " Expertise/Field"];
        if (activeTab === 'student') {
            tableColumn.splice(4, 0, "Year & Sem");
        }
        const tableRows = filteredUsers.map((user, index) => {
            const row = [
                index + 1,
                user.name,
                user.email,
                user.realEmail || 'N/A'
            ];

            if (activeTab === 'student') {
                row.push(user.academicInfo ? `Y${user.academicInfo.year}S${user.academicInfo.semester}` : 'N/A');
            }

            row.push(user.field || 'General');
            return row;
        });

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 75,
            theme: 'grid',
            headStyles: {
                fillColor: [37, 99, 235],
                textColor: [255, 255, 255],
                fontSize: 10,
                fontStyle: 'bold',
                halign: 'center'
            },
            columnStyles: {
                0: { cellWidth: 10, halign: 'center' },
                1: { cellWidth: 40 },
                2: { cellWidth: 50 },
                3: { cellWidth: 50 },
                4: { cellWidth: 35 }
            },
            styles: {
                fontSize: 9,
                cellPadding: 4
            },
            alternateRowStyles: {
                fillColor: [248, 250, 252]
            },
            margin: { top: 75 },
            didDrawPage: (data) => {
                // Footer
                const str = "Page " + doc.internal.getNumberOfPages();
                doc.setFontSize(8);
                doc.setTextColor(150);
                doc.text(str, pageWidth / 2, doc.internal.pageSize.height - 10, { align: 'center' });
                doc.text("© 2026 CampusConnect Platform - Internal Use Only", 14, doc.internal.pageSize.height - 10);
            }
        });

        doc.save(`CampusConnect_${activeTab}_Report_${Date.now()}.pdf`);
    };

    const filteredUsers = users.filter(user => {
        const matchesRole = user.role === activeTab;
        const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesRole && matchesSearch;
    });

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
            <div className="font-bold text-primary animate-pulse">Loading Management Data...</div>
        </div>
    );

    return (
        <div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div>
                    <h1 className="text-4xl font-black text-text-main font-heading tracking-tight mb-2">User Management</h1>
                    <p className="text-text-secondary text-sm font-medium">Manage and monitor all platform members by their specialized roles</p>
                </div>
                <div className="flex items-center gap-4">
                    {error && <span className="text-error text-sm font-bold bg-red-50 px-4 py-2 rounded-xl border border-red-100 italic">{error}</span>}
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-primary hover:bg-primary-dark text-white px-5 py-1 rounded-xl text-sm font-bold shadow-xl shadow-primary/20 transition-all active:scale-95 flex items-center gap-2 group"
                    >
                        <span className="text-xl group-hover:rotate-90 transition-transform">+</span>
                        Add New {activeTab}
                    </button>
                </div>
            </div>

            {/* Filters and Actions */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
                {/* Tabs */}
                <div className="flex gap-2 bg-gray-100/50 p-1.5 rounded-[22px] w-fit">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => {
                                setActiveTab(tab.id);
                                setSearchTerm('');
                            }}
                            className={`px-8 py-2.5 rounded-[18px] text-sm font-bold transition-all ${activeTab === tab.id
                                ? 'bg-white text-primary shadow-sm ring-1 ring-black/5'
                                : 'text-text-secondary hover:text-text-main hover:bg-gray-100'
                                }`}
                        >
                            {tab.label}
                            <span className={`ml-2 px-2 py-0.5 rounded-lg text-[10px] ${activeTab === tab.id ? 'bg-primary/10 text-primary' : 'bg-gray-200 text-gray-500'}`}>
                                {users.filter(u => u.role === tab.id).length}
                            </span>
                        </button>
                    ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-4 items-center">
                    {/* Search Bar */}
                    <div className="relative w-full sm:w-80">
                        <input
                            type="text"
                            placeholder={`Search ${activeTab}s...`}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-6 py-2 bg-white rounded-2xl border border-gray-100 shadow-sm focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none font-medium"
                        />
                        <svg className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>

                    {/* Export Button */}
                    <button
                        onClick={handleExportPDF}
                        disabled={filteredUsers.length === 0}
                        className="bg-white border border-gray-100 text-text-main hover:bg-gray-50 px-6 py-2 rounded-2xl font-bold transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
                    >
                        <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Export PDF
                    </button>
                </div>
            </div>

            <motion.div
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[32px] shadow-2xl shadow-gray-200/50 overflow-hidden border border-gray-100"
            >
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50 border-b border-gray-100">
                            <tr>
                                <th className="px-8 py-5 text-xs font-black text-text-secondary uppercase tracking-widest">User Details</th>
                                <th className="px-8 py-5 text-xs font-black text-text-secondary uppercase tracking-widest">Login Email</th>
                                {activeTab === 'expert' && (
                                    <th className="px-8 py-5 text-xs font-black text-text-secondary uppercase tracking-widest italic text-primary/70">Personal Email</th>
                                )}
                                {activeTab === 'student' && (
                                    <th className="px-8 py-5 text-xs font-black text-text-secondary uppercase tracking-widest">Year & Sem</th>
                                )}
                                <th className="px-8 py-5 text-xs font-black text-text-secondary uppercase tracking-widest">Role Type</th>
                                <th className="px-8 py-5 text-xs font-black text-text-secondary uppercase tracking-widest">Management</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            <AnimatePresence mode='popLayout'>
                                {filteredUsers.map((user) => (
                                    <motion.tr
                                        layout
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        key={user._id}
                                        className="hover:bg-gray-50/80 transition-colors group"
                                    >
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${user.role === 'admin' ? 'bg-red-100 text-error' :
                                                    user.role === 'expert' ? 'bg-green-100 text-green-600' :
                                                        'bg-primary/10 text-primary'
                                                    }`}>
                                                    {user.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-text-main flex items-center gap-2">
                                                        {user.name}
                                                        {user._id === currentUser._id && (
                                                            <span className="text-[9px] bg-primary text-white font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">YOU</span>
                                                        )}
                                                    </div>
                                                    <div className="text-[11px] text-text-secondary font-semibold uppercase tracking-wider">{user.field || 'General'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-sm font-medium text-text-secondary">{user.email}</td>
                                        {activeTab === 'expert' && (
                                            <td className="px-8 py-5 text-sm font-bold text-primary/60 italic">{user.realEmail || '—'}</td>
                                        )}
                                        {activeTab === 'student' && (
                                            <td className="px-8 py-5 text-sm font-bold text-text-main">
                                                {user.academicInfo ? `Y${user.academicInfo.year}S${user.academicInfo.semester}` : '—'}
                                            </td>
                                        )}
                                        <td className="px-8 py-5">
                                            <span className={`inline-block whitespace-nowrap px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${user.role === 'admin' ? 'bg-red-50 text-error ring-1 ring-red-100' :
                                                user.role === 'expert' ? 'bg-green-50 text-green-600 ring-1 ring-green-100' :
                                                    user.isBatchRep ? 'bg-orange-50 text-orange-600 ring-1 ring-orange-100' :
                                                    'bg-primary/5 text-primary ring-1 ring-primary/10'
                                                }`}>
                                                {user.isBatchRep ? 'Batch Rep' : user.role}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex gap-4 opacity-0 group-hover:opacity-100 transition-opacity text-sm items-center">
                                                {user.role === 'student' && (
                                                    <button
                                                        onClick={() => handleToggleRep(user)}
                                                        className={`whitespace-nowrap ${user.isBatchRep ? 'text-orange-500 hover:text-orange-600' : 'text-blue-500 hover:text-blue-600'} font-bold uppercase tracking-wider transition-colors`}
                                                    >
                                                        {user.isBatchRep ? 'Remove Rep' : 'Make Rep'}
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleEdit(user)}
                                                    className="text-primary hover:text-primary-dark font-bold uppercase tracking-wider transition-colors"
                                                >
                                                    Edit
                                                </button>
                                                {user.role !== 'admin' && (
                                                    <button
                                                        onClick={() => handleDelete(user._id)}
                                                        className="text-error/60 hover:text-error font-bold uppercase tracking-wider transition-colors"
                                                    >
                                                        Remove
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                            {filteredUsers.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="px-8 py-20 text-center">
                                        <div className="text-gray-300 mb-4">
                                            <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                            </svg>
                                        </div>
                                        <p className="text-text-secondary font-bold text-lg">No {activeTab}s found in this department</p>
                                        <p className="text-text-secondary/60 text-sm mt-1">Try adding a new {activeTab} manually above</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </motion.div>

            <AddUserModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onUserAdded={handleUserAdded}
                initialRole={activeTab}
            />

            <EditUserModal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setSelectedUser(null);
                }}
                user={selectedUser}
                onUserUpdated={handleUserUpdated}
            />
        </div>
    );
};

export default ManageUsers;
