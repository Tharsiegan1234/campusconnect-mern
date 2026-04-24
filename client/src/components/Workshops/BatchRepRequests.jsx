// components/Workshops/BatchRepRequests.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const BatchRepRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [approveForm, setApproveForm] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    duration: 60,
    location: '',
    capacity: 50
  });
  const [rejectMessage, setRejectMessage] = useState('');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.get('/api/workshops/requests', config);
      setRequests(response.data);
    } catch (error) {
      toast.error('Failed to fetch requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const workshopData = {
        ...approveForm,
        date: new Date(`${approveForm.date}T${approveForm.time}`)
      };
      
      await axios.put(`/api/workshops/requests/${selectedRequest._id}/approve`, workshopData, config);
      toast.success('Workshop approved and scheduled!');
      setShowApproveModal(false);
      fetchRequests();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve request');
    }
  };

  const handleReject = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      await axios.put(`/api/workshops/requests/${selectedRequest._id}/reject`, 
        { responseMessage: rejectMessage }, 
        config
      );
      toast.success('Workshop request rejected');
      setShowRejectModal(false);
      fetchRequests();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject request');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-primary">Workshop Requests</h2>
      
      {requests.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-text-secondary">No pending workshop requests</p>
        </div>
      ) : (
        requests.map(request => (
          <div key={request._id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-gray-800">{request.topic}</h3>
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs">
                    Pending
                  </span>
                </div>
                <p className="text-text-secondary text-sm mb-3">{request.description}</p>
                <div className="grid grid-cols-2 gap-2 text-sm text-text-secondary mb-3">
                  <div>👤 Requested by: {request.requestedBy?.name}</div>
                  <div>📧 Email: {request.requestedBy?.email}</div>
                  <div>📚 Faculty: {request.faculty}</div>
                  <div>📅 Academic Year: {request.academicYear}</div>
                  <div>🏷️ Category: {request.category}</div>
                  <div>📅 Requested: {new Date(request.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
              <div className="flex gap-2 ml-4">
                <button
                  onClick={() => {
                    setSelectedRequest(request);
                    setApproveForm({
                      title: request.topic,
                      description: request.description,
                      date: '',
                      time: '',
                      duration: 60,
                      location: '',
                      capacity: 50
                    });
                    setShowApproveModal(true);
                  }}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold"
                >
                  Approve & Schedule
                </button>
                <button
                  onClick={() => {
                    setSelectedRequest(request);
                    setRejectMessage('');
                    setShowRejectModal(true);
                  }}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        ))
      )}

      {/* Approve Modal */}
      {showApproveModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-primary mb-4">Schedule Workshop</h2>
            <p className="text-text-secondary mb-4">
              Creating workshop for: <strong>{selectedRequest.topic}</strong>
            </p>
            
            <form onSubmit={(e) => { e.preventDefault(); handleApprove(); }} className="space-y-4">
              <div>
                <label className="block text-text-secondary text-sm font-bold mb-2">Title</label>
                <input
                  type="text"
                  value={approveForm.title}
                  onChange={(e) => setApproveForm({...approveForm, title: e.target.value})}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-gray-200"
                />
              </div>
              
              <div>
                <label className="block text-text-secondary text-sm font-bold mb-2">Description</label>
                <textarea
                  value={approveForm.description}
                  onChange={(e) => setApproveForm({...approveForm, description: e.target.value})}
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-text-secondary text-sm font-bold mb-2">Date</label>
                  <input
                    type="date"
                    value={approveForm.date}
                    onChange={(e) => setApproveForm({...approveForm, date: e.target.value})}
                    required
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2 rounded-lg border border-gray-200"
                  />
                </div>
                <div>
                  <label className="block text-text-secondary text-sm font-bold mb-2">Time</label>
                  <input
                    type="time"
                    value={approveForm.time}
                    onChange={(e) => setApproveForm({...approveForm, time: e.target.value})}
                    required
                    className="w-full px-4 py-2 rounded-lg border border-gray-200"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-text-secondary text-sm font-bold mb-2">Duration (minutes)</label>
                <input
                  type="number"
                  value={approveForm.duration}
                  onChange={(e) => setApproveForm({...approveForm, duration: parseInt(e.target.value)})}
                  required
                  min={15}
                  step={15}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200"
                />
              </div>
              
              <div>
                <label className="block text-text-secondary text-sm font-bold mb-2">Location/Meeting Link</label>
                <input
                  type="text"
                  value={approveForm.location}
                  onChange={(e) => setApproveForm({...approveForm, location: e.target.value})}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-gray-200"
                />
              </div>
              
              <div>
                <label className="block text-text-secondary text-sm font-bold mb-2">Capacity</label>
                <input
                  type="number"
                  value={approveForm.capacity}
                  onChange={(e) => setApproveForm({...approveForm, capacity: parseInt(e.target.value)})}
                  required
                  min={1}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowApproveModal(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-semibold"
                >
                  Schedule Workshop
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-primary mb-4">Reject Workshop Request</h2>
            <p className="text-text-secondary mb-4">
              Rejecting request for: <strong>{selectedRequest.topic}</strong>
            </p>
            
            <div className="mb-4">
              <label className="block text-text-secondary text-sm font-bold mb-2">Reason (Optional)</label>
              <textarea
                value={rejectMessage}
                onChange={(e) => setRejectMessage(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 rounded-lg border border-gray-200"
                placeholder="Provide a reason for rejection..."
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold"
              >
                Reject Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchRepRequests;