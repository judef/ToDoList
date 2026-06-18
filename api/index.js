const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const { ClerkExpressRequireAuth } = require('@clerk/clerk-sdk-node');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

if (!process.env.DATABASE_URL || !process.env.CLERK_SECRET_KEY) {
  console.error('CRITICAL: DATABASE_URL and CLERK_SECRET_KEY environment variables are not defined.');
}

// Apply Clerk authentication middleware to all /api/tasks routes
// This will ensure that req.auth is populated with user information
app.use('/api/tasks', ClerkExpressRequireAuth());

// PostgreSQL Connection Pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  // Max time to wait for a connection before timing out
  connectionTimeoutMillis: 5000, 
  // Max time a client can sit idle in the pool
  idleTimeoutMillis: 30000 
});

// Initialize Database Table
const initDb = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id BIGINT PRIMARY KEY,
        text TEXT NOT NULL,
        completed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        user_id TEXT NOT NULL
      );
    `);
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization failed. Check if project is paused or DATABASE_URL is correct:', error.message);
  }
};
initDb();

// Get all tasks
app.get('/api/tasks', async (req, res) => {
  try {
    const { userId } = req.auth; // Get userId from Clerk authentication
    const result = await pool.query('SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
    // Convert BIGINT to Number for frontend compatibility
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
    const { userId } = req.auth; // Get userId from Clerk authentication
    if (!text || text.trim() === '') {
      return res.status(400).json({ message: 'Task text is required' });
    }

    const id = Date.now();
    const result = await pool.query(
      'INSERT INTO tasks (id, text, completed, user_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [id, text.trim(), false, userId]
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
    const { userId } = req.auth; // Get userId from Clerk authentication

    const result = await pool.query(
      'UPDATE tasks SET text = COALESCE($1, text), completed = COALESCE($2, completed) WHERE id = $3 AND user_id = $4 RETURNING *',
      [text, completed, id, userId]
    );

    // Ensure the task exists AND belongs to the authenticated user
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
    const { userId } = req.auth; // Get userId from Clerk authentication
    const result = await pool.query('DELETE FROM tasks WHERE id = $1 AND user_id = $2', [id, userId]);
    // Ensure the task exists AND belongs to the authenticated user
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