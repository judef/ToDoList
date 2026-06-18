import React, { useState, useEffect } from 'react';

// Accessing the API base URL from environment variables
const API_BASE = process.env.REACT_APP_API_URL || '';

function App() {
  const [todos, setTodos] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/api/tasks`);
        if (!res.ok) throw new Error('Failed to fetch tasks.');
        const data = await res.json();
        setTodos(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, []);

  const filteredTodos = todos.filter(todo => {
    if (filter === 'active') return !todo.completed;
    if (filter === 'completed') return todo.completed;
    return true;
  });

  const addTodo = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputValue })
      });
      if (!res.ok) throw new Error('Failed to add task.');
      const newTodo = await res.json();
      setTodos([...todos, newTodo]);
      setInputValue('');
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleTodo = async (id, completed) => {
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !completed })
      });
      if (!res.ok) throw new Error('Failed to update task.');
      const updated = await res.json();
      setTodos(todos.map(t => t.id === id ? updated : t));
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteTodo = async (id) => {
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/tasks/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete task.');
      setTodos(todos.filter(t => t.id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  const startEdit = (todo) => {
    setEditingId(todo.id);
    setEditText(todo.text);
  };

  const saveEdit = async (id) => {
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: editText })
      });
      if (!res.ok) throw new Error('Failed to save changes.');
      const updated = await res.json();
      setTodos(todos.map(t => t.id === id ? updated : t));
      setEditingId(null);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="container">
      <h1>My Tasks</h1>
      
      {error && (
        <div className="error-banner" style={{ color: 'red', marginBottom: '10px' }}>
          Error: {error} 
          <button onClick={() => setError(null)} style={{ marginLeft: '10px' }}>×</button>
        </div>
      )}

      <form onSubmit={addTodo} className="todo-form">
        <input 
          value={inputValue} 
          onChange={(e) => setInputValue(e.target.value)} 
          placeholder="What needs to be done?"
        />
        <button type="submit">Add</button>
      </form>

      <div className="filter-section">
        <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>All</button>
        <button className={filter === 'active' ? 'active' : ''} onClick={() => setFilter('active')}>Active</button>
        <button className={filter === 'completed' ? 'active' : ''} onClick={() => setFilter('completed')}>Completed</button>
      </div>

      {loading ? (
        <div className="loading">Loading tasks...</div>
      ) : (
      <ul className="todo-list">
        {filteredTodos.map(todo => (
          <li key={todo.id} className={todo.completed ? 'completed' : ''}>
            {editingId === todo.id ? (
              <div className="edit-mode">
                <input value={editText} onChange={(e) => setEditText(e.target.value)} />
                <button onClick={() => saveEdit(todo.id)}>Save</button>
                <button className="cancel-btn" onClick={() => setEditingId(null)}>Cancel</button>
              </div>
            ) : (
              <>
                <div className="todo-content">
                  <input 
                    type="checkbox" 
                    checked={todo.completed} 
                    onChange={() => toggleTodo(todo.id, todo.completed)} 
                  />
                  <span className="todo-text">
                    {todo.text}
                  </span>
                </div>
                <div className="actions">
                  <button className="edit-btn" onClick={() => startEdit(todo)} title="Edit Task">
                    ✎
                  </button>
                  <button className="delete-btn" onClick={() => deleteTodo(todo.id)} title="Delete Task">
                    ×
                  </button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
      )}
    </div>
  );
}

export default App;