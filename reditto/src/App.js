import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home/Home';
import PostPage from './pages/PostPage/PostPage';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import { authService } from './services/authService';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [sidebarExpanded, setSidebarExpanded] = useState(() => {
    const saved = localStorage.getItem('reditto_sidebar_expanded');
    return saved !== null ? JSON.parse(saved) : true;
  });

  // Check if user is already logged in on mount
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const token = authService.getToken();
      if (token) {
        try {
          console.log('Fetching current user from API...');
          // Fetch fresh user data from the server
          const response = await fetch('http://localhost:5000/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.ok) {
            const data = await response.json();
            console.log('API returned user:', data.user);
            console.log('User communities.joined:', data.user?.communities?.joined);
            setUser(data.user);
            authService.saveUser(data.user);
          } else {
            console.error('API returned error:', response.status);
            // Token is invalid, clear auth
            authService.clearAuth();
          }
        } catch (error) {
          console.error('Failed to fetch user from API:', error);
          authService.clearAuth();
        }
      }
      setUserLoading(false);
    };

    fetchCurrentUser();
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
      const response = await fetch(`http://localhost:5000/api/users/${user._id}`, {
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
          <Route path="/" element={<Home user={user} userLoading={userLoading} onLogout={handleLogout} onJoinCommunity={handleJoinCommunity} darkMode={darkMode} setDarkMode={setDarkMode} sidebarExpanded={sidebarExpanded} setSidebarExpanded={setSidebarExpanded} />} />
          <Route path="/r/:communityName/posts/:postId" element={<PostPage user={user} onLogout={handleLogout} darkMode={darkMode} setDarkMode={setDarkMode} sidebarExpanded={sidebarExpanded} setSidebarExpanded={setSidebarExpanded} />} />
          <Route path="/r/:communityName" element={<div style={{padding: '100px', textAlign: 'center'}}>Community Page - Coming Soon</div>} />
          <Route path="/user/:username" element={<div style={{padding: '100px', textAlign: 'center'}}>User Profile - Coming Soon</div>} />
          <Route path="/login" element={<Login onLoginSuccess={handleLoginSuccess} />} />
          <Route path="/register" element={<Register onRegisterSuccess={handleRegisterSuccess} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

