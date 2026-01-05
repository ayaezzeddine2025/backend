const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcryptjs');

const app = express();
app.use(express.json());
app.use(cors());

// Health check
app.get('/', (req, res) => {
  res.send('Backend is running 🚀');
});

// Database connection
const db = mysql.createConnection({
  host: '127.0.0.1',
  user: 'root',
  password: '',        // set your MySQL root password if needed
  database: 'flowers', // ✅ your DB name
  port: 3306           // change if XAMPP uses 3307
});

db.connect(err => {
  if (err) {
    console.error('❌ Database connection failed:', err);
    process.exit(1);
  }
  console.log('✅ Connected to MySQL database: flowers');
});

// ---------------- AUTH ----------------

// Signup
app.post('/signup', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    db.query(
      'INSERT INTO users (username, password) VALUES (?, ?)',
      [username, hashedPassword],
      (err, results) => {
        if (err) {
          console.error('❌ Signup error:', err);
          if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Username already exists' });
          return res.status(500).json({ error: 'Signup failed' });
        }
        res.status(201).json({ user: username, id: results.insertId });
      }
    );
  } catch (err) {
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

// Login
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

  db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (results.length === 0) return res.status(401).json({ error: 'User not found' });

    const user = results[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid password' });

    res.json({ user: user.username });
  });
});

// ---------------- NOTES ----------------
app.post('/notes', (req, res) => {
  const { flowerName, flowerImg, note, username } = req.body;
  if (!note || !username) return res.status(400).json({ error: 'Note and username required' });

  db.query(
    'INSERT INTO notes (flowerName, flowerImg, note, username, date) VALUES (?, ?, ?, ?, NOW())',
    [flowerName, flowerImg, note.trim(), username],
    (err, results) => {
      if (err) {
        console.error('❌ Notes insert error:', err.sqlMessage);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ id: results.insertId });
    }
  );
});

app.get('/notes', (req, res) => {
  db.query('SELECT * FROM notes ORDER BY date DESC', (err, results) => {
    if (err) {
      console.error('❌ Notes fetch error:', err.sqlMessage);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
});

app.delete('/notes/:id', (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM notes WHERE id = ?', [id], (err) => {
    if (err) {
      console.error('❌ Notes delete error:', err.sqlMessage);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ success: true });
  });
});

// ---------------- FLOWER HISTORY ----------------
// Get history
app.get('/flower_history', (req, res) => {
  const { username } = req.query;
  let sql = 'SELECT * FROM flower_history';
  let params = [];

  if (username) {
    sql += ' WHERE username = ?';
    params.push(username);
  }

  sql += ' ORDER BY date DESC';

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error('❌ Flower history fetch error:', err.sqlMessage);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
});

// Insert new flower pick
app.post('/flower_history', (req, res) => {
  const { username, flowerId, flowerName, favorite, note } = req.body;
  if (!username || !flowerId || !flowerName) {
    return res.status(400).json({ error: 'username, flowerId, and flowerName are required' });
  }

  db.query(
    'INSERT INTO flower_history (username, flowerId, flowerName, favorite, note) VALUES (?, ?, ?, ?, ?)',
    [username, flowerId, flowerName, !!favorite, note || ''],
    (err, results) => {
      if (err) {
        console.error('❌ Flower history insert error:', err.sqlMessage);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ id: results.insertId });
    }
  );
});

// ✅ Update favorite status instead of inserting a new row
app.put('/flower_history/:id/favorite', (req, res) => {
  const { id } = req.params;
  const { favorite } = req.body;

  db.query(
    'UPDATE flower_history SET favorite = ? WHERE id = ?',
    [!!favorite, id],
    (err) => {
      if (err) {
        console.error('❌ Flower history update error:', err.sqlMessage);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ success: true });
    }
  );
});

// Delete entry
app.delete('/flower_history/:id', (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM flower_history WHERE id = ?', [id], (err) => {
    if (err) {
      console.error('❌ Flower history delete error:', err.sqlMessage);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ success: true });
  });
});

// ---------------- CONTACT ----------------
app.get('/contact', (req, res) => {
  db.query('SELECT * FROM contact ORDER BY created_at DESC', (err, results) => {
    if (err) {
      console.error('❌ Contact fetch error:', err.sqlMessage);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
});

app.post('/contact', (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) return res.status(400).json({ error: 'All fields are required' });

  db.query(
    'INSERT INTO contact (name, email, message, created_at) VALUES (?, ?, ?, NOW())',
    [name, email, message],
    (err, results) => {
      if (err) {
        console.error('❌ Contact insert error:', err.sqlMessage);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ id: results.insertId });
    }
  );
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

