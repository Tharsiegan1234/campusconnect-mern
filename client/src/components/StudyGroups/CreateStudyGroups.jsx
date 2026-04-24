// components/StudyGroups/CreateStudyGroups.jsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const CreateGroupModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'open',
    faculty: 'Computing',  // Changed from category to faculty
    academicYear: 'Year 1',
    participantLimit: 20
  });
  const [loading, setLoading] = useState(false);

  const faculties = [
    'Computing', 'Engineering', 'Humanities and Sciences', 'Business', 
    'Architecture', 'Other'
  ];

  const academicYears = ['Year 1', 'Year 2', 'Year 3', 'Year 4'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      await axios.post('/api/study-groups', formData, config);
      toast.success('Study group created successfully!');
      onSuccess();
      onClose();
      setFormData({
        name: '',
        description: '',
        type: 'open',
        faculty: 'Computing',
        academicYear: 'Year 1',
        participantLimit: 20
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create group');
      console.error('Create group error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-xl z-50 w-full max-w-md p-6"
          >
            <h2 className="text-2xl font-bold text-primary mb-4">Create Study Group</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-text-secondary text-sm font-bold mb-2">Group Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  maxLength={100}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-primary focus:outline-none"
                  placeholder="e.g., JavaScript Study Group"
                />
              </div>

              <div>
                <label className="block text-text-secondary text-sm font-bold mb-2">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-primary focus:outline-none"
                  placeholder="Describe what your group is about..."
                />
              </div>

              <div>
                <label className="block text-text-secondary text-sm font-bold mb-2">Faculty</label>
                <select
                  name="faculty"
                  value={formData.faculty}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-primary focus:outline-none"
                >
                  {faculties.map(faculty => (
                    <option key={faculty} value={faculty}>{faculty}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-text-secondary text-sm font-bold mb-2">Academic Year</label>
                <select
                  name="academicYear"
                  value={formData.academicYear}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-primary focus:outline-none"
                >
                  {academicYears.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-text-secondary text-sm font-bold mb-2">Group Type</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="type"
                      value="open"
                      checked={formData.type === 'open'}
                      onChange={handleChange}
                      className="text-primary"
                    />
                    <span>Open Group</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="type"
                      value="private"
                      checked={formData.type === 'private'}
                      onChange={handleChange}
                      className="text-primary"
                    />
                    <span>Private Group</span>
                  </label>
                </div>
              </div>

              {formData.type === 'private' && (
                <div>
                  <label className="block text-text-secondary text-sm font-bold mb-2">
                    Participant Limit
                  </label>
                  <input
                    type="number"
                    name="participantLimit"
                    value={formData.participantLimit}
                    onChange={handleChange}
                    min={2}
                    max={100}
                    required
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-primary focus:outline-none"
                  />
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg font-semibold transition-all disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Group'}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CreateGroupModal;