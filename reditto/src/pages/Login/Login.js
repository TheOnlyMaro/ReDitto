import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input, Button, Card, Alert } from '../../components';
import { authAPI } from '../../services/api';
import { authService } from '../../services/authService';
import './Login.css';

const Login = ({ onLoginSuccess }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [alert, setAlert] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert(null);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Call backend API
      const response = await authAPI.login({
        email: formData.email,
        password: formData.password
      });

      // Save token and user to localStorage
      authService.saveAuth(response.token, response.user);

      setAlert({
        type: 'success',
        message: 'Login successful! Redirecting...'
      });

      // Call onLoginSuccess callback if provided
      if (onLoginSuccess) {
        onLoginSuccess(response.user);
      }

      // Navigate to home page
      setTimeout(() => {
        navigate('/');
      }, 1000);
    } catch (error) {
      setAlert({
        type: 'error',
        message: error.message || 'Failed to login. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-content">
        <div className="auth-header">
          <div className="auth-logo">
            <img src="/logo192.png" alt="ReDitto Logo" />
          </div>
          <h1 className="auth-title">Welcome back to ReDitto</h1>
          <p className="auth-subtitle">Log in to your account</p>
        </div>

        <Card className="auth-card">
          {alert && (
            <Alert 
              type={alert.type} 
              message={alert.message}
              onClose={() => setAlert(null)}
            />
          )}

          <form onSubmit={handleSubmit}>
            <Input
              label="Email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your.email@example.com"
              error={errors.email}
              required
              icon={
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
              }
            />

            <Input
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              error={errors.password}
              required
              icon={
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              }
            />

            <div className="auth-forgot">
              <a href="#" className="auth-link">Forgot password?</a>
            </div>

            <Button 
              type="submit" 
              variant="primary" 
              size="large" 
              fullWidth
              disabled={isLoading}
            >
              {isLoading ? 'Logging in...' : 'Log In'}
            </Button>
          </form>
        </Card>

        <div className="auth-footer">
          <p>
            Don't have an account?{' '}
            <button onClick={() => navigate('/register')} className="auth-link-button">
              Sign Up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
