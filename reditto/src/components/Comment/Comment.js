import React from 'react';
import './Comment.css';

const Comment = ({ comment }) => {
  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const posted = new Date(timestamp);
    const diffInSeconds = Math.floor((now - posted) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  return (
    <div className="comment">
      <div className="comment-header">
        <span className="comment-author">{comment.author}</span>
        <span className="comment-divider">•</span>
        <span className="comment-time">{formatTimeAgo(comment.createdAt)}</span>
      </div>
      <p className="comment-content">{comment.content}</p>
    </div>
  );
};

export default Comment;
