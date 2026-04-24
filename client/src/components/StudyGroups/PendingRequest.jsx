// components/PendingRequestsModal.jsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const PendingRequestsModal = ({ isOpen, onClose, requests, onUpdate }) => {
  const [processingId, setProcessingId] = useState(null);

  const handleRequest = async (groupId, userId, action) => {
    setProcessingId(userId);
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      await axios.put(
        `/api/study-groups/${groupId}/handle-request/${userId}`,
        { action },
        config
      );

      toast.success(`Request ${action}ed successfully`);
      onUpdate();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to process request');
    } finally {
      setProcessingId(null);
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
            <h2 className="text-2xl font-bold text-primary mb-4">Pending Join Requests</h2>
            
            {requests.length === 0 ? (
              <p className="text-text-secondary text-center py-8">No pending requests</p>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {requests.map((request) => (
                  <div
                    key={`${request.groupId}-${request.userId}`}
                    className="flex items-center justify-between p-4 border border-gray-100 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={request.userAvatar || '/avatars/avatar1.png'}
                        alt={request.userName}
                        className="w-10 h-10 rounded-full"
                      />
                      <div>
                        <p className="font-semibold text-gray-800">{request.userName}</p>
                        <p className="text-sm text-text-secondary">
                          wants to join <span className="font-medium">{request.groupName}</span>
                        </p>
                        <p className="text-xs text-text-secondary">
                          Requested: {new Date(request.requestedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRequest(request.groupId, request.userId, 'approve')}
                        disabled={processingId === request.userId}
                        className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm font-semibold transition-all disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleRequest(request.groupId, request.userId, 'reject')}
                        disabled={processingId === request.userId}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm font-semibold transition-all disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="mt-6">
              <button
                onClick={onClose}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold transition-all"
              >
                Close
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default PendingRequestsModal;