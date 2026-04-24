// components/Workshops/CreateWorkshopModal.jsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const CreateWorkshopModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Technical',
    date: '',
    time: '',
    duration: 60,
    location: '',
    capacity: 50,
    academicYear: 'Year 1 Sem 1',
    faculty: 'Computing'
  });
  const [loading, setLoading] = useState(false);

  const categories = ['Technical', 'Soft Skills', 'Career Development', 'Research', 'Other'];
  
  const faculties = ['Computing', 'Engineering', 'Humanities and Sciences', 'Business', 'Architecture', 'Other'];
  
  const academicYears = [
    'Year 1 Sem 1', 'Year 1 Sem 2',
    'Year 2 Sem 1', 'Year 2 Sem 2',
    'Year 3 Sem 1', 'Year 3 Sem 2',
    'Year 4 Sem 1', 'Year 4 Sem 2'
  ];

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

      const workshopData = {
        ...formData,
        date: new Date(`${formData.date}T${formData.time}`)
      };

      await axios.post('/api/workshops', workshopData, config);
      toast.success('Workshop created successfully!');
      onSuccess();
      onClose();
      setFormData({
        title: '',
        description: '',
        category: 'Technical',
        date: '',
        time: '',
        duration: 60,
        location: '',
        capacity: 50,
        academicYear: 'Year 1 Sem 1',
        faculty: 'Computing'
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create workshop');
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
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-xl z-50 w-full max-w-md p-6 max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-2xl font-bold text-primary mb-4">Create Workshop</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-text-secondary text-sm font-bold mb-2">Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-text-secondary text-sm font-bold mb-2">Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-text-secondary text-sm font-bold mb-2">Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-primary focus:outline-none"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-text-secondary text-sm font-bold mb-2">Faculty *</label>
                <select
                  name="faculty"
                  value={formData.faculty}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-primary focus:outline-none"
                >
                  {faculties.map(f => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-text-secondary text-sm font-bold mb-2">Academic Year *</label>
                <select
                  name="academicYear"
                  value={formData.academicYear}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-primary focus:outline-none"
                >
                  {academicYears.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-text-secondary text-sm font-bold mb-2">Date *</label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    required
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-text-secondary text-sm font-bold mb-2">Time *</label>
                  <input
                    type="time"
                    name="time"
                    value={formData.time}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-text-secondary text-sm font-bold mb-2">Duration (minutes)</label>
                <input
                  type="number"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  required
                  min={15}
                  step={15}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-text-secondary text-sm font-bold mb-2">Location/Meeting Link *</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  required
                  placeholder="Zoom link, Google Meet, or physical location"
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-text-secondary text-sm font-bold mb-2">Capacity</label>
                <input
                  type="number"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleChange}
                  required
                  min={1}
                  max={500}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-primary focus:outline-none"
                />
              </div>

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
                  {loading ? 'Creating...' : 'Create Workshop'}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CreateWorkshopModal;