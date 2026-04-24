// components/Workshops/WorkshopCard.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const WorkshopCard = ({ workshop, user, onRegister, onCancel, onRefresh }) => {
  const [showMaterials, setShowMaterials] = useState(false);
  const [showVideos, setShowVideos] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [videoForm, setVideoForm] = useState({
    title: '',
    description: '',
    videoUrl: '',
    platform: 'youtube'
  });
  const [materialForm, setMaterialForm] = useState({
    title: '',
    description: '',
    fileUrl: '',
    fileName: '',
    fileType: '',
    fileSize: ''
  });

  const getTypeColor = () => {
    switch(workshop.workshopType) {
      case 'upcoming': return 'bg-green-100 text-green-700';
      case 'ongoing': return 'bg-yellow-100 text-yellow-700';
      case 'ended': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getTypeIcon = () => {
    switch(workshop.workshopType) {
      case 'upcoming': return '⏰';
      case 'ongoing': return '🔄';
      case 'ended': return '✅';
      default: return '📅';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
    if (url.includes('youtube.com/embed/') || url.includes('vimeo.com')) return url;
    return url;
  };

  const handleAddVideo = async (e) => {
    e.preventDefault();
    setUploading(true);
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.post(`/api/workshops/${workshop._id}/videos`, videoForm, config);
      toast.success('Video added successfully!');
      setShowVideoModal(false);
      setVideoForm({ title: '', description: '', videoUrl: '', platform: 'youtube' });
      onRefresh();
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
      await axios.post(`/api/workshops/${workshop._id}/materials`, materialForm, config);
      toast.success('Material added successfully!');
      setShowMaterialModal(false);
      setMaterialForm({ title: '', description: '', fileUrl: '', fileName: '', fileType: '', fileSize: '' });
      onRefresh();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add material');
    } finally {
      setUploading(false);
    }
  };

  const handleCardClick = (e) => {
    if (e.target.closest('button') || e.target.closest('a')) {
      e.preventDefault();
      return;
    }
  };

  return (
    <Link to={`/workshops/${workshop._id}`} className="block" onClick={handleCardClick}>
      <motion.div whileHover={{ y: -4 }} className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all border border-gray-100 overflow-hidden cursor-pointer">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-3">
            <h3 className="text-xl font-bold text-primary font-heading line-clamp-1">{workshop.title}</h3>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getTypeColor()}`}>
              {getTypeIcon()} {workshop.workshopType}
            </span>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs">{workshop.category}</span>
            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-md text-xs">{workshop.faculty}</span>
            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs">{workshop.academicYear}</span>
          </div>

          {/* Description */}
          <p className="text-text-secondary text-sm mb-4 line-clamp-2">{workshop.description}</p>

          {/* Details */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm text-text-secondary"><span>📅</span><span>{formatDate(workshop.date)}</span></div>
            <div className="flex items-center gap-2 text-sm text-text-secondary"><span>⏱️</span><span>{workshop.duration} minutes</span></div>
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <span>📍</span>
              <a href={workshop.location} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate" onClick={(e) => e.stopPropagation()}>{workshop.location}</a>
            </div>
            <div className="flex items-center gap-2 text-sm text-text-secondary"><span>👥</span><span>{workshop.registrationCount || 0}/{workshop.capacity} registered</span></div>
            <div className="flex items-center gap-2 text-sm text-text-secondary"><span>👤</span><span>By: {workshop.createdBy?.name || 'Unknown'}</span></div>
          </div>

          {/* Registration Button */}
          {workshop.workshopType !== 'ended' && (
            <div className="mb-4" onClick={(e) => e.stopPropagation()}>
              {workshop.isRegistered ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-2 text-center">
                  <p className="text-green-700 text-sm font-semibold">✓ Registered</p>
                  <button onClick={() => onCancel(workshop._id)} className="mt-1 text-red-600 text-xs hover:underline">Cancel Registration</button>
                </div>
              ) : workshop.isOnWaitlist ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 text-center">
                  <p className="text-yellow-700 text-sm font-semibold">⏳ On Waitlist</p>
                  <button onClick={() => onCancel(workshop._id)} className="mt-1 text-red-600 text-xs hover:underline">Remove from Waitlist</button>
                </div>
              ) : (
                <button onClick={() => onRegister(workshop._id)} className="w-full bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all">Register Now</button>
              )}
            </div>
          )}

          {/* Materials Section - ALL LOGGED IN USERS CAN VIEW */}
          {workshop.materials && workshop.materials.length > 0 && (
            <div className="mt-4 border-t border-gray-100 pt-3" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setShowMaterials(!showMaterials)} className="text-primary text-sm font-semibold hover:underline flex items-center gap-1">
                {showMaterials ? '▼' : '▶'} 📚 Study Materials ({workshop.materials.length})
              </button>
              {showMaterials && (
                <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                  {workshop.materials.map((material, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-lg p-2">
                      <a href={material.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        📄 {material.title || material.fileName}
                      </a>
                      {material.description && <p className="text-xs text-text-secondary mt-1 ml-5">{material.description}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Videos Section - ALL LOGGED IN USERS CAN VIEW */}
          {workshop.videos && workshop.videos.length > 0 && (
            <div className="mt-4 border-t border-gray-100 pt-3" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setShowVideos(!showVideos)} className="text-primary text-sm font-semibold hover:underline flex items-center gap-1">
                {showVideos ? '▼' : '▶'} 🎥 Workshop Recordings ({workshop.videos.length})
              </button>
              {showVideos && (
                <div className="mt-2 space-y-3 max-h-96 overflow-y-auto">
                  {workshop.videos.map((video, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-lg p-2">
                      <p className="font-semibold text-gray-800 text-sm mb-1">{video.title}</p>
                      {video.description && <p className="text-xs text-text-secondary mb-2">{video.description}</p>}
                      <div className="aspect-video rounded-lg overflow-hidden">
                        <iframe src={getYouTubeEmbedUrl(video.videoUrl)} title={video.title} className="w-full h-full" allowFullScreen />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Add Content Buttons - ONLY for Batch Reps/Lecturers */}
          {isLecturerOrBatchRep() && workshop.workshopType !== 'ended' && (
            <div className="mt-4 border-t border-gray-100 pt-3 flex gap-2" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setShowVideoModal(true)} className="flex-1 bg-purple-500 hover:bg-purple-600 text-white px-3 py-1.5 rounded text-xs font-semibold transition-all">+ Add Video Recording</button>
              <button onClick={() => setShowMaterialModal(true)} className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded text-xs font-semibold transition-all">+ Add Study Material</button>
            </div>
          )}
        </div>

        {/* Add Video Modal */}
        {showVideoModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-100 p-6"><h2 className="text-2xl font-bold text-primary">Add Workshop Recording</h2></div>
              <form onSubmit={handleAddVideo} className="p-6 space-y-5">
                <div><label className="block text-text-secondary text-sm font-bold mb-2">Title *</label><input type="text" value={videoForm.title} onChange={(e) => setVideoForm({...videoForm, title: e.target.value})} required className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:outline-none" placeholder="e.g., React Workshop Recording - Part 1" /></div>
                <div><label className="block text-text-secondary text-sm font-bold mb-2">Description</label><textarea value={videoForm.description} onChange={(e) => setVideoForm({...videoForm, description: e.target.value})} rows={3} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:outline-none" placeholder="What's covered in this video?" /></div>
                <div><label className="block text-text-secondary text-sm font-bold mb-2">YouTube/Video URL *</label><input type="url" value={videoForm.videoUrl} onChange={(e) => setVideoForm({...videoForm, videoUrl: e.target.value})} required className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:outline-none" placeholder="https://youtube.com/watch?v=..." /></div>
                <div className="flex gap-3 pt-4"><button type="button" onClick={() => setShowVideoModal(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-xl font-semibold">Cancel</button><button type="submit" disabled={uploading} className="flex-1 bg-purple-500 hover:bg-purple-600 text-white px-4 py-3 rounded-xl font-semibold disabled:opacity-50">{uploading ? 'Adding...' : 'Add Video'}</button></div>
              </form>
            </div>
          </div>
        )}

        {/* Add Material Modal */}
        {showMaterialModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-100 p-6"><h2 className="text-2xl font-bold text-primary">Add Study Material</h2></div>
              <form onSubmit={handleAddMaterial} className="p-6 space-y-5">
                <div><label className="block text-text-secondary text-sm font-bold mb-2">Title *</label><input type="text" value={materialForm.title} onChange={(e) => setMaterialForm({...materialForm, title: e.target.value})} required className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:outline-none" placeholder="e.g., Workshop Slides, Code Examples" /></div>
                <div><label className="block text-text-secondary text-sm font-bold mb-2">Description</label><textarea value={materialForm.description} onChange={(e) => setMaterialForm({...materialForm, description: e.target.value})} rows={3} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:outline-none" placeholder="Brief description" /></div>
                <div><label className="block text-text-secondary text-sm font-bold mb-2">File URL *</label><input type="url" value={materialForm.fileUrl} onChange={(e) => setMaterialForm({...materialForm, fileUrl: e.target.value})} required className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:outline-none" placeholder="https://drive.google.com/file/d/..." /></div>
                <div className="flex gap-3 pt-4"><button type="button" onClick={() => setShowMaterialModal(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-xl font-semibold">Cancel</button><button type="submit" disabled={uploading} className="flex-1 bg-primary hover:bg-primary-dark text-white px-4 py-3 rounded-xl font-semibold disabled:opacity-50">{uploading ? 'Adding...' : 'Add Material'}</button></div>
              </form>
            </div>
          </div>
        )}
      </motion.div>
    </Link>
  );
};

export default WorkshopCard;