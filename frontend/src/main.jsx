import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles/themes.css';
import './styles/main.css';
import './styles/mobile.css';

createRoot(document.getElementById('app')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
