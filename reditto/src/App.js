import React, { useState } from 'react';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('login'); // 'login' or 'register'

  return (
    <div className="App">
      {currentPage === 'login' ? (
        <Login onSwitchToRegister={() => setCurrentPage('register')} />
      ) : (
        <Register onSwitchToLogin={() => setCurrentPage('login')} />
      )}
    </div>
  );
}

export default App;
