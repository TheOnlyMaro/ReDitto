import React from 'react';
import './Avatar.css';

const Avatar = ({ 
  src, 
  alt, 
  size = 'medium', 
  username,
  className = '' 
}) => {
  const getInitials = (name) => {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className={`avatar avatar-${size} ${className}`}>
      {src ? (
        <img src={src} alt={alt || username} className="avatar-image" />
      ) : (
        <div className="avatar-fallback">
          {getInitials(username || alt)}
        </div>
      )}
    </div>
  );
};

export default Avatar;
