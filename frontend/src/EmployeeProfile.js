// EmployeeProfile.js
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Modal from './Modal';
import axios from 'axios';
import './EmployeeProfile.css';

const EmployeeProfile = () => {
  const { id } = useParams();
  const [employee, setEmployee] = useState({});
  const [permissions, setPermissions] = useState({
    allow_salary_logging: false,
    allow_advance_logging: false,
    allow_salary_view: false,
    allow_advance_view: false,
    allow_salary_edit: false,
    allow_salary_delete: false,
    allow_advance_edit: false,
    allow_advance_delete: false,
    allow_leave_logging: false,
    allow_leave_edit: false,
    allow_leave_delete: false
  });
  const [leaves, setLeaves] = useState({
    currentMonthLeave: 0,
    employeeMonthLeave: 0,
    totalLeaves: 0,
    leaveHistory: []
  });
  const [salary, setSalary] = useState([]);
  const [withdrawals, setWithdrawals] = useState({
    totalAmount: 0,
    currentMonthAmount: 0,
    totalAdvanceAmount: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentDateTime, setCurrentDateTime] = useState('2025-04-26 07:27:02');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const currentUser = 'Plutish2004';

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      now.setFullYear(2025);
      const year = now.getUTCFullYear();
      const month = String(now.getUTCMonth() + 1).padStart(2, '0');
      const day = String(now.getUTCDate()).padStart(2, '0');
      const hours = String(now.getUTCHours()).padStart(2, '0');
      const minutes = String(now.getUTCMinutes()).padStart(2, '0');
      const seconds = String(now.getUTCSeconds()).padStart(2, '0');
      
      const formatted = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      setCurrentDateTime(formatted);
    };

    updateDateTime();
    const timer = setInterval(updateDateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/control-settings', {
          headers: { 
            'username': currentUser,
            'Content-Type': 'application/json'
          }
        });
        
        const settingsData = response.data.reduce((acc, setting) => ({
          ...acc,
          [setting.setting_name]: Boolean(setting.setting_value)
        }), {});
        
        setPermissions(settingsData);
      } catch (err) {
        console.error('Error fetching permissions:', err);
        setError('Failed to load control settings');
      }
    };

    fetchPermissions();
  }, []);

  const fetchEmployeeData = async () => {
    try {
      setLoading(true);
      setError('');

      const empResponse = await axios.get(`http://localhost:5000/api/employees/${id}`, {
        headers: { 'username': currentUser }
      });
      setEmployee(empResponse.data);

      const salaryResponse = await axios.get(`http://localhost:5000/api/salary/history/${id}`, {
        headers: { 'username': currentUser }
      });
      setSalary(salaryResponse.data);

      const leavesResponse = await axios.get(`http://localhost:5000/api/leaves/employee/${id}`, {
        headers: { 'username': currentUser }
      });
      setLeaves({
        currentMonthLeave: leavesResponse.data.currentMonthLeave || 0,
        employeeMonthLeave: leavesResponse.data.employeeMonthLeave || 0,
        totalLeaves: leavesResponse.data.totalLeaves || 0,
        leaveHistory: leavesResponse.data.history || []
      });

      const withdrawalsResponse = await axios.get(`http://localhost:5000/api/salary/withdrawals/${id}`, {
        headers: { 'username': currentUser }
      });
      setWithdrawals({
        totalAmount: withdrawalsResponse.data.totalAmount || 0,
        currentMonthAmount: withdrawalsResponse.data.currentMonthAmount || 0,
        totalAdvanceAmount: withdrawalsResponse.data.totalAdvanceAmount || 0
      });

    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Error fetching data: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchEmployeeData();
    }
  }, [id]);

  const handleEdit = (record, type) => {
    setEditingRecord({
      ...record,
      recordType: type
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (recordId, type) => {
    if (!window.confirm('Are you sure you want to delete this record?')) {
      return;
    }

    try {
      let endpoint;
      if (type === 'salary') {
        endpoint = `http://localhost:5000/api/salary/${recordId}`;
      } else if (type === 'advance') {
        endpoint = `http://localhost:5000/api/advance/${recordId}`;
      } else if (type === 'leave') {
        endpoint = `http://localhost:5000/api/leaves/${recordId}`;
      }

      await axios.delete(endpoint, {
        headers: { 
          'username': currentUser,
          'Content-Type': 'application/json'
        }
      });

      fetchEmployeeData(); // Refresh all data
    } catch (err) {
      console.error('Error deleting record:', err);
      alert('Failed to delete record');
    }
  };

  const handleSaveEdit = async (editedRecord) => {
    try {
      let endpoint;
      if (editedRecord.recordType === 'salary' || editedRecord.recordType === 'advance') {
        endpoint = `http://localhost:5000/api/salary/update/${editedRecord.id}`;
      } else if (editedRecord.recordType === 'leave') {
        endpoint = `http://localhost:5000/api/leaves/update/${editedRecord.id}`;
      }

      const response = await axios.put(
        endpoint,
        editedRecord,
        {
          headers: {
            'Content-Type': 'application/json',
            'username': currentUser
          }
        }
      );

      if (response.data.success) {
        fetchEmployeeData(); // Refresh all data
        setIsModalOpen(false);
        setEditingRecord(null);
      } else {
        throw new Error('Failed to update record');
      }
    } catch (err) {
      console.error('Error updating record:', err);
      alert(err.response?.data?.error || 'Failed to update record. Please try again.');
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  // Continue with return statement in Part 2...
  return (
    <div className="employee-profile">
      <div className="header">
        <h1>Employee Profile</h1>
        <div className="header-right">
          <div className="datetime">Current Date and Time (UTC - YYYY-MM-DD HH:MM:SS formatted): {currentDateTime}</div>
          <div className="user">Current User's Login: {currentUser}</div>
        </div>
      </div>

      <div className="profile-form">
        <div className="form-grid">
          <div className="form-group">
            <label>Name</label>
            <input type="text" value={employee.name || ''} readOnly />
          </div>

          <div className="form-group">
            <label>ID Number</label>
            <input type="text" value={employee.id_number || ''} readOnly />
          </div>

          <div className="form-group">
            <label>Date of Birth</label>
            <input type="text" value={employee.dob || ''} readOnly />
          </div>

          <div className="form-group">
            <label>S/D/W of</label>
            <input type="text" value={employee.sdw_of || ''} readOnly />
          </div>

          <div className="form-group">
            <label>Mobile Number</label>
            <input type="text" value={employee.mobile_number || ''} readOnly />
          </div>

          <div className="form-group">
            <label>Address</label>
            <input type="text" value={employee.address || ''} readOnly />
          </div>

          <div className="form-group">
            <label>Role</label>
            <input type="text" value={employee.role || ''} readOnly />
          </div>

          <div className="form-group">
            <label>Joining Date</label>
            <input type="text" value={employee.joining_date || ''} readOnly />
          </div>

          <div className="form-group">
            <label>Salary</label>
            <input type="text" value={employee.salary ? `₹${parseFloat(employee.salary).toLocaleString('en-IN')}` : ''} readOnly />
          </div>
        </div>

        <div className="history-section">
          <div className="salary-section">
            <h2>Regular Salary History</h2>
            <div className="salary-table">
              <div className="table-row header">
                <div>Date</div>
                <div>Amount</div>
                <div>Status</div>
                {(permissions.allow_salary_edit || permissions.allow_salary_delete) && <div>Actions</div>}
              </div>
              {salary.filter(record => !record.type || record.type === 'salary').length > 0 ? (
                salary
                  .filter(record => !record.type || record.type === 'salary')
                  .map((record, index) => (
                    <div key={index} className="table-row">
                      <div>{record.date}</div>
                      <div>₹{parseFloat(record.amount).toLocaleString('en-IN')}</div>
                      <div>{record.checked ? 'Checked' : 'Pending'}</div>
                      <div className="action-buttons">
                        {permissions.allow_salary_edit && (
                          <button 
                            onClick={() => handleEdit(record, 'salary')}
                            className="edit-btn"
                            title="Edit"
                          >
                            <img src="/icons/edit2.png" alt="Edit" />
                          </button>
                        )}
                        {permissions.allow_salary_delete && (
                          <button 
                            onClick={() => handleDelete(record.id, 'salary')}
                            className="delete-btn"
                            title="Delete"
                          >
                            <img src="/icons/delete2.png" alt="Delete" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
              ) : (
                <div className="table-row empty">
                  <div colSpan="4">No regular salary records found</div>
                </div>
              )}
            </div>
          </div>

          <div className="advance-salary-section">
            <h2>Advance Salary History</h2>
            <div className="advance-table">
              <div className="table-row header">
                <div>Date</div>
                <div>Amount</div>
                <div>Status</div>
                {(permissions.allow_advance_edit || permissions.allow_advance_delete) && <div>Actions</div>}
              </div>
              {salary.filter(record => record.type === 'advance').length > 0 ? (
                salary
                  .filter(record => record.type === 'advance')
                  .map((record, index) => (
                    <div key={index} className="table-row">
                      <div>{record.date}</div>
                      <div>₹{parseFloat(record.amount).toLocaleString('en-IN')}</div>
                      <div>{record.checked ? 'Checked' : 'Pending'}</div>
                      <div className="action-buttons">
                        {permissions.allow_advance_edit && (
                          <button 
                            onClick={() => handleEdit(record, 'advance')}
                            className="edit-btn"
                            title="Edit"
                          >
                            <img src="/icons/edit2.png" alt="Edit" />
                          </button>
                        )}
                        {permissions.allow_advance_delete && (
                          <button 
                            onClick={() => handleDelete(record.id, 'advance')}
                            className="delete-btn"
                            title="Delete"
                          >
                            <img src="/icons/delete2.png" alt="Delete" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
              ) : (
                <div className="table-row empty">
                  <div colSpan="4">No advance salary records found</div>
                </div>
              )}
            </div>
          </div>

          <div className="leaves-section">
            <h2>Leave Information</h2>
            <div className="leave-stats">
              <div className="stat-item">
                <label>Current Month Leaves</label>
                <span>{leaves.currentMonthLeave} days</span>
              </div>
              <div className="stat-item">
                <label>Employee Month Leaves</label>
                <span>{leaves.employeeMonthLeave} days</span>
              </div>
              <div className="stat-item">
                <label>Total Leaves Taken</label>
                <span>{leaves.totalLeaves} days</span>
              </div>
            </div>

            <div className="leave-history">
              <h3>Leave History</h3>
              <div className="leave-table">
                <div className="table-row header">
                  <div>Date</div>
                  <div>Days</div>
                  <div>Reason</div>
                  <div>Status</div>
                  {(permissions.allow_leave_edit || permissions.allow_leave_delete) && <div>Actions</div>}
                </div>
                {leaves.leaveHistory.length > 0 ? (
                  leaves.leaveHistory.map((leave, index) => (
                    <div key={index} className="table-row">
                      <div>{leave.date}</div>
                      <div>{leave.days}</div>
                      <div>{leave.reason}</div>
                      <div>{leave.status}</div>
                      <div className="action-buttons">
                        {permissions.allow_leave_edit && (
                          <button 
                            onClick={() => handleEdit(leave, 'leave')}
                            className="edit-btn"
                            title="Edit"
                          >
                            <img src="/icons/edit2.png" alt="Edit" />
                          </button>
                        )}
                        {permissions.allow_leave_delete && (
                          <button 
                            onClick={() => handleDelete(leave.id, 'leave')}
                            className="delete-btn"
                            title="Delete"
                          >
                            <img src="/icons/delete2.png" alt="Delete" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="table-row empty">
                    <div colSpan="5">No leave records found</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setEditingRecord(null);
        }}
        onSubmit={handleSaveEdit}
        type={editingRecord?.recordType}
        data={editingRecord}
        currentDateTime={currentDateTime}
      />
    </div>
  );
};

export default EmployeeProfile;