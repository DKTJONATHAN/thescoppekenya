import React from 'react';
import { hydrateRoot, createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import App from './App';
import './index.css';

const container = document.getElementById('root') as HTMLElement;

const app = (
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>
);

// If the root has server-rendered content, hydrate; otherwise do a fresh render
if (container.innerHTML.trim().length > 0) {
  hydrateRoot(container, app);
} else {
  createRoot(container).render(app);
}
