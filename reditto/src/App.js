import React, { useState, useEffect } from 'react';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import { authService } from './services/authService';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('login'); // 'login' or 'register'
  const [user, setUser] = useState(null);

  // Check if user is already logged in on mount
  useEffect(() => {
    const savedUser = authService.getUser();
    if (savedUser) {
      setUser(savedUser);
    }
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    // Will redirect to home/dashboard later
    console.log('User logged in:', userData);
  };

  const handleRegisterSuccess = (userData) => {
    setUser(userData);
    // Will redirect to home/dashboard later
    console.log('User registered:', userData);
  };

  const handleLogout = () => {
    authService.clearAuth();
    setUser(null);
    setCurrentPage('login');
  };

  // If user is logged in, show welcome message (temporary until we build home page)
  if (user) {
    return (
      <div className="App">
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <h1>Welcome, {user.displayName || user.username}!</h1>
          <p>Email: {user.email}</p>
          <p>Karma: Post {user.karma.postKarma} | Comment {user.karma.commentKarma}</p>
          <button 
            onClick={handleLogout}
            style={{
              padding: '10px 20px',
              marginTop: '20px',
              backgroundColor: '#ff4500',
              color: 'white',
              border: 'none',
              borderRadius: '20px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      {currentPage === 'login' ? (
        <Login 
          onSwitchToRegister={() => setCurrentPage('register')} 
          onLoginSuccess={handleLoginSuccess}
        />
      ) : (
        <Register 
          onSwitchToLogin={() => setCurrentPage('login')}
          onRegisterSuccess={handleRegisterSuccess}
        />
      )}
    </div>
  );
}

export default App;
