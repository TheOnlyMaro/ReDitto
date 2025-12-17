import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '../Logo/Logo';
import SearchBar from '../SearchBar/SearchBar';
import Avatar from '../Avatar/Avatar';
import Button from '../Button/Button';
import './Navbar.css';

const Navbar = ({ user, onSearch }) => {
  const navigate = useNavigate();
  const isLoggedIn = !!user;

  const handleLoginClick = () => {
    navigate('/login');
  };

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
              <div className="navbar-profile">
                <button className="navbar-profile-btn" aria-label="User menu">
                  <Avatar 
                    src={user.avatar} 
                    username={user.username}
                    size="small"
                  />
                  <svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" className="dropdown-icon">
                    <path d="M14.17 6.71l-3.88 3.88-3.88-3.88c-.39-.39-1.02-.39-1.41 0-.39.39-.39 1.02 0 1.41l4.59 4.59c.39.39 1.02.39 1.41 0l4.59-4.59c.39-.39.39-1.02 0-1.41-.39-.39-1.03-.39-1.42 0z" fill="currentColor"/>
                  </svg>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
