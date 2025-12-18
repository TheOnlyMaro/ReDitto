import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '../Logo/Logo';
import SearchBar from '../SearchBar/SearchBar';
import Avatar from '../Avatar/Avatar';
import Button from '../Button/Button';
import './Navbar.css';

const Navbar = ({ user, onSearch, darkMode, setDarkMode, onLogout }) => {
  const navigate = useNavigate();
  const isLoggedIn = !!user;
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);

  const handleLoginClick = () => {
    navigate('/login');
  };

  const toggleProfileMenu = () => {
    setProfileMenuOpen(!profileMenuOpen);
  };

  const handleViewProfile = () => {
    navigate(`/user/${user?.username}`);
    setProfileMenuOpen(false);
  };

  const handleEditProfile = () => {
    navigate('/settings/profile');
    setProfileMenuOpen(false);
  };

  const handleSettings = () => {
    navigate('/settings');
    setProfileMenuOpen(false);
  };

  const handleLogout = () => {
    if (onLogout) onLogout();
    setProfileMenuOpen(false);
    // Refresh the page after logout
    window.location.reload();
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    };

    if (profileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileMenuOpen]);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Left: Logo */}
        <div className="navbar-left">
          <Logo />
        </div>

        {/* Middle: Search Bar */}
        <div className="navbar-middle">
          <SearchBar onSearch={onSearch} />
        </div>

        {/* Right: Auth/User Actions */}
        <div className="navbar-right">
          {!isLoggedIn ? (
            <>
              <Button 
                variant="secondary" 
                size="small"
                onClick={handleLoginClick}
              >
                Log In
              </Button>
            </>
          ) : (
            <>
              {/* Chat Icon */}
              <button className="navbar-icon-btn" aria-label="Chat">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.48 2 2 6.48 2 12C2 13.93 2.6 15.72 3.62 17.2L2.5 21.5L6.8 20.38C8.28 21.4 10.07 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C10.37 20 8.84 19.53 7.55 18.72L4 19.5L4.78 15.95C3.97 14.66 3.5 13.13 3.5 11.5C3.5 7.36 6.86 4 11 4H12C16.14 4 19.5 7.36 19.5 11.5V12C19.5 16.14 16.14 19.5 12 19.5V20Z" fill="currentColor"/>
                  <circle cx="8.5" cy="12" r="1.5" fill="currentColor"/>
                  <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
                  <circle cx="15.5" cy="12" r="1.5" fill="currentColor"/>
                </svg>
              </button>

              {/* Create Post Button */}
              <button className="navbar-icon-btn create-btn" aria-label="Create post">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 13H13V19H11V13H5V11H11V5H13V11H19V13Z" fill="currentColor"/>
                  <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z" fill="currentColor"/>
                </svg>
                <span className="create-text">Create</span>
              </button>

              {/* Notifications */}
              <button className="navbar-icon-btn" aria-label="Notifications">
                <svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11 18c0 1.1-.9 2-2 2s-2-.9-2-2h4zm7.2-4.7L17 12V8c0-3.2-2.2-5.9-5.2-6.5V1c0-.6-.4-1-1-1s-1 .4-1 1v.5C6.8 2.1 4.6 4.8 4.6 8v4l-1.2 1.3c-.4.4-.4 1 0 1.4.2.2.4.3.7.3h12.4c.3 0 .5-.1.7-.3.4-.4.4-1 0-1.4zM6.6 13V8c0-2.2 1.8-4 4-4s4 1.8 4 4v5H6.6z" fill="currentColor"/>
                </svg>
              </button>

              {/* Profile Menu */}
              <div className="navbar-profile" ref={profileMenuRef}>
                <button 
                  className="navbar-profile-btn" 
                  aria-label="User menu"
                  onClick={toggleProfileMenu}
                >
                  <Avatar 
                    src={user.avatar} 
                    username={user.username}
                    size="small"
                  />
                  <svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" className="dropdown-icon">
                    <path d="M14.17 6.71l-3.88 3.88-3.88-3.88c-.39-.39-1.02-.39-1.41 0-.39.39-.39 1.02 0 1.41l4.59 4.59c.39.39 1.02.39 1.41 0l4.59-4.59c.39-.39.39-1.02 0-1.41-.39-.39-1.03-.39-1.42 0z" fill="currentColor"/>
                  </svg>
                </button>

                {/* Profile Dropdown Menu */}
                {profileMenuOpen && (
                  <div className="profile-dropdown">
                    {/* View Profile */}
                    <button className="profile-dropdown-item profile-header" onClick={handleViewProfile}>
                      <Avatar 
                        src={user.avatar} 
                        username={user.username}
                        size="medium"
                      />
                      <div className="profile-info">
                        <span className="profile-title">View Profile</span>
                        <span className="profile-subtitle">u/{user.username}</span>
                      </div>
                    </button>

                    <div className="profile-dropdown-divider"></div>

                    {/* Edit Profile */}
                    <button className="profile-dropdown-item" onClick={handleEditProfile}>
                      <svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" fill="currentColor"/>
                      </svg>
                      <span>Edit Profile</span>
                    </button>

                    {/* Dark Mode Toggle */}
                    <div className="profile-dropdown-item dark-mode-item">
                      <div className="dark-mode-label">
                        <svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" fill="currentColor"/>
                        </svg>
                        <span>Dark Mode</span>
                      </div>
                      <label className="toggle-switch">
                        <input 
                          type="checkbox" 
                          checked={darkMode}
                          onChange={(e) => setDarkMode(e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>

                    <div className="profile-dropdown-divider"></div>

                    {/* Settings */}
                    <button className="profile-dropdown-item" onClick={handleSettings}>
                      <svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" fill="currentColor"/>
                      </svg>
                      <span>Settings</span>
                    </button>

                    {/* Log Out */}
                    <button className="profile-dropdown-item logout-item" onClick={handleLogout}>
                      <svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L9.414 9H17a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z" fill="currentColor"/>
                      </svg>
                      <span>Log Out</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
