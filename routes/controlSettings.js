// routes/controlSettings.js
const express = require('express');
const router = express.Router();
const db = require('../database');

// Get all control settings
router.get('/', (req, res) => {
  db.all('SELECT * FROM control_settings', [], (err, settings) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(settings);
  });
});

// Get a specific control setting
router.get('/:settingName', (req, res) => {
  const { settingName } = req.params;

  db.get(
    'SELECT * FROM control_settings WHERE setting_name = ?',
    [settingName],
    (err, setting) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!setting) {
        return res.status(404).json({ error: 'Setting not found' });
      }
      res.json(setting);
    }
  );
});

// Update a control setting
router.put('/:settingName', (req, res) => {
  const { settingName } = req.params;
  const { value } = req.body;
  const username = req.headers.username;

  // Verify if the user is admin
  db.get('SELECT role FROM users WHERE username = ?', [username], (err, user) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized: Admin access required' });
    }

    // Validate setting name
    const validSettings = [
      'allow_salary_logging',
      'allow_advance_logging',
      'allow_salary_view',
      'allow_advance_view',
      'allow_salary_edit',
      'allow_salary_delete',
      'allow_advance_edit',
      'allow_advance_delete',
      'allow_leave_logging',
      'allow_leave_edit',
      'allow_leave_delete'
    ];

    if (!validSettings.includes(settingName)) {
      return res.status(400).json({ error: 'Invalid setting name' });
    }

    db.run(
      'UPDATE control_settings SET setting_value = ? WHERE setting_name = ?',
      [value ? 1 : 0, settingName],
      function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        if (this.changes === 0) {
          return res.status(404).json({ error: 'Setting not found' });
        }

        res.json({
          message: 'Setting updated successfully',
          changes: this.changes,
          setting: {
            name: settingName,
            value: value ? 1 : 0
          }
        });
      }
    );
  });
});

// Reset all settings to default
router.post('/reset', (req, res) => {
  const username = req.headers.username;

  // Verify if the user is admin
  db.get('SELECT role FROM users WHERE username = ?', [username], (err, user) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized: Admin access required' });
    }

    const defaultSettings = {
      'allow_salary_logging': 1,
      'allow_advance_logging': 1,
      'allow_salary_view': 1,
      'allow_advance_view': 1,
      'allow_salary_edit': 0,
      'allow_salary_delete': 0,
      'allow_advance_edit': 0,
      'allow_advance_delete': 0,
      'allow_leave_logging': 1,
      'allow_leave_edit': 0,
      'allow_leave_delete': 0
    };

    const updates = Object.entries(defaultSettings).map(([name, value]) => {
      return new Promise((resolve, reject) => {
        db.run(
          'UPDATE control_settings SET setting_value = ? WHERE setting_name = ?',
          [value, name],
          function(err) {
            if (err) reject(err);
            else resolve();
          }
        );
      });
    });

    Promise.all(updates)
      .then(() => {
        res.json({ message: 'All settings reset to default values' });
      })
      .catch(err => {
        res.status(500).json({ error: err.message });
      });
  });
});

// Error handling middleware
router.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

module.exports = router;