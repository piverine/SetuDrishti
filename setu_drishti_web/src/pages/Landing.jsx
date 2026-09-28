import React, { useEffect, useRef } from 'react';
import { Activity, ShieldAlert, Zap, Brain, ClipboardList, MapPin, Lock, ArrowRight, Scan, Monitor, HeartPulse } from 'lucide-react';
import { Link } from 'react-router-dom';

/* ─── Subtle animated SVG mesh background ─── */
function MeshBackground() {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {/* Top-right gradient orb */}
      <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(14,165,233,0.12) 0%, transparent 65%)', borderRadius: '50%' }} />
      {/* Bottom-left orb */}
      <div style={{ position: 'absolute', bottom: '-10%', left: '-5%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(168,85,247,0.10) 0%, transparent 65%)', borderRadius: '50%' }} />
      {/* Center soft wash */}
      <div style={{ position: 'absolute', top: '30%', left: '40%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(34,211,238,0.07) 0%, transparent 70%)', borderRadius: '50%' }} />
      {/* Subtle grid lines */}
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.035 }}>
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#0ea5e9" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
    </div>
  );
}

/* ─── Reusable styles ─── */
const glassCard = (extra = {}) => ({
  background: 'rgba(255,255,255,0.72)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.9)',
  borderRadius: '20px',
  boxShadow: '0 4px 24px rgba(0,0,0,0.06), 0 1px 0 rgba(255,255,255,1) inset',
  ...extra,
});

const gradText = {
  background: 'linear-gradient(120deg, #0284c7 0%, #7c3aed 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
};

export default function Landing({ mockupAuth }) {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(145deg, #f0f7ff 0%, #fafafe 40%, #f5f0ff 100%)', color: '#111827', fontFamily: '"Inter", system-ui, sans-serif', overflowX: 'hidden' }}>
      <MeshBackground />

      {/* ══════════════════ NAVBAR ══════════════════ */}
      <nav style={{ position: 'relative', zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 48px', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', background: 'rgba(255,255,255,0.75)', borderBottom: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 12px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'linear-gradient(135deg, #0ea5e9, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(14,165,233,0.35)' }}>
            <Activity size={16} style={{ color: '#fff' }} />
          </div>
          <span style={{ fontWeight: 900, fontSize: '15px', letterSpacing: '2px', ...gradText }}>SETU-DRISHTI</span>
        </div>

        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          {['Physician Portal', 'Frontline Triage', 'District Health Pulse', 'Patient Terminal'].map(item => (
            <span key={item} style={{ padding: '6px 14px', borderRadius: '50px', fontSize: '12px', color: '#4b5563', cursor: 'pointer', letterSpacing: '0.3px', fontWeight: 500, transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#0284c7'; e.currentTarget.style.background = 'rgba(14,165,233,0.08)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#4b5563'; e.currentTarget.style.background = 'transparent'; }}
            >{item}</span>
          ))}
          <Link to="/dashboard" style={{ marginLeft: '8px', padding: '9px 22px', borderRadius: '50px', background: 'linear-gradient(135deg, #0ea5e9, #7c3aed)', color: '#fff', fontWeight: 700, fontSize: '12px', textDecoration: 'none', letterSpacing: '0.5px', boxShadow: '0 4px 16px rgba(14,165,233,0.35)' }}>
            Login / Register
          </Link>
        </div>
      </nav>

      {/* ══════════════════ HERO ══════════════════ */}
      <section style={{ position: 'relative', zIndex: 5, display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '48px', padding: '72px 60px 56px', alignItems: 'center' }}>
        {/* LEFT */}
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '5px 14px', borderRadius: '50px', background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.25)', marginBottom: '28px' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#22c55e', display: 'inline-block', animation: 'lp-pulse 1.5s ease-in-out infinite' }} />
            <span style={{ fontSize: '10px', color: '#0284c7', fontWeight: 700, letterSpacing: '2.5px', textTransform: 'uppercase' }}>LIVE SYSTEM ACTIVE</span>
          </div>

          <h1 style={{ fontSize: '52px', fontWeight: 900, lineHeight: 1.1, marginBottom: '22px', color: '#0f172a' }}>
            The Future of{' '}
            <span style={gradText}>Clinical Intelligence.</span>
            <br />AI-Powered, Edge-Enabled.
          </h1>

          <p style={{ fontSize: '16px', color: '#6b7280', lineHeight: 1.75, marginBottom: '36px', maxWidth: '460px' }}>
            A unified platform for critical care, early sepsis detection, and comprehensive patient monitoring. Bridging data, insight, and action.
          </p>

          <div style={{ display: 'flex', gap: '14px', marginBottom: '48px', flexWrap: 'wrap' }}>
            <Link to="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '13px 26px', borderRadius: '50px', background: 'linear-gradient(135deg, #0ea5e9, #0284c7)', color: '#fff', fontWeight: 700, textDecoration: 'none', letterSpacing: '0.8px', fontSize: '13px', boxShadow: '0 4px 20px rgba(14,165,233,0.4)', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(14,165,233,0.5)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(14,165,233,0.4)'; }}
            >
              Request Platform Demo <ArrowRight size={15} />
            </Link>
            <Link to="/omnimed" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '13px 26px', borderRadius: '50px', background: 'rgba(124,58,237,0.08)', border: '1.5px solid rgba(124,58,237,0.3)', color: '#7c3aed', fontWeight: 700, textDecoration: 'none', letterSpacing: '0.8px', fontSize: '13px', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.14)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.08)'; }}
            >
              <Zap size={15} /> OmniMed AI Suite
            </Link>
          </div>

          <div style={{ display: 'flex', gap: '40px' }}>
            {[{ val: '94%', label: 'Sepsis Recall Rate' }, { val: '<2s', label: 'Alert Latency' }, { val: '8+', label: 'AI Modules' }].map(s => (
              <div key={s.label}>
                <div style={{ fontSize: '30px', fontWeight: 900, ...gradText }}>{s.val}</div>
                <div style={{ fontSize: '10px', color: '#9ca3af', letterSpacing: '1.5px', textTransform: 'uppercase', marginTop: '4px' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — ICU Monitor Light Card */}
        <div style={{ position: 'relative' }}>
          {/* Floating badge */}
          <div style={{ position: 'absolute', top: '-18px', right: '-12px', ...glassCard({ borderRadius: '14px', border: '1px solid rgba(124,58,237,0.2)', background: 'rgba(255,255,255,0.9)', padding: '10px 18px', zIndex: 5 }) }}>
            <div style={{ fontSize: '11px', color: '#7c3aed', fontWeight: 700, letterSpacing: '1.5px' }}>✦ OmniMed Edge</div>
            <div style={{ fontSize: '9px', color: '#9ca3af', marginTop: '2px' }}>7 AI Modules Active</div>
          </div>

          <div style={{ ...glassCard({ padding: '26px', boxShadow: '0 20px 60px rgba(0,0,0,0.08), 0 1px 0 rgba(255,255,255,1) inset' }) }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <div style={{ fontSize: '10px', color: '#0284c7', fontWeight: 700, letterSpacing: '2.5px', textTransform: 'uppercase' }}>ICU WARD · BED 04</div>
                <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>SHARMA, RAJESH · PT-2847</div>
              </div>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', padding: '4px 10px', background: 'rgba(239,68,68,0.08)', borderRadius: '20px', border: '1px solid rgba(239,68,68,0.2)' }}>
                <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#ef4444', animation: 'lp-pulse 1s ease-in-out infinite' }} />
                <span style={{ fontSize: '10px', color: '#dc2626', letterSpacing: '1px', fontWeight: 700 }}>CRITICAL</span>
              </div>
            </div>

            {/* ECG */}
            <div style={{ background: 'rgba(240,249,255,0.8)', borderRadius: '12px', padding: '12px 10px', marginBottom: '18px', border: '1px solid rgba(14,165,233,0.15)' }}>
              <svg width="100%" height="52" viewBox="0 0 400 52" preserveAspectRatio="none">
                <polyline
                  points="0,26 30,26 45,26 52,4 58,48 64,8 70,40 78,26 108,26 123,26 130,4 136,48 142,8 148,40 156,26 186,26 201,26 208,4 214,48 220,8 226,40 234,26 264,26 279,26 286,4 292,48 298,8 304,40 312,26 342,26 357,26 364,4 370,48 376,8 382,40 400,26"
                  fill="none" stroke="#0ea5e9" strokeWidth="2.5"
                />
              </svg>
            </div>

            {/* Vital Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '16px' }}>
              {[
                { label: 'HR', value: '112', unit: 'bpm', color: '#ef4444', bg: '#fef2f2' },
                { label: 'SpO₂', value: '94', unit: '%', color: '#0284c7', bg: '#f0f9ff' },
                { label: 'MAP', value: '61', unit: 'mmHg', color: '#7c3aed', bg: '#faf5ff' },
                { label: 'Temp', value: '38.7', unit: '°C', color: '#d97706', bg: '#fffbeb' },
                { label: 'MEWS', value: '6', unit: 'pts', color: '#ea580c', bg: '#fff7ed' },
                { label: 'Risk', value: '89', unit: '%', color: '#dc2626', bg: '#fef2f2' },
              ].map(v => (
                <div key={v.label} style={{ background: v.bg, borderRadius: '10px', padding: '10px 12px', border: `1px solid ${v.color}22` }}>
                  <div style={{ fontSize: '9px', color: '#9ca3af', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '5px' }}>{v.label}</div>
                  <div style={{ fontSize: '22px', fontWeight: 900, color: v.color, lineHeight: 1 }}>{v.value}</div>
                  <div style={{ fontSize: '9px', color: '#d1d5db', marginTop: '2px' }}>{v.unit}</div>
                </div>
              ))}
            </div>

            {/* Alert Bar */}
            <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px', padding: '11px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: '#dc2626', fontWeight: 700, letterSpacing: '0.5px' }}>🚨 SEPSIS PROTOCOL INITIATED</span>
              <span style={{ fontSize: '12px', color: '#dc2626', fontWeight: 900 }}>89%</span>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════ FEATURE CARDS ══════════════════ */}
      <section style={{ position: 'relative', zIndex: 5, padding: '0 60px 56px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '18px' }}>
          {[
            { icon: <Brain size={36} style={{ color: '#0284c7' }} />, title: 'Advanced Diagnostics & Insights.', accent: 'rgba(14,165,233,0.06)', border: 'rgba(14,165,233,0.2)' },
            { icon: <ClipboardList size={36} style={{ color: '#7c3aed' }} />, title: 'Real-Time Patient Records & Vitals.', accent: 'rgba(124,58,237,0.06)', border: 'rgba(124,58,237,0.2)' },
            { icon: <MapPin size={36} style={{ color: '#0284c7' }} />, title: 'Population Health Trends.', accent: 'rgba(14,165,233,0.06)', border: 'rgba(14,165,233,0.2)' },
            { icon: <Lock size={36} style={{ color: '#d97706' }} />, title: 'Personal Health Passport & Privacy Control.', accent: 'rgba(217,119,6,0.06)', border: 'rgba(217,119,6,0.2)' },
          ].map((card, i) => (
            <div key={i}
              style={{ ...glassCard({ padding: '28px 22px', background: `rgba(255,255,255,0.85)`, borderColor: card.border, cursor: 'pointer', transition: 'all 0.3s' }) }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.06)'; }}
            >
              <div style={{ marginBottom: '18px' }}>{card.icon}</div>
              <p style={{ fontSize: '14px', color: '#374151', fontWeight: 600, lineHeight: 1.55, margin: 0 }}>{card.title}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════ PLATFORM FEATURES + AUTH ══════════════════ */}
      <section style={{ position: 'relative', zIndex: 5, padding: '0 60px 80px' }}>
        <h2 style={{ textAlign: 'center', fontSize: '11px', fontWeight: 700, letterSpacing: '5px', color: '#9ca3af', textTransform: 'uppercase', marginBottom: '28px' }}>PLATFORM FEATURES &amp; PRIVACY</h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '22px', alignItems: 'start' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {[
              { icon: <Scan size={28} style={{ color: '#0284c7' }} />, title: 'AR Lens', sub: 'Holographic Vitals & Risk Drivers.', border: 'rgba(14,165,233,0.2)', bg: 'rgba(14,165,233,0.05)' },
              { icon: <Monitor size={28} style={{ color: '#7c3aed' }} />, title: 'ICU Command', sub: '24/7 Multi-Patient Sepsis Protocol Tracking.', border: 'rgba(124,58,237,0.2)', bg: 'rgba(124,58,237,0.05)' },
              { icon: <HeartPulse size={28} style={{ color: '#16a34a' }} />, title: 'Data Privacy', sub: 'Complete Edge AI Data & Consent Control.', border: 'rgba(22,163,74,0.2)', bg: 'rgba(22,163,74,0.05)' },
            ].map((f, i) => (
              <div key={i}
                style={{ ...glassCard({ padding: '24px', background: f.bg, border: `1px solid ${f.border}`, cursor: 'pointer', transition: 'all 0.3s' }) }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.04)'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.06)'; }}
              >
                <div style={{ marginBottom: '14px' }}>{f.icon}</div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>{f.title}</div>
                <div style={{ fontSize: '12px', color: '#6b7280', lineHeight: 1.6 }}>{f.sub}</div>
              </div>
            ))}
          </div>

          {/* Auth Panel */}
          <div style={{ ...glassCard({ padding: '28px', background: 'rgba(255,255,255,0.92)', boxShadow: '0 20px 60px rgba(0,0,0,0.08)' }) }}>
            <div style={{ height: '3px', background: 'linear-gradient(90deg, #0ea5e9, #7c3aed)', borderRadius: '3px', marginBottom: '22px' }} />

              <>
                <div style={{ textAlign: 'center', marginBottom: '22px' }}>
                  <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'linear-gradient(135deg, #0ea5e9, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', boxShadow: '0 6px 20px rgba(14,165,233,0.35)' }}>
                    <Activity size={22} style={{ color: '#fff' }} />
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>Physician Portal</h3>
                  <p style={{ fontSize: '11px', color: '#9ca3af', letterSpacing: '1px' }}>Demo Mode · Auth Bypassed</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <Link to="/dashboard" style={{ display: 'block', textAlign: 'center', padding: '14px', borderRadius: '14px', background: 'linear-gradient(135deg, #0ea5e9, #0284c7)', color: '#fff', fontWeight: 800, textDecoration: 'none', fontSize: '12px', letterSpacing: '2px', boxShadow: '0 6px 20px rgba(14,165,233,0.4)' }}>
                    ACCESS WARD COMMAND
                  </Link>
                  <Link to="/omnimed" style={{ display: 'block', textAlign: 'center', padding: '12px', borderRadius: '14px', background: 'rgba(124,58,237,0.08)', border: '1.5px solid rgba(124,58,237,0.25)', color: '#7c3aed', fontWeight: 700, textDecoration: 'none', fontSize: '12px', letterSpacing: '1.5px' }}>
                    ✦ OMNIMED AI SUITE
                  </Link>
                </div>
                <p style={{ textAlign: 'center', fontSize: '10px', color: '#d1d5db', marginTop: '16px' }}>
                  Bypassed authentication for hackathon evaluation.
                </p>
              </>
          </div>
        </div>
      </section>

      {/* ══════════════════ FOOTER ══════════════════ */}
      <footer style={{ position: 'relative', zIndex: 5, borderTop: '1px solid rgba(0,0,0,0.06)', padding: '20px 60px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.5)' }}>
        <span style={{ fontSize: '11px', color: '#9ca3af', letterSpacing: '0.5px' }}>© 2025 Setu-Drishti × OmniMed AI Suite · Team StackOverChad · Hacknation 2.0</span>
        <div style={{ display: 'flex', gap: '20px' }}>
          {['Privacy', 'HIPAA Compliance', 'API Docs'].map(l => (
            <span key={l} style={{ fontSize: '11px', color: '#9ca3af', cursor: 'pointer', transition: 'color 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#0284c7'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#9ca3af'; }}
            >{l}</span>
          ))}
        </div>
      </footer>

      <style>{`
        @keyframes lp-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.85); }
        }
      `}</style>
    </div>
  );
}
