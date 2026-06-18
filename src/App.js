import React, { useState, useEffect } from 'react';
import { ClerkProvider, SignedIn, SignedOut, SignIn, SignUp, UserButton, useAuth } from '@clerk/clerk-react';

// Accessing the API base URL from environment variables
const API_BASE = process.env.REACT_APP_API_URL || '';
// Accessing Clerk Publishable Key from environment variables
const PUBLISHABLE_KEY = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key for Clerk");
}

function App() {
  const [todos, setTodos] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // useAuth hook must be used inside ClerkProvider
  const { isSignedIn } = useAuth(); 

  useEffect(() => {
    const fetchTasks = async () => {
      if (!isSignedIn) { // Only fetch tasks if the user is signed in
        setTodos([]); // Clear tasks if user signs out
        return;
      }
      setLoading(true); // Set loading state before fetch
      setError(null); // Clear previous errors
      try {
        const res = await fetch(`${API_BASE}/api/tasks`);
        if (!res.ok) {
          const errorData = await res.json(); // Attempt to read error message from response body
          throw new Error(errorData.message || 'Failed to fetch tasks.');
        }
        const data = await res.json();
        setTodos(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, [isSignedIn]); // Re-run effect when authentication status changes

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
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to add task.');
      }
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
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to update task.');
      }
      const updated = await res.json();
      setTodos(todos.map(t => t.id === id ? updated : t));
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteTodo = async (id) => {
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/tasks/${id}`, { method: 'DELETE' }); // No body needed for DELETE
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to delete task.');
      }
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
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to save changes.');
      }
      const updated = await res.json();
      setTodos(todos.map(t => t.id === id ? updated : t));
      setEditingId(null);
    } catch (err) {
      setError(err.message);
    }
  };

  return ( // Main application content for authenticated users
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>My Tasks</h1>
        <UserButton /> {/* Clerk User Button */}
      </div>

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

// This component wraps the main App with ClerkProvider and handles authentication routing
function AppWithClerk() {
  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <SignedIn>
        <App /> {/* Render the main App component if signed in */}
      </SignedIn>
      <SignedOut>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', flexDirection: 'column', gap: '20px' }}>
          <h2>Please sign in to manage your tasks</h2>
          <SignIn /> {/* Clerk Sign In component */}
          <SignUp /> {/* Clerk Sign Up component */}
        </div>
      </SignedOut>
    </ClerkProvider>
  );
}

export default AppWithClerk;

//export default App;