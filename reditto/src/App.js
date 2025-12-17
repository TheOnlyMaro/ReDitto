import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home/Home';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import { authService } from './services/authService';
import './App.css';

function App() {
  // Dummy user data for testing
  const dummyUser = {
    username: 'testuser',
    email: 'testuser@reditto.com',
    avatar: 'https://i.pravatar.cc/150?img=3',
    id: 1
  };

  const [user, setUser] = useState(dummyUser); // Start with dummy user for testing
  const [darkMode, setDarkMode] = useState(true);

  // Check if user is already logged in on mount
  useEffect(() => {
    const savedUser = authService.getUser();
    if (savedUser) {
      setUser(savedUser);
    }
  }, []);

  // Apply dark mode class to body
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [darkMode]);

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

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home user={user} onLogout={handleLogout} darkMode={darkMode} setDarkMode={setDarkMode} />} />
          <Route path="/login" element={<Login onLoginSuccess={handleLoginSuccess} darkMode={darkMode} />} />
          <Route path="/register" element={<Register onRegisterSuccess={handleRegisterSuccess} darkMode={darkMode} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

