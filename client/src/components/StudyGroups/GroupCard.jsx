// components/StudyGroups/GroupCard.jsx
import { motion } from 'framer-motion';

const GroupCard = ({ group, isMember, isOwner, hasPendingRequest, onJoin, onLeave, onDelete, onClick }) => {
  const getTypeColor = () => {
    return group.type === 'open' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700';
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all border border-gray-100 overflow-hidden cursor-pointer"
      onClick={onClick}
    >
      <div className="p-6">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-xl font-bold text-primary font-heading line-clamp-1">{group.name}</h3>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getTypeColor()}`}>
            {group.type === 'open' ? 'Open' : 'Private'}
          </span>
        </div>

        <p className="text-text-secondary text-sm mb-4 line-clamp-2">{group.description}</p>

        <div className="flex items-center gap-4 text-sm text-text-secondary mb-4">
          <span>📚 {group.faculty}</span>
          <span>📅 {group.academicYear}</span>
          <span>👥 {group.memberCount}/{group.participantLimit || '∞'}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src={group.owner?.avatar || '/avatars/avatar1.png'}
              alt={group.owner?.name}
              className="w-6 h-6 rounded-full"
            />
            <span className="text-xs text-text-secondary">by {group.owner?.name}</span>
          </div>

          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
            {!isMember && !hasPendingRequest && (
              <button
                onClick={onJoin}
                className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all"
              >
                Join
              </button>
            )}
            {hasPendingRequest && (
              <span className="bg-yellow-100 text-yellow-700 px-4 py-2 rounded-lg text-sm font-semibold">
                Pending
              </span>
            )}
            {isMember && !isOwner && (
              <button
                onClick={onLeave}
                className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
              >
                Leave
              </button>
            )}
            {isOwner && (
              <button
                onClick={onDelete}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default GroupCard;