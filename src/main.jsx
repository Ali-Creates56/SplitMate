import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import './offlineSync.js';

// Monkeypatch fetch to support external API URL for Capacitor Android builds
const API_BASE = import.meta.env.VITE_API_URL || "";
if (API_BASE) {
  const originalFetch = window.fetch;
  window.fetch = async (input, init) => {
    if (typeof input === "string" && input.startsWith("/api/")) {
      input = API_BASE + input;
    }
    return originalFetch(input, init);
  };
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);