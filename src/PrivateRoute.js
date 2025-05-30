// PrivateRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children, allowedRoles }) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  const userRole = localStorage.getItem('userRole');

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(userRole)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default PrivateRoute;