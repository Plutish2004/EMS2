const express = require('express');
const router = express.Router();
const db = require('../database');

// GET all employees
router.get('/', (req, res) => {
  db.all('SELECT * FROM employees', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: 'Failed to retrieve employees' });
    } else {
      res.json(rows);
    }
  });
});

// GET employee by ID
router.get('/:id', (req, res) => {
  const id = req.params.id;
  db.get('SELECT * FROM employees WHERE id = ?', [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else if (!row) {
      res.status(404).json({ error: 'Employee not found' });
    } else {
      res.json(row);
    }
  });
});

// POST a new employee
router.post('/', (req, res) => {
  const {
    name, id_number, mobile_number, dob, sdw_of,
    address, role, joining_date, salary
  } = req.body;

  const query = `
    INSERT INTO employees 
    (name, id_number, mobile_number, dob, sdw_of, address, role, joining_date, salary)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const values = [
    name, id_number, mobile_number, dob, sdw_of, address, role, joining_date, salary
  ];

  db.run(query, values, function (err) {
    if (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to add employee' });
    } else {
      res.status(201).json({ id: this.lastID });
    }
  });
});

// PUT (update) an employee
router.put('/:id', (req, res) => {
  const id = req.params.id;
  const { name, id_number, mobile_number, address, role, salary } = req.body;
  db.run(
    'UPDATE employees SET name = ?, id_number = ?, mobile_number = ?, address = ?, role = ?, salary = ? WHERE id = ?',
    [name, id_number, mobile_number, address, role, salary, id],
    function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json({ updated: this.changes });
      }
    }
  );
});

// DELETE an employee
router.delete('/:id', (req, res) => {
  const id = req.params.id;
  db.run('DELETE FROM employees WHERE id = ?', [id], function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json({ deleted: this.changes });
    }
  });
});

module.exports = router;
