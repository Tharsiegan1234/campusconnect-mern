import React from 'react';

const AutoTagBadge = ({ tags }) => {
  if (!tags || tags.length === 0) return null;
  
  const getTagColor = (tag) => {
    if (tag.includes('Exam')) return 'bg-red-100 text-red-800';
    if (tag.includes('Notes')) return 'bg-blue-100 text-blue-800';
    if (tag.includes('Practice')) return 'bg-green-100 text-green-800';
    if (tag.includes('Lecture')) return 'bg-purple-100 text-purple-800';
    if (tag.includes('Reference')) return 'bg-orange-100 text-orange-800';
    return 'bg-gray-100 text-gray-800';
  };
  
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {tags.map((tag, index) => (
        <span
          key={index}
          className={`text-xs px-2 py-0.5 rounded-full ${getTagColor(tag)}`}
        >
          {tag}
        </span>
      ))}
    </div>
  );
};

export default AutoTagBadge;