// Setting up the backend
// backend/server.js
const db = require('./database');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const employeeRoutes = require('./routes/employees');
const leaveRoutes = require('./routes/leaves');
const salaryRoutes = require('./routes/salary');
const userRoutes = require('./routes/users');
const controlSettingsRouter = require('./routes/controlSettings');
const app = express();
const port = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: "Backend is connected!" });
});

// Login endpoint
app.post('/api/login', (req, res) => {
  console.log('Login attempt received:', req.body); // Debug log
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  db.get(
    'SELECT * FROM users WHERE username = ? AND password = ?',
    [username, password],
    (err, user) => {
      if (err) {
        console.error('Login error:', err);
        return res.status(500).json({ message: 'Database error' });
      }
      if (!user) {
        return res.status(401).json({ message: 'Invalid username or password' });
      }
      console.log('Login successful for user:', username); // Debug log
      res.json({
        message: 'Login successful',
        user: {
          id: user.id,
          username: user.username,
          role: user.role
        }
      });
    }
  );
});

// Current time endpoint
app.get('/api/current-time', (req, res) => {
  const now = new Date();
  now.setFullYear(2025);
  
  const formattedDate = `${now.getFullYear()}-${
    String(now.getMonth() + 1).padStart(2, '0')}-${
    String(now.getDate()).padStart(2, '0')} ${
    String(now.getHours()).padStart(2, '0')}:${
    String(now.getMinutes()).padStart(2, '0')}:${
    String(now.getSeconds()).padStart(2, '0')}`;

  res.json({ currentTime: formattedDate });
});

// Current user endpoint
app.get('/api/current-user', (req, res) => {
  const username = req.headers.username || 'Plutish2004';
  
  db.get(
    'SELECT id, username, role FROM users WHERE username = ?',
    [username],
    (err, user) => {
      if (err) {
        return res.status(500).json({ message: 'Database error' });
      }
      if (!user) {
        return res.json({
          id: 1,
          username: 'Plutish2004',
          role: 'admin'
        });
      }
      res.json(user);
    }
  );
});

// Auth check endpoint
app.get('/api/check-auth', (req, res) => {
  const username = req.headers.username;
  
  if (!username) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  db.get(
    'SELECT id, username, role FROM users WHERE username = ?',
    [username],
    (err, user) => {
      if (err) {
        return res.status(500).json({ message: 'Database error' });
      }
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }
      res.json(user);
    }
  );
});

// Route middleware
app.use('/api/employees', employeeRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/salary', salaryRoutes);
app.use('/api/users', userRoutes);
app.use('/api/control-settings', controlSettingsRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});