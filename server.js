const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '', 
  database: 'flowers'
});

db.connect(err => {
  if (err) {
    console.error('Database connection failed:', err);
    return;
  }
  console.log('Connected to MySQL database: flowers');
});

app.get('/users', (req, res) => {
  db.query('SELECT * FROM users', (err, results) => {
    if (err) return res.status(500).send(err);
    res.json(results);
  });
});

app.post('/users', (req, res) => {
  const { username, password, email } = req.body;
  db.query(
    'INSERT INTO users (username, password, email) VALUES (?, ?, ?)',
    [username, password, email],
    (err, results) => {
      if (err) return res.status(500).send(err);
      res.json({ id: results.insertId });
    }
  );
});

app.get('/notes', (req, res) => {
  db.query('SELECT * FROM notes', (err, results) => {
    if (err) return res.status(500).send(err);
    res.json(results);
  });
});

app.post('/notes', (req, res) => {
  const { flowerName, flowerImg, note, username } = req.body;
  db.query(
    'INSERT INTO notes (flowerName, flowerImg, note, username, date) VALUES (?, ?, ?, ?, NOW())',
    [flowerName, flowerImg, note, username],
    (err, results) => {
      if (err) return res.status(500).send(err);
      res.json({ id: results.insertId });
    }
  );
});

app.get('/flower_history', (req, res) => {
  db.query('SELECT * FROM flower_history', (err, results) => {
    if (err) return res.status(500).send(err);
    res.json(results);
  });
});

app.post('/flower_history', (req, res) => {
  const { username, flowerId, flowerName, favorite, note } = req.body;
  db.query(
    'INSERT INTO flower_history (username, flowerId, flowerName, date, favorite, note) VALUES (?, ?, ?, NOW(), ?, ?)',
    [username, flowerId, flowerName, favorite, note],
    (err, results) => {
      if (err) return res.status(500).send(err);
      res.json({ id: results.insertId });
    }
  );
});

app.get('/contact', (req, res) => {
  db.query('SELECT * FROM contact', (err, results) => {
    if (err) return res.status(500).send(err);
    res.json(results);
  });
});

app.post('/contact', (req, res) => {
  const { name, email, message } = req.body;
  db.query(
    'INSERT INTO contact (name, email, message, created_at) VALUES (?, ?, ?, NOW())',
    [name, email, message],
    (err, results) => {
      if (err) return res.status(500).send(err);
      res.json({ id: results.insertId });
    }
  );
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
