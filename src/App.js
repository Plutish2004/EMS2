// src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AddEmployeeForm from './AddEmployeeForm';
import EmployeeList from './EmployeeList';
import Sidebar from './Sidebar';
import LeaveTracking from './LeaveTracking';
import SalaryLogger from './SalaryLogger';
import EmployeeProfile from './EmployeeProfile';
import Login from './Login';
import ControlCenter from './ControlCenter';
import UserAccessSettings from './UserAccessSettings';
import Header from './Header';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentDateTime] = useState('2025-04-25 08:36:27');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      setCurrentUser(user);
      setIsAuthenticated(true);
    }
  }, []);

  const ProtectedRoute = ({ children }) => {
    if (!isAuthenticated) {
      return <Navigate to="/login" />;
    }
    return children;
  };

  return (
    <Router>
      <div className="app">
        {isAuthenticated && (
          <>
            <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
            <Header 
              setIsAuthenticated={setIsAuthenticated}
              currentDateTime={currentDateTime}
              currentUser={currentUser}
              setCurrentUser={setCurrentUser}
            />
          </>
        )}
        <main className={`main-content ${isAuthenticated ? 'authenticated' : ''}`}>
          <Routes>
            <Route
              path="/"
              element={
                isAuthenticated ? 
                <Navigate to="/add-employee" /> : 
                <Navigate to="/login" />
              }
            />
            
            <Route 
              path="/login" 
              element={
                isAuthenticated ? 
                <Navigate to="/add-employee" /> : 
                <Login 
                  setIsAuthenticated={setIsAuthenticated}
                  setCurrentUser={setCurrentUser}
                />
              } 
            />

            <Route
              path="/add-employee"
              element={
                <ProtectedRoute>
                  <AddEmployeeForm />
                </ProtectedRoute>
              }
            />

            <Route
              path="/control-center"
              element={
                <ProtectedRoute>
                  <ControlCenter />
                </ProtectedRoute>
              }
            />

            <Route
              path="/user-access-settings"
              element={
                <ProtectedRoute>
                  <UserAccessSettings 
                    currentDateTime={currentDateTime}
                    currentUser={currentUser}
                  />
                </ProtectedRoute>
              }
            />

            <Route
              path="/employees"
              element={
                <ProtectedRoute>
                  <EmployeeList />
                </ProtectedRoute>
              }
            />

            <Route
              path="/leave-tracking"
              element={
                <ProtectedRoute>
                  <LeaveTracking />
                </ProtectedRoute>
              }
            />

            <Route
              path="/salary-logger"
              element={
                <ProtectedRoute>
                  <SalaryLogger 
                    currentDateTime={currentDateTime}
                    currentUser={currentUser}
                  />
                </ProtectedRoute>
              }
            />

            <Route
              path="/employees/:id"
              element={
                <ProtectedRoute>
                  <EmployeeProfile />
                </ProtectedRoute>
              }
            />

            <Route
              path="*"
              element={
                isAuthenticated ? 
                <Navigate to="/add-employee" /> : 
                <Navigate to="/login" />
              }
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;