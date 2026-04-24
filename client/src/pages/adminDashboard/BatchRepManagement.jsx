// client/src/pages/adminDashboard/batchReps/BatchRepManagement.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const BatchRepManagement = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    faculty: 'Computing',
    academicYear: 'Year 1 Sem 1'
  });

  const faculties = ['Computing', 'Engineering', 'Humanities and Sciences', 'Business', 'Architecture', 'Other'];
  const academicYears = [
    'Year 1 Sem 1', 'Year 1 Sem 2',
    'Year 2 Sem 1', 'Year 2 Sem 2',
    'Year 3 Sem 1', 'Year 3 Sem 2',
    'Year 4 Sem 1', 'Year 4 Sem 2'
  ];

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.get('/api/users/all', config);
      // Filter only students
      const studentsList = response.data.filter(user => user.role === 'student');
      setStudents(studentsList);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBatchRep = (student) => {
    setSelectedStudent(student);
    setFormData({
      faculty: student.batchRepDetails?.faculty || 'Computing',
      academicYear: student.batchRepDetails?.academicYear || 'Year 1 Sem 1'
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      // If student is already a batch rep, this will remove them
      // If not, this will add them with the selected faculty/year
      const response = await axios.put(
        `/api/users/toggle-rep/${selectedStudent._id}`,
        {
          faculty: formData.faculty,
          academicYear: formData.academicYear
        },
        config
      );
      
      toast.success(`Student ${response.data.isBatchRep ? 'made' : 'removed as'} batch rep successfully`);
      setShowModal(false);
      fetchStudents();
    } catch (error) {
      console.error('Error toggling batch rep:', error);
      toast.error(error.response?.data?.message || 'Failed to update batch rep status');
    }
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary">Batch Representative Management</h1>
        <p className="text-text-secondary mt-2">Assign or remove batch representatives for each faculty and academic year</p>
      </div>

      <div className="bg-white rounded-2xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Register Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Field</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Faculty</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Academic Year</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {students.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-text-secondary">
                    No students found
                  </td>
                </tr>
              ) : (
                students.map(student => (
                  <tr key={student._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img 
                          src={student.avatar || '/avatars/avatar1.png'} 
                          alt={student.name} 
                          className="w-8 h-8 rounded-full mr-3" 
                        />
                        <span className="font-medium text-gray-900">{student.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{student.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{student.registerNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">{student.field}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        student.isBatchRep ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {student.isBatchRep ? 'Batch Rep' : 'Student'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                      {student.batchRepDetails?.faculty || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-text-secondary">
                      {student.batchRepDetails?.academicYear || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleBatchRep(student)}
                        className={`px-3 py-1 rounded-lg text-sm font-semibold transition-all ${
                          student.isBatchRep
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {student.isBatchRep ? 'Remove Batch Rep' : 'Make Batch Rep'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for selecting faculty and academic year */}
      {showModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-primary mb-4">
              {selectedStudent.isBatchRep ? 'Remove Batch Rep' : 'Make Batch Rep'}
            </h2>
            
            {!selectedStudent.isBatchRep && (
              <>
                <p className="text-text-secondary mb-4">
                  Assign {selectedStudent.name} as batch representative for:
                </p>
                
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-text-secondary text-sm font-bold mb-2">Faculty</label>
                    <select
                      value={formData.faculty}
                      onChange={(e) => setFormData({...formData, faculty: e.target.value})}
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-primary focus:outline-none"
                    >
                      {faculties.map(f => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-text-secondary text-sm font-bold mb-2">Academic Year</label>
                    <select
                      value={formData.academicYear}
                      onChange={(e) => setFormData({...formData, academicYear: e.target.value})}
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-primary focus:outline-none"
                    >
                      {academicYears.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            )}
            
            {selectedStudent.isBatchRep && (
              <p className="text-text-secondary mb-6">
                Are you sure you want to remove {selectedStudent.name} as a batch representative?
                {selectedStudent.batchRepDetails?.faculty && (
                  <span className="block mt-2 text-sm">
                    Currently representing: <strong>{selectedStudent.batchRepDetails.faculty} - {selectedStudent.batchRepDetails.academicYear}</strong>
                  </span>
                )}
              </p>
            )}
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className={`flex-1 ${
                  selectedStudent.isBatchRep
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-green-500 hover:bg-green-600'
                } text-white px-4 py-2 rounded-lg font-semibold transition-all`}
              >
                {selectedStudent.isBatchRep ? 'Remove' : 'Make Batch Rep'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchRepManagement;