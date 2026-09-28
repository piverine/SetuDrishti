import React, { useState } from 'react';
import { OmniAPI } from '../services/api.js';

export default function TrialBridge({ onAddAudit, onShowToast, onShowLoader, onHideLoader }) {
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (!text.trim()) { onShowToast('Please enter a medical summary.', 'error'); return; }
    setLoading(true);
    onShowLoader('Scanning clinical trial database…');
    try {
      const data = await OmniAPI.matchTrials(text);
      setResult(data);
      onAddAudit(`TrialBridge: Found ${data.matches?.length || 0} trial matches`, 'green');
      onShowToast(`${data.matches?.length || 0} trial matches found.`, 'success');
    } catch (e) {
      onShowToast(`Matching failed: ${e.message}`, 'error');
    } finally {
      setLoading(false);
      onHideLoader();
    }
  };

  return (
    <section className="page active" id="page-trialbridge" aria-labelledby="trialTitle">
      <div className="page-inner">
        <div className="page-hero">
          <div className="page-hero-text">
            <div className="module-eyebrow eyebrow-green">TrialBridge · SentenceBERT NLP</div>
            <h1 id="trialTitle" className="page-title">Clinical Trial Matching</h1>
            <p className="page-subtitle">Enter a patient medical summary. The NLP engine computes vector similarity against the trial database in real time.</p>
          </div>
        </div>
        <div className="two-col">
          <div className="card">
            <h2 className="card-title" style={{ marginBottom: '1.5rem' }}>Patient Medical Summary</h2>
            <div className="form-group">
              <label className="form-label" htmlFor="trialText">Medical Passport / Symptom Description</label>
              <textarea className="form-textarea" id="trialText" rows="8" placeholder="Patient presents with iron deficiency, severe fatigue…" value={text} onChange={e => setText(e.target.value)} />
            </div>
            <div className="quick-set">
              <span className="quick-set-label">Examples:</span>
              {[
                ['Anemia', 'severe iron deficiency anemia, pallor, fatigue, hemoglobin below 8 g/dL'],
                ['Skin', 'irregular pigmented skin lesion, asymmetric borders, rapid growth over 6 weeks'],
                ['Cardiac', 'resting heart rate 130 BPM, palpitations, dizziness episodes, syncope twice'],
                ['Hypoxia', 'SpO2 drops to 88%, frequent asthma attacks, requires inhaler multiple times daily'],
              ].map(([label, phrase]) => (
                <button key={label} className="chip-btn chip-neutral" onClick={() => setText(phrase)}>{label}</button>
              ))}
            </div>
            <button className="btn-action btn-full" onClick={run} disabled={loading}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/></svg>
              {loading ? 'Searching…' : 'Match Clinical Trials'}
            </button>
          </div>

          {!result ? (
            <div className="card result-placeholder">
              <div className="placeholder-inner">
                <div className="placeholder-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/></svg></div>
                <p className="placeholder-title">No Query Yet</p>
                <p className="placeholder-text">Enter a patient's medical summary above and click <strong>Match Clinical Trials</strong>.</p>
              </div>
            </div>
          ) : (
            <div className="card" aria-live="polite">
              <div className="card-header">
                <h2 className="card-title">Trial Matches</h2>
                <span className="result-badge result-badge-success">{result.matches?.length || 0} FOUND</span>
              </div>
              <p className="card-meta" role="status">
                Semantically scanned {result.total_active_trials_scanned || 0} active clinical trials in database
              </p>
              <div className="trial-list" role="list">
                {(result.matches || []).map((m, i) => (
                  <div key={i} className="trial-card" role="listitem">
                    <div className="trial-card-hd">
                      <span className="trial-id">{m.trial_id}</span>
                      <span className="trial-conf">{m.confidence_score}% match</span>
                    </div>
                    <div className="trial-cond">{m.condition}</div>
                    <div className="trial-why">{m.match_reason}</div>
                    <div className="progress-bar-wrap" role="progressbar" aria-valuenow={m.confidence_score} aria-valuemin="0" aria-valuemax="100">
                      <div className="progress-bar-fill" style={{ width: `${m.confidence_score}%` }} />
                    </div>
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
