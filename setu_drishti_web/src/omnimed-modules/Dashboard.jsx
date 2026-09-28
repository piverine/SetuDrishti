import React, { useEffect } from 'react';

const MOCK_PATIENTS = [
  { id: 'P-001', name: 'Ravi Kumar', age: 45, condition: 'Cardiac - Stable', risk: 'low', vitals: 'HR 72 · SpO2 98%' },
  { id: 'P-002', name: 'Priya Sharma', age: 32, condition: 'Anemia - Moderate', risk: 'medium', vitals: 'HR 88 · SpO2 96%' },
  { id: 'P-003', name: 'Arun Das', age: 67, condition: 'Hypoxia - Critical', risk: 'high', vitals: 'HR 115 · SpO2 88%' },
  { id: 'P-004', name: 'Meena Iyer', age: 28, condition: 'Skin Lesion - Review', risk: 'medium', vitals: 'HR 76 · SpO2 99%' },
];

const MODULE_HEALTH = [
  { name: 'ToneScore AI', status: 'online', color: 'green' },
  { name: 'Nidana Vision', status: 'online', color: 'green' },
  { name: 'TrialBridge NLP', status: 'online', color: 'green' },
  { name: 'SentinelIQ ML', status: 'online', color: 'green' },
  { name: 'Offline Sync', status: 'online', color: 'green' },
];

export default function Dashboard({ auditEntries, onAddAudit }) {
  useEffect(() => {
    onAddAudit('Dashboard initialized — all modules nominal', 'green');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="page active" id="page-dashboard" aria-labelledby="dashTitle">
      <div className="page-inner">
        <div className="page-hero">
          <div className="page-hero-text">
            <h1 id="dashTitle" className="page-title">Clinical Dashboard</h1>
            <p className="page-subtitle">Real-time patient intelligence &amp; system overview</p>
          </div>
        </div>

        <div className="stats-grid" role="list" aria-label="Key metrics">
          {[
            { n: 12, label: 'Active Patients', trend: '↑ 2 today', cls: '', tcls: 'stat-up', color: 'blue', icon: <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></> },
            { n: 3, label: 'Critical Alerts', trend: '⚠ Needs attention', cls: 'stat-danger', tcls: 'stat-down', color: 'red', icon: <><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></> },
            { n: 4, label: 'Trial Matches', trend: '↑ New this week', cls: 'stat-success', tcls: 'stat-up', color: 'green', icon: <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/> },
            { n: 1, label: 'Security Flags', trend: 'Review pending', cls: 'stat-warning', tcls: 'stat-down', color: 'amber', icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/> },
          ].map((s, i) => (
            <div key={i} className="stat-card animate-up" role="listitem" style={{ '--delay': `${i * 60}ms` }}>
              <div className={`stat-icon-wrap stat-${s.color}`} aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{s.icon}</svg>
              </div>
              <div className="stat-body">
                <span className={`stat-number ${s.cls}`}>{s.n}</span>
                <span className="stat-label">{s.label}</span>
                <span className={`stat-trend ${s.tcls}`}>{s.trend}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="dashboard-grid">
          <div className="card animate-up" style={{ '--delay': '240ms' }}>
            <div className="card-header">
              <h2 className="card-title">Patient Records</h2>
              <span className="card-chip">Mock FHIR</span>
            </div>
            <div className="patient-list" role="list" aria-label="Patient records">
              {MOCK_PATIENTS.map(p => (
                <div key={p.id} className={`patient-row risk-${p.risk}`} role="listitem">
                  <div className="patient-avatar" aria-hidden="true">{p.name[0]}</div>
                  <div className="patient-info">
                    <span className="patient-name">{p.name}</span>
                    <span className="patient-meta">{p.id} · Age {p.age} · {p.vitals}</span>
                  </div>
                  <span className={`patient-status status-${p.risk}`}>{p.condition}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="dashboard-side">
            <div className="card animate-up" style={{ '--delay': '300ms' }}>
              <div className="card-header">
                <h2 className="card-title">Live Audit Log</h2>
                <span className="live-indicator" aria-label="Live updates">
                  <span className="live-dot" aria-hidden="true" />Live
                </span>
              </div>
              <div className="audit-log" role="log" aria-live="polite" aria-label="Recent audit events">
                {auditEntries.map(e => (
                  <div key={e.id} className="audit-entry" role="listitem">
                    <div className={`audit-dot dot-${e.color}`} aria-hidden="true" />
                    <span className="audit-txt">{e.text}</span>
                    <span className="audit-time">{e.time}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card animate-up" style={{ '--delay': '360ms' }}>
              <div className="card-header"><h2 className="card-title">Module Status</h2></div>
              <div className="module-health" role="status">
                {MODULE_HEALTH.map(m => (
                  <div key={m.name} className="module-health-row">
                    <span className={`health-dot dot-${m.color}`} aria-hidden="true" />
                    <span className="health-name">{m.name}</span>
                    <span className={`health-status status-${m.color}`}>{m.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
