// pages/Workshops/WorkshopDetails.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';

const WorkshopDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [workshop, setWorkshop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('details');
  const [uploading, setUploading] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [videoForm, setVideoForm] = useState({ title: '', description: '', videoUrl: '', platform: 'youtube' });
  const [materialForm, setMaterialForm] = useState({ title: '', description: '', fileUrl: '', fileName: '' });

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    setUser(userData);
    fetchWorkshop();
  }, [id]);

  const fetchWorkshop = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.get(`/api/workshops/${id}`, config);
      setWorkshop(response.data);
    } catch (error) {
      toast.error('Failed to load workshop');
      navigate('/workshops');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.post(`/api/workshops/${id}/register`, {}, config);
      toast.success(response.data.message);
      fetchWorkshop();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to register');
    }
  };

  const handleCancel = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.delete(`/api/workshops/${id}/cancel`, config);
      toast.success('Registration cancelled');
      fetchWorkshop();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel');
    }
  };

  const isLecturerOrBatchRep = () => {
    if (!user) return false;
    const isBatchRep = user.isBatchRep === true;
    const isLecturer = user.email && user.email.match(/^ept\d{3}@sliitplatform\.com$/);
    return isBatchRep || isLecturer || user.role === 'admin';
  };

  const extractYouTubeId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const getYouTubeEmbedUrl = (url) => {
    const videoId = extractYouTubeId(url);
    if (videoId) return `https://www.youtube.com/embed/${videoId}`;
    return url;
  };

  const handleAddVideo = async (e) => {
    e.preventDefault();
    setUploading(true);
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.post(`/api/workshops/${id}/videos`, videoForm, config);
      toast.success('Video added successfully!');
      setShowVideoModal(false);
      setVideoForm({ title: '', description: '', videoUrl: '', platform: 'youtube' });
      fetchWorkshop();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add video');
    } finally {
      setUploading(false);
    }
  };

  const handleAddMaterial = async (e) => {
    e.preventDefault();
    setUploading(true);
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.post(`/api/workshops/${id}/materials`, materialForm, config);
      toast.success('Material added successfully!');
      setShowMaterialModal(false);
      setMaterialForm({ title: '', description: '', fileUrl: '', fileName: '' });
      fetchWorkshop();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add material');
    } finally {
      setUploading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  }

  if (!workshop) {
    return <div className="text-center py-20"><div className="text-6xl mb-4">🔍</div><p className="text-text-secondary text-lg">Workshop not found</p><button onClick={() => navigate('/workshops')} className="mt-4 text-primary hover:underline">Back to Workshops</button></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Link to="/workshops" className="inline-flex items-center gap-2 text-text-secondary hover:text-primary transition-colors mb-6">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back to Workshops
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-primary-dark p-8 text-white">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3 flex-wrap">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${workshop.workshopType === 'upcoming' ? 'bg-green-100 text-green-700' : workshop.workshopType === 'ongoing' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>
                    {workshop.workshopType === 'upcoming' ? '⏰ UPCOMING' : workshop.workshopType === 'ongoing' ? '🔄 ONGOING' : '✅ ENDED'}
                  </span>
                  <span className="px-3 py-1 bg-white/20 rounded-full text-sm">{workshop.category}</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold mb-4">{workshop.title}</h1>
                <p className="text-white/90 text-lg">{workshop.description}</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Info Grid */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gray-50 rounded-xl p-5"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-2xl">📅</div><div><p className="text-sm text-text-secondary">Date & Time</p><p className="font-semibold text-gray-800">{formatDate(workshop.date)}</p></div></div></div>
              <div className="bg-gray-50 rounded-xl p-5"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-2xl">⏱️</div><div><p className="text-sm text-text-secondary">Duration</p><p className="font-semibold text-gray-800">{workshop.duration} minutes</p></div></div></div>
              <div className="bg-gray-50 rounded-xl p-5"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-2xl">📍</div><div className="flex-1"><p className="text-sm text-text-secondary">Location</p><a href={workshop.location} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold break-all">{workshop.location}</a></div></div></div>
              <div className="bg-gray-50 rounded-xl p-5"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-2xl">👥</div><div><p className="text-sm text-text-secondary">Capacity</p><p className="font-semibold text-gray-800">{workshop.registrationCount || 0} / {workshop.capacity} registered</p><div className="w-full bg-gray-200 rounded-full h-2 mt-2"><div className="bg-primary rounded-full h-2" style={{ width: `${((workshop.registrationCount || 0) / workshop.capacity) * 100}%` }} /></div></div></div></div>
              <div className="bg-gray-50 rounded-xl p-5"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-2xl">🏫</div><div><p className="text-sm text-text-secondary">Faculty</p><p className="font-semibold text-gray-800">{workshop.faculty}</p></div></div></div>
              <div className="bg-gray-50 rounded-xl p-5"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-2xl">📚</div><div><p className="text-sm text-text-secondary">Academic Year</p><p className="font-semibold text-gray-800">{workshop.academicYear}</p></div></div></div>
            </div>

            {/* Registration Button */}
            {workshop.workshopType !== 'ended' && (
              <div className="mb-8">
                {workshop.isRegistered ? (
                  <button onClick={handleCancel} className="w-full bg-red-500 hover:bg-red-600 text-white px-6 py-4 rounded-xl font-semibold">Cancel Registration</button>
                ) : workshop.isOnWaitlist ? (
                  <div><button onClick={handleCancel} className="w-full bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-4 rounded-xl font-semibold">Remove from Waitlist</button><p className="text-sm text-text-secondary text-center mt-2">You're on the waitlist. You'll be notified if a spot opens up.</p></div>
                ) : (
                  <button onClick={handleRegister} className="w-full bg-primary hover:bg-primary-dark text-white px-6 py-4 rounded-xl font-semibold">Register for Workshop</button>
                )}
              </div>
            )}

            {/* Tabs */}
            <div className="flex gap-4 border-b border-gray-200 mb-6">
              <button onClick={() => setActiveTab('details')} className={`pb-3 px-4 font-semibold transition-all ${activeTab === 'details' ? 'text-primary border-b-2 border-primary' : 'text-text-secondary hover:text-primary'}`}>Workshop Details</button>
              {workshop.materials?.length > 0 && <button onClick={() => setActiveTab('materials')} className={`pb-3 px-4 font-semibold transition-all ${activeTab === 'materials' ? 'text-primary border-b-2 border-primary' : 'text-text-secondary hover:text-primary'}`}>📚 Materials ({workshop.materials.length})</button>}
              {workshop.videos?.length > 0 && <button onClick={() => setActiveTab('videos')} className={`pb-3 px-4 font-semibold transition-all ${activeTab === 'videos' ? 'text-primary border-b-2 border-primary' : 'text-text-secondary hover:text-primary'}`}>🎥 Videos ({workshop.videos.length})</button>}
            </div>

            {/* Details Tab */}
            {activeTab === 'details' && (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-xl p-6"><h2 className="text-xl font-bold text-primary mb-3">About This Workshop</h2><p className="text-text-secondary leading-relaxed">{workshop.description}</p></div>
                <div className="bg-gray-50 rounded-xl p-6"><h2 className="text-xl font-bold text-primary mb-3">Workshop Details</h2><div className="grid grid-cols-2 gap-4"><div><p className="text-sm text-text-secondary">Created by</p><p className="font-semibold text-gray-800">{workshop.createdBy?.name || 'Unknown'}</p></div><div><p className="text-sm text-text-secondary">Created on</p><p className="font-semibold text-gray-800">{new Date(workshop.createdAt).toLocaleDateString()}</p></div></div></div>
              </div>
            )}

            {/* Materials Tab - ALL LOGGED IN USERS CAN VIEW */}
            {activeTab === 'materials' && workshop.materials?.length > 0 && (
              <div className="space-y-4">
                {workshop.materials.map((material, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-xl p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl">📄</div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800 text-lg mb-1">{material.title || material.fileName}</h3>
                        {material.description && <p className="text-text-secondary text-sm mb-3">{material.description}</p>}
                        <a href={material.fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-primary hover:underline text-sm font-semibold">📎 Download Material</a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Videos Tab - ALL LOGGED IN USERS CAN VIEW */}
            {activeTab === 'videos' && workshop.videos?.length > 0 && (
              <div className="space-y-6">
                {workshop.videos.map((video, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-xl overflow-hidden">
                    <div className="p-5"><h3 className="font-semibold text-gray-800 text-lg mb-2">{video.title}</h3>{video.description && <p className="text-text-secondary text-sm mb-4">{video.description}</p>}</div>
                    <div className="aspect-video bg-black"><iframe src={getYouTubeEmbedUrl(video.videoUrl)} title={video.title} className="w-full h-full" allowFullScreen /></div>
                  </div>
                ))}
              </div>
            )}

            {/* Add Content Buttons - ONLY for Batch Reps/Lecturers */}
            {isLecturerOrBatchRep() && workshop.workshopType !== 'ended' && (
              <div className="mt-8 flex gap-3">
                <button onClick={() => setShowVideoModal(true)} className="flex-1 bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold">+ Add Video Recording</button>
                <button onClick={() => setShowMaterialModal(true)} className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold">+ Add Study Material</button>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Add Video Modal */}
      {showVideoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6 border-b"><h2 className="text-2xl font-bold text-primary">Add Video Recording</h2></div>
            <form onSubmit={handleAddVideo} className="p-6 space-y-4">
              <input type="text" value={videoForm.title} onChange={(e) => setVideoForm({...videoForm, title: e.target.value})} placeholder="Title *" required className="w-full px-4 py-3 rounded-xl border" />
              <textarea value={videoForm.description} onChange={(e) => setVideoForm({...videoForm, description: e.target.value})} rows={3} placeholder="Description" className="w-full px-4 py-3 rounded-xl border" />
              <input type="url" value={videoForm.videoUrl} onChange={(e) => setVideoForm({...videoForm, videoUrl: e.target.value})} placeholder="YouTube URL *" required className="w-full px-4 py-3 rounded-xl border" />
              <div className="flex gap-3"><button type="button" onClick={() => setShowVideoModal(false)} className="flex-1 bg-gray-100 py-3 rounded-xl">Cancel</button><button type="submit" disabled={uploading} className="flex-1 bg-purple-500 text-white py-3 rounded-xl">{uploading ? 'Adding...' : 'Add Video'}</button></div>
            </form>
          </div>
        </div>
      )}

      {/* Add Material Modal */}
      {showMaterialModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6 border-b"><h2 className="text-2xl font-bold text-primary">Add Study Material</h2></div>
            <form onSubmit={handleAddMaterial} className="p-6 space-y-4">
              <input type="text" value={materialForm.title} onChange={(e) => setMaterialForm({...materialForm, title: e.target.value})} placeholder="Title *" required className="w-full px-4 py-3 rounded-xl border" />
              <textarea value={materialForm.description} onChange={(e) => setMaterialForm({...materialForm, description: e.target.value})} rows={3} placeholder="Description" className="w-full px-4 py-3 rounded-xl border" />
              <input type="url" value={materialForm.fileUrl} onChange={(e) => setMaterialForm({...materialForm, fileUrl: e.target.value})} placeholder="File URL *" required className="w-full px-4 py-3 rounded-xl border" />
              <div className="flex gap-3"><button type="button" onClick={() => setShowMaterialModal(false)} className="flex-1 bg-gray-100 py-3 rounded-xl">Cancel</button><button type="submit" disabled={uploading} className="flex-1 bg-primary text-white py-3 rounded-xl">{uploading ? 'Adding...' : 'Add Material'}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkshopDetails;