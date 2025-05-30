const sqlite3 = require('sqlite3').verbose();

// Create and connect to SQLite database
const db = new sqlite3.Database('./employee_management.db', (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to SQLite database');

    // Create Employees Table
    db.run(`
      CREATE TABLE IF NOT EXISTS employees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        id_number TEXT UNIQUE,
        dob TEXT,
        sdw_of TEXT,
        mobile_number TEXT,
        address TEXT,
        role TEXT,
        joining_date TEXT,
        salary INTEGER
      )
    `);

    // Create Leaves Table
    db.run(`
      CREATE TABLE IF NOT EXISTS leaves (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_id INTEGER,
        start_date TEXT NOT NULL,
        end_date NULL,
        days_taken REAL,
        FOREIGN KEY (employee_id) REFERENCES employees (id)
      )
    `);

    // Create Salary Table
    db.run(`
      CREATE TABLE IF NOT EXISTS salary (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_id INTEGER,
        amount INTEGER,
        date TEXT,
        type TEXT,
        checked INTEGER DEFAULT 0,
        FOREIGN KEY (employee_id) REFERENCES employees (id)
      )
    `);

    // Create Withdrawals Table
    db.run(`
      CREATE TABLE IF NOT EXISTS withdrawals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_id INTEGER,
        amount REAL NOT NULL,
        date TEXT NOT NULL,
        FOREIGN KEY (employee_id) REFERENCES employees (id)
      )
    `);

    // Create Users Table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL
      )
    `, (err) => {
      if (err) {
        console.error('Error creating users table:', err);
      } else {
        // Insert default admin user if not exists
        db.get("SELECT * FROM users WHERE username = 'Plutish2004'", (err, user) => {
          if (err) {
            console.error('Error checking for admin user:', err);
          } else if (!user) {
            db.run(`
              INSERT INTO users (username, password, role)
              VALUES ('Plutish2004', 'admin123', 'admin')
            `);
          }
        });
      }
    });

    // Create Control Settings Table with simplified structure
    db.run(`
      CREATE TABLE IF NOT EXISTS control_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        setting_name TEXT UNIQUE NOT NULL,
        setting_value INTEGER DEFAULT 0
      )
    `, (err) => {
      if (err) {
        console.error('Error creating control_settings table:', err);
      } else {
        // Insert default settings if they don't exist
        const defaultSettings = [
          { name: 'allow_salary_logging', value: 1 },
          { name: 'allow_advance_logging', value: 1 },
          { name: 'allow_salary_view', value: 1 },
          { name: 'allow_advance_view', value: 1 },
          { name: 'allow_salary_edit', value: 1 },
          { name: 'allow_salary_delete', value: 1 },
          { name: 'allow_advance_edit', value: 1 },
          { name: 'allow_advance_delete', value: 1 },
          { name: 'allow_leave_logging', value: 1 },
          { name: 'allow_leave_edit', value: 1 },
          { name: 'allow_leave_delete', value: 1 }
        ];

        // Insert default settings
        const insertSetting = db.prepare(`
          INSERT OR IGNORE INTO control_settings 
          (setting_name, setting_value)
          VALUES (?, ?)
        `);

        defaultSettings.forEach(setting => {
          insertSetting.run(
            setting.name,
            setting.value
          );
        });

        insertSetting.finalize();
      }
    });
  }
});

module.exports = db;