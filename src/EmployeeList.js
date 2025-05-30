import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './EmployeeList.css';

function EmployeeList() {
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editEmp, setEditEmp] = useState(null);
  const [deleteEmpId, setDeleteEmpId] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/employees');
      if (!response.ok) throw new Error('Failed to fetch employees');
      const data = await response.json();
      setEmployees(data);
      setFilteredEmployees(data);
    } catch (err) {
      console.error(err);
      setError('Could not load employees.');
    }
  };

  const handleSearch = (e) => {
    const searchValue = e.target.value;
    setSearch(searchValue);
    const searchLower = searchValue.toLowerCase();
    setFilteredEmployees(
      employees.filter(emp => 
        emp.name.toLowerCase().includes(searchLower)
      )
    );
  };

      const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditEmp({ ...editEmp, [name]: value });
      
        // Clear any previous error for this field
        setFormErrors(prev => {
          const { [name]: removed, ...rest } = prev;
          return rest;
        });
      
        // Validation rules
        if (!value.trim()) {
          setFormErrors(prev => ({ ...prev, [name]: 'This field is required' }));
        } else if (name === 'mobile_number') {
          if (!/^\d{10}$/.test(value)) {
            setFormErrors(prev => ({ ...prev, mobile_number: 'Mobile number must be 10 digits' }));
          }
        }
      };
      
      const handleEditSubmit = async (e) => {
        e.preventDefault();
        
        // Check for empty required fields
        const requiredFields = ['name', 'mobile_number', 'id_number', 'address', 'joining_date'];
        const newErrors = {};
        
        requiredFields.forEach(field => {
          if (!editEmp[field] || !editEmp[field].trim()) {
            newErrors[field] = 'This field is required';
          }
        });
      
        // Check mobile number format
        if (editEmp.mobile_number && !/^\d{10}$/.test(editEmp.mobile_number)) {
          newErrors.mobile_number = 'Mobile number must be 10 digits';
        }
      
        // If there are any errors, set them and stop submission
        if (Object.keys(newErrors).length > 0) {
          setFormErrors(newErrors);
          return;
        }
      
        try {
          const response = await fetch(`http://localhost:5000/api/employees/${editEmp.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(editEmp),
          });
          if (!response.ok) throw new Error('Failed to update employee');
          setSuccess('Employee updated successfully');
          setEditEmp(null);
          fetchEmployees();
        } catch (err) {
          setError('Error updating employee');
        }
      };

  const handleDelete = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/employees/${deleteEmpId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete');
      setSuccess('Employee deleted successfully');
      setDeleteEmpId(null);
      fetchEmployees();
    } catch (err) {
      setError('Error deleting employee');
    }
  };

  return (
    <div className="container">
      <div className="header">
        <h2 className="title">All Employees</h2>
      </div>

      {success && <p className="success-message">{success}</p>}
      {error && <p className="error-message">{error}</p>}

      <div className="search-container">
        <input
          type="text"
          placeholder="Search by name"
          value={search}
          onChange={handleSearch}
          className="search-input"
        />
        <button
          onClick={() => {
            setSearch('');
            setFilteredEmployees(employees);
          }}
          className="refresh-button"
          title="Refresh"
        >
          <img src="/icons/refresh.png" alt="Refresh" className="icon" />
        </button>
      </div>

      <div className="table-container">
        <table className="employee-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Mobile</th>
              <th>ID Number</th>
              <th>Role</th>
              <th>Address</th>
              <th>Joining Date</th>
              <th>Salary</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.map((emp) => (
              <tr 
                key={emp.id} 
                className="employee-row"
                onClick={(e) => {
                  if (!e.target.closest('.action-buttons') && !e.target.closest('.employee-name-link')) {
                    window.location.href = `/employees/${emp.id}`;
                  }
                }}
              >
                <td>
                  <Link 
                    to={`/employees/${emp.id}`} 
                    className="employee-name-link"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {emp.name}
                  </Link>
                </td>
                <td>{emp.mobile_number}</td>
                <td>{emp.id_number}</td>
                <td>{emp.role}</td>
                <td>
                  <div 
                    className="address-cell"
                    data-full-address={emp.address}
                    title={emp.address}
                  >
                    {emp.address}
                  </div>
                </td>
                <td>
                  {emp.joining_date ? new Date(emp.joining_date).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  }).split('/').join('-') : ''}
                </td>
                <td>₹{parseFloat(emp.salary).toLocaleString('en-IN')}</td>
                <td className="action-buttons">
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                    <button 
                      onClick={() => setEditEmp(emp)} 
                      className="icon-button"
                      title="Edit"
                    >
                      <img src="/icons/edit.png" alt="Edit" className="icon" />
                    </button>
                    <button 
                      onClick={() => setDeleteEmpId(emp.id)} 
                      className="icon-button"
                      title="Delete"
                    >
                      <img src="/icons/delete.png" alt="Delete" className="icon" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

          {editEmp && (
      <div className="modal-overlay">
        <div className="modal">
          <h3 className="modal-title">Edit Employee</h3>
          <form onSubmit={handleEditSubmit} className="edit-form">
            {[
              'name',
              'mobile_number',
              'id_number',
              'role',
              'address',
              'joining_date'
            ].map((field) => (
              <div key={field} className="form-group">
                <label className="form-label">
                  {field.split('_').map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1)
                  ).join(' ')}
                  {field !== 'role' && <span className="required">*</span>}
                </label>
                {field === 'address' ? (
                  <textarea
                    name={field}
                    value={editEmp[field] || ''}
                    onChange={handleEditChange}
                    className={`form-input textarea ${formErrors[field] ? 'error' : ''}`}
                    required={field !== 'role'}
                  />
                ) : field === 'joining_date' ? (
                  <input
                    type="date"
                    name={field}
                    value={editEmp[field] ? new Date(editEmp[field]).toISOString().split('T')[0] : ''}
                    onChange={handleEditChange}
                    className={`form-input ${formErrors[field] ? 'error' : ''}`}
                    required={field !== 'role'}
                  />
                ) : (
                  <input
                    type="text"
                    name={field}
                    value={editEmp[field] || ''}
                    onChange={handleEditChange}
                    className={`form-input ${formErrors[field] ? 'error' : ''}`}
                    required={field !== 'role'}
                  />
                )}
                {formErrors[field] && (
                  <span className="error-text">{formErrors[field]}</span>
                )}
              </div>
            ))}
            <div className="form-actions">
              <button type="submit" className="save-button">
                Save
              </button>
              <button
                type="button"
                onClick={() => setEditEmp(null)}
                className="cancel-button"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    )}

      {deleteEmpId && (
        <div className="modal-overlay">
          <div className="modal delete-modal">
            <p className="delete-message">
              Are you sure you want to delete this employee?
            </p>
            <div className="delete-actions">
              <button onClick={handleDelete} className="confirm-delete-button">
                Yes
              </button>
              <button
                onClick={() => setDeleteEmpId(null)}
                className="cancel-button"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EmployeeList;