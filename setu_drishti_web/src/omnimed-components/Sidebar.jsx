import React from 'react';

export default function Sidebar({ currentPage, onNavigate, onExit, onToggleTheme, backendStatus, onRetry }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></> },
  ];
  const aiModules = [
    { id: 'triage',       label: 'ToneScore Triage',    badge: 'AI',  icon: <path d="M22 12h-4l-3 9L9 3l-3 9H2"/> },
    { id: 'nidana',       label: 'Nidana Vision+',      badge: 'CV',  icon: <><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/><path d="M11 8v6M8 11h6"/></> },
    { id: 'trialbridge',  label: 'TrialBridge',         badge: 'NLP', icon: <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/> },
    { id: 'sentineliq',   label: 'SentinelIQ',          badge: 'ML',  icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/> },
    { id: 'deterioration',label: 'Deterioration AI',    badge: 'XGB', icon: <><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/><circle cx="22" cy="12" r="2" fill="currentColor"/></> },
  ];
  const dataOps = [
    { id: 'sync', label: 'Patient Sync', icon: <><polyline points="1 4 1 10 7 10"/><polyline points="23 20 23 14 17 14"/><path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15"/></> },
  ];

  const statusColor = backendStatus === 'online' ? 'green' : backendStatus === 'offline' ? 'red' : 'amber';
  const statusText  = backendStatus === 'online' ? 'Backend Online' : backendStatus === 'offline' ? 'Offline' : 'Connecting…';

  const NavBtn = ({ item }) => (
    <button
      className={`nav-item${currentPage === item.id ? ' active' : ''}`}
      id={`nav-${item.id}`}
      onClick={() => onNavigate(item.id)}
      aria-current={currentPage === item.id ? 'page' : undefined}
    >
      <span className="nav-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{item.icon}</svg>
      </span>
      <span className="nav-label">{item.label}</span>
      {item.badge && <span className="nav-badge">{item.badge}</span>}
    </button>
  );

  return (
    <aside className="sidebar" id="sidebar" role="navigation" aria-label="Main navigation">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="logo-mark" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="2"/>
              <path d="M16 8v16M8 16h16M11 11l10 10M21 11L11 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="sidebar-brand">
            <span className="brand-name">Setu-Drishti</span>
            <span className="brand-tag">Clinical AI OS</span>
          </div>
        </div>
        <button className="sidebar-back-btn" onClick={onExit} title="Back to ward dashboard" aria-label="Back to home">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
      </div>

      <div className={`backend-status backend-${statusColor}`} id="backendStatus" role="status" aria-live="polite">
        <span className={`status-dot dot-${statusColor}`} id="statusDot" aria-hidden="true" />
        <span id="statusText" className="status-text">{statusText}</span>
        {backendStatus === 'offline' && (
          <button className="status-retry" onClick={onRetry} title="Retry connection" aria-label="Retry backend connection">↻</button>
        )}
      </div>

      <nav className="sidebar-nav" id="sidebarNav">
        {navItems.map(i => <NavBtn key={i.id} item={i} />)}
        <div className="nav-section-label" aria-hidden="true">AI Modules</div>
        {aiModules.map(i => <NavBtn key={i.id} item={i} />)}
        <div className="nav-section-label" aria-hidden="true">Data Ops</div>
        {dataOps.map(i => <NavBtn key={i.id} item={i} />)}
      </nav>

      <div className="sidebar-footer">
        <button className="theme-toggle-sidebar" onClick={onToggleTheme} aria-label="Toggle light/dark mode">
          <span className="theme-icon-sun" aria-hidden="true">☀</span>
          <span className="theme-icon-moon" aria-hidden="true">☾</span>
          <span className="theme-toggle-label">Toggle Theme</span>
        </button>
        <p className="sidebar-version">v2.0 · Hackathon Build · © 2026 Setu-Drishti</p>
      </div>
    </aside>
  );
}
