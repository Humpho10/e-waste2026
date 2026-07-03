import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { BadgeProvider } from './context/BadgeContext';
import { ToastProvider } from './components/Toast';
import './index.css';

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BadgeProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </BadgeProvider>
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
);