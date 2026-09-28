import React, { useState } from 'react';
import { OmniAPI } from '../services/api.js';

const ROLES = ['Cardiologist', 'Dermatologist', 'Nurse', 'Radiologist', 'Surgeon', 'Administrator', 'Pharmacist'];

function fmtHour(h) {
  const d = new Date(); d.setHours(h, 0, 0, 0);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

export default function SentinelIQ({ onAddAudit, onShowToast, onShowLoader, onHideLoader }) {
  const [role, setRole] = useState('Cardiologist');
  const [hour, setHour] = useState(14);
  const [billing, setBilling] = useState(0.85);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const setScenario = (r, h, b) => { setRole(r); setHour(h); setBilling(b); };

  const run = async () => {
    setLoading(true);
    onShowLoader('Running isolation forest audit…');
    try {
      const data = await OmniAPI.auditEHR(role, hour, billing);
      setResult(data);
      const flagged = data.is_anomaly === true;
      onAddAudit(`SentinelIQ: ${role} at ${fmtHour(hour)} — ${flagged ? '🚨 ANOMALY DETECTED' : '✅ Cleared'}`, flagged ? 'red' : 'green');
      onShowToast(flagged ? 'Anomaly detected! Review access log.' : 'Access cleared.', flagged ? 'error' : 'success');
    } catch (e) {
      onShowToast(`Audit failed: ${e.message}`, 'error');
    } finally {
      setLoading(false);
      onHideLoader();
    }
  };

  const flagged = result?.is_anomaly === true;

  return (
    <section className="page active" id="page-sentineliq" aria-labelledby="sentinelTitle">
      <div className="page-inner">
        <div className="page-hero">
          <div className="page-hero-text">
            <div className="module-eyebrow eyebrow-amber">SentinelIQ · Isolation Forest ML</div>
            <h1 id="sentinelTitle" className="page-title">EHR Anomaly Detection</h1>
            <p className="page-subtitle">Flags unusual role/time/billing combinations without any labelled fraud data.</p>
          </div>
        </div>
        <div className="two-col">
          <div className="card">
            <h2 className="card-title" style={{ marginBottom: '1.5rem' }}>EHR Access Log Parameters</h2>
            <div className="form-group">
              <label className="form-label" htmlFor="providerRole">Provider Role</label>
              <select className="form-select" id="providerRole" value={role} onChange={e => setRole(e.target.value)}>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="accessHour">Access Hour <span className="form-label-hint">(0 = midnight, 23 = 11 PM)</span></label>
              <div className="slider-group">
                <input className="form-input slim" id="accessHour" type="number" min="0" max="23" value={hour} onChange={e => setHour(Number(e.target.value))} />
                <span className="slider-preview">{fmtHour(hour)}</span>
              </div>
              <input className="form-range" type="range" min="0" max="23" value={hour} onChange={e => setHour(Number(e.target.value))} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="billingScore">Billing Coherence Score <span className="form-label-hint">(0.0 = low · 1.0 = perfect)</span></label>
              <div className="slider-group">
                <input className="form-input slim" id="billingScore" type="number" min="0" max="1" step="0.01" value={billing} onChange={e => setBilling(Number(e.target.value))} />
                <span className="slider-preview">{Math.round(billing * 100)}%</span>
              </div>
              <input className="form-range" type="range" min="0" max="1" step="0.01" value={billing} onChange={e => setBilling(Number(e.target.value))} />
            </div>
            <div className="quick-set">
              <span className="quick-set-label">Risk scenarios:</span>
              <button className="chip-btn chip-critical" onClick={() => setScenario('Dermatologist', 3, 0.2)}>🔴 Suspicious</button>
              <button className="chip-btn chip-routine" onClick={() => setScenario('Nurse', 14, 0.91)}>🟢 Normal</button>
              <button className="chip-btn chip-moderate" onClick={() => setScenario('Administrator', 2, 0.35)}>🟡 At Risk</button>
            </div>
            <button className="btn-action btn-full" onClick={run} disabled={loading}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              {loading ? 'Auditing…' : 'Run Audit Check'}
            </button>
          </div>

          {!result ? (
            <div className="card result-placeholder">
              <div className="placeholder-inner">
                <div className="placeholder-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div>
                <p className="placeholder-title">Ready to Audit</p>
                <p className="placeholder-text">Configure access parameters and click <strong>Run Audit Check</strong>.</p>
              </div>
            </div>
          ) : (
            <div className="card" aria-live="polite">
              <div className="card-header"><h2 className="card-title">Audit Result</h2></div>
              <div className="audit-hero">
                <div className={`audit-hero-icon ${flagged ? 'audit-icon-flagged' : 'audit-icon-cleared'}`}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 36, height: 36 }}>
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                </div>
                <div>
                  <div
                    className="audit-hero-label"
                    role="status"
                    style={{ color: flagged ? 'var(--color-danger)' : 'var(--color-success)' }}
                  >
                    {flagged ? 'ANOMALY DETECTED' : 'ACCESS CLEARED'}
                  </div>
                  <p className="audit-hero-detail">
                    {flagged
                      ? 'Unusual access pattern detected. Manual review required.'
                      : 'Access pattern is within normal operational parameters'}
                  </p>
                </div>
              </div>
              <div className="data-table" role="table">
                {[
                  ['Provider Role',    role],
                  ['Access Time',      `${fmtHour(hour)} (Hour ${hour})`],
                  ['Billing Coherence',`${Math.round(billing * 100)}%`],
                  ['Model',            'Isolation Forest (scikit-learn)'],
                  ['Action Taken',     result.action_taken || 'N/A'],
                  ['Anomaly Detected', result.is_anomaly ? 'Yes' : 'No'],
                ].map(([k, v]) => (
                  <div key={k} className="data-row" role="row">
                    <span className="data-key" role="cell">{k}</span>
                    <span className="data-val" role="cell">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
