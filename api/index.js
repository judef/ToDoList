const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

let todos = [
  { id: 1, text: 'Learn React', completed: false },
  { id: 2, text: 'Build a To-Do App', completed: true },
  { id: 3, text: 'Learn Express JS', completed: true }
];

// Get all tasks
app.get('/api/tasks', (req, res) => {
  try {
    res.json(todos);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving tasks' });
  }
});

// Add a task
app.post('/api/tasks', (req, res) => {
  try {
    const { text } = req.body;
    if (!text || text.trim() === '') {
      return res.status(400).json({ message: 'Task text is required' });
    }
    const newTodo = {
      id: Date.now(),
      text: text.trim(),
      completed: false
    };
    todos.push(newTodo);
    res.status(201).json(newTodo);
  } catch (error) {
    res.status(500).json({ message: 'Error creating task' });
  }
});

// Update a task
app.put('/api/tasks/:id', (req, res) => {
  try {
  const { id } = req.params;
  const { text, completed } = req.body;

    const taskIndex = todos.findIndex(t => t.id == id);
    if (taskIndex === -1) {
      return res.status(404).json({ message: 'Task not found' });
    }

  todos = todos.map(t => t.id == id ? { ...t, text: text ?? t.text, completed: completed ?? t.completed } : t);
  const updatedTodo = todos.find(t => t.id == id);
  res.json(updatedTodo);
  } catch (error) {
    res.status(500).json({ message: 'Error updating task' });
  }
});

// Delete a task
app.delete('/api/tasks/:id', (req, res) => {
  try {
  const { id } = req.params;
    const exists = todos.some(t => t.id == id);
    if (!exists) {
      return res.status(404).json({ message: 'Task not found' });
    }
  todos = todos.filter(t => t.id != id);
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