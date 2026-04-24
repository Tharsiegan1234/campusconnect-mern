// pages/Workshops/Workshops.jsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import WorkshopCard from '../../components/Workshops/WorkshopCard';
import CreateWorkshopModal from '../../components/Workshops/CreateWorkshopModal';
import RequestWorkshopModal from '../../components/Workshops/RequestWorkshopModal';
import BatchRepRequests from '../../components/Workshops/BatchRepRequests';


const Workshops = () => {
  const [workshops, setWorkshops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedFaculty, setSelectedFaculty] = useState('all');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [user, setUser] = useState(null);

  const categories = ['all', 'Technical', 'Soft Skills', 'Career Development', 'Research', 'Other'];
  const workshopTypes = ['all', 'upcoming', 'ongoing', 'ended'];
  const faculties = ['all', 'Computing', 'Engineering', 'Humanities and Sciences', 'Business', 'Architecture', 'Other'];
  const academicYears = [
    'all',
    'Year 1 Sem 1', 'Year 1 Sem 2',
    'Year 2 Sem 1', 'Year 2 Sem 2',
    'Year 3 Sem 1', 'Year 3 Sem 2',
    'Year 4 Sem 1', 'Year 4 Sem 2'
  ];

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    setUser(userData);
    fetchWorkshops();
  }, [selectedType, selectedCategory, selectedFaculty, selectedAcademicYear, searchQuery]);

  const fetchWorkshops = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const params = new URLSearchParams();
      if (selectedType !== 'all') params.append('type', selectedType);
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (selectedFaculty !== 'all') params.append('faculty', selectedFaculty);
      if (selectedAcademicYear !== 'all') params.append('academicYear', selectedAcademicYear);
      if (searchQuery.trim() !== '') params.append('search', searchQuery);

      const response = await axios.get(`/api/workshops?${params.toString()}`, config);
      setWorkshops(response.data);
    } catch (error) {
      toast.error('Failed to fetch workshops');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (workshopId) => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const response = await axios.post(`/api/workshops/${workshopId}/register`, {}, config);
      toast.success(response.data.message);
      fetchWorkshops();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to register');
    }
  };

  const handleCancelRegistration = async (workshopId) => {
    if (!window.confirm('Are you sure you want to cancel your registration?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      await axios.delete(`/api/workshops/${workshopId}/cancel`, config);
      toast.success('Registration cancelled successfully');
      fetchWorkshops();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel registration');
    }
  };

  const canCreateWorkshop = () => {
    if (!user) return false;
    const isBatchRep = user.isBatchRep === true;
    const isLecturer = user.email && user.email.match(/^ept\d{3}@sliitplatform\.com$/);
    return isBatchRep || isLecturer || user.role === 'admin';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-4xl font-bold text-primary font-heading">Workshops</h1>
            <p className="text-text-secondary mt-2">
              Enhance your skills with expert-led workshops and sessions
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowRequestModal(true)}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-semibold transition-all"
            >
              Request Workshop
            </button>
            {canCreateWorkshop() && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-lg font-semibold transition-all"
              >
                + Create Workshop
              </button>
            )}
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search workshops by title or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 pl-12 rounded-lg border border-gray-200 focus:border-primary focus:outline-none"
            />
            <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-200"
          >
            {workshopTypes.map(type => (
              <option key={type} value={type}>
                {type === 'all' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-200"
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat === 'all' ? 'All Categories' : cat}
              </option>
            ))}
          </select>

          <select
            value={selectedFaculty}
            onChange={(e) => setSelectedFaculty(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-200"
          >
            {faculties.map(f => (
              <option key={f} value={f}>
                {f === 'all' ? 'All Faculties' : f}
              </option>
            ))}
          </select>

          <select
            value={selectedAcademicYear}
            onChange={(e) => setSelectedAcademicYear(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-200"
          >
            {academicYears.map(year => (
              <option key={year} value={year}>
                {year === 'all' ? 'All Academic Years' : year}
              </option>
            ))}
          </select>
        </div>
      </motion.div>

      {/* Workshops Grid */}
      <AnimatePresence>
        <motion.div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workshops.length > 0 ? (
            workshops.map(workshop => (
              <WorkshopCard
                key={workshop._id}
                workshop={workshop}
                user={user}
                onRegister={handleRegister}
                onCancel={handleCancelRegistration}
                onRefresh={fetchWorkshops}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <div className="text-6xl mb-4">🎓</div>
              <p className="text-text-secondary text-lg mb-2">No workshops found</p>
              {canCreateWorkshop() && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-4 text-primary font-semibold hover:underline"
                >
                  Create the first workshop →
                </button>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Modals */}
      <CreateWorkshopModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={fetchWorkshops}
      />

      <RequestWorkshopModal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        onSuccess={fetchWorkshops}
      />
    </div>
  );
};

export default Workshops;