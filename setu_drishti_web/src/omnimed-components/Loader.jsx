import React from 'react';

export default function Loader({ visible, text = 'Processing…' }) {
  if (!visible) return null;
  return (
    <div className="global-loader" role="dialog" aria-modal="true" aria-label="Processing" style={{ display: 'flex' }}>
      <div className="loader-inner">
        <div className="loader-ring" aria-hidden="true" />
        <p className="loader-text" id="loaderText">{text}</p>
      </div>
    </div>
  );
}
