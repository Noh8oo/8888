import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Fix for "process is not defined" error in browser environments (Vercel/Vite)
// This ensures the Google GenAI SDK can access process.env.API_KEY without crashing the app
if (typeof window !== 'undefined' && typeof process === 'undefined') {
  (window as any).process = {
    env: {
      // Maps VITE_API_KEY (Standard for Vite on Vercel) or REACT_APP_API_KEY to process.env.API_KEY
      API_KEY: (import.meta as any).env?.VITE_API_KEY || (import.meta as any).env?.REACT_APP_API_KEY || (import.meta as any).env?.API_KEY || ''
    }
  };
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);