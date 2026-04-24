import React, { useState, useEffect } from 'react';
import axios from 'axios';
import WeeklySummaryCard from './weeklySummaryCard';
import { Bell, Clock, RefreshCw } from 'lucide-react';

const MainStudyBuddyWidget = ({ groupId }) => {
  const [notifications, setNotifications] = useState([]);
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (groupId) {
      loadData();
    }
  }, [groupId]);

  const loadData = async () => {
    if (!groupId) return;
    
    setLoading(true);
    const token = localStorage.getItem('token');
    const config = { headers: { Authorization: `Bearer ${token}` } };
    
    try {
      const notificationsRes = await axios.get(`/api/study-buddy/notifications/${groupId}`, config);
      setNotifications(notificationsRes.data || []);
      
      const sessionsRes = await axios.get(`/api/study-buddy/upcoming-sessions/${groupId}`, config);
      setUpcomingSessions(sessionsRes.data || []);
    } catch (error) {
      console.error('Error loading study buddy data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'welcome': return '🎉';
      case 'reminder': return '🔔';
      case 'summary': return '📊';
      case 'suggestion': return '💡';
      case 'inactivity_alert': return '⚠️';
      default: return '🤖';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 mb-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-t-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🤖</span>
            <h2 className="text-xl font-semibold text-white">Study Buddy Assistant</h2>
          </div>
          <button
            onClick={loadData}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition text-white"
            disabled={loading}
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
        <p className="text-sm text-white opacity-90 mt-1">Your automatic study group assistant</p>
      </div>
      
      {/* Content */}
      <div className="p-4">
        {/* Weekly Summary */}
        <WeeklySummaryCard groupId={groupId} />
        
        {/* Upcoming Sessions Reminder */}
        {upcomingSessions.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2 text-yellow-800 mb-2">
              <Clock size={16} className="text-yellow-600" />
              <span className="font-semibold text-yellow-800">Upcoming Sessions</span>
            </div>
            {upcomingSessions.map((session, idx) => (
              <div key={idx} className="text-sm text-yellow-700 mb-1">
                • {session.title} - {new Date(session.date).toLocaleString()} 
                <span className="text-xs ml-2 text-yellow-600">({session.hoursUntil}h left)</span>
              </div>
            ))}
          </div>
        )}
        
        {/* Notifications */}
        {notifications.length > 0 && (
          <div className="mb-3">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="flex items-center gap-2 text-gray-700 hover:text-gray-900 mb-2 font-medium"
            >
              <Bell size={16} />
              <span>{notifications.length} Notifications</span>
              <span className="text-xs text-gray-500">{showNotifications ? '▼' : '▶'}</span>
            </button>
            
            {showNotifications && (
              <div className="space-y-2 max-h-64 overflow-y-auto bg-gray-50 rounded-lg p-2">
                {notifications.slice(0, 5).map((notif, idx) => (
                  <div key={idx} className="bg-white rounded-lg p-3 text-sm border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{getNotificationIcon(notif.type)}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(notif.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap">{notif.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Empty State */}
        {notifications.length === 0 && upcomingSessions.length === 0 && !loading && (
          <div className="text-center py-6 bg-gray-50 rounded-lg mb-3">
            <div className="text-4xl mb-2">✨</div>
            <p className="text-gray-600 font-medium">Your Study Buddy is watching</p>
            <p className="text-gray-500 text-sm mt-1">Activity will appear here</p>
          </div>
        )}
        
        {/* Quick Actions Info */}
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex flex-wrap gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">🎉 Auto-welcome new members</span>
            <span className="flex items-center gap-1">📊 Weekly summaries</span>
            <span className="flex items-center gap-1">🔔 Session reminders</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainStudyBuddyWidget;