import React, { useState, useEffect } from 'react';

function App() {
  const [todos, setTodos] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');

  useEffect(() => {
    fetch('/api/todos')
      .then(res => res.json())
      .then(data => setTodos(data));
  }, []);

  const addTodo = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    const res = await fetch('/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: inputValue })
    });
    const newTodo = await res.json();
    setTodos([...todos, newTodo]);
    setInputValue('');
  };

  const toggleTodo = async (id, completed) => {
    const res = await fetch(`/api/todos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: !completed })
    });
    const updated = await res.json();
    setTodos(todos.map(t => t.id === id ? updated : t));
  };

  const deleteTodo = async (id) => {
    await fetch(`/api/todos/${id}`, { method: 'DELETE' });
    setTodos(todos.filter(t => t.id !== id));
  };

  const startEdit = (todo) => {
    setEditingId(todo.id);
    setEditText(todo.text);
  };

  const saveEdit = async (id) => {
    const res = await fetch(`/api/todos/${id}`, {
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
      <h1>Task Manager</h1>
      <form onSubmit={addTodo} className="todo-form">
        <input 
          value={inputValue} 
          onChange={(e) => setInputValue(e.target.value)} 
          placeholder="What needs to be done?"
        />
        <button type="submit">Add Task</button>
      </form>
      <ul className="todo-list">
        {todos.map(todo => (
          <li key={todo.id} className={todo.completed ? 'completed' : ''}>
            {editingId === todo.id ? (
              <div className="edit-mode">
                <input value={editText} onChange={(e) => setEditText(e.target.value)} />
                <button onClick={() => saveEdit(todo.id)}>Save</button>
              </div>
            ) : (
              <>
                <span onClick={() => toggleTodo(todo.id, todo.completed)}>
                  {todo.text}
                </span>
                <div className="actions">
                  <button className="edit-btn" onClick={() => startEdit(todo)}>Edit</button>
                  <button className="delete-btn" onClick={() => deleteTodo(todo.id)}>Delete</button>
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