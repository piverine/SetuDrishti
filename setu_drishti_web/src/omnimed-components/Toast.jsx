import React from 'react';

export default function Toast({ toasts }) {
  return (
    <div className="toast-stack" id="toastContainer">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <div className="toast-icon" aria-hidden="true">
            {t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : 'ℹ'}
          </div>
          <span className="toast-text">{t.message}</span>
        </div>
      ))}
    </div>
  );
}
