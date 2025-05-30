// src/UserAccessSettings.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './UserAccessSettings.css';

const UserAccessSettings = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    allow_salary_logging: false,
    allow_advance_logging: false,
    allow_salary_edit: false,
    allow_salary_delete: false,
    allow_leave_edit: false,
    allow_leave_delete: false
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentDateTime] = useState('2025-04-25 13:32:09');
  const currentUsername = 'Plutish2004';

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/control-settings', {
        headers: { 
          'username': currentUsername,
          'Content-Type': 'application/json'
        }
      });
      
      // Convert the settings array to an object
      const settingsData = response.data.reduce((acc, setting) => ({
        ...acc,
        [setting.setting_name]: Boolean(setting.setting_value)
      }), {});
      
      setSettings(settingsData);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError('Failed to fetch settings');
      setLoading(false);
    }
  };

  const handleToggle = async (settingName) => {
    try {
      setError('');
      setSuccess('');
      
      const response = await axios.put(
        `http://localhost:5000/api/control-settings/${settingName}`,
        {
          value: !settings[settingName]
        },
        {
          headers: { 
            'username': currentUsername,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data) {
        setSettings(prev => ({
          ...prev,
          [settingName]: !prev[settingName]
        }));
        setSuccess(`${settingName.replace(/_/g, ' ')} updated successfully`);
      }
    } catch (err) {
      console.error('Error updating setting:', err);
      setError('Failed to update setting');
    }
  };

  const handleBack = () => {
    navigate('/control-center');
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="user-access-settings">
      <div className="header">
        <button onClick={handleBack} className="back-button">
          ← Back to Control Center
        </button>
        <div className="header-info">
          <h2>User Access Settings</h2>
          <p className="time-info">
            Current Date and Time (UTC - YYYY-MM-DD HH:MM:SS formatted): {currentDateTime}
          </p>
          <p className="user-info">Current User's Login: {currentUsername}</p>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="settings-container">
        <div className="settings-card">
          <h3>Salary Access Controls</h3>
          <div className="settings-grid">
            <div className="setting-item">
              <div className="setting-info">
                <h4>Regular Salary Logging</h4>
                <p>Allow users to log regular salary payments</p>
              </div>
              <div className="toggle-switch">
                <input
                  type="checkbox"
                  id="allow_salary_logging"
                  checked={settings.allow_salary_logging || false}
                  onChange={() => handleToggle('allow_salary_logging')}
                />
                <label htmlFor="allow_salary_logging" className="slider"></label>
              </div>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <h4>Advance Salary Logging</h4>
                <p>Allow users to log advance salary payments</p>
              </div>
              <div className="toggle-switch">
                <input
                  type="checkbox"
                  id="allow_advance_logging"
                  checked={settings.allow_advance_logging || false}
                  onChange={() => handleToggle('allow_advance_logging')}
                />
                <label htmlFor="allow_advance_logging" className="slider"></label>
              </div>
            </div>

            {/* New settings for salary edit/delete */}
            <div className="setting-item">
              <div className="setting-info">
                <h4>Salary Record Editing</h4>
                <p>Allow users to edit salary payment records</p>
              </div>
              <div className="toggle-switch">
                <input
                  type="checkbox"
                  id="allow_salary_edit"
                  checked={settings.allow_salary_edit || false}
                  onChange={() => handleToggle('allow_salary_edit')}
                />
                <label htmlFor="allow_salary_edit" className="slider"></label>
              </div>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <h4>Salary Record Deletion</h4>
                <p>Allow users to delete salary payment records</p>
              </div>
              <div className="toggle-switch">
                <input
                  type="checkbox"
                  id="allow_salary_delete"
                  checked={settings.allow_salary_delete || false}
                  onChange={() => handleToggle('allow_salary_delete')}
                />
                <label htmlFor="allow_salary_delete" className="slider"></label>
              </div>
            </div>
          </div>
        </div>

        <div className="settings-card">
          <h3>Leave Management Controls</h3>
          <div className="settings-grid">
            <div className="setting-item">
              <div className="setting-info">
                <h4>Leave Record Editing</h4>
                <p>Allow users to edit leave records</p>
              </div>
              <div className="toggle-switch">
                <input
                  type="checkbox"
                  id="allow_leave_edit"
                  checked={settings.allow_leave_edit || false}
                  onChange={() => handleToggle('allow_leave_edit')}
                />
                <label htmlFor="allow_leave_edit" className="slider"></label>
              </div>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <h4>Leave Record Deletion</h4>
                <p>Allow users to delete leave records</p>
              </div>
              <div className="toggle-switch">
                <input
                  type="checkbox"
                  id="allow_leave_delete"
                  checked={settings.allow_leave_delete || false}
                  onChange={() => handleToggle('allow_leave_delete')}
                />
                <label htmlFor="allow_leave_delete" className="slider"></label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserAccessSettings;