// pages/BatchRepDashboard.jsx
import { useState } from 'react';
import BatchRepRequests from '../components/Workshops/BatchRepRequests';
import { motion } from 'framer-motion';

const BatchRepDashboard = () => {
  const [activeTab, setActiveTab] = useState('requests');

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary">Batch Representative Dashboard</h1>
          <p className="text-text-secondary">Manage workshop requests and view student submissions</p>
        </div>

        <div className="flex gap-4 border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('requests')}
            className={`pb-3 px-4 font-semibold transition-all ${
              activeTab === 'requests'
                ? 'text-primary border-b-2 border-primary'
                : 'text-text-secondary hover:text-primary'
            }`}
          >
            Pending Requests
          </button>
          <button
            onClick={() => setActiveTab('workshops')}
            className={`pb-3 px-4 font-semibold transition-all ${
              activeTab === 'workshops'
                ? 'text-primary border-b-2 border-primary'
                : 'text-text-secondary hover:text-primary'
            }`}
          >
            My Workshops
          </button>
        </div>

        {activeTab === 'requests' && <BatchRepRequests />}
        {activeTab === 'workshops' && (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-text-secondary">Workshops you've created will appear here</p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default BatchRepDashboard;