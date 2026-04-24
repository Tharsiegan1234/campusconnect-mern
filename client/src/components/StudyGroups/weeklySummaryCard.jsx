import React, { useState, useEffect } from 'react';
import axios from 'axios';

const WeeklySummaryCard = ({ groupId }) => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (groupId) {
      loadSummary();
    }
  }, [groupId]);

  const loadSummary = async () => {
    if (!groupId) return;
    
    setLoading(true);
    const token = localStorage.getItem('token');
    const config = { headers: { Authorization: `Bearer ${token}` } };
    
    try {
      const response = await axios.get(`/api/study-buddy/summary/${groupId}`, config);
      setSummary(response.data);
    } catch (error) {
      console.error('Error loading summary:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg p-4 mb-4">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
          <span className="text-white">Loading summary...</span>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg p-4 mb-4">
        <div className="text-center text-white">
          <p className="text-sm">No data available yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-white">📊 Weekly Summary</h3>
        <span className="text-xs text-white opacity-80">
          Last 7 days
        </span>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Sessions Card */}
        <div className="bg-white rounded-lg p-3 text-center shadow-sm">
          <div className="text-3xl font-bold text-blue-600">{summary.totalSessions || 0}</div>
          <div className="text-xs text-gray-500 font-medium mt-1">Sessions</div>
        </div>
        
        {/* New Members Card */}
        <div className="bg-white rounded-lg p-3 text-center shadow-sm">
          <div className="text-3xl font-bold text-green-600">{summary.newMembers || 0}</div>
          <div className="text-xs text-gray-500 font-medium mt-1">New Members</div>
        </div>
        
        {/* Materials Card */}
        <div className="bg-white rounded-lg p-3 text-center shadow-sm">
          <div className="text-3xl font-bold text-purple-600">{summary.newMaterials || 0}</div>
          <div className="text-xs text-gray-500 font-medium mt-1">Materials</div>
        </div>
        
        {/* Active Card */}
        <div className="bg-white rounded-lg p-3 text-center shadow-sm">
          <div className="text-3xl font-bold text-orange-600">{summary.activeMembers || 0}</div>
          <div className="text-xs text-gray-500 font-medium mt-1">Active</div>
        </div>
      </div>
      
      {summary.totalSessions === 0 && (
        <div className="mt-3 text-sm bg-yellow-400 bg-opacity-90 rounded-lg p-2 text-center">
          <span className="text-yellow-900 font-medium">💡 Tip: Schedule a session to keep your group active!</span>
        </div>
      )}
    </div>
  );
};

export default WeeklySummaryCard;