// Modal.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Modal.css';

const Modal = ({ isOpen, onClose, onSubmit, type, data, currentDateTime }) => {
  const [formData, setFormData] = useState({
    amount: '',
    date: '',
    start_date: '',
    end_date: '',
    days_taken: '',
  });

  useEffect(() => {
    if (data) {
      switch (type) {
        case 'salary':
        case 'advance':
          setFormData({
            amount: data.amount,
            date: data.date,
          });
          break;
        case 'leave':
          setFormData({
            start_date: data.start_date,
            end_date: data.end_date || '',
            days_taken: data.days_taken,
          });
          break;
        default:
          break;
      }
    }
  }, [data, type]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Auto-calculate days for leaves
    if (type === 'leave' && (name === 'start_date' || name === 'end_date')) {
      if (formData.start_date && formData.end_date) {
        const start = new Date(formData.start_date);
        const end = new Date(formData.end_date);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        setFormData(prev => ({
          ...prev,
          days_taken: diffDays
        }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let response;
      if (type === 'salary' || type === 'advance') {
        response = await axios.put(`http://localhost:5000/api/salary/update/${data.id}`, formData, {
          headers: {
            'Content-Type': 'application/json',
            'username': 'Plutish2004'
          }
        });
      } else if (type === 'leave') {
        response = await axios.put(`http://localhost:5000/api/leaves/update/${data.id}`, formData, {
          headers: {
            'Content-Type': 'application/json',
            'username': 'Plutish2004'
          }
        });
      }
      
      // Pass the entire response data to the parent component
      onSubmit({ ...formData, id: data.id, recordType: type });
      onClose();
    } catch (error) {
      console.error('Failed to update record:', error);
      alert('Failed to update record. Please try again.');
    }
  };

  if (!isOpen) return null;

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3>
            Edit {type === 'salary' ? 'Salary' : type === 'advance' ? 'Advance' : 'Leave'} Record
          </h3>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {(type === 'salary' || type === 'advance') && (
            <>
              <div className="form-group">
                <label>Amount (₹):</label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  required
                  min="0"
                  step="1"
                />
              </div>
              <div className="form-group">
                <label>Date:</label>
                <input
                  type="date"
                  name="date"
                  value={formatDate(formData.date)}
                  onChange={handleChange}
                  required
                  max={currentDateTime.split(' ')[0]}
                />
              </div>
            </>
          )}

          {type === 'leave' && (
            <>
              <div className="form-group">
                <label>Start Date:</label>
                <input
                  type="date"
                  name="start_date"
                  value={formatDate(formData.start_date)}
                  onChange={handleChange}
                  required
                  max={currentDateTime.split(' ')[0]}
                />
              </div>
              <div className="form-group">
                <label>End Date:</label>
                <input
                  type="date"
                  name="end_date"
                  value={formatDate(formData.end_date)}
                  onChange={handleChange}
                  min={formatDate(formData.start_date)}
                  max={currentDateTime.split(' ')[0]}
                />
              </div>
              <div className="form-group">
                <label>Days Taken:</label>
                <input
                  type="number"
                  name="days_taken"
                  value={formData.days_taken}
                  onChange={handleChange}
                  required
                  min="0.5"
                  step="0.5"
                  readOnly
                />
              </div>
            </>
          )}

          <div className="modal-footer">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="save-btn">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Modal;