import React, { useState } from 'react';
import { OmniAPI } from '../services/api.js';

const DEFAULT_VITALS = {
  patient_id: '',
  HR: 80, O2Sat: 97, Temp: 37.0, SBP: 120, MAP: 85, DBP: 75, Resp: 16,
  BaseExcess: 0, HCO3: 24, pH: 7.40, Lactate: 1.0, Glucose: 110,
  Creatinine: 0.9, WBC: 8, Platelets: 250, Hgb: 13, Hct: 40,
  Age: 55, Gender: 1, ICULOS: 1,
};

const VITAL_FIELDS = [
  { key: 'patient_id', label: 'Patient ID',  type: 'text',   unit: '',       placeholder: 'e.g. P001' },
  { key: 'HR',         label: 'Heart Rate',   type: 'number', unit: 'bpm',    min: 0,   max: 300,  step: 1 },
  { key: 'O2Sat',      label: 'SpO₂',         type: 'number', unit: '%',      min: 50,  max: 100,  step: 0.1 },
  { key: 'Temp',       label: 'Temperature',  type: 'number', unit: '°C',     min: 30,  max: 45,   step: 0.1 },
  { key: 'SBP',        label: 'Systolic BP',  type: 'number', unit: 'mmHg',   min: 50,  max: 250,  step: 1 },
  { key: 'MAP',        label: 'MAP',          type: 'number', unit: 'mmHg',   min: 20,  max: 200,  step: 1 },
  { key: 'DBP',        label: 'Diastolic BP', type: 'number', unit: 'mmHg',   min: 20,  max: 150,  step: 1 },
  { key: 'Resp',       label: 'Resp. Rate',   type: 'number', unit: '/min',   min: 0,   max: 60,   step: 1 },
  { key: 'pH',         label: 'Blood pH',     type: 'number', unit: '',       min: 6.5, max: 8.0,  step: 0.01 },
  { key: 'Lactate',    label: 'Lactate',      type: 'number', unit: 'mmol/L', min: 0,   max: 20,   step: 0.1 },
  { key: 'Glucose',    label: 'Glucose',      type: 'number', unit: 'mg/dL',  min: 20,  max: 600,  step: 1 },
  { key: 'Creatinine', label: 'Creatinine',   type: 'number', unit: 'mg/dL',  min: 0,   max: 20,   step: 0.1 },
  { key: 'WBC',        label: 'WBC',          type: 'number', unit: '10⁹/L',  min: 0,   max: 100,  step: 0.1 },
  { key: 'Platelets',  label: 'Platelets',    type: 'number', unit: '10⁹/L',  min: 0,   max: 1000, step: 1 },
  { key: 'Hgb',        label: 'Hemoglobin',   type: 'number', unit: 'g/dL',   min: 0,   max: 25,   step: 0.1 },
  { key: 'Hct',        label: 'Hematocrit',   type: 'number', unit: '%',      min: 0,   max: 70,   step: 0.1 },
  { key: 'BaseExcess', label: 'Base Excess',  type: 'number', unit: 'mEq/L',  min: -30, max: 30,   step: 0.1 },
  { key: 'HCO3',       label: 'HCO₃',         type: 'number', unit: 'mEq/L',  min: 0,   max: 60,   step: 0.1 },
  { key: 'Age',        label: 'Age',          type: 'number', unit: 'yrs',    min: 0,   max: 120,  step: 1 },
  { key: 'Gender',     label: 'Gender',       type: 'number', unit: '1=M 0=F',min: 0,   max: 1,    step: 1 },
  { key: 'ICULOS',     label: 'ICU Hours',    type: 'number', unit: 'hrs',    min: 0,   max: 336,  step: 1 },
];

const SCENARIOS = [
  { label: '🔴 Septic Shock',  vals: { HR: 128, MAP: 55, Temp: 39.4, Lactate: 4.8, O2Sat: 88, Resp: 28, pH: 7.22, WBC: 22, Creatinine: 2.8, Platelets: 65 } },
  { label: '🟡 Moderate Risk', vals: { HR: 108, MAP: 68, Temp: 38.5, Lactate: 2.2, O2Sat: 94, Resp: 22, pH: 7.32, WBC: 13, Creatinine: 1.4, Platelets: 148 } },
  { label: '🟢 Stable',        vals: { HR: 72,  MAP: 90, Temp: 36.8, Lactate: 0.9, O2Sat: 98, Resp: 14, pH: 7.41, WBC: 7,  Creatinine: 0.8, Platelets: 260 } },
];

const ALERT_COLORS = {
  CRITICAL: { bar: '#ef4444', glow: 'rgba(239,68,68,0.3)', text: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.3)' },
  HIGH:     { bar: '#f97316', glow: 'rgba(249,115,22,0.3)', text: '#f97316', bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.3)' },
  WATCH:    { bar: '#eab308', glow: 'rgba(234,179,8,0.25)', text: '#eab308', bg: 'rgba(234,179,8,0.06)',  border: 'rgba(234,179,8,0.25)' },
  SAFE:     { bar: '#22d3ee', glow: 'rgba(34,211,238,0.2)', text: '#22d3ee', bg: 'rgba(34,211,238,0.06)', border: 'rgba(34,211,238,0.2)' },
};

export default function Deterioration({ onAddAudit, onShowToast, onShowLoader, onHideLoader }) {
  const [vitals, setVitals] = useState(DEFAULT_VITALS);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const set = (key, val) => setVitals(prev => ({ ...prev, [key]: val }));

  const applyScenario = (scenario) => {
    setVitals(prev => ({ ...prev, ...scenario.vals }));
    setResult(null);
  };

  const run = async () => {
    setLoading(true);
    onShowLoader('Running XGBoost deterioration model…');
    try {
      const data = await OmniAPI.predictDeterioration(vitals);
      setResult(data);
      const level = data.alert_level;
      onAddAudit(
        `Deterioration: ${vitals.patient_id || 'Patient'} — ${level} (${data.risk_score}% risk)`,
        level === 'CRITICAL' ? 'red' : level === 'HIGH' ? 'amber' : level === 'WATCH' ? 'amber' : 'green'
      );
      onShowToast(
        level === 'CRITICAL' ? '🚨 Critical deterioration risk detected!' :
        level === 'HIGH'     ? '⚠️ High deterioration risk — monitor closely.' :
        'Deterioration analysis complete.',
        level === 'CRITICAL' ? 'error' : level === 'HIGH' ? 'error' : 'success'
      );
    } catch (e) {
      onShowToast(`Prediction failed: ${e.message}`, 'error');
    } finally {
      setLoading(false);
      onHideLoader();
    }
  };

  const colors = result ? (ALERT_COLORS[result.alert_level] || ALERT_COLORS.SAFE) : ALERT_COLORS.SAFE;
  const score  = result?.risk_score ?? 0;

  return (
    <section className="page active" id="page-deterioration" aria-labelledby="detTitle">
      <div className="page-inner">

        {/* Hero */}
        <div className="page-hero">
          <div className="page-hero-text">
            <div className="module-eyebrow eyebrow-red">Deterioration Monitor · XGBoost v2.0</div>
            <h1 id="detTitle" className="page-title">Patient Deterioration Risk</h1>
            <p className="page-subtitle">
              Predict clinical deterioration up to 6 hours ahead using 40-feature XGBoost model
              trained on PhysioNet sepsis telemetry data.
            </p>
          </div>
        </div>

        {/* Quick Scenarios */}
        <div className="quick-set" style={{ marginBottom: '1.5rem' }}>
          <span className="quick-set-label">Load scenario:</span>
          {SCENARIOS.map(s => (
            <button key={s.label} className="chip-btn chip-neutral" onClick={() => applyScenario(s)}>
              {s.label}
            </button>
          ))}
        </div>

        <div className="two-col">
          {/* ── LEFT: Input form ── */}
          <div className="card">
            <h2 className="card-title" style={{ marginBottom: '1.5rem' }}>Patient Vitals Input</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
              {VITAL_FIELDS.map(f => (
                <div className="form-group" key={f.key} style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor={`det-${f.key}`}>
                    {f.label}
                    {f.unit && <span className="form-label-hint"> ({f.unit})</span>}
                  </label>
                  <input
                    className="form-input slim"
                    id={`det-${f.key}`}
                    type={f.type}
                    min={f.min} max={f.max} step={f.step}
                    placeholder={f.placeholder}
                    value={vitals[f.key]}
                    onChange={e => set(f.key, f.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
                  />
                </div>
              ))}
            </div>

            <button
              className="btn-action btn-full"
              style={{ marginTop: '1.5rem' }}
              id="detRunBtn"
              onClick={run}
              disabled={loading}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
              {loading ? 'Analysing…' : 'Predict Deterioration Risk'}
            </button>
            <p className="form-helper" role="note">
              ⚕ Screening tool only — not a replacement for clinical judgment.
            </p>
          </div>

          {/* ── RIGHT: Result panel ── */}
          {!result ? (
            <div className="card result-placeholder">
              <div className="placeholder-inner">
                <div className="placeholder-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                  </svg>
                </div>
                <p className="placeholder-title">Awaiting Analysis</p>
                <p className="placeholder-text">
                  Fill in patient vitals or load a scenario, then click <strong>Predict Deterioration Risk</strong>.
                </p>
              </div>
            </div>
          ) : (
            <div className="card" aria-live="polite" style={{
              border: `1px solid ${colors.border}`,
              boxShadow: `0 0 24px ${colors.glow}`,
            }}>
              {/* Big risk number */}
              <div style={{
                background: colors.bg,
                border: `1px solid ${colors.border}`,
                borderRadius: '12px',
                padding: '1.5rem',
                marginBottom: '1.25rem',
                position: 'relative',
                overflow: 'hidden',
              }}>
                <div style={{ fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: colors.text, marginBottom: '0.5rem' }}>
                  Deterioration Risk Score
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.375rem' }}>
                  <span style={{ fontSize: '4.5rem', fontWeight: 900, color: colors.text, lineHeight: 1, fontFamily: 'monospace' }}>
                    {score}
                  </span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 700, color: colors.text }}>%</span>
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: colors.text, letterSpacing: '0.08em', marginTop: '0.25rem' }}>
                  {result.alert_level}
                </div>

                {/* Risk bar */}
                <div style={{ marginTop: '1rem', background: 'rgba(255,255,255,0.06)', borderRadius: 99, height: 8, overflow: 'hidden' }}>
                  <div style={{
                    width: `${score}%`,
                    height: '100%',
                    background: `linear-gradient(90deg, #22d3ee, ${colors.bar})`,
                    borderRadius: 99,
                    boxShadow: `0 0 10px ${colors.bar}`,
                    transition: 'width 0.8s cubic-bezier(.4,0,.2,1)',
                  }} />
                </div>

                {result.alert_level === 'CRITICAL' && (
                  <div style={{ position: 'absolute', top: 12, right: 12 }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" className="animate-pulse">
                      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                  </div>
                )}
              </div>

              {/* AI Explanation */}
              <div className="recommendation-box" style={{ marginBottom: '1.25rem' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span role="alert">{result.explanation}</span>
              </div>

              {/* Top Risk Drivers */}
              {result.top_drivers && result.top_drivers.length > 0 && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: '0.75rem' }}>
                    Key Risk Drivers
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {result.top_drivers.map((d, i) => {
                      const absVal = Math.abs(d.contribution);
                      const barW   = Math.min(100, (absVal / 1.5) * 100);
                      const isDanger = d.contribution > 0;
                      return (
                        <div key={i}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                              {d.feature} <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>({d.value})</span>
                            </span>
                            <span style={{ fontFamily: 'monospace', fontSize: '0.6875rem', color: isDanger ? '#ef4444' : '#22c55e' }}>
                              {isDanger ? '+' : ''}{d.contribution.toFixed(3)}
                            </span>
                          </div>
                          <div style={{ position: 'relative', width: '100%', height: 6, background: 'var(--bg-input)', borderRadius: 99 }}>
                            <div style={{ position: 'absolute', left: '50%', width: 1, height: '200%', top: '-50%', background: 'var(--border-strong)', zIndex: 2 }} />
                            {isDanger ? (
                              <div style={{ position: 'absolute', left: '50%', width: `${barW / 2}%`, height: '100%', background: '#ef4444', borderRadius: '0 99px 99px 0', boxShadow: '0 0 6px #ef4444', transition: 'width 0.6s ease' }} />
                            ) : (
                              <div style={{ position: 'absolute', right: '50%', width: `${barW / 2}%`, height: '100%', background: '#22c55e', borderRadius: '99px 0 0 99px', boxShadow: '0 0 6px #22c55e', transition: 'width 0.6s ease' }} />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Vitals summary table */}
              <div className="card-header" style={{ marginBottom: '0.5rem' }}>
                <h2 className="card-title">Vitals Summary</h2>
              </div>
              <div className="data-table" role="table">
                {Object.entries(result.vitals_summary).map(([k, v]) => (
                  <div key={k} className="data-row" role="row">
                    <span className="data-key" role="cell">{k}</span>
                    <span className="data-val" role="cell">{typeof v === 'number' ? v.toFixed(1) : v}</span>
                  </div>
                ))}
                <div className="data-row" role="row">
                  <span className="data-key" role="cell">Raw Probability</span>
                  <span className="data-val" role="cell">{(result.raw_probability * 100).toFixed(2)}%</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
