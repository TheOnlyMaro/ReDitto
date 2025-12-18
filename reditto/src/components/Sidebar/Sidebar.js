import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = ({ isExpanded, setIsExpanded, user }) => {
  const navigate = useNavigate();
  const [moderationExpanded, setModerationExpanded] = useState(true);
  const [communitiesExpanded, setCommunitiesExpanded] = useState(true);
  const [popularExpanded, setPopularExpanded] = useState(true);
  
  const [moderatedCommunities, setModeratedCommunities] = useState([]);
  const [followedCommunities, setFollowedCommunities] = useState([]);
  const [popularCommunities, setPopularCommunities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCommunityData();
  }, [user]);

  const fetchCommunityData = async () => {
    try {
      setLoading(true);
      
      // Fetch popular communities (top 10 by member count)
      const popularResponse = await fetch('http://localhost:5000/api/communities?limit=10&sort=-memberCount');
      const popularData = await popularResponse.json();
      setPopularCommunities(popularData.communities || []);

      // If user is logged in, fetch their specific communities
      if (user && user.communities) {
        const token = localStorage.getItem('reditto_auth_token');
        
        // Fetch all communities to filter user's joined/moderated ones
        const allResponse = await fetch('http://localhost:5000/api/communities?limit=100');
        const allData = await allResponse.json();
        const allCommunities = allData.communities || [];

        // Filter joined communities
        if (user.communities.joined && user.communities.joined.length > 0) {
          const joined = allCommunities.filter(comm => 
            user.communities.joined.includes(comm._id)
          );
          setFollowedCommunities(joined);
        }

        // Filter moderated communities
        if (user.communities.moderated && user.communities.moderated.length > 0) {
          const moderated = allCommunities.filter(comm => 
            user.communities.moderated.includes(comm._id)
          );
          setModeratedCommunities(moderated);
        }
      }
    } catch (error) {
      console.error('Error fetching communities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCommunityClick = (communityName) => {
    navigate(`/r/${communityName}`);
  };

  const handleHomeClick = () => {
    navigate('/');
  };

  const handleCreateCommunityClick = () => {
    navigate('/create/community');
  };

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
          <div className="sidebar-item" onClick={handleHomeClick}>
            <svg className="sidebar-icon" width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" fill="currentColor"/>
            </svg>
            <span>Home</span>
          </div>

          {/* Start a community */}
          <div className="sidebar-item" onClick={handleCreateCommunityClick}>
            <svg className="sidebar-icon" width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" fill="currentColor"/>
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z" fill="currentColor"/>
            </svg>
            <span>Start a community</span>
          </div>

          <div className="sidebar-divider"></div>

          {/* Moderation Section */}
          {moderatedCommunities.length > 0 && (
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
                  {moderatedCommunities.map(community => (
                    <div 
                      key={community._id} 
                      className="sidebar-item community-item"
                      onClick={() => handleCommunityClick(community.name)}
                    >
                      {community.appearance?.icon ? (
                        <img 
                          src={community.appearance.icon} 
                          alt={community.name}
                          className="community-icon-img"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <span className="community-icon-fallback" style={{ display: community.appearance?.icon ? 'none' : 'flex' }}>
                        {community.name.charAt(0).toUpperCase()}
                      </span>
                      <span>r/{community.name}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="sidebar-divider"></div>
            </>
          )}

          {/* Communities Section (Followed) */}
          {followedCommunities.length > 0 && (
            <>
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
                  {followedCommunities.map(community => (
                    <div 
                      key={community._id} 
                      className="sidebar-item community-item"
                      onClick={() => handleCommunityClick(community.name)}
                    >
                      {community.appearance?.icon ? (
                        <img 
                          src={community.appearance.icon} 
                          alt={community.name}
                          className="community-icon-img"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <span className="community-icon-fallback" style={{ display: community.appearance?.icon ? 'none' : 'flex' }}>
                        {community.name.charAt(0).toUpperCase()}
                      </span>
                      <span>r/{community.name}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="sidebar-divider"></div>
            </>
          )}

          {/* Popular Communities Section */}
          <div 
            className="sidebar-section-header"
            onClick={() => setPopularExpanded(!popularExpanded)}
          >
            <svg 
              className={`sidebar-chevron ${popularExpanded ? 'expanded' : ''}`}
              width="16" 
              height="16" 
              viewBox="0 0 16 16" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M5.3 6.7l2.7 2.7 2.7-2.7L12 8l-4 4-4-4 1.3-1.3z" fill="currentColor"/>
            </svg>
            <span>Popular</span>
          </div>
          {popularExpanded && (
            <div className="sidebar-section">
              {loading ? (
                <div className="sidebar-loading">Loading...</div>
              ) : popularCommunities.length > 0 ? (
                popularCommunities.map(community => (
                  <div 
                    key={community._id} 
                    className="sidebar-item community-item"
                    onClick={() => handleCommunityClick(community.name)}
                  >
                    {community.appearance?.icon ? (
                      <img 
                        src={community.appearance.icon} 
                        alt={community.name}
                        className="community-icon-img"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <span className="community-icon-fallback" style={{ display: community.appearance?.icon ? 'none' : 'flex' }}>
                      {community.name.charAt(0).toUpperCase()}
                    </span>
                    <span>r/{community.name}</span>
                  </div>
                ))
              ) : (
                <div className="sidebar-empty">No communities yet</div>
              )}
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
