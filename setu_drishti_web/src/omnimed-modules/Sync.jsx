import React, { useState } from 'react';
import { OmniAPI } from '../services/api.js';

function driftLabel(v) {
  if (v < 3) return 'Low Risk';
  if (v < 7) return 'Moderate';
  return 'Critical';
}

export default function Sync({ onAddAudit, onShowToast, onShowLoader, onHideLoader }) {
  const [patientId, setPatientId] = useState('');
  const [notes, setNotes] = useState('');
  const [drift, setDrift] = useState(2.5);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!patientId.trim() || !notes.trim()) { onShowToast('Please fill in Patient ID and Clinical Notes.', 'error'); return; }
    setLoading(true);
    onShowLoader('Syncing to cloud database…');
    try {
      const data = await OmniAPI.syncPatient(patientId, notes, drift);
      setResult(data);
      onAddAudit(`Sync: Patient ${patientId} synced successfully`, 'green');
      onShowToast('Patient record synced successfully.', 'success');
    } catch (e) {
      onShowToast(`Sync failed: ${e.message}`, 'error');
    } finally {
      setLoading(false);
      onHideLoader();
    }
  };

  return (
    <section className="page active" id="page-sync" aria-labelledby="syncTitle">
      <div className="page-inner">
        <div className="page-hero">
          <div className="page-hero-text">
            <div className="module-eyebrow eyebrow-cyan">Sync Layer · HTTP/2 Push</div>
            <h1 id="syncTitle" className="page-title">Patient Data Sync</h1>
            <p className="page-subtitle">Securely push offline patient records to the cloud database when connectivity is restored.</p>
          </div>
        </div>
        <div className="two-col">
          <div className="card">
            <h2 className="card-title" style={{ marginBottom: '1.5rem' }}>Offline Payload</h2>
            <div className="form-group">
              <label className="form-label" htmlFor="syncPatientId">Patient ID</label>
              <input className="form-input" id="syncPatientId" type="text" placeholder="e.g. P001" value={patientId} onChange={e => setPatientId(e.target.value)} autoComplete="off" />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="syncNotes">Clinical Notes</label>
              <textarea className="form-textarea" id="syncNotes" rows="5" placeholder="Patient visited on 2026-04-11. BP: 130/85…" value={notes} onChange={e => setNotes(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="vitalsDrift">Vitals Drift Score <span className="form-label-hint">(0 = stable · 10 = critical)</span></label>
              <div className="slider-group">
                <input className="form-input slim" id="vitalsDrift" type="number" min="0" max="10" step="0.1" value={drift} onChange={e => setDrift(Number(e.target.value))} />
                <span className="slider-preview">{driftLabel(drift)}</span>
              </div>
              <input className="form-range" type="range" min="0" max="10" step="0.1" value={drift} onChange={e => setDrift(Number(e.target.value))} />
            </div>
            <button className="btn-action btn-full" onClick={run} disabled={loading}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><polyline points="23 20 23 14 17 14"/><path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15"/></svg>
              {loading ? 'Syncing…' : 'Sync to Cloud'}
            </button>
          </div>

          {!result ? (
            <div className="card result-placeholder">
              <div className="placeholder-inner">
                <div className="placeholder-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="1 4 1 10 7 10"/><polyline points="23 20 23 14 17 14"/><path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15"/></svg></div>
                <p className="placeholder-title">Ready to Sync</p>
                <p className="placeholder-text">Fill in patient data above and click <strong>Sync to Cloud</strong>.</p>
              </div>
            </div>
          ) : (
            <div className="card" aria-live="polite">
              <div className="card-header">
                <h2 className="card-title">Sync Complete</h2>
                <span className="result-badge result-badge-success">SUCCESS</span>
              </div>
              <div className="sync-anim" aria-hidden="true">
                <div className="sync-ring sync-ring-done" />
                <svg className="sync-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
              </div>
              <div className="data-table" role="table">
                {[['Patient ID', result.patient_id || patientId], ['Sync Time', result.sync_time || new Date().toLocaleTimeString()], ['Vitals Drift', `${drift} (${driftLabel(drift)})`], ['Status', 'Committed to DB']].map(([k, v]) => (
                  <div key={k} className="data-row" role="row"><span className="data-key" role="cell">{k}</span><span className="data-val" role="cell">{v}</span></div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
