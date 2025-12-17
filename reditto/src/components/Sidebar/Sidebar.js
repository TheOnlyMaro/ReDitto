import React, { useState } from 'react';
import './Sidebar.css';

// Dummy data for sidebar
const sidebarData = {
  moderatedCommunities: [
    { id: 1, name: 'r/testcommunity1', icon: '🎮' },
    { id: 2, name: 'r/testcommunity2', icon: '💻' },
  ],
  followedCommunities: [
    { id: 3, name: 'r/testcommunity3', icon: '🎨' },
    { id: 4, name: 'r/testcommunity4', icon: '⚽' },
    { id: 5, name: 'r/testcommunity5', icon: '🎵' },
    { id: 6, name: 'r/testcommunity6', icon: '📚' },
  ]
};

const Sidebar = () => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [moderationExpanded, setModerationExpanded] = useState(true);
  const [communitiesExpanded, setCommunitiesExpanded] = useState(true);

  const toggleSidebar = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={`sidebar ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <button 
        className="sidebar-toggle-btn" 
        onClick={toggleSidebar}
        aria-label={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <path d="M2 4h16v2H2V4zm0 5h16v2H2V9zm0 5h16v2H2v-2z" fill="currentColor"/>
        </svg>
      </button>

      {isExpanded && (
        <div className="sidebar-content">
          {/* Home */}
          <div className="sidebar-item">
            <svg className="sidebar-icon" width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" fill="currentColor"/>
            </svg>
            <span>Home</span>
          </div>

          {/* Start a community */}
          <div className="sidebar-item">
            <svg className="sidebar-icon" width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" fill="currentColor"/>
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z" fill="currentColor"/>
            </svg>
            <span>Start a community</span>
          </div>

          <div className="sidebar-divider"></div>

          {/* Moderation Section */}
          {sidebarData.moderatedCommunities.length > 0 && (
            <>
              <div 
                className="sidebar-section-header"
                onClick={() => setModerationExpanded(!moderationExpanded)}
              >
                <svg 
                  className={`sidebar-chevron ${moderationExpanded ? 'expanded' : ''}`}
                  width="16" 
                  height="16" 
                  viewBox="0 0 16 16" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M5.3 6.7l2.7 2.7 2.7-2.7L12 8l-4 4-4-4 1.3-1.3z" fill="currentColor"/>
                </svg>
                <span>Moderation</span>
              </div>
              {moderationExpanded && (
                <div className="sidebar-section">
                  {sidebarData.moderatedCommunities.map(community => (
                    <div key={community.id} className="sidebar-item community-item">
                      <span className="community-icon">{community.icon}</span>
                      <span>{community.name}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="sidebar-divider"></div>
            </>
          )}

          {/* Communities Section */}
          <div 
            className="sidebar-section-header"
            onClick={() => setCommunitiesExpanded(!communitiesExpanded)}
          >
            <svg 
              className={`sidebar-chevron ${communitiesExpanded ? 'expanded' : ''}`}
              width="16" 
              height="16" 
              viewBox="0 0 16 16" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M5.3 6.7l2.7 2.7 2.7-2.7L12 8l-4 4-4-4 1.3-1.3z" fill="currentColor"/>
            </svg>
            <span>Communities</span>
          </div>
          {communitiesExpanded && (
            <div className="sidebar-section">
              {sidebarData.followedCommunities.map(community => (
                <div key={community.id} className="sidebar-item community-item">
                  <span className="community-icon">{community.icon}</span>
                  <span>{community.name}</span>
                </div>
              ))}
            </div>
          )}

          <div className="sidebar-divider"></div>

          {/* Footer Section */}
          <div className="sidebar-footer">
            <div className="sidebar-item">
              <svg className="sidebar-icon" width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" fill="currentColor"/>
              </svg>
              <span>About ReDitto</span>
            </div>
            <div className="sidebar-item">
              <svg className="sidebar-icon" width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0v12h8V4H6z" fill="currentColor"/>
              </svg>
              <span>User Agreement</span>
            </div>
            <div className="sidebar-copyright">
              © 2025 ReDitto. All rights reserved.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
