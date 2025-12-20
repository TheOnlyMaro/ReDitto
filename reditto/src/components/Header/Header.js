import React from 'react';
import { Link } from 'react-router-dom';
import './Header.css';

const Header = ({ user, onLogout }) => {
  return (
    <header className="header">
      <div className="header-container">
        <Link to="/" className="header-logo">
          <div className="logo-icon">
            <svg viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <circle cx="10" cy="10" r="10" fill="#FF4500"/>
              <circle cx="7" cy="8" r="1.5" fill="white"/>
              <circle cx="13" cy="8" r="1.5" fill="white"/>
              <path d="M 6 12 Q 10 15 14 12" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="logo-text">ReDitto</span>
        </Link>

        <div className="header-search">
          <input 
            type="text" 
            placeholder="Search ReDitto..." 
            className="search-input"
          />
        </div>

        <nav className="header-nav">
          {user ? (
            <>
              <Link to="/submit" className="nav-link">
                <span>Create Post</span>
              </Link>
              <div className="user-menu">
                <button className="user-button">
                  <img 
                    src={user.avatar || '/default-avatar.png'} 
                    alt={user.username}
                    className="user-avatar"
                  />
                  <span className="user-name">{user.username}</span>
                  <svg className="dropdown-icon" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="2" fill="none"/>
                  </svg>
                </button>
                <div className="user-dropdown">
                  <Link to={`/u/${user.username}`} className="dropdown-item">
                    My Profile
                  </Link>
                  <Link to="/settings" className="dropdown-item">
                    Settings
                  </Link>
                  <hr className="dropdown-divider" />
                  <button onClick={onLogout} className="dropdown-item logout-btn">
                    Log Out
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">
                Log In
              </Link>
              <Link to="/register" className="nav-link nav-link-primary">
                Sign Up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
