// src/Login.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Login.css';

const Login = ({ setIsAuthenticated, setCurrentUser }) => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const response = await axios.post('http://localhost:5000/api/login', credentials);
      
      const userData = {
        username: response.data.user.username,
        role: response.data.user.role,
        id: response.data.user.id
      };

      // Store user data
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Update authentication state
      setIsAuthenticated(true);
      setCurrentUser(userData);
      
      // Navigate to add-employee
      navigate('/add-employee');
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Invalid username or password');
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Employee Management System</h2>
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>Username:</label>
            <input
              type="text"
              name="username"
              value={credentials.username}
              onChange={handleInputChange}
              required
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label>Password:</label>
            <input
              type="password"
              name="password"
              value={credentials.password}
              onChange={handleInputChange}
              required
              autoComplete="current-password"
            />
          </div>

          {error && <div className="error-message">{error}</div>}
          
          <button type="submit">Login</button>
        </form>
      </div>
    </div>
  );
};

export default Login;