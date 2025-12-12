import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Robust Polyfill for process.env
// This runs before anything else to prevent "process is not defined" crashes
if (typeof window !== 'undefined') {
  // Ensure process exists
  if (typeof (window as any).process === 'undefined') {
    (window as any).process = {};
  }
  // Ensure process.env exists
  if (typeof (window as any).process.env === 'undefined') {
    (window as any).process.env = {};
  }
  // Assign API Key if not already set
  if (!(window as any).process.env.API_KEY) {
    (window as any).process.env.API_KEY = 
      (import.meta as any).env?.VITE_API_KEY || 
      (import.meta as any).env?.REACT_APP_API_KEY || 
      (import.meta as any).env?.API_KEY || 
      '';
  }
}

console.log("App initializing..."); // Debug log

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error("Failed to find root element");
  throw new Error("Could not find root element to mount to");
}

try {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log("App rendered successfully");
} catch (error) {
  console.error("Error rendering app:", error);
}