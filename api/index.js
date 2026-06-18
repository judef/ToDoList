const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const app = express();

app.use(cors());
app.use(express.json());

// Firebase SQL Connect (PostgreSQL) configuration
const pool = new Pool({
  connectionString: process.env.FIREBASE_URL,
  database: 'todolist-bf982-database', // Service: todolist-bf982-service
  ssl: {
    rejectUnauthorized: false // Required for most managed cloud SQL instances
  }
});

// Initialize the tasks table if it doesn't exist
const initDb = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id BIGINT PRIMARY KEY,
        text TEXT NOT NULL,
        completed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
  }
};
initDb();

// Get all tasks
app.get('/api/tasks', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tasks ORDER BY created_at DESC');
    // Convert BIGINT results to Numbers for frontend compatibility
    const tasks = result.rows.map(row => ({ ...row, id: Number(row.id) }));
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving tasks' });
  }
});

// Add a task
app.post('/api/tasks', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || text.trim() === '') {
      return res.status(400).json({ message: 'Task text is required' });
    }
    const id = Date.now();
    const result = await pool.query(
      'INSERT INTO tasks (id, text, completed) VALUES ($1, $2, $3) RETURNING *',
      [id, text.trim(), false]
    );
    res.status(201).json({ ...result.rows[0], id: Number(result.rows[0].id) });
  } catch (error) {
    res.status(500).json({ message: 'Error creating task' });
  }
});

// Update a task
app.put('/api/tasks/:id', async (req, res) => {
  try {
  const { id } = req.params;
  const { text, completed } = req.body;

    const result = await pool.query(
      'UPDATE tasks SET text = COALESCE($1, text), completed = COALESCE($2, completed) WHERE id = $3 RETURNING *',
      [text, completed, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.json({ ...result.rows[0], id: Number(result.rows[0].id) });
  } catch (error) {
    res.status(500).json({ message: 'Error updating task' });
  }
});

// Delete a task
app.delete('/api/tasks/:id', async (req, res) => {
  try {
  const { id } = req.params;
    const result = await pool.query('DELETE FROM tasks WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }
  res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Error deleting task' });
  }
});

// Error handling middleware
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

// Export the app for Vercel's serverless environment
module.exports = app;