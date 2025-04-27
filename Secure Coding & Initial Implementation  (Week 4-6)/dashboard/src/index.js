import './styles/index.css'; // Global styles
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { BrowserRouter } from 'react-router-dom'; // ✅ Import

const container = document.getElementById('root');
const root = createRoot(container);

// ✅ Wrap App in <BrowserRouter>
root.render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
  