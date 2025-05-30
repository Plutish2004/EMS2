// src/ControlCenter.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ControlCenter.css';

const ControlCenter = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    role: 'user'
  });
  const [editingUser, setEditingUser] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentTime, setCurrentTime] = useState('2025-04-24 20:00:19');
  const currentUsername = 'Plutish2004';

  // Fetch current time
  useEffect(() => {
    const fetchTime = async () => {
      try {
        const now = new Date('2025-04-24 20:00:19');
        const year = now.getUTCFullYear();
        const month = String(now.getUTCMonth() + 1).padStart(2, '0');
        const day = String(now.getUTCDate()).padStart(2, '0');
        const hours = String(now.getUTCHours()).padStart(2, '0');
        const minutes = String(now.getUTCMinutes()).padStart(2, '0');
        const seconds = String(now.getUTCSeconds()).padStart(2, '0');
        
        const formattedTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        setCurrentTime(formattedTime);
      } catch (err) {
        console.error('Error setting time:', err);
      }
    };

    fetchTime();
    const timer = setInterval(fetchTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch users
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/users', {
        headers: { 
          'username': currentUsername,
          'Content-Type': 'application/json'
        }
      });
      setUsers(response.data);
    } catch (err) {
      setError('Failed to fetch users');
      console.error('Error:', err.response?.data);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (editingUser) {
      setEditingUser({
        ...editingUser,
        [name]: value
      });
    } else {
      setNewUser({
        ...newUser,
        [name]: value
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      if (editingUser) {
        // Prepare update data
        const updateData = {
          username: editingUser.username,
          role: editingUser.role
        };
        
        // Only include password if it's not empty
        if (editingUser.password && editingUser.password.trim() !== '') {
          updateData.password = editingUser.password;
        }

        // Update existing user
        const response = await axios.put(
          `http://localhost:5000/api/users/${editingUser.id}`,
          updateData,
          {
            headers: { 
              'username': currentUsername,
              'Content-Type': 'application/json'
            }
          }
        );

        setSuccess(response.data.message || 'User updated successfully');
        setEditingUser(null);
      } else {
        // Create new user
        const response = await axios.post(
          'http://localhost:5000/api/users',
          newUser,
          {
            headers: { 
              'username': currentUsername,
              'Content-Type': 'application/json'
            }
          }
        );
        setSuccess(response.data.message || 'User created successfully');
        setNewUser({ username: '', password: '', role: 'user' });
      }
      
      // Refresh users list
      fetchUsers();
    } catch (err) {
      const errorMessage = err.response?.data?.message || 
                          (editingUser ? 'Failed to update user' : 'Failed to create user');
      setError(errorMessage);
      console.error('Error:', err.response || err);
    }
  };

  const handleEdit = (user) => {
    setEditingUser({
      ...user,
      password: '' // Clear password field for security
    });
    setNewUser({ username: '', password: '', role: 'user' });
    setError('');
    setSuccess('');
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setNewUser({ username: '', password: '', role: 'user' });
    setError('');
    setSuccess('');
  };

  const handleDelete = async (userId, username) => {
    if (username === currentUsername) {
      setError("You cannot delete your own account");
      return;
    }

    if (window.confirm(`Are you sure you want to delete user ${username}?`)) {
      try {
        const response = await axios.delete(
          `http://localhost:5000/api/users/${userId}`,
          {
            headers: { 
              'username': currentUsername,
              'Content-Type': 'application/json'
            }
          }
        );
        setSuccess(response.data.message || 'User deleted successfully');
        fetchUsers();
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete user');
      }
    }
  };

  const navigateToUserAccess = () => {
    navigate('/user-access-settings');
  };

  return (
    <div className="control-center">
      <div className="header-info">
        <h2>User Control Center</h2>
        <p className="time-info">
          Current Date and Time (UTC - YYYY-MM-DD HH:MM:SS formatted): {currentTime}
        </p>
        <p className="admin-info">Current User's Login: {currentUsername}</p>
        <button 
          onClick={navigateToUserAccess}
          className="access-settings-button"
        >
          Edit User Access
        </button>
      </div>

      <div className="create-user-section">
        <h3>{editingUser ? 'Edit User' : 'Create New User'}</h3>
        <form onSubmit={handleSubmit} className="create-user-form">
          <div className="form-group">
            <label>Username:</label>
            <input
              type="text"
              name="username"
              value={editingUser ? editingUser.username : newUser.username}
              onChange={handleInputChange}
              required
              minLength="3"
            />
          </div>

          <div className="form-group">
            <label>
              Password:
              {editingUser && ' (Leave blank to keep current password)'}
            </label>
            <input
              type="password"
              name="password"
              value={editingUser ? editingUser.password : newUser.password}
              onChange={handleInputChange}
              required={!editingUser}
              minLength="6"
            />
          </div>

          <div className="form-group">
            <label>Role:</label>
            <select
              name="role"
              value={editingUser ? editingUser.role : newUser.role}
              onChange={handleInputChange}
              required
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="form-actions">
            <button type="submit" className="submit-button">
              {editingUser ? 'Update User' : 'Create User'}
            </button>
            {editingUser && (
              <button 
                type="button" 
                onClick={handleCancelEdit} 
                className="cancel-button"
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="users-section">
        <h3>Existing Users</h3>
        <table className="users-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.username}</td>
                <td>{user.role}</td>
                <td>
                  <button
                    onClick={() => handleEdit(user)}
                    className="edit-button"
                    disabled={editingUser && editingUser.id === user.id}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(user.id, user.username)}
                    className="delete-button"
                    disabled={user.username === currentUsername}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ControlCenter;