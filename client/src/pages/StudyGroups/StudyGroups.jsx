// pages/StudyGroups/StudyGroups.jsx
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import CreateGroupModal from '../../components/StudyGroups/CreateStudyGroups';
import GroupCard from '../../components/StudyGroups/GroupCard';
import PendingRequestsModal from '../../components/StudyGroups/PendingRequest';

const StudyGroups = () => {
  const [myGroups, setMyGroups] = useState([]);
  const [availableGroups, setAvailableGroups] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFaculty, setSelectedFaculty] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('all');
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const [activeTab, setActiveTab] = useState('myGroups');
  const searchInputRef = useRef(null);
  const navigate = useNavigate();

  const Faculties = [
    'all', 'Computing', 'Engineering', 'Humanities and Sciences', 'Business', 
    'Architecture', 'Other'
  ];

  const AcademicYears = [
    'all', 'Year 1', 'Year 2', 'Year 3', 'Year 4'
  ];

  // Fetch data whenever filters change
  useEffect(() => {
    fetchData();
  }, [selectedFaculty, selectedType, selectedAcademicYear, searchQuery]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      console.log('\n=== 🔍 FETCHING STUDY GROUPS ===');
      console.log('Token exists:', !!token);
      
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      
      // Try public endpoint first to see if groups exist
      try {
        const publicRes = await axios.get('/api/study-groups/public/all');
        console.log('✅ Public endpoint - Groups in DB:', publicRes.data.count);
        if (publicRes.data.groups && publicRes.data.groups.length > 0) {
          console.log('Sample group:', publicRes.data.groups[0]);
        }
      } catch (err) {
        console.log('⚠️ Public endpoint not available:', err.message);
      }
      
      // If no token, show message but don't fetch authenticated data
      if (!token) {
        console.log('❌ No authentication token found');
        toast.error('Please login to view study groups');
        setLoading(false);
        return;
      }

      const params = new URLSearchParams();
      if (selectedFaculty !== 'all') params.append('faculty', selectedFaculty);
      if (selectedType !== 'all') params.append('type', selectedType);
      if (selectedAcademicYear !== 'all') params.append('academicYear', selectedAcademicYear);
      if (searchQuery.trim() !== '') params.append('search', searchQuery);

      const url = `/api/study-groups${params.toString() ? '?' + params.toString() : ''}`;
      console.log('\n📡 Fetching from:', url);

      const [myGroupsRes, availableRes, pendingRes] = await Promise.all([
        axios.get('/api/study-groups/my-groups', config),
        axios.get(url, config),
        axios.get('/api/study-groups/pending-requests', config)
      ]);

      console.log('\n📊 API Responses:');
      console.log('My groups:', myGroupsRes.data.length);
      console.log('Available groups:', availableRes.data.length);
      console.log('Pending requests:', pendingRes.data.length);
      
      if (availableRes.data.length > 0) {
        console.log('Sample available group:', availableRes.data[0]);
      }

      setMyGroups(myGroupsRes.data);
      setAvailableGroups(availableRes.data);
      setPendingRequests(pendingRes.data);
      
    } catch (error) {
      console.error('\n❌ Fetch error details:', error);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
        
        if (error.response.status === 401) {
          toast.error('Session expired. Please login again.');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
        } else {
          toast.error(error.response.data?.message || 'Failed to fetch study groups');
        }
      } else if (error.request) {
        console.error('No response received:', error.request);
        toast.error('Cannot connect to server. Please check if backend is running.');
      } else {
        console.error('Error:', error.message);
        toast.error('Failed to fetch study groups');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    console.log('🔍 Searching for:', searchInput);
    setSearchQuery(searchInput);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleFilterChange = (filterType, value) => {
    console.log('🎯 Filter changed:', filterType, value);
    switch(filterType) {
      case 'faculty':
        setSelectedFaculty(value);
        break;
      case 'type':
        setSelectedType(value);
        break;
      case 'academicYear':
        setSelectedAcademicYear(value);
        break;
      default:
        break;
    }
  };

  const handleJoinGroup = async (groupId, groupType) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login to join groups');
        navigate('/login');
        return;
      }
      
      const config = { headers: { Authorization: `Bearer ${token}` } };

      await axios.post(`/api/study-groups/${groupId}/request`, {}, config);
      
      if (groupType === 'open') {
        toast.success('Successfully joined the group!');
      } else {
        toast.success('Join request sent to group owner');
      }
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to join group');
    }
  };

  const handleLeaveGroup = async (groupId) => {
    if (!window.confirm('Are you sure you want to leave this group?')) return;

    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      await axios.delete(`/api/study-groups/${groupId}/leave`, config);
      toast.success('Left the group successfully');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to leave group');
    }
  };

  const handleDeleteGroup = async (groupId) => {
    if (!window.confirm('Are you sure you want to delete this group? This action cannot be undone.')) return;

    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      await axios.delete(`/api/study-groups/${groupId}`, config);
      toast.success('Group deleted successfully');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete group');
    }
  };

  const resetFilters = () => {
    console.log('🔄 Resetting all filters');
    setSelectedFaculty('all');
    setSelectedType('all');
    setSelectedAcademicYear('all');
    setSearchInput('');
    setSearchQuery('');
    setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, 100);
  };

  const hasActiveFilters = () => {
    return selectedFaculty !== 'all' || 
           selectedType !== 'all' || 
           selectedAcademicYear !== 'all' || 
           searchQuery !== '';
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (selectedFaculty !== 'all') count++;
    if (selectedType !== 'all') count++;
    if (selectedAcademicYear !== 'all') count++;
    if (searchQuery !== '') count++;
    return count;
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
            <h1 className="text-4xl font-bold text-primary font-heading">Study Groups</h1>
            <p className="text-text-secondary mt-2">Connect, collaborate, and learn together</p>
          </div>
          <div className="flex gap-3">
            {pendingRequests.length > 0 && (
              <button
                onClick={() => setShowRequestsModal(true)}
                className="relative bg-yellow-100 text-yellow-700 px-4 py-2 rounded-lg hover:bg-yellow-200 transition-all"
              >
                Pending Requests
                {pendingRequests.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {pendingRequests.length}
                  </span>
                )}
              </button>
            )}
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-lg font-semibold transition-all transform hover:-translate-y-0.5 shadow-md"
            >
              + Create Group
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('myGroups')}
            className={`pb-3 px-4 font-semibold transition-all ${
              activeTab === 'myGroups'
                ? 'text-primary border-b-2 border-primary'
                : 'text-text-secondary hover:text-primary'
            }`}
          >
            My Groups ({myGroups.length}/10)
          </button>
          <button
            onClick={() => setActiveTab('available')}
            className={`pb-3 px-4 font-semibold transition-all ${
              activeTab === 'available'
                ? 'text-primary border-b-2 border-primary'
                : 'text-text-secondary hover:text-primary'
            }`}
          >
            Available Groups ({availableGroups.length})
          </button>
        </div>

        {/* Search Bar with Button */}
        <div className="mb-6">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search groups by name or description..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full px-4 py-3 pl-12 rounded-lg border border-gray-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
              />
              <svg
                className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <button
              onClick={handleSearch}
              className="px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg"
            >
              Search
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-4">
          <select
            value={selectedFaculty}
            onChange={(e) => handleFilterChange('faculty', e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-200 focus:border-primary focus:outline-none"
          >
            {Faculties.map(faculty => (
              <option key={faculty} value={faculty}>
                {faculty === 'all' ? 'All Faculties' : faculty}
              </option>
            ))}
          </select>

          <select
            value={selectedAcademicYear}
            onChange={(e) => handleFilterChange('academicYear', e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-200 focus:border-primary focus:outline-none"
          >
            {AcademicYears.map(year => (
              <option key={year} value={year}>
                {year === 'all' ? 'All Academic Years' : year}
              </option>
            ))}
          </select>

          <select
            value={selectedType}
            onChange={(e) => handleFilterChange('type', e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-200 focus:border-primary focus:outline-none"
          >
            <option value="all">All Types</option>
            <option value="open">Open Groups</option>
            <option value="private">Private Groups</option>
          </select>

          {hasActiveFilters() && (
            <button
              onClick={resetFilters}
              className="px-4 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-all"
            >
              Clear All Filters ({getActiveFiltersCount()})
            </button>
          )}
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters() && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm font-semibold text-text-secondary">Active filters:</span>
              {selectedFaculty !== 'all' && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs flex items-center gap-1">
                  Faculty: {selectedFaculty}
                  <button onClick={() => setSelectedFaculty('all')} className="ml-1 hover:text-blue-900">×</button>
                </span>
              )}
              {selectedAcademicYear !== 'all' && (
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs flex items-center gap-1">
                  Year: {selectedAcademicYear}
                  <button onClick={() => setSelectedAcademicYear('all')} className="ml-1 hover:text-green-900">×</button>
                </span>
              )}
              {selectedType !== 'all' && (
                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-md text-xs flex items-center gap-1">
                  Type: {selectedType}
                  <button onClick={() => setSelectedType('all')} className="ml-1 hover:text-purple-900">×</button>
                </span>
              )}
              {searchQuery && (
                <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs flex items-center gap-1">
                  Search: "{searchQuery}"
                  <button onClick={() => {
                    setSearchInput('');
                    setSearchQuery('');
                  }} className="ml-1 hover:text-gray-900">×</button>
                </span>
              )}
            </div>
          </div>
        )}
      </motion.div>

      {/* Groups Grid */}
      <AnimatePresence>
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {activeTab === 'myGroups' ? (
            myGroups.length > 0 ? (
              myGroups.map(group => (
                <GroupCard
                  key={group._id}
                  group={group}
                  isMember={true}
                  isOwner={group.isOwner}
                  onLeave={() => handleLeaveGroup(group._id)}
                  onDelete={() => handleDeleteGroup(group._id)}
                  onClick={() => navigate(`/study-groups/${group._id}`)}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                {hasActiveFilters() ? (
                  <>
                    <div className="text-6xl mb-4">🔍</div>
                    <p className="text-text-secondary text-lg mb-2 font-semibold">
                      No matching groups found
                    </p>
                    <p className="text-text-secondary text-sm mb-4">
                      We couldn't find any groups matching your search criteria.
                    </p>
                    <button
                      onClick={resetFilters}
                      className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-all"
                    >
                      Clear All Filters
                    </button>
                  </>
                ) : (
                  <>
                    <div className="text-6xl mb-4">📚</div>
                    <p className="text-text-secondary text-lg mb-2">
                      You haven't joined any study groups yet.
                    </p>
                    <button
                      onClick={() => setActiveTab('available')}
                      className="mt-2 text-primary font-semibold hover:underline"
                    >
                      Browse available groups →
                    </button>
                  </>
                )}
              </div>
            )
          ) : (
            availableGroups.length > 0 ? (
              availableGroups.map(group => (
                <GroupCard
                  key={group._id}
                  group={group}
                  isMember={group.userStatus === 'approved'}
                  hasPendingRequest={group.userStatus === 'pending'}
                  onJoin={() => handleJoinGroup(group._id, group.type)}
                  onClick={() => navigate(`/study-groups/${group._id}`)}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                {hasActiveFilters() ? (
                  <>
                    <div className="text-6xl mb-4">🔍</div>
                    <p className="text-text-secondary text-lg mb-2 font-semibold">
                      No matching groups found
                    </p>
                    <p className="text-text-secondary text-sm mb-4">
                      We couldn't find any groups matching your search criteria.
                    </p>
                    <button
                      onClick={resetFilters}
                      className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-all"
                    >
                      Clear All Filters
                    </button>
                  </>
                ) : (
                  <>
                    <div className="text-6xl mb-4">🎓</div>
                    <p className="text-text-secondary text-lg mb-2">
                      No study groups available yet.
                    </p>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="mt-2 text-primary font-semibold hover:underline"
                    >
                      Create the first study group →
                    </button>
                  </>
                )}
              </div>
            )
          )}
        </motion.div>
      </AnimatePresence>

      {/* Modals */}
      <CreateGroupModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false);
          fetchData();
        }}
      />
      
      <PendingRequestsModal
        isOpen={showRequestsModal}
        onClose={() => setShowRequestsModal(false)}
        requests={pendingRequests}
        onUpdate={() => {
          setShowRequestsModal(false);
          fetchData();
        }}
      />
    </div>
  );
};

export default StudyGroups;