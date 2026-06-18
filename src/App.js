import React, { useState, useEffect } from 'react';

function App() {
  const [todos, setTodos] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetch('/api/tasks')
      .then(res => res.json())
      .then(data => setTodos(data));
  }, []);

  const filteredTodos = todos.filter(todo => {
    if (filter === 'active') return !todo.completed;
    if (filter === 'completed') return todo.completed;
    return true;
  });

  const addTodo = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: inputValue })
    });
    const newTodo = await res.json();
    setTodos([...todos, newTodo]);
    setInputValue('');
  };

  const toggleTodo = async (id, completed) => {
    const res = await fetch(`/api/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: !completed })
    });
    const updated = await res.json();
    setTodos(todos.map(t => t.id === id ? updated : t));
  };

  const deleteTodo = async (id) => {
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
    setTodos(todos.filter(t => t.id !== id));
  };

  const startEdit = (todo) => {
    setEditingId(todo.id);
    setEditText(todo.text);
  };

  const saveEdit = async (id) => {
    const res = await fetch(`/api/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: editText })
    });
    const updated = await res.json();
    setTodos(todos.map(t => t.id === id ? updated : t));
    setEditingId(null);
  };

  return (
    <div className="container">
      <h1>My Tasks</h1>
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
    </div>
  );
}

export default App;