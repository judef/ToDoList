
import ReactDOM from 'react-dom/client';
import AppWithClerk from './App'; // Import the new wrapper component
import './App.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AppWithClerk />
  </React.StrictMode>
);
