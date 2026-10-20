import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Depois de um deploy, uma aba antiga pode pedir arquivos de página que não existem mais:
// recarrega uma vez para pegar a versão nova (a marca evita recarregar sem parar)
window.addEventListener('vite:preloadError', (event) => {
  try {
    const last = Number(sessionStorage.getItem('dotahub_reload_at') || 0);
    if (Date.now() - last < 10000) return;
    sessionStorage.setItem('dotahub_reload_at', String(Date.now()));
  } catch { /* sem sessionStorage: recarrega mesmo assim */ }
  event.preventDefault();
  window.location.reload();
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)