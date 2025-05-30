// backend/routes/users.js
const express = require('express');
const router = express.Router();
const db = require('../database');

// Debug middleware with body logging
router.use((req, res, next) => {
  console.log('Users Route -', req.method, req.path);
  console.log('Headers:', req.headers);
  if (req.method === 'PUT' || req.method === 'POST') {
    console.log('Body:', req.body);
  }
  next();
});

// Get current time route (BEFORE admin check)
router.get('/current-time', (req, res) => {
  const now = new Date();
  // Set year to 2025 as per your requirement
  now.setFullYear(2025);
  const formattedTime = now.toISOString().slice(0, 19).replace('T', ' ');
  res.json({ currentTime: formattedTime });
});

// Get user role route (BEFORE admin check)
router.get('/role/:username', (req, res) => {
  const username = req.params.username;
  
  if (!username) {
    return res.status(400).json({ message: 'Username is required' });
  }

  db.get('SELECT role FROM users WHERE username = ?', [username], (err, user) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: 'Database error' });
    }
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ role: user.role });
  });
});

// Middleware to check if user is admin
const checkAdmin = (req, res, next) => {
  const username = req.headers.username;
  
  console.log('Checking admin status for:', username);

  if (!username) {
    console.log('No username provided in headers');
    return res.status(401).json({ 
      message: 'Authentication required',
      detail: 'No username provided in request headers'
    });
  }

  db.get('SELECT role FROM users WHERE username = ?', [username], (err, user) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ 
        message: 'Database error',
        detail: err.message 
      });
    }
    if (!user) {
      console.log('User not found:', username);
      return res.status(403).json({ 
        message: 'Admin access required',
        detail: 'User not found' 
      });
    }
    if (user.role !== 'admin') {
      console.log('User is not admin:', username);
      return res.status(403).json({ 
        message: 'Admin access required',
        detail: 'User is not an admin' 
      });
    }
    console.log('Admin check passed for:', username);
    next();
  });
};

// Apply admin check to all routes EXCEPT current-time and role
router.use((req, res, next) => {
  if (req.path === '/current-time' || req.path.startsWith('/role/')) {
    return next();
  }
  checkAdmin(req, res, next);
});

// Get all users
router.get('/', (req, res) => {
  db.all('SELECT id, username, role FROM users', [], (err, users) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: 'Database error' });
    }
    res.json(users);
  });
});

// Create new user
router.post('/', (req, res) => {
  const { username, password, role } = req.body;

  // Basic validation
  if (!username || !password || !role) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  db.run(
    'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
    [username, password, role],
    function(err) {
      if (err) {
        console.error('Database error:', err);
        if (err.code === 'SQLITE_CONSTRAINT') {
          return res.status(400).json({ message: 'Username already exists' });
        }
        return res.status(500).json({ message: 'Failed to create user' });
      }
      res.status(201).json({
        message: 'User created successfully',
        userId: this.lastID
      });
    }
  );
});

// Update user
router.put('/:id', async (req, res) => {
  console.log('Update request received for user ID:', req.params.id);
  console.log('Update data:', req.body);

  const userId = req.params.id;
  const { username, password, role } = req.body;
  const currentUsername = req.headers.username;

  try {
    // Check if user exists
    const user = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE id = ?', [userId], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent changing own role
    if (user.username === currentUsername && role !== 'admin') {
      return res.status(400).json({ message: 'Cannot change your own admin status' });
    }

    // Validation
    if (!username || !role) {
      return res.status(400).json({ message: 'Username and role are required' });
    }

    // Check username uniqueness if changed
    if (username !== user.username) {
      const existingUser = await new Promise((resolve, reject) => {
        db.get('SELECT id FROM users WHERE username = ? AND id != ?', [username, userId], (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });

      if (existingUser) {
        return res.status(400).json({ message: 'Username already exists' });
      }
    }

    // Prepare update query
    const query = password && password.trim() !== ''
      ? 'UPDATE users SET username = ?, password = ?, role = ? WHERE id = ?'
      : 'UPDATE users SET username = ?, role = ? WHERE id = ?';
    
    const params = password && password.trim() !== ''
      ? [username, password, role, userId]
      : [username, role, userId];

    // Execute update
    await new Promise((resolve, reject) => {
      db.run(query, params, function(err) {
        if (err) reject(err);
        else resolve(this);
      });
    });

    res.json({
      message: 'User updated successfully',
      user: { id: userId, username, role }
    });

  } catch (err) {
    console.error('Update error:', err);
    res.status(500).json({ message: 'Failed to update user' });
  }
});

// Delete user
router.delete('/:id', (req, res) => {
  const userId = req.params.id;
  const username = req.headers.username;

  db.get('SELECT username FROM users WHERE id = ?', [userId], (err, user) => {
    if (err) {
      return res.status(500).json({ message: 'Database error' });
    }
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (user.username === username) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    db.run('DELETE FROM users WHERE id = ?', [userId], (err) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ message: 'Failed to delete user' });
      }
      res.json({ message: 'User deleted successfully' });
    });
  });
});

module.exports = router;