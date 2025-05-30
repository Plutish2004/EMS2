// backend/routes/leaves.js
const express = require('express');
const router = express.Router();
const db = require('../database');
const dayjs = require('dayjs');

// Get Employee Leave Details (New endpoint)
router.get('/employee/:id', (req, res) => {
  const employeeId = req.params.id;

  // Get employee joining date
  db.get('SELECT joining_date FROM employees WHERE id = ?', [employeeId], (err, emp) => {
    if (err || !emp) return res.status(500).json({ error: 'Employee not found' });

    const today = dayjs();
    const joiningDate = dayjs(emp.joining_date);
    const joinDay = joiningDate.date();

    // Calculate payroll period
    const startOfPayroll = today.date() >= joinDay
      ? today.date(joinDay)
      : today.subtract(1, 'month').date(joinDay);
    const endOfPayroll = startOfPayroll.add(1, 'month');

    // Set date ranges
    const currentMonthStart = today.startOf('month').format('YYYY-MM-DD');
    const currentMonthEnd = today.endOf('month').format('YYYY-MM-DD');
    const payrollStart = startOfPayroll.format('YYYY-MM-DD');
    const payrollEnd = endOfPayroll.format('YYYY-MM-DD');

    // Get all leave information
    db.all(
      `SELECT 
        l.*,
        CASE 
          WHEN l.end_date IS NULL THEN 'Ongoing'
          ELSE 'Completed'
        END as status
      FROM leaves l
      WHERE l.employee_id = ?
      ORDER BY l.start_date DESC`,
      [employeeId],
      (err, leaveHistory) => {
        if (err) return res.status(500).json({ error: err.message });

        // Calculate current month leaves
        const currentMonthLeaves = leaveHistory.filter(leave => 
          leave.start_date >= currentMonthStart && 
          leave.start_date <= currentMonthEnd
        );

        // Calculate payroll period leaves
        const payrollLeaves = leaveHistory.filter(leave =>
          leave.start_date >= payrollStart &&
          leave.start_date <= payrollEnd
        );

        // Calculate totals
        const currentTotal = currentMonthLeaves.reduce((sum, l) => sum + (l.days_taken || 0), 0);
        const payrollTotal = payrollLeaves.reduce((sum, l) => sum + (l.days_taken || 0), 0);
        const totalLeaves = leaveHistory.reduce((sum, l) => sum + (l.days_taken || 0), 0);

        // Format history records
        const history = leaveHistory.map(leave => ({
          date: leave.start_date,
          days: leave.days_taken || 0,
          reason: leave.reason || 'Not specified',
          status: leave.status
        }));

        res.json({
          currentMonthLeave: currentTotal,
          employeeMonthLeave: payrollTotal,
          totalLeaves: totalLeaves,
          history: history
        });
      }
    );
  });
});

// Add Leave
router.post('/', (req, res) => {
  const { employee_id, start_date } = req.body;

  db.get(
    'SELECT * FROM leaves WHERE employee_id = ? AND end_date IS NULL',
    [employee_id],
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (row) return res.status(400).json({ error: 'Employee already on leave' });

      db.run(
        'INSERT INTO leaves (employee_id, start_date) VALUES (?, ?)',
        [employee_id, start_date],
        (err) => {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ success: true });
        }
      );
    }
  );
});

// End Leave
router.post('/end', (req, res) => {
  const { employee_id, end_date, days_taken } = req.body;
  db.run(
    'UPDATE leaves SET end_date = ?, days_taken = ? WHERE employee_id = ? AND end_date IS NULL',
    [end_date, days_taken, employee_id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

// Get Employees Currently on Leave
router.get('/on-leave', (req, res) => {
  db.all(
    `SELECT e.name, l.employee_id, l.start_date 
     FROM leaves l 
     JOIN employees e ON e.id = l.employee_id 
     WHERE l.end_date IS NULL`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// Get Leave Count (Keep your existing implementation)
router.get('/counts/:employee_id', (req, res) => {
  const { employee_id } = req.params;

  db.get('SELECT joining_date FROM employees WHERE id = ?', [employee_id], (err, emp) => {
    if (err || !emp) return res.status(500).json({ error: 'Employee not found' });

    const today = dayjs();
    const joiningDate = dayjs(emp.joining_date);
    const joinDay = joiningDate.date();

    const startOfPayroll = today.date() >= joinDay
      ? today.date(joinDay)
      : today.subtract(1, 'month').date(joinDay);
    const endOfPayroll = startOfPayroll.add(1, 'month');

    const currentMonthStart = today.startOf('month').format('YYYY-MM-DD');
    const currentMonthEnd = today.endOf('month').format('YYYY-MM-DD');
    const payrollStart = startOfPayroll.format('YYYY-MM-DD');
    const payrollEnd = endOfPayroll.format('YYYY-MM-DD');

    db.all(
      `SELECT start_date, end_date, days_taken FROM leaves 
       WHERE employee_id = ? 
       AND start_date BETWEEN ? AND ?`,
      [employee_id, currentMonthStart, currentMonthEnd],
      (err, currentMonthLeaves) => {
        if (err) return res.status(500).json({ error: err.message });

        db.all(
          `SELECT start_date, end_date, days_taken FROM leaves 
           WHERE employee_id = ? 
           AND start_date BETWEEN ? AND ?`,
          [employee_id, payrollStart, payrollEnd],
          (err2, payrollCycleLeaves) => {
            if (err2) return res.status(500).json({ error: err2.message });

            const currentTotal = currentMonthLeaves.reduce((sum, l) => sum + (l.days_taken || 0), 0);
            const payrollTotal = payrollCycleLeaves.reduce((sum, l) => sum + (l.days_taken || 0), 0);

            res.json({
              currentMonthLeave: currentTotal,
              employeeMonthLeave: payrollTotal,
            });
          }
        );
      }
    );
  });
});

// Update leave record
router.put('/update/:id', (req, res) => {
  const { start_date, end_date, days_taken } = req.body;
  const id = req.params.id;

  const sql = 'UPDATE leaves SET start_date = ?, end_date = ?, days_taken = ? WHERE id = ?';
  db.run(sql, [start_date, end_date, days_taken, id], function(err) {
    if (err) {
      console.error('Database error:', err.message);
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Record not found' });
    }
    res.json({ success: true, message: 'Record updated successfully' });
  });
});

module.exports = router;