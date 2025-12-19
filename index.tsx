
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error("Fatal: Root element not found!");
} else {
  try {
    const root = createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (error) {
    console.error("Root render failed:", error);
    rootElement.innerHTML = `<div style="padding: 20px; text-align: center;">加载失败，请检查网络连接。</div>`;
  }
}
