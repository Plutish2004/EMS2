// src/Header.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Header.css';

const Header = ({ setIsAuthenticated }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    navigate('/login');
  };

  return (
    <div className="header">
      <div className="header-title">Employee Management System</div>
      <div className="header-actions">
        <button onClick={handleLogout} className="logout-button">Logout</button>
      </div>
    </div>
  );
};

export default Header;