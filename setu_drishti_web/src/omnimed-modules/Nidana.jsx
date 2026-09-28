import React, { useState, useRef } from 'react';
import { OmniAPI, fileToBase64 } from '../services/api.js';

export default function Nidana({ onAddAudit, onShowToast, onShowLoader, onHideLoader }) {
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const handleFile = (file) => {
    if (!file || !file.type.startsWith('image/')) { onShowToast('Please select a valid image file.', 'error'); return; }
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setResult(null);
  };

  const run = async () => {
    if (!imageFile) return;
    setLoading(true);
    onShowLoader('Running CNN classification…');
    try {
      const b64 = await fileToBase64(imageFile);
      const data = await OmniAPI.analyzeImage(b64);
      setResult(data);
      onAddAudit(`Nidana Vision: ${data.diagnosis} (${Math.round((data.confidence_score || 0) * 100)}% confidence)`, data.urgency_level === 'HIGH' ? 'red' : 'cyan');
      onShowToast('Analysis complete.', 'success');
    } catch (e) {
      onShowToast(`Analysis failed: ${e.message}`, 'error');
    } finally {
      setLoading(false);
      onHideLoader();
    }
  };

  const confidence = result ? Math.round((result.confidence_score || 0) * 100) : 0;

  return (
    <section className="page active" id="page-nidana" aria-labelledby="nidanaTitle">
      <div className="page-inner">
        <div className="page-hero">
          <div className="page-hero-text">
            <div className="module-eyebrow eyebrow-blue">Nidana Vision+ · MobileNetV2 CNN</div>
            <h1 id="nidanaTitle" className="page-title">Skin Lesion Analysis</h1>
            <p className="page-subtitle">Upload a skin image for real-time AI classification. The CNN model returns a diagnosis and confidence score.</p>
          </div>
        </div>
        <div className="two-col">
          <div className="card">
            <h2 className="card-title" style={{ marginBottom: '1.5rem' }}>Image Upload</h2>
            <div
              className={`drop-zone${dragging ? ' drag-over' : ''}`}
              onClick={() => inputRef.current?.click()}
              onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              role="button" tabIndex="0"
              onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
            >
              <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleFile(e.target.files[0])} />
              {previewUrl ? (
                <img src={previewUrl} className="drop-preview" alt="Selected skin image preview" style={{ display: 'block' }} />
              ) : (
                <div className="drop-zone-inner">
                  <div className="drop-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div>
                  <p className="drop-title">Drag &amp; drop skin image here</p>
                  <p className="drop-hint">or click to browse · PNG, JPG, WEBP supported</p>
                  <span className="drop-chip">Max 10 MB</span>
                </div>
              )}
            </div>
            <button className="btn-action btn-full" onClick={run} disabled={!imageFile || loading}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
              {loading ? 'Analyzing…' : 'Analyze Lesion'}
            </button>
            <p className="form-helper" role="note">⚠ Screening tool only — not a clinical diagnosis.</p>
          </div>

          {!result ? (
            <div className="card result-placeholder">
              <div className="placeholder-inner">
                <div className="placeholder-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div>
                <p className="placeholder-title">No Image Selected</p>
                <p className="placeholder-text">Upload a skin image and click <strong>Analyze Lesion</strong> to get results.</p>
              </div>
            </div>
          ) : (
            <div className="card" aria-live="polite">
              <div className="card-header">
                <h2 className="card-title">Diagnostic Report</h2>
                <span className={`result-badge badge-${result.urgency_level?.toLowerCase()}`}>{result.urgency_level}</span>
              </div>
              <div className="diagnosis-block">
                <div className="diagnosis-icon-wrap">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 28, height: 28 }}><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                </div>
                <div>
                  <h3 className="diagnosis-label">{result.diagnosis}</h3>
                  <p className="diagnosis-detail" role="status">Confidence: {confidence}%</p>
                </div>
              </div>
              <div className="metric-group">
                <div className="metric-row">
                  <span className="metric-label">Confidence Score</span>
                  <span className="metric-value">{confidence}%</span>
                </div>
                <div className="progress-bar-wrap" role="progressbar" aria-valuenow={confidence} aria-valuemin="0" aria-valuemax="100">
                  <div className="progress-bar-fill" style={{ width: `${confidence}%` }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
