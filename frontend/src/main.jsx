import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { BadgeProvider } from './context/BadgeContext';
import { ToastProvider } from './components/Toast';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <BadgeProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </BadgeProvider>
    </AuthProvider>
  </React.StrictMode>
);