// src/SalaryLogger.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './SalaryLogger.css';

const SalaryLogger = ({ currentUser, currentDateTime }) => {
  const [employees, setEmployees] = useState([]);
  const [salarySearch, setSalarySearch] = useState('');
  const [advanceSearch, setAdvanceSearch] = useState('');
  const [selectedSalaryEmp, setSelectedSalaryEmp] = useState(null);
  const [selectedAdvanceEmp, setSelectedAdvanceEmp] = useState(null);
  const [salaryAmount, setSalaryAmount] = useState('');
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [salaryDate, setSalaryDate] = useState('2025-04-25');
  const [advanceDate, setAdvanceDate] = useState('2025-04-25');
  const [deductions, setDeductions] = useState(null);
  const [deductAdvance, setDeductAdvance] = useState(false);
  const [customAdvanceDeduct, setCustomAdvanceDeduct] = useState('');
  const [baseSalary, setBaseSalary] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userRole, setUserRole] = useState('');
  const [permissions, setPermissions] = useState({
    allow_salary_logging: false,
    allow_advance_logging: false
  });

  useEffect(() => {
    fetchEmployees();
    fetchPermissions();
    fetchUserRole();
  }, []);

  const fetchUserRole = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/users/role/${currentUser.username}`, {
        headers: {
          'username': currentUser.username,
          'Content-Type': 'application/json'
        }
      });
      console.log('User role:', response.data.role);
      setUserRole(response.data.role);
    } catch (err) {
      console.error('Failed to fetch user role:', err);
    }
  };

  const fetchPermissions = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/control-settings', {
        headers: {
          'username': currentUser.username,
          'Content-Type': 'application/json'
        }
      });
      const permissionsData = response.data.reduce((acc, setting) => ({
        ...acc,
        [setting.setting_name]: Boolean(setting.setting_value)
      }), {});
      setPermissions(permissionsData);
    } catch (err) {
      setError('Failed to fetch permissions');
    }
  };

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:5000/api/employees', {
        headers: {
          'username': currentUser.username,
          'Content-Type': 'application/json'
        }
      });
      setEmployees(res.data);
    } catch (err) {
      setError('Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEmployee = async (emp, type) => {
    try {
      if (type === 'salary') {
        setSelectedSalaryEmp(emp);
        setSalarySearch(emp.name);
        setBaseSalary(emp.salary);
        const deductions = await fetchDeductions(emp.id);
        setDeductions(deductions);
        const calculatedSalary = emp.salary - 
          (emp.salary / 30 * (deductions?.leaveDays || 0)) - 
          (deductions?.withdrawals || 0);
        setSalaryAmount(calculatedSalary.toFixed(2));
      } else {
        setSelectedAdvanceEmp(emp);
        setAdvanceSearch(emp.name);
      }
    } catch (err) {
      setError('Failed to fetch employee details');
    }
  };

  const fetchDeductions = async (id) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/salary/deductions/${id}`, {
        headers: {
          'username': currentUser.username,
          'Content-Type': 'application/json'
        }
      });
      return res.data;
    } catch (err) {
      setError('Failed to fetch deductions');
      return null;
    }
  };

  const handleLogSalary = async () => {
    try {
      // First, validate required fields
      if (!selectedSalaryEmp || !salaryAmount || !salaryDate) {
        setError('Please fill all required fields');
        return;
      }

      // Check permissions - if not admin, must have permission
      if (userRole !== 'admin' && !permissions.allow_salary_logging) {
        setError('You do not have permission to log salary payments');
        return;
      }

      await axios.post('http://localhost:5000/api/salary', {
        employee_id: selectedSalaryEmp.id,
        amount: parseFloat(salaryAmount),
        date: salaryDate,
        type: 'salary',
        logged_by: currentUser.username,
        logged_at: currentDateTime
      }, {
        headers: {
          'username': currentUser.username,
          'Content-Type': 'application/json'
        }
      });

      alert('Salary logged successfully');
      refreshSearch('salary');
    } catch (err) {
      console.error('Error logging salary:', err);
      setError('Failed to log salary');
    }
  };

  const handleLogAdvance = async () => {
    try {
      // First, validate required fields
      if (!selectedAdvanceEmp || !advanceAmount || !advanceDate) {
        setError('Please fill all required fields');
        return;
      }

      // Check permissions - if not admin, must have permission
      if (userRole !== 'admin' && !permissions.allow_advance_logging) {
        setError('You do not have permission to log advance payments');
        return;
      }

      await axios.post('http://localhost:5000/api/salary', {
        employee_id: selectedAdvanceEmp.id,
        amount: parseFloat(advanceAmount),
        date: advanceDate,
        type: 'advance',
        logged_by: currentUser.username,
        logged_at: currentDateTime
      }, {
        headers: {
          'username': currentUser.username,
          'Content-Type': 'application/json'
        }
      });

      alert('Advance logged successfully');
      refreshSearch('advance');
    } catch (err) {
      console.error('Error logging advance:', err);
      setError('Failed to log advance');
    }
  };

  const refreshSearch = (type) => {
    if (type === 'salary') {
      setSalarySearch('');
      setSelectedSalaryEmp(null);
      setDeductions(null);
      setSalaryAmount('');
      setSalaryDate('2025-04-25');
    } else {
      setAdvanceSearch('');
      setSelectedAdvanceEmp(null);
      setAdvanceAmount('');
      setAdvanceDate('2025-04-25');
    }
  };

  const filterEmployees = (search) =>
    employees.filter((emp) => emp.name.toLowerCase().includes(search.toLowerCase()));

  const calculateNetSalary = () => {
    if (!deductions || !baseSalary) return 0;
    return (
      baseSalary -
      (baseSalary / 30 * deductions.leaveDays) -
      deductions.withdrawals -
      (deductAdvance ? Number(customAdvanceDeduct || 0) : 0)
    ).toFixed(2);
  };

  return (
    <div className="salary-logger">
      <div className="header-info">
        <h2>Salary Logger</h2>
        <p className="time-info">
          Current Date and Time (UTC - YYYY-MM-DD HH:MM:SS formatted): {currentDateTime}
        </p>
        <p className="admin-info">Current User's Login: {currentUser.username}</p>
      </div>

      {error && <div className="error-message">{error}</div>}
      {loading && <div className="loading">Loading...</div>}

      <div className="card">
        <h3>Log Salary Payment</h3>
        <div className="search-container">
          <input
            type="text"
            value={salarySearch}
            onChange={(e) => setSalarySearch(e.target.value)}
            placeholder="Search employee..."
          />
          <button onClick={() => refreshSearch('salary')}>
            <img src="/icons/refresh.png" alt="refresh" style={{ width: 16 }} />
          </button>
          {salarySearch && (
            <div className="search-results">
              {filterEmployees(salarySearch).map((emp) => (
                <div
                  key={emp.id}
                  className={`search-item ${selectedSalaryEmp?.id === emp.id ? 'selected' : ''}`}
                  onClick={() => handleSelectEmployee(emp, 'salary')}
                >
                  {emp.name}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="input-group">
          <input
            type="date"
            value={salaryDate}
            onChange={(e) => setSalaryDate(e.target.value)}
          />
        </div>

        <div className="input-group">
          <input
            type="number"
            placeholder="Salary amount"
            value={salaryAmount}
            onChange={(e) => setSalaryAmount(e.target.value)}
          />
        </div>

        {deductions && (
          <div className="deductions-info">
            <p>Base Salary: ₹{baseSalary}</p>
            <p>
              Less: Leaves ({deductions.leaveDays} days): ₹
              {(baseSalary / 30 * deductions.leaveDays).toFixed(2)}
            </p>
            <p>Less: Withdrawals: ₹{deductions.withdrawals}</p>
            {deductions.advance > 0 && (
              <div className="advance-deduction">
                <label>
                  <input
                    type="checkbox"
                    checked={deductAdvance}
                    onChange={(e) => setDeductAdvance(e.target.checked)}
                  />
                  Deduct advance salary (custom)
                </label>
                {deductAdvance && (
                  <input
                    type="number"
                    placeholder="Advance deduction amount"
                    value={customAdvanceDeduct}
                    onChange={(e) => setCustomAdvanceDeduct(e.target.value)}
                  />
                )}
              </div>
            )}
            <p className="net-salary">
              Calculated Net Salary: ₹{calculateNetSalary()}
            </p>
            {Number(salaryAmount) !== Number(calculateNetSalary()) && (
              <p className="warning">
                Warning: The salary amount you're logging (₹{salaryAmount}) 
                differs from the calculated amount
              </p>
            )}
          </div>
        )}

        <button 
          onClick={handleLogSalary} 
          className="submit-button"
          disabled={userRole !== 'admin' && !permissions.allow_salary_logging}
        >
          {userRole === 'admin' ? 'Log Salary' : 'Log Salary'}
        </button>
        {userRole !== 'admin' && !permissions.allow_salary_logging && (
          <p className="permission-notice">You do not have permission to log salary payments</p>
        )}
      </div>

      <div className="card advance-section">
        <h3>Advance Salary Payment</h3>
        <div className="search-container">
          <input
            type="text"
            value={advanceSearch}
            onChange={(e) => setAdvanceSearch(e.target.value)}
            placeholder="Search employee..."
          />
          <button onClick={() => refreshSearch('advance')}>
            <img src="/icons/refresh.png" alt="refresh" style={{ width: 16 }} />
          </button>
          {advanceSearch && (
            <div className="search-results">
              {filterEmployees(advanceSearch).map((emp) => (
                <div
                  key={emp.id}
                  className={`search-item ${selectedAdvanceEmp?.id === emp.id ? 'selected' : ''}`}
                  onClick={() => handleSelectEmployee(emp, 'advance')}
                >
                  {emp.name}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="input-group">
          <input
            type="date"
            value={advanceDate}
            onChange={(e) => setAdvanceDate(e.target.value)}
          />
        </div>

        <div className="input-group">
          <input
            type="number"
            placeholder="Advance amount"
            value={advanceAmount}
            onChange={(e) => setAdvanceAmount(e.target.value)}
          />
        </div>

        <button 
          onClick={handleLogAdvance} 
          className="submit-button"
          disabled={userRole !== 'admin' && !permissions.allow_advance_logging}
        >
          {userRole === 'admin' ? 'Log Advance' : 'Log Advance'}
        </button>
        {userRole !== 'admin' && !permissions.allow_advance_logging && (
          <p className="permission-notice">You do not have permission to log advance payments</p>
        )}
      </div>
    </div>
  );
};

export default SalaryLogger;