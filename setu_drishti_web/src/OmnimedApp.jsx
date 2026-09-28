import React, { useState } from 'react';
import './styles/main.css';
import { useTheme, useBackendStatus, useCurrentTime, useAuditLog, useToast } from './hooks/useApp.js';
import { useNavigate } from 'react-router-dom';
import Landing from './omnimed-components/Landing.jsx';
import Sidebar from './omnimed-components/Sidebar.jsx';
import Toast from './omnimed-components/Toast.jsx';
import Loader from './omnimed-components/Loader.jsx';
import Dashboard from './omnimed-modules/Dashboard.jsx';
import Triage from './omnimed-modules/Triage.jsx';
import Nidana from './omnimed-modules/Nidana.jsx';
import TrialBridge from './omnimed-modules/TrialBridge.jsx';
import SentinelIQ from './omnimed-modules/SentinelIQ.jsx';
import Sync from './omnimed-modules/Sync.jsx';
import Deterioration from './omnimed-modules/Deterioration.jsx';

export default function OmnimedApp() {
  const { theme, toggle: toggleTheme } = useTheme();
  const { status: backendStatus, retry } = useBackendStatus();
  const time = useCurrentTime();
  const { entries: auditEntries, add: addAudit } = useAuditLog();
  const { toasts, show: showToast } = useToast();
  const navigate = useNavigate();

  const [view, setView] = useState('app');
  const [page, setPage] = useState('dashboard');
  const [loaderVisible, setLoaderVisible] = useState(false);
  const [loaderText, setLoaderText] = useState('Processing…');

  const showLoader = (text = 'Processing…') => { setLoaderText(text); setLoaderVisible(true); };
  const hideLoader = () => setLoaderVisible(false);

  const pageProps = { onAddAudit: addAudit, onShowToast: showToast, onShowLoader: showLoader, onHideLoader: hideLoader };

  const PAGE_TITLES = {
    dashboard:    'Clinical Dashboard',
    triage:       'ToneScore Triage',
    nidana:       'Nidana Vision+',
    trialbridge:  'TrialBridge',
    sentineliq:   'SentinelIQ',
    sync:         'Patient Sync',
    deterioration:'Deterioration Monitor',
  };

  return (
    <>
      <Toast toasts={toasts} />
      <Loader visible={loaderVisible} text={loaderText} />

      {view === 'landing' ? (
        <Landing onEnter={() => setView('app')} theme={theme} onToggleTheme={toggleTheme} />
      ) : (
        <div className="app-shell" id="appShell">
          <Sidebar
            currentPage={page}
            onNavigate={setPage}
            onExit={() => navigate('/dashboard')}
            onToggleTheme={toggleTheme}
            backendStatus={backendStatus}
            onRetry={retry}
          />

          <main className="main-content" id="mainContent" role="main">
            {/* Topbar */}
            <header className="topbar" role="banner">
              <div className="topbar-left">
                <h2 className="topbar-title">{PAGE_TITLES[page]}</h2>
                <div className="topbar-breadcrumb" aria-label="Current page">
                  {page.charAt(0).toUpperCase() + page.slice(1)}
                </div>
              </div>
              <div className="topbar-right">
                <div className="topbar-time" aria-live="off">{time}</div>
                <div className="topbar-divider" aria-hidden="true" />
                <button className="theme-toggle-topbar" onClick={toggleTheme} aria-label="Toggle theme">
                  <span className="theme-icon-sun" aria-hidden="true">☀</span>
                  <span className="theme-icon-moon" aria-hidden="true">☾</span>
                </button>
              </div>
            </header>

            {/* Page router */}
            {page === 'dashboard'     && <Dashboard {...pageProps} auditEntries={auditEntries} onAddAudit={addAudit} />}
            {page === 'triage'        && <Triage {...pageProps} />}
            {page === 'nidana'        && <Nidana {...pageProps} />}
            {page === 'trialbridge'   && <TrialBridge {...pageProps} />}
            {page === 'sentineliq'    && <SentinelIQ {...pageProps} />}
            {page === 'sync'          && <Sync {...pageProps} />}
            {page === 'deterioration' && <Deterioration {...pageProps} />}
          </main>
        </div>
      )}
    </>
  );
}
