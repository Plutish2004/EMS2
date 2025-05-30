import React, { useState, useEffect } from 'react';
import axios from 'axios';
import dayjs from 'dayjs';
import './LeaveTracking.css';

const LeaveTracking = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [leaveDate, setLeaveDate] = useState('');
  const [leaveCounts, setLeaveCounts] = useState(null);
  const [onLeave, setOnLeave] = useState([]);
  const [endLeaveData, setEndLeaveData] = useState(null);
  const [endDate, setEndDate] = useState('');
  const [daysTaken, setDaysTaken] = useState('');
  const [leaveError, setLeaveError] = useState('');

  useEffect(() => {
    fetchEmployees();
    fetchOnLeave();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await axios.get('/api/employees');
      setEmployees(res.data);
    } catch (err) {
      console.error('Error fetching employees:', err);
    }
  };

  const fetchOnLeave = async () => {
    try {
      const res = await axios.get('/api/leaves/on-leave');
      setOnLeave(res.data);
    } catch (err) {
      console.error('Error fetching on-leave employees:', err);
    }
  };

  const fetchLeaveCounts = async (id) => {
    try {
      const res = await axios.get(`/api/leaves/counts/${id}`);
      setLeaveCounts(res.data);
    } catch (err) {
      setLeaveCounts(null);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setSelectedEmployee(null);
    setLeaveCounts(null);
    setLeaveDate('');
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setSelectedEmployee(null);
    setLeaveCounts(null);
    setLeaveDate('');
  };

  const handleSelectEmployee = (employee) => {
    setSelectedEmployee(employee);
    setSearchTerm(employee.name);
    fetchLeaveCounts(employee.id);
  };

  const handleMarkLeave = async () => {
    if (!selectedEmployee || !leaveDate) return;
    
    setLeaveError('');
    
    try {
      await axios.post('/api/leaves', {
        employee_id: selectedEmployee.id,
        start_date: leaveDate,
      });
      
      fetchOnLeave();
      fetchLeaveCounts(selectedEmployee.id);
      setLeaveDate('');
    } catch (err) {
      if (err.response && err.response.status === 400) {
        setLeaveError(err.response.data.error || "Employee is already on leave.");
      } else {
        setLeaveError("Something went wrong. Please try again.");
      }
    }
  };

  const handleEndLeave = (employee_id, name) => {
    setEndLeaveData({ employee_id, name });
    setEndDate('');
    setDaysTaken('');
  };

  const submitEndLeave = async () => {
    try {
      await axios.post('/api/leaves/end', {
        employee_id: endLeaveData.employee_id,
        end_date: endDate,
        days_taken: parseFloat(daysTaken),
      });
      fetchOnLeave();
      if (selectedEmployee && selectedEmployee.id === endLeaveData.employee_id) {
        fetchLeaveCounts(endLeaveData.employee_id);
      }
      setEndLeaveData(null);
    } catch (err) {
      console.error('Error ending leave:', err);
    }
  };

  const filteredEmployees = employees.filter(emp =>
    emp.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container">
      <div className="header">
        <h2 className="title">Leave Tracking</h2>
      </div>

      <div className="cards-container">
        {/* Left Card */}
        <div className="card">
          <div className="card-header">
            <h3>Log a Leave</h3>
          </div>
          <div className="card-content">
            <div className="search-section">
              <div className="search-container">
                <div className="search-box">
                  <label className="search-label">Search Employee</label>
                  <div className="search-input-container">
                    <input
                      value={searchTerm}
                      onChange={handleSearchChange}
                      className="search-input"
                      placeholder="Type employee name..."
                    />
                    <button onClick={handleClearSearch} className="refresh-button" title="Clear">
                      <img src="/icons/refresh.png" alt="Clear" className="icon" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {filteredEmployees.length > 0 && searchTerm && !selectedEmployee && (
              <div className="employee-list">
                {filteredEmployees.map(emp => (
                  <div
                    key={emp.id}
                    onClick={() => handleSelectEmployee(emp)}
                    className="employee-item"
                  >
                    {emp.name}
                  </div>
                ))}
              </div>
            )}

            {selectedEmployee && (
              <div className="selected-employee">
                <div className="date-input-container">
                  <label>Start Leave Date from</label>
                  <input
                    type="date"
                    value={leaveDate}
                    onChange={(e) => setLeaveDate(e.target.value)}
                    className="date-input"
                  />
                </div>

                <button className="mark-leave-button" onClick={handleMarkLeave}>
                  Mark on Leave
                </button>

                {leaveError && (
                  <div className="error-message">{leaveError}</div>
                )}

                {leaveCounts && (
                  <div className="leave-counts">
                    <div className="count-card current-month">
                      <h4>Current Month Leaves</h4>
                      <p>{leaveCounts.currentMonthLeave} days</p>
                    </div>
                    <div className="count-card employee-month">
                      <h4>Employee Leave Month</h4>
                      <p>{leaveCounts.employeeMonthLeave} days</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Card */}
        <div className="card">
          <div className="card-header">
            <h3>Employees Currently on Leave</h3>
          </div>
          <div className="card-content">
            <div className="leave-list">
              {onLeave.map(emp => (
                <div key={emp.employee_id} className="leave-item">
                  <div className="leave-info">
                    <p className="employee-name">{emp.name}</p>
                    <p className="leave-date">
                      Start: {dayjs(emp.start_date).format('DD MMM YYYY')}
                    </p>
                  </div>
                  <button
                    onClick={() => handleEndLeave(emp.employee_id, emp.name)}
                    className="end-leave-button"
                  >
                    End Leave
                  </button>
                </div>
              ))}
              {onLeave.length === 0 && (
                <div className="no-leaves">No employees currently on leave</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {endLeaveData && (
        <div className="modal-overlay">
          <div className="modal">
            <h3 className="modal-title">End {endLeaveData.name}'s Leave?</h3>
            <div className="modal-content">
              <div className="form-group">
                <label>Ending Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="date-input"
                />
              </div>
              <div className="form-group">
                <label>Leave Days Taken</label>
                <input
                  type="number"
                  step="0.1"
                  value={daysTaken}
                  onChange={(e) => setDaysTaken(e.target.value)}
                  className="number-input"
                />
              </div>
              <div className="modal-actions">
                <button
                  onClick={() => setEndLeaveData(null)}
                  className="cancel-button"
                >
                  Cancel
                </button>
                <button onClick={submitEndLeave} className="confirm-button">
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveTracking;