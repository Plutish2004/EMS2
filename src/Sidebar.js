// src/Sidebar.js
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = ({ open, setOpen }) => {
  const location = useLocation();
  // Fix: Get user role from the stored user object
  const user = JSON.parse(localStorage.getItem('user'));
  const userRole = user?.role; // This will get the role from the user object

  const isActive = (path) => location.pathname === path;

  return (
    <div className={`sidebar ${open ? 'open' : 'closed'}`}>
      <div className="sidebar-top">
        <button className="custom-toggle" onClick={() => setOpen(!open)}>
          <span className="bar top-bar"></span>
          <span className="bar middle-bar"></span>
          <span className="bar bottom-bar"></span>
        </button>

        {open && (
          <div className="sidebar-branding">
            <img src="/icons/logo.png" title="KJL Logo" alt="Logo" className="sidebar-logo" />
            <div className="sidebar-text">
              <div className="lodge-name">The Kanchan Jungha Lodge</div>
              <div className="ems-label">EMS</div>
            </div>
          </div>
        )}
        {!open && (
          <div className="sidebar-branding">
            <img src="/icons/logo.png" alt="Logo" className="sidebar-logo small" />
          </div>
        )}
      </div>

      <nav className="nav-links">
        <Link to="/add-employee" className={isActive('/add-employee') ? 'active' : ''}>
          <img src="/icons/add-employee.png" alt="Add" className="nav-icon" />
          {open && <span>Add Employee</span>}
        </Link>
        <Link to="/employees" className={isActive('/employees') ? 'active' : ''}>
          <img src="/icons/all-employees.png" alt="All" className="nav-icon" />
          {open && <span>All Employees</span>}
        </Link>
        <Link to="/leave-tracking" className={isActive('/leave-tracking') ? 'active' : ''}>
          <img src="/icons/leave-tracking.png" alt="Leave" className="nav-icon" />
          {open && <span>Leave Tracking</span>}
        </Link>
        <Link to="/salary-logger" className={isActive('/salary-logger') ? 'active' : ''}>
          <img src="/icons/salary-payment.png" alt="Salary Logger" className="nav-icon" />
          {open && <span>Salary Payment</span>}
        </Link>
      </nav>

      {/* Fix: Show Control Center if user role is 'admin' */}
      {userRole === 'admin' && (
        <div className="nav-links bottom">
          <Link to="/control-center" className={isActive('/control-center') ? 'active' : ''}>
            <img src="/icons/settings.png" alt="Control Center" className="nav-icon" />
            {open && <span>Control Center</span>}
          </Link>
        </div>
      )}
    </div>
  );
};

export default Sidebar;