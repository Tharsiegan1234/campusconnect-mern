// pages/StudyGroupDetails.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const StudyGroupDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('members');
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    fetchGroupDetails();
  }, [id]);

  const fetchGroupDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const response = await axios.get(`/api/study-groups/${id}`, config);
      setGroup(response.data);
    } catch (error) {
      toast.error('Failed to load group details');
      console.error('Error:', error);
      navigate('/groups');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveGroup = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      await axios.delete(`/api/study-groups/${id}/leave`, config);
      toast.success('Left the group successfully');
      navigate('/groups');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to leave group');
    }
  };

  const handleDeleteGroup = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      await axios.delete(`/api/study-groups/${id}`, config);
      toast.success('Group deleted successfully');
      navigate('/groups');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete group');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="text-center py-20">
        <p className="text-text-secondary">Group not found</p>
        <button onClick={() => navigate('/groups')} className="mt-4 text-primary">
          Back to Groups
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-8"
      >
        <div className="bg-gradient-to-r from-primary to-primary-dark p-6 text-white">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{group.name}</h1>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm">
                  {group.type === 'open' ? '🔓 Open Group' : '🔒 Private Group'}
                </span>
                <span className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm">
                  📚 {group.faculty}
                </span>
                <span className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm">
                  📅 {group.academicYear}
                </span>
              </div>
            </div>
            <div className="flex gap-3">
              {group.isOwner && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-all"
                >
                  Delete Group
                </button>
              )}
              {!group.isOwner && group.userStatus === 'approved' && (
                <button
                  onClick={() => setShowLeaveConfirm(true)}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-all"
                >
                  Leave Group
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-primary mb-2">Description</h2>
            <p className="text-text-secondary">{group.description}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-primary mb-1">{group.memberCount}</div>
              <div className="text-text-secondary text-sm">Total Members</div>
              {group.participantLimit && (
                <div className="text-xs text-text-secondary mt-1">
                  Limit: {group.participantLimit} members
                </div>
              )}
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-primary mb-1">
                {new Date(group.createdAt).toLocaleDateString()}
              </div>
              <div className="text-text-secondary text-sm">Created On</div>
              <div className="text-xs text-text-secondary mt-1">
                by {group.owner?.name}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('members')}
          className={`pb-3 px-4 font-semibold transition-all ${
            activeTab === 'members'
              ? 'text-primary border-b-2 border-primary'
              : 'text-text-secondary hover:text-primary'
          }`}
        >
          Members ({group.memberCount})
        </button>
        <button
          onClick={() => setActiveTab('meetings')}
          className={`pb-3 px-4 font-semibold transition-all ${
            activeTab === 'meetings'
              ? 'text-primary border-b-2 border-primary'
              : 'text-text-secondary hover:text-primary'
          }`}
        >
          Meetings ({group.meetings?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('sessions')}
          className={`pb-3 px-4 font-semibold transition-all ${
            activeTab === 'sessions'
              ? 'text-primary border-b-2 border-primary'
              : 'text-text-secondary hover:text-primary'
          }`}
        >
          Study Sessions ({group.sessions?.length || 0})
        </button>
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="bg-white rounded-2xl shadow-md border border-gray-100 p-6"
      >
        {activeTab === 'members' && (
          <div>
            <h2 className="text-xl font-bold text-primary mb-4">Group Members</h2>
            <div className="grid gap-3">
              {/* Owner */}
              {group.owner && (
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <img
                      src={group.owner.avatar || '/avatars/avatar1.png'}
                      alt={group.owner.name}
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <p className="font-semibold text-gray-800">{group.owner.name}</p>
                      <p className="text-xs text-blue-600">Group Owner</p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Other Members */}
              {group.members
                ?.filter(m => m.status === 'approved' && m.user._id !== group.owner?._id)
                .map(member => (
                  <div key={member.user._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <img
                        src={member.user.avatar || '/avatars/avatar1.png'}
                        alt={member.user.name}
                        className="w-10 h-10 rounded-full"
                      />
                      <div>
                        <p className="font-semibold text-gray-800">{member.user.name}</p>
                        <p className="text-xs text-text-secondary">
                          Joined {new Date(member.joinedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              
              {group.members?.filter(m => m.status === 'approved').length === 0 && (
                <p className="text-center text-text-secondary py-8">No members yet</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'meetings' && (
          <div>
            <h2 className="text-xl font-bold text-primary mb-4">Upcoming Meetings</h2>
            {group.meetings && group.meetings.length > 0 ? (
              <div className="grid gap-4">
                {group.meetings.map((meeting, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all">
                    <h3 className="font-semibold text-gray-800 mb-2">{meeting.title}</h3>
                    <p className="text-text-secondary text-sm mb-3">{meeting.description}</p>
                    <div className="flex flex-wrap gap-4 text-sm text-text-secondary">
                      <span>📅 {new Date(meeting.scheduledDate).toLocaleDateString()}</span>
                      <span>⏰ {new Date(meeting.scheduledDate).toLocaleTimeString()}</span>
                      <span>⌛ {meeting.duration} minutes</span>
                    </div>
                    {meeting.meetingLink && (
                      <a
                        href={meeting.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-block bg-primary text-white px-4 py-2 rounded-lg text-sm hover:bg-primary-dark transition-all"
                      >
                        Join Meeting
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-text-secondary py-8">No meetings scheduled yet</p>
            )}
          </div>
        )}

        {activeTab === 'sessions' && (
          <div>
            <h2 className="text-xl font-bold text-primary mb-4">Study Sessions</h2>
            {group.sessions && group.sessions.length > 0 ? (
              <div className="grid gap-4">
                {group.sessions.map((session, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all">
                    <h3 className="font-semibold text-gray-800 mb-2">{session.title}</h3>
                    <p className="text-text-secondary text-sm mb-3">{session.description}</p>
                    <div className="flex flex-wrap gap-4 text-sm text-text-secondary">
                      <span>📅 {new Date(session.date).toLocaleDateString()}</span>
                      <span>⏰ {new Date(session.date).toLocaleTimeString()}</span>
                    </div>
                    {session.resources && session.resources.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-semibold text-primary mb-2">Resources:</p>
                        <div className="flex flex-wrap gap-2">
                          {session.resources.map((resource, idx) => (
                            <a
                              key={idx}
                              href={resource}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline text-sm"
                            >
                              📎 Resource {idx + 1}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-text-secondary py-8">No study sessions scheduled yet</p>
            )}
          </div>
        )}
      </motion.div>

      {/* Confirmation Modals */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-primary mb-4">Leave Group</h3>
            <p className="text-text-secondary mb-6">
              Are you sure you want to leave "{group.name}"? You can always rejoin later.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLeaveConfirm(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleLeaveGroup}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold"
              >
                Leave Group
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-red-600 mb-4">Delete Group</h3>
            <p className="text-text-secondary mb-6">
              Are you sure you want to delete "{group.name}"? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteGroup}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold"
              >
                Delete Group
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudyGroupDetails;