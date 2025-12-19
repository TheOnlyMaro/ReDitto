import React from 'react';
import './Loading.css';

const Loading = ({ size = 'medium', fullScreen = false }) => {
  if (fullScreen) {
    return (
      <div className="loading-fullscreen">
        <div className={`spinner spinner-${size}`}>
          <div className="spinner-circle"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`loading-container ${size === 'small' ? 'loading-small' : ''}`}>
      <div className={`spinner spinner-${size}`}>
        <div className="spinner-circle"></div>
      </div>
    </div>
  );
};

export default Loading;
