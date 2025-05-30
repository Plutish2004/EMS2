import React, { useState } from 'react';
import axios from 'axios';
import './AddEmployeeForm.css';

const AddEmployeeForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    id_number: '',
    sdw_of: '',
    role: '',
    joining_date: '',
    dob: '',
    mobile_number: '',
    address: '',
    salary: ''
  });

  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.id_number.trim()) newErrors.id_number = 'ID Number is required';
    if (!formData.mobile_number || !/^\d{10}$/.test(formData.mobile_number))
      newErrors.mobile_number = 'Mobile number must be 10 digits';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.joining_date) newErrors.joining_date = 'Joining date is required';
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      await axios.post('http://localhost:5000/api/employees', formData);
      setSuccessMessage('Employee added successfully!');
      setFormData({
        name: '',
        id_number: '',
        sdw_of: '',
        role: '',
        joining_date: '',
        dob: '',
        mobile_number: '',
        address: '',
        salary: ''
      });
    } catch (error) {
      console.error('Error adding employee:', error);
      setSuccessMessage('');
    }
  };

  const closePopup = () => {
    setSuccessMessage('');
  };

  const leftFields = [
    { label: 'Name', name: 'name', type: 'text', required: true },
    { label: 'ID Number', name: 'id_number', type: 'text', required: true },
    { label: 'S/D/W of', name: 'sdw_of', type: 'text' },
    { label: 'Role', name: 'role', type: 'text' },
    { label: 'Joining Date', name: 'joining_date', type: 'date', required: true }
  ];

  const rightFields = [
    { label: 'Date of Birth', name: 'dob', type: 'date' },
    { label: 'Mobile Number', name: 'mobile_number', type: 'text', required: true },
    { label: 'Address', name: 'address', type: 'textarea', required: true },
    { label: 'Salary', name: 'salary', type: 'number' }
  ];

  return (
    <div className="add-employee-container">
      <h2 className="form-title">Add A New Employee</h2>

      {successMessage && (
        <div className="popup-overlay">
          <div className="popup-card">
            <h3>{successMessage}</h3>
            <button onClick={closePopup}>Close</button>
          </div>
        </div>
      )}

      <form className="employee-form" onSubmit={handleSubmit} autoComplete="off">
        <div className="form-grid">
          <div className="form-column">
            {leftFields.map((field) => (
              <div className="form-group" key={field.name}>
                <label>
                  {field.label} {field.required && <span className="required">*</span>}
                </label>
                <input
                  type={field.type}
                  name={field.name}
                  value={formData[field.name]}
                  onChange={handleChange}
                  className={`form-input ${errors[field.name] ? 'input-error' : ''}`}
                />
                {errors[field.name] && <p className="error-message">{errors[field.name]}</p>}
              </div>
            ))}
          </div>

          <div className="form-column">
            {rightFields.map((field) => (
              <div className={`form-group ${field.name === 'address' ? 'address-field' : ''}`} key={field.name}>
                <label>
                  {field.label} {field.required && <span className="required">*</span>}
                </label>
                {field.type === 'textarea' ? (
                  <textarea
                    name={field.name}
                    value={formData[field.name]}
                    onChange={handleChange}
                    className={`form-input address-input ${errors[field.name] ? 'input-error' : ''}`}
                  />
                ) : (
                  <input
                    type={field.type}
                    name={field.name}
                    value={formData[field.name]}
                    onChange={handleChange}
                    className={`form-input ${errors[field.name] ? 'input-error' : ''}`}
                  />
                )}
                {errors[field.name] && <p className="error-message">{errors[field.name]}</p>}
              </div>
            ))}
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="submit-button">Add Employee</button>
        </div>
      </form>
    </div>
  );
};

export default AddEmployeeForm;