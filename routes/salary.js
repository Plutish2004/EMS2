const express = require('express');
const router = express.Router();
const db = require('../database');

// Log a salary or advance entry
router.post('/', (req, res) => {
  try {
    const { employee_id, amount, date, type } = req.body;
    console.log('Received data:', { employee_id, amount, date, type });

    if (!employee_id || !amount || !date || !type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Match your exact schema including the checked column
    const sql = `INSERT INTO salary (employee_id, amount, date, type) VALUES (?, ?, ?, ?)`;
    const params = [employee_id, amount, date, type];

    db.run(sql, params, function(err) {
      if (err) {
        console.error('Database error:', err.message);
        return res.status(500).json({ error: err.message });
      }
      res.json({ 
        success: true, 
        id: this.lastID,
        message: 'Salary logged successfully'
      });
    });
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Failed to log salary' });
  }
});

// Get withdrawals information
router.get('/withdrawals/:id', (req, res) => {
  const employeeId = req.params.id;
  const currentYearMonth = '2025-04'; // Matching your system's current date
  
  const sql = `
    SELECT 
      SUM(amount) as totalAmount,
      SUM(CASE 
        WHEN strftime('%Y-%m', date) = ? 
        THEN amount ELSE 0 END) as currentMonthAmount,
      SUM(CASE 
        WHEN type = 'advance' 
        THEN amount ELSE 0 END) as totalAdvanceAmount
    FROM salary 
    WHERE employee_id = ?`;

  db.get(sql, [currentYearMonth, employeeId], (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: 'Database error' });
    }

    res.json({
      totalAmount: result?.totalAmount || 0,
      currentMonthAmount: result?.currentMonthAmount || 0,
      totalAdvanceAmount: result?.totalAdvanceAmount || 0
    });
  });
});

// Get salary/advance records
router.get('/', (req, res) => {
  db.all(`SELECT * FROM salary`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Get deductions for an employee
router.get('/deductions/:id', (req, res) => {
  const employeeId = req.params.id;

  // Fetch employee details first
  db.get(
    `SELECT joining_date, salary FROM employees WHERE id = ?`,
    [employeeId],
    (err, emp) => {
      if (err || !emp) return res.status(404).json({ error: 'Employee not found' });

      const joiningDate = new Date(emp.joining_date);
      const joinDay = joiningDate.getDate();
      const today = new Date('2025-04-24 14:30:34'); // Matching your system's current date

      let cycleStart = new Date(today);
      let cycleEnd = new Date(today);

      // Set to employee's monthly cycle
      if (today.getDate() < joinDay) {
        cycleStart.setMonth(today.getMonth() - 1);
      }
      cycleStart.setDate(joinDay);
      cycleEnd = new Date(cycleStart);
      cycleEnd.setMonth(cycleEnd.getMonth() + 1);
      cycleEnd.setDate(cycleEnd.getDate() - 1);

      const startDate = cycleStart.toISOString().split('T')[0];
      const endDate = cycleEnd.toISOString().split('T')[0];

      // Fetch leaves
      db.get(
        `SELECT SUM(days_taken) AS leaveDays FROM leaves 
         WHERE employee_id = ? AND start_date BETWEEN ? AND ?`,
        [employeeId, startDate, endDate],
        (err, leaveRow) => {
          const leaveDays = leaveRow?.leaveDays || 0;

          // Fetch regular salary withdrawals
          db.get(
            `SELECT SUM(amount) AS withdrawals FROM salary 
             WHERE employee_id = ? AND type != 'advance' 
             AND date BETWEEN ? AND ?`,
            [employeeId, startDate, endDate],
            (err, withdrawRow) => {
              const withdrawals = withdrawRow?.withdrawals || 0;

              // Fetch advance salary
              db.get(
                `SELECT SUM(amount) AS advance FROM salary 
                 WHERE employee_id = ? AND type = 'advance' 
                 AND date BETWEEN ? AND ?`,
                [employeeId, startDate, endDate],
                (err, advanceRow) => {
                  const advance = advanceRow?.advance || 0;

                  res.json({
                    cycleStart: startDate,
                    cycleEnd: endDate,
                    baseSalary: emp.salary,
                    leaveDays,
                    withdrawals,
                    advance
                  });
                }
              );
            }
          );
        }
      );
    }
  );
});

// Get salary by ID
router.get('/:id', (req, res) => {
  const salaryId = req.params.id;
  
  db.get(`SELECT * FROM salary WHERE id = ?`, [salaryId], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Salary record not found' });
    res.json(row);
  });
});

// Update salary checked status
router.put('/:id', (req, res) => {
  const salaryId = req.params.id;
  const { checked } = req.body;
  
  db.run(
    `UPDATE salary SET checked = ? WHERE id = ?`,
    [checked ? 1 : 0, salaryId],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

// Update salary/advance record
router.put('/update/:id', (req, res) => {
  const { amount, date } = req.body;
  const id = req.params.id;

  const sql = 'UPDATE salary SET amount = ?, date = ? WHERE id = ?';
  db.run(sql, [amount, date, id], function(err) {
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

// Delete salary
router.delete('/:id', (req, res) => {
  const salaryId = req.params.id;
  
  db.run(`DELETE FROM salary WHERE id = ?`, [salaryId], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// Get salary history for an employee
router.get('/history/:employeeId', (req, res) => {
  const employeeId = req.params.employeeId;
  
  db.all(
    `SELECT * FROM salary WHERE employee_id = ? ORDER BY date DESC`,
    [employeeId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

module.exports = router;