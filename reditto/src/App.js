import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home/Home';
import PostPage from './pages/PostPage/PostPage';
import CommentThread from './pages/CommentThread/CommentThread';
import CommunityPage from './pages/CommunityPage/CommunityPage';
import CreateCommunity from './pages/CreateCommunity/CreateCommunity';
import CreatePost from './pages/CreatePost/CreatePost';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';

import { authService } from './services/authService';
import { searchAPI } from './services/api';
import UserPage from './pages/UserPage/UserPage';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);
  const [userVoteVersion, setUserVoteVersion] = useState(0);
  const [darkMode, setDarkMode] = useState(true);
  const [sidebarExpanded, setSidebarExpanded] = useState(() => {
    const saved = localStorage.getItem('reditto_sidebar_expanded');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  // Check if user is already logged in on mount
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const token = authService.getToken();
      if (token) {
        // Keep local user immediately so refresh doesn't log out the UI
        const localUser = authService.getUser();
        if (localUser) setUser(localUser);

        try {
          console.log('Attempting to refresh current user from API...');
          const response = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/me`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.ok) {
            const data = await response.json();
            console.log('API returned user:', data.user);
            setUser(data.user);
            authService.saveUser(data.user);
          } else if (response.status === 401 || response.status === 403) {
            console.error('Token invalid or expired:', response.status);
            // Clear auth only on explicit authorization failures
            authService.clearAuth();
            setUser(null);
          } else {
            console.warn('Non-auth error fetching current user, keeping local auth. Status:', response.status);
            // keep local cached user
          }
        } catch (error) {
          console.error('Network error while fetching current user, keeping local auth:', error);
          // Network issues shouldn't log the user out — keep the locally cached user
        }
      }
      setUserLoading(false);
    };

    fetchCurrentUser();

    // Listen for custom user update events (triggered when user data changes in other components)
    const handleUserUpdate = (event) => {
      if (event.detail?.user) {
        setUser(event.detail.user);
        // Increment version to trigger refetch in components that depend on vote state
        setUserVoteVersion(prev => prev + 1);
      }
    };

    window.addEventListener('userDataUpdated', handleUserUpdate);

    return () => {
      window.removeEventListener('userDataUpdated', handleUserUpdate);
    };
  }, []);

  // Apply dark mode class to body
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [darkMode]);

  // Save sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem('reditto_sidebar_expanded', JSON.stringify(sidebarExpanded));
  }, [sidebarExpanded]);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  const handleRegisterSuccess = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    authService.clearAuth();
    setUser(null);
  };

  const handleSearch = async (query) => {
    if (!query || query.trim() === '') {
      setSearchResults(null);
      return;
    }

    try {
      setIsSearching(true);
      const results = await searchAPI.globalSearch(query, 10);
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults({ communities: [], users: [], posts: [], query, totalResults: 0 });
    } finally {
      setIsSearching(false);
    }
  };

  const handleJoinCommunity = async (communityName, isJoining, communityId) => {
    if (!user) return;

    try {
      // Update user's joined communities locally
      const updatedUser = { ...user };
      if (!updatedUser.communities) {
        updatedUser.communities = { joined: [], created: [], moderated: [] };
      }
      
      // Ensure joined is an array
      const currentJoined = Array.isArray(updatedUser.communities.joined) 
        ? updatedUser.communities.joined 
        : [];

      console.log('Current joined communities:', currentJoined);

      console.log('Current joined communities:', currentJoined);
      
      let updatedJoined = [...currentJoined];

      if (isJoining) {
        // Add community ID to joined list if not already present
        if (communityId && !updatedJoined.includes(communityId)) {
          updatedJoined.push(communityId);
        }
      } else {
        // Remove community ID from joined list
        updatedJoined = updatedJoined.filter(id => id !== communityId);
      }

      console.log('Updated joined communities:', updatedJoined);

      // Call API to update user
      const response = await fetch(`process.env.REACT_APP_API_UR/users/${user._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          communities: {
            joined: updatedJoined
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        authService.saveUser(data.user);
      }
    } catch (error) {
      console.error('Failed to join/unjoin community:', error);
    }
  };

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home user={user} userLoading={userLoading} userVoteVersion={userVoteVersion} onLogout={handleLogout} onJoinCommunity={handleJoinCommunity} darkMode={darkMode} setDarkMode={setDarkMode} sidebarExpanded={sidebarExpanded} setSidebarExpanded={setSidebarExpanded} onSearch={handleSearch} searchResults={searchResults} isSearching={isSearching} />} />
          <Route path="/create/community" element={<CreateCommunity user={user} userLoading={userLoading} onLogout={handleLogout} darkMode={darkMode} setDarkMode={setDarkMode} sidebarExpanded={sidebarExpanded} setSidebarExpanded={setSidebarExpanded} onSearch={handleSearch} />} />
          <Route path="/create/post" element={<CreatePost user={user} userLoading={userLoading} onLogout={handleLogout} darkMode={darkMode} setDarkMode={setDarkMode} sidebarExpanded={sidebarExpanded} setSidebarExpanded={setSidebarExpanded} onSearch={handleSearch} />} />
          <Route path="/r/:communityName/posts/:postId" element={<PostPage user={user} onLogout={handleLogout} darkMode={darkMode} setDarkMode={setDarkMode} sidebarExpanded={sidebarExpanded} setSidebarExpanded={setSidebarExpanded} onSearch={handleSearch} searchResults={searchResults} isSearching={isSearching} />} />
          <Route path="/r/comments/:commentId" element={<CommentThread user={user} onLogout={handleLogout} darkMode={darkMode} setDarkMode={setDarkMode} sidebarExpanded={sidebarExpanded} setSidebarExpanded={setSidebarExpanded} onSearch={handleSearch} />} />
          <Route path="/r/:communityName" element={<CommunityPage user={user} userLoading={userLoading} userVoteVersion={userVoteVersion} onLogout={handleLogout} onJoinCommunity={handleJoinCommunity} darkMode={darkMode} setDarkMode={setDarkMode} sidebarExpanded={sidebarExpanded} setSidebarExpanded={setSidebarExpanded} onSearch={handleSearch} />} />
          <Route path="/u/:username" element={<UserPage user={user} onLogout={handleLogout} darkMode={darkMode} setDarkMode={setDarkMode} sidebarExpanded={sidebarExpanded} setSidebarExpanded={setSidebarExpanded} onSearch={handleSearch} />} />
          <Route path="/login" element={<Login onLoginSuccess={handleLoginSuccess} />} />
          <Route path="/register" element={<Register onRegisterSuccess={handleRegisterSuccess} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

