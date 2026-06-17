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

// Get all todos
app.get('/api/todos', (req, res) => {
  res.json(todos);
});

// Add a todo
app.post('/api/todos', (req, res) => {
  const newTodo = {
    id: Date.now(),
    text: req.body.text,
    completed: false
  };
  todos.push(newTodo);
  res.status(201).json(newTodo);
});

// Update a todo
app.put('/api/todos/:id', (req, res) => {
  const { id } = req.params;
  const { text, completed } = req.body;
  todos = todos.map(t => t.id == id ? { ...t, text: text ?? t.text, completed: completed ?? t.completed } : t);
  const updatedTodo = todos.find(t => t.id == id);
  res.json(updatedTodo);
});

// Delete a todo
app.delete('/api/todos/:id', (req, res) => {
  const { id } = req.params;
  todos = todos.filter(t => t.id != id);
  res.status(204).send();
});

// Export the app for Vercel's serverless environment
module.exports = app;