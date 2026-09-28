import React, { useState, useRef, useEffect } from 'react';
import { OmniAPI } from '../services/api.js';

const GAUGE_TOTAL = 267;

export default function Triage({ onAddAudit, onShowToast, onShowLoader, onHideLoader }) {
  const [patientId, setPatientId] = useState('P001');
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const gaugeFillRef = useRef(null);
  const gaugeValueRef = useRef(null);

  const setPhrase = (phrase) => setText(phrase);

  const animateGauge = (score) => {
    const offset = GAUGE_TOTAL - (score / 100) * GAUGE_TOTAL;
    if (gaugeFillRef.current) gaugeFillRef.current.style.strokeDashoffset = offset;
    if (gaugeValueRef.current) gaugeValueRef.current.textContent = `${score}%`;
  };

  const run = async () => {
    if (!text.trim()) { onShowToast('Please enter symptoms or a voice transcript.', 'error'); return; }
    setLoading(true);
    onShowLoader('Analyzing urgency score…');
    try {
      const data = await OmniAPI.analyzeTone(text);
      setResult(data);
      const score = Math.round(data.acoustic_urgency_score || 0);
      setTimeout(() => animateGauge(score), 50);
      onAddAudit(`ToneScore: Patient ${patientId} scored ${score}% urgency`, score > 70 ? 'red' : 'cyan');
      onShowToast('Triage analysis complete.', 'success');
    } catch (e) {
      onShowToast(`Analysis failed: ${e.message}`, 'error');
    } finally {
      setLoading(false);
      onHideLoader();
    }
  };

  const urgencyScore = result?.acoustic_urgency_score || 0;
  const urgencyColor = result
    ? urgencyScore > 70 ? 'CRITICAL' : urgencyScore > 40 ? 'MODERATE' : 'ROUTINE'
    : null;

  return (
    <section className="page active" id="page-triage" aria-labelledby="triageTitle">
      <div className="page-inner">
        <div className="page-hero">
          <div className="page-hero-text">
            <div className="module-eyebrow eyebrow-red">ToneScore · AI Triage Engine</div>
            <h1 id="triageTitle" className="page-title">Emotion-Aware Triage</h1>
            <p className="page-subtitle">Analyze vocal acoustics and transcript sentiment to produce a composite urgency score.</p>
          </div>
        </div>
        <div className="two-col">
          <div className="card">
            <h2 className="card-title" style={{ marginBottom: '1.5rem' }}>Patient Symptom Input</h2>
            <div className="form-group">
              <label className="form-label" htmlFor="triagePatientId">Patient ID</label>
              <input className="form-input" id="triagePatientId" type="text" placeholder="e.g. P001" value={patientId} onChange={e => setPatientId(e.target.value)} autoComplete="off" />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="triageText">Symptoms / Voice Transcript</label>
              <textarea className="form-textarea" id="triageText" rows="6" placeholder="Describe the patient's symptoms…" value={text} onChange={e => setText(e.target.value)} />
            </div>
            <div className="quick-set">
              <span className="quick-set-label">Quick fill:</span>
              <button className="chip-btn chip-critical" onClick={() => setPhrase('severe chest pain and cannot breathe, feeling like dying, help me please')}>🔴 Critical</button>
              <button className="chip-btn chip-moderate" onClick={() => setPhrase('mild fever and nausea since yesterday morning, feeling uncomfortable and dizzy')}>🟡 Moderate</button>
              <button className="chip-btn chip-routine" onClick={() => setPhrase('routine check, feeling fine, only a slight headache')}>🟢 Routine</button>
            </div>
            <button className="btn-action btn-full" id="triageBtn" onClick={run} disabled={loading}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
              {loading ? 'Analyzing…' : 'Analyze Urgency'}
            </button>
          </div>

          {!result ? (
            <div className="card result-placeholder">
              <div className="placeholder-inner">
                <div className="placeholder-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg></div>
                <p className="placeholder-title">Awaiting Analysis</p>
                <p className="placeholder-text">Enter patient symptoms and click <strong>Analyze Urgency</strong>.</p>
              </div>
            </div>
          ) : (
            <div className="card" aria-live="polite">
              <div className="card-header">
                <h2 className="card-title">Triage Report</h2>
                <span className={`result-badge badge-${urgencyColor?.toLowerCase()}`}>{urgencyColor}</span>
              </div>
              <div className="gauge-wrap">
                <svg className="gauge-svg" viewBox="0 0 220 130">
                  <defs>
                    <linearGradient id="gaugeGradDark" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#22c55e"/>
                      <stop offset="50%" stopColor="#f59e0b"/>
                      <stop offset="100%" stopColor="#ef4444"/>
                    </linearGradient>
                  </defs>
                  <path d="M 25 105 A 85 85 0 0 1 195 105" stroke="var(--gauge-track)" strokeWidth="14" fill="none" strokeLinecap="round"/>
                  <path ref={gaugeFillRef} d="M 25 105 A 85 85 0 0 1 195 105" stroke="url(#gaugeGradDark)" strokeWidth="14" fill="none" strokeDasharray="267" strokeDashoffset="267" strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1.3s cubic-bezier(.4,0,.2,1)' }}/>
                  <text ref={gaugeValueRef} x="110" y="93" textAnchor="middle" className="gauge-value-text">0%</text>
                  <text x="110" y="113" textAnchor="middle" className="gauge-label-text">URGENCY SCORE</text>
                </svg>
              </div>
              <div className="emotion-chips" aria-label="Detected emotions" role="list">
                {(result.detected_emotions || []).map(e => (
                  <span key={e} className="emotion-chip" role="listitem">{e}</span>
                ))}
              </div>
              <div className="recommendation-box">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <span role="alert">{result.recommendation || 'Review patient vitals immediately.'}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
