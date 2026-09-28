import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, AreaChart, Area } from 'recharts';
import { AlertTriangle, Activity, Thermometer, Droplets, HeartPulse, ShieldAlert, BrainCircuit, Clock, Zap, ArrowLeft, Users, Scan, TrendingUp, TrendingDown, Minus, Waves, Stethoscope, FlaskConical, Info, ChevronRight, FileText, X, Package, CheckCircle2, XCircle } from 'lucide-react';

/* ══════════════════════════════════════════════════════════════
   ECG WAVEFORM ENGINE
   Generates realistic P-QRS-T complexes at a given HR
══════════════════════════════════════════════════════════════ */
const SAMPLE_RATE = 120;  // samples per second rendered
const DISPLAY_SECONDS = 6;
const TOTAL_SAMPLES = SAMPLE_RATE * DISPLAY_SECONDS;

function gauss(x, mu, sigma, amp) {
  return amp * Math.exp(-0.5 * ((x - mu) / sigma) ** 2);
}

/** Build one normalised beat (0..1 in time, -0.2..1.2 in voltage) */
function buildBeat(bpm) {
  const beatLen = Math.round((60 / bpm) * SAMPLE_RATE);
  const samples = new Float32Array(beatLen).fill(0);
  const frac = (i) => i / beatLen;

  for (let i = 0; i < beatLen; i++) {
    const f = frac(i);
    const v =
      gauss(f, 0.12, 0.025, 0.18)         // P wave
      + gauss(f, 0.28, 0.004, -0.12)      // Q dip
      + gauss(f, 0.30, 0.007, 1.15)       // R spike  ← main QRS peak
      + gauss(f, 0.32, 0.005, -0.18)      // S dip
      + gauss(f, 0.46, 0.04,  0.32);      // T wave
    samples[i] = v;
  }
  return samples;
}

/** Tile beats to fill TOTAL_SAMPLES then add ±2% noise */
function buildECGBuffer(bpm) {
  const beat = buildBeat(Math.max(30, Math.min(bpm, 200)));
  const buf = new Float32Array(TOTAL_SAMPLES);
  let pos = 0;
  while (pos < TOTAL_SAMPLES) {
    const len = Math.min(beat.length, TOTAL_SAMPLES - pos);
    buf.set(beat.subarray(0, len), pos);
    pos += beat.length;
  }
  // Add a touch of noise for realism
  for (let i = 0; i < buf.length; i++) {
    buf[i] += (Math.random() - 0.5) * 0.04;
  }
  return buf;
}

/** Convert Float32Array buffer to SVG polyline points string in a given viewport */
function bufferToPolyline(buf, vw, vh, baseline, amp) {
  const step = vw / (buf.length - 1);
  let d = '';
  for (let i = 0; i < buf.length; i++) {
    const x = i * step;
    const y = baseline - buf[i] * amp;
    d += `${x.toFixed(1)},${y.toFixed(1)} `;
  }
  return d.trim();
}

/* ── Live ECG Component ─────────────────────────────────────── */
function ECGMonitor({ hr = 72, alertLevel = 'SAFE', label = 'II', compact = false }) {
  const [points, setPoints] = useState('');
  const offsetRef = useRef(0);
  const bufRef = useRef(null);
  const rafRef = useRef(null);

  const VW = compact ? 340 : 520;
  const VH = compact ? 56 : 90;
  const BASE = compact ? 35 : 58;
  const AMP = compact ? 22 : 36;
  const SCROLL_SPEED = compact ? 1.6 : 2.0; // px per frame

  useEffect(() => {
    bufRef.current = buildECGBuffer(hr);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [hr]);

  const animate = useCallback(() => {
    if (!bufRef.current) return;
    offsetRef.current = (offsetRef.current + SCROLL_SPEED) % VW;
    const shift = Math.round((offsetRef.current / VW) * TOTAL_SAMPLES);
    // Rotate buffer for scroll effect
    const rolled = new Float32Array(TOTAL_SAMPLES);
    const tail = TOTAL_SAMPLES - shift;
    rolled.set(bufRef.current.subarray(shift), 0);
    rolled.set(bufRef.current.subarray(0, shift), tail);
    setPoints(bufferToPolyline(rolled, VW, VH, BASE, AMP));
    rafRef.current = requestAnimationFrame(animate);
  }, [VW, VH, BASE, AMP, SCROLL_SPEED]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [animate]);

  const traceColor = alertLevel === 'CRITICAL' ? '#ef4444' : alertLevel === 'HIGH' ? '#f97316' : alertLevel === 'WATCH' ? '#eab308' : '#22d3ee';
  const glowColor  = alertLevel === 'CRITICAL' ? 'rgba(239,68,68,0.5)' : alertLevel === 'HIGH' ? 'rgba(249,115,22,0.4)' : '#22d3ee80';

  return (
    <div style={{
      background: '#050d1a',
      borderRadius: compact ? 8 : 10,
      border: `1px solid ${traceColor}22`,
      padding: compact ? '6px 10px' : '10px 14px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Grid lines */}
      <svg
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.12 }}
        viewBox={`0 0 ${VW} ${VH}`}
        preserveAspectRatio="none"
      >
        {Array.from({ length: Math.floor(VW / 30) }).map((_, i) => (
          <line key={`v${i}`} x1={i * 30} y1={0} x2={i * 30} y2={VH} stroke="#22d3ee" strokeWidth="0.5" />
        ))}
        {Array.from({ length: Math.floor(VH / 18) }).map((_, i) => (
          <line key={`h${i}`} x1={0} y1={i * 18} x2={VW} y2={i * 18} stroke="#22d3ee" strokeWidth="0.5" />
        ))}
      </svg>

      {/* Lead label */}
      <div style={{
        position: 'absolute', top: 6, left: 10,
        fontSize: 9, fontWeight: 700, color: traceColor,
        letterSpacing: '0.12em', fontFamily: 'monospace',
      }}>
        LEAD {label} · {Math.round(hr)} BPM
      </div>

      {/* ECG trace */}
      <svg
        viewBox={`0 0 ${VW} ${VH}`}
        style={{ display: 'block', width: '100%', height: compact ? 56 : 90 }}
        preserveAspectRatio="none"
      >
        {/* Glow filter */}
        <defs>
          <filter id={`ecgGlow${label}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        {/* Baseline */}
        <line x1={0} y1={BASE} x2={VW} y2={BASE} stroke={traceColor} strokeWidth="0.4" strokeOpacity="0.3" />
        {/* Trace */}
        {points && (
          <polyline
            points={points}
            fill="none"
            stroke={traceColor}
            strokeWidth={compact ? 1.5 : 2}
            strokeLinejoin="round"
            filter={`url(#ecgGlow${label})`}
          />
        )}
        {/* Scan cursor */}
        <line
          x1={offsetRef.current % VW}
          y1={0}
          x2={offsetRef.current % VW}
          y2={VH}
          stroke={traceColor}
          strokeWidth="2"
          strokeOpacity="0.6"
        />
      </svg>
    </div>
  );
}

/* ── Mini sparkline for ward card ───────────────────────────── */
function MiniSparkline({ data, color = '#22d3ee', height = 28 }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const W = 80; const H = height;
  const pts = data.map((v, i) =>
    `${(i / (data.length - 1)) * W},${H - ((v - min) / range) * (H - 4) - 2}`
  ).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

/* ── Trend arrow ────────────────────────────────────────────── */
function TrendIcon({ values = [] }) {
  if (values.length < 2) return <Minus size={12} className="text-gray-500" />;
  const delta = values[values.length - 1] - values[values.length - 2];
  if (delta > 0.5) return <TrendingUp size={12} className="text-red-400" />;
  if (delta < -0.5) return <TrendingDown size={12} className="text-green-400" />;
  return <Minus size={12} className="text-gray-400" />;
}

/* ══════════════════════════════════════════════════════════════
   MAIN DASHBOARD
══════════════════════════════════════════════════════════════ */
const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export default function Dashboard() {
  const [view, setView] = useState('ward');             // 'ward' | 'patient'
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [selectedSystem, setSelectedSystem] = useState('Cardio');
  const [xaiTab, setXaiTab] = useState('shap');         // 'shap' | 'cf' | 'timeline'
  const [wardData, setWardData] = useState([]);
  const [patientData, setPatientData] = useState({ history: [], current_state: null });

  // Auto-Briefing State
  const [handoffModalOpen, setHandoffModalOpen] = useState(false);
  const [handoffLoading, setHandoffLoading] = useState(false);
  const [handoffText, setHandoffText] = useState('');

  const generateHandoff = async () => {
    if (!selectedPatientId) return;
    setHandoffModalOpen(true);
    setHandoffLoading(true);
    setHandoffText("");
    try {
      const res = await fetch(`${API_BASE}/api/v1/patient/${selectedPatientId}/shift_handoff`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setHandoffText(data.summary);
      } else {
        setHandoffText("Failed to generate AI shifting briefing via Gemini. " + (data.detail || ""));
      }
    } catch (err) {
      setHandoffText("Network error connecting to AI endpoint.");
    } finally {
      setHandoffLoading(false);
    }
  };

  // Family-Link Translator State
  const [familyModalOpen, setFamilyModalOpen] = useState(false);
  const [familyLoading, setFamilyLoading] = useState(false);
  const [familyText, setFamilyText] = useState('');

  const generateFamilyUpdate = async () => {
    if (!selectedPatientId) return;
    setFamilyModalOpen(true);
    setFamilyLoading(true);
    setFamilyText("");
    try {
      const res = await fetch(`${API_BASE}/api/v1/patient/${selectedPatientId}/family_update`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setFamilyText(data.summary);
      } else {
        setFamilyText("Failed to generate family update: " + (data.detail || ""));
      }
    } catch (err) {
      setFamilyText("Network error connecting to AI endpoint.");
    } finally {
      setFamilyLoading(false);
    }
  };

  const [activeInventoryAlert, setActiveInventoryAlert] = useState(null);
  useEffect(() => {
    let alert = null;
    if (view === 'ward' && wardData.length > 0) {
      const p = wardData.find(pat => pat.inventory_alert);
      if (p) alert = { ...p.inventory_alert, patient: p.patient_id };
    } else if (view === 'patient' && patientData?.current_state?.inventory_alert) {
      alert = { ...patientData.current_state.inventory_alert, patient: patientData.current_state.patient_id };
    }
    setActiveInventoryAlert(alert);
  }, [wardData, patientData, view]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (view === 'ward') {
          const res = await fetch(`${API_BASE}/api/v1/patients`);
          const data = await res.json();
          data.sort((a, b) => b.combined_risk_score - a.combined_risk_score);
          setWardData(data);
        } else if (view === 'patient' && selectedPatientId) {
          const res = await fetch(`${API_BASE}/api/v1/patient/${selectedPatientId}/timeline`);
          const data = await res.json();
          setPatientData(data);
        }
      } catch (_) {}
    };
    fetchData();
    const id = setInterval(fetchData, 1000);
    return () => clearInterval(id);
  }, [view, selectedPatientId]);

  const current = patientData.current_state;

  const getColors = (level) => {
    if (level === 'CRITICAL') return { bg: 'bg-red-950/60',    border: 'border-red-500',    text: 'text-red-400',    fill: '#ef4444', hex: '#ef4444' };
    if (level === 'HIGH')     return { bg: 'bg-orange-950/60', border: 'border-orange-500', text: 'text-orange-400', fill: '#f97316', hex: '#f97316' };
    if (level === 'WATCH')    return { bg: 'bg-yellow-950/60', border: 'border-yellow-500', text: 'text-yellow-400', fill: '#eab308', hex: '#eab308' };
    return                           { bg: 'bg-gray-900/60',   border: 'border-cyan-500',   text: 'text-cyan-400',  fill: '#22d3ee', hex: '#22d3ee' };
  };

  /* ── Ward View ──────────────────────────────────────────────── */
  if (view === 'ward') {
    return (
      <div className="min-h-screen bg-[#f0f4f9] dark:bg-[#080c14] text-gray-800 dark:text-gray-300 p-6 font-mono selection:bg-cyan-900 relative">
        
        {/* Inventory DB Action Popup */}
        {activeInventoryAlert && (
          <div className="fixed top-6 right-6 z-50 bg-[#0b1220] border-2 border-red-500 rounded-xl shadow-[0_0_30px_rgba(239,68,68,0.4)] p-4 max-w-sm w-full animate-bounce">
            <div className="flex items-center gap-3 border-b border-red-900/50 pb-2 mb-3">
              <Package className="text-red-500 animate-pulse" size={24} />
              <div>
                <h3 className="text-red-400 font-bold tracking-widest uppercase text-xs">Supply Chain Triggered</h3>
                <p className="text-white font-mono text-[10px]">{activeInventoryAlert.protocol} ({activeInventoryAlert.patient})</p>
              </div>
            </div>
            <p className="text-gray-400 text-[10px] mb-2 font-mono">{activeInventoryAlert.status}</p>
            <div className="space-y-2">
              {activeInventoryAlert.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between bg-black/40 p-2 rounded border border-gray-800">
                  <div className="flex items-center gap-2">
                    {item.available ? <CheckCircle2 size={14} className="text-green-500" /> : <XCircle size={14} className="text-yellow-500" />}
                    <span className={`text-[10px] ${item.available ? 'text-green-100' : 'text-yellow-100'}`}>{item.name}</span>
                  </div>
                  <span className={`text-[10px] font-bold ${item.available ? 'text-green-400' : 'text-yellow-400'}`}>{item.qty}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-end mb-6 border-b border-gray-200 dark:border-gray-800 pb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-widest flex items-center gap-3">
              <Activity className="text-cyan-500" /> Setu-Drishti <span className="text-sm font-normal text-cyan-700 dark:text-cyan-500 bg-cyan-50 dark:bg-cyan-950/30 px-2 py-1 rounded border border-cyan-200 dark:border-cyan-900">v2.0</span>
            </h1>
            <p className="text-gray-500 mt-2 text-sm uppercase tracking-widest">Unified ICU Decision Support System</p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 justify-end"><Users size={20} className="text-cyan-500"/> WARD COMMAND</h2>
            <p className="text-gray-500 text-sm mt-1">{wardData.length} Live Monitored Patients</p>
          </div>
        </div>

        {wardData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-cyan-500 animate-pulse border border-gray-200 dark:border-gray-800 rounded-lg bg-gray-100/50 dark:bg-gray-900/50">
            <Activity size={48} className="mb-4" />
            <p className="tracking-widest uppercase">Awaiting Live Telemetry Stream...</p>
            <p className="text-xs text-gray-500 mt-2">Start the simulator.py script</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {wardData.map((patient) => {
              const c = getColors(patient.alert_level);
              const hrHistory = (patientData.history || []).map(h => h.vitals?.HR || patient.vitals.HR);
              const latestHR = patient.vitals.HR;
              const isCritical = patient.alert_level === 'CRITICAL';

              return (
                <div
                  key={patient.patient_id}
                  onClick={() => { setSelectedPatientId(patient.patient_id); setView('patient'); }}
                  className={`bg-white dark:bg-[#0b1220] rounded-xl border-2 cursor-pointer hover:-translate-y-1.5 transition-all duration-200 relative overflow-hidden ${c.border} group`}
                  style={{ boxShadow: isCritical ? `0 0 24px ${c.hex}40` : 'none' }}
                >
                  {/* Colour stripe top */}
                  <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg, transparent, ${c.hex}, transparent)` }} />

                  {/* Critical pulse overlay */}
                  {isCritical && (
                    <div className="absolute inset-0 pointer-events-none opacity-5 animate-pulse" style={{ background: `radial-gradient(ellipse at top left, ${c.hex}, transparent 70%)` }} />
                  )}

                  <div className="p-4">
                    {/* Patient ID row */}
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-black text-gray-900 dark:text-gray-100">{patient.patient_id}</h3>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${c.text} border-current bg-current/10 tracking-widest`}>{patient.alert_level}</span>
                        </div>
                        <p className="text-[10px] text-gray-500 mt-0.5">{patient.patient_name} · BED {patient.bed_number}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {isCritical && <AlertTriangle className="animate-pulse text-red-500" size={18} />}
                        <ChevronRight size={14} className="text-gray-400 group-hover:text-cyan-400 transition-colors" />
                      </div>
                    </div>

                    {/* Risk score hero */}
                    <div className="flex items-baseline gap-1.5 my-3">
                      <span className={`text-4xl font-black tracking-tighter ${c.text}`}>{patient.combined_risk_score}</span>
                      <span className={`text-xs font-bold ${c.text}`}>% RISK</span>
                    </div>

                    {/* Risk bar */}
                    <div className="w-full bg-gray-200 dark:bg-gray-900 rounded-full h-1.5 mb-3 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${patient.combined_risk_score}%`,
                          background: `linear-gradient(90deg, #22d3ee, ${c.hex})`,
                          boxShadow: `0 0 8px ${c.hex}`,
                        }}
                      />
                    </div>

                    {/* Mini ECG strip */}
                    <div className="mb-3" style={{ borderRadius: 6, overflow: 'hidden' }}>
                      <ECGMonitor hr={latestHR} alertLevel={patient.alert_level} label="I" compact={true} />
                    </div>

                    {/* Vitals 2×3 grid */}
                    <div className="grid grid-cols-3 gap-1.5 mb-3">
                      {[
                        { icon: <HeartPulse size={9} className="text-red-400"/>, label: 'HR',   val: patient.vitals.HR.toFixed(0),   warn: patient.vitals.HR > 110 || patient.vitals.HR < 45 },
                        { icon: <Activity size={9} className="text-cyan-400"/>,  label: 'MAP',  val: patient.vitals.MAP.toFixed(0),  warn: patient.vitals.MAP < 65 },
                        { icon: <Thermometer size={9} className="text-orange-400"/>, label: 'T°', val: patient.vitals.Temp.toFixed(1), warn: patient.vitals.Temp > 38.3 || patient.vitals.Temp < 36 },
                        { icon: <Droplets size={9} className="text-yellow-400"/>, label: 'LAC', val: patient.vitals.Lactate.toFixed(1), warn: patient.vitals.Lactate > 2.0 },
                        { icon: <Waves size={9} className="text-blue-400"/>,     label: 'SBP',  val: patient.vitals.SBP?.toFixed(0) ?? '—', warn: (patient.vitals.SBP ?? 120) < 90 },
                        { icon: <FlaskConical size={9} className="text-purple-400"/>, label: 'DBP', val: patient.vitals.DBP?.toFixed(0) ?? '—', warn: false },
                      ].map(v => (
                        <div key={v.label} className={`rounded px-1.5 py-1 border ${v.warn ? 'border-red-700/50 bg-red-950/20' : 'border-gray-200 dark:border-gray-800 bg-white/60 dark:bg-black/30'}`}>
                          <span className="flex items-center gap-0.5 text-[8px] text-gray-500 uppercase mb-0.5">{v.icon}{v.label}</span>
                          <span className={`font-black text-xs ${v.warn ? 'text-red-400' : 'text-gray-900 dark:text-gray-100'}`}>{v.val}</span>
                        </div>
                      ))}
                    </div>

                    {/* Top driver badge */}
                    <div className="bg-gray-100/80 dark:bg-black/40 rounded p-2 border border-gray-200 dark:border-gray-800">
                      <p className="text-[8px] uppercase tracking-widest text-gray-500 mb-0.5 flex items-center gap-1"><BrainCircuit size={8} className="text-purple-400"/> AI Top Driver</p>
                      <p className="text-[10px] font-semibold text-gray-800 dark:text-gray-300 truncate">{patient.top_risk_driver}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════════
     PATIENT DETAIL VIEW
  ══════════════════════════════════════════════════════════════ */
  const colors = current ? getColors(current.alert_level) : getColors('SAFE');
  const isCritical = current?.alert_level === 'CRITICAL';

  /* Build history-based sparklines for each vital */
  const historyVital = (key) => (patientData.history || []).slice(-20).map(h => h.vitals?.[key] ?? 0);

  /* XAI Counterfactual — "What would lower the risk?" */
  const counterfactuals = current ? [
    { action: 'Fluid bolus 30ml/kg', delta: -18, metric: 'MAP ↑ to ≥65', icon: '💧' },
    { action: 'IV Norepinephrine', delta: -22, metric: 'MAP ↑ target 70', icon: '💉' },
    { action: 'Broad-spectrum ABX', delta: -15, metric: 'WBC ↓ over 6h', icon: '🧬' },
    { action: 'Lactate recheck 2h', delta: -8,  metric: 'Trend monitoring', icon: '🔬' },
  ] : [];

  /* XAI Evidence timeline */
  const evidenceTimeline = current ? [
    { hour: `H${Math.max(1,(current.hour||0)-6)}`, event: 'Tachycardia onset', severity: 'WATCH',    metric: `HR ${(current.vitals.HR * 0.85).toFixed(0)}` },
    { hour: `H${Math.max(2,(current.hour||0)-4)}`, event: 'MAP declining',     severity: 'HIGH',     metric: `MAP ${(current.vitals.MAP * 1.1).toFixed(0)} → ${(current.vitals.MAP * 0.95).toFixed(0)}` },
    { hour: `H${Math.max(3,(current.hour||0)-2)}`, event: 'Lactate elevated',  severity: 'HIGH',     metric: `Lactate ${current.vitals.Lactate.toFixed(1)} mmol/L` },
    { hour: `H${(current.hour||0)}`,               event: 'AI flag triggered', severity: 'CRITICAL', metric: `Risk ${current.combined_risk_score}%` },
  ] : [];

  const renderHologram = () => {
    const isActive = (sys) => selectedSystem === sys;
    return (
      <div className="bg-white dark:bg-[#080d17] rounded-xl p-5 border border-cyan-500/40 shadow-[0_0_20px_rgba(34,211,238,0.15)] flex flex-col h-full relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#22d3ee 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-2 flex items-center gap-2 relative z-10">
          <Scan size={14}/> Adv. Biometric Scan
        </h3>
        <div className="flex-grow flex items-center justify-center relative my-2 z-10">
          <style>{`
            @keyframes scan { 0%{transform:translateY(20px);opacity:0} 5%{opacity:1} 45%{opacity:1} 50%{transform:translateY(380px);opacity:0} 100%{opacity:0;transform:translateY(380px)} }
            .animate-scan{animation:scan 4s ease-in-out infinite}
          `}</style>
          <svg viewBox="0 0 200 400" className="w-full h-full max-h-[280px]">
            <path d="M 85 40 C 85 20,115 20,115 40 C 115 55,108 65,105 70 C 120 70,140 80,150 90 C 180 110,185 170,180 230 C 175 240,165 240,165 230 C 170 170,155 120,145 105 C 145 120,125 220,120 240 C 125 280,135 350,130 380 C 125 390,115 390,115 380 C 115 340,105 280,100 245 C 95 280,85 340,85 380 C 85 390,75 390,70 380 C 65 350,75 280,80 240 C 75 220,55 120,55 105 C 45 120,30 170,35 230 C 35 240,25 240,20 230 C 15 170,20 110,50 90 C 60 80,80 70,95 70 C 92 65,85 55,85 40 Z" className="fill-cyan-950/30 stroke-cyan-700/60 stroke-[1.5]" />
            <line x1="100" y1="55" x2="100" y2="245" className="stroke-cyan-800/60 stroke-1" strokeDasharray="3 3" />
            <g onClick={() => setSelectedSystem('Neuro')} className={`cursor-pointer transition-all duration-300 ${isActive('Neuro') ? 'fill-cyan-400 drop-shadow-[0_0_12px_cyan]' : 'fill-cyan-900/50 hover:fill-cyan-500/70'}`}>
              <path d="M 88 35 C 88 20,112 20,112 35 C 112 50,100 55,100 55 C 100 55,88 50,88 35 Z" />
            </g>
            <g onClick={() => setSelectedSystem('Respiratory')} className={`cursor-pointer transition-all duration-300 ${isActive('Respiratory') ? 'fill-blue-400 drop-shadow-[0_0_12px_blue]' : 'fill-blue-900/50 hover:fill-blue-500/70'}`}>
              <path d="M 75 100 C 60 110,65 140,85 150 C 95 150,95 110,90 95 Z" />
              <path d="M 125 100 C 140 110,135 140,115 150 C 105 150,105 110,110 95 Z" />
            </g>
            <g onClick={() => setSelectedSystem('Cardio')} className={`cursor-pointer transition-all duration-300 ${isActive('Cardio') ? 'fill-red-500 drop-shadow-[0_0_15px_red] animate-pulse' : 'fill-red-900/50 hover:fill-red-500/80'}`}>
              <path d="M 100 110 C 105 100,115 100,115 110 C 115 125,100 135,100 135 C 100 135,85 125,85 110 C 85 100,95 100,100 110 Z" />
            </g>
            <g onClick={() => setSelectedSystem('Metabolic')} className={`cursor-pointer transition-all duration-300 ${isActive('Metabolic') ? 'fill-yellow-400 drop-shadow-[0_0_12px_yellow]' : 'fill-yellow-900/50 hover:fill-yellow-500/70'}`}>
              <path d="M 70 165 C 65 195,80 225,100 230 C 120 225,135 195,130 165 C 110 175,90 175,70 165 Z" />
            </g>
            <path d="M 10 0 L 190 0 M 10 2 L 190 2" className="stroke-cyan-400 stroke-[1.5] drop-shadow-[0_0_8px_cyan] animate-scan" style={{ fill: 'none' }} />
          </svg>
        </div>
        <div className="bg-white/90 dark:bg-black/60 p-3 border border-cyan-900/40 rounded min-h-[100px] relative z-10 backdrop-blur-sm">
          {selectedSystem === 'Neuro' && current && (
            <div>
              <h4 className="text-cyan-400 font-bold text-[10px] uppercase tracking-widest border-b border-cyan-900/50 pb-1.5 mb-2">Neurological</h4>
              <div className="flex justify-between text-[11px] mb-1"><span className="text-gray-500">Core Temp</span><span className="font-bold text-gray-900 dark:text-gray-100">{current.vitals.Temp.toFixed(1)} °C</span></div>
              <div className="flex justify-between text-[11px] mb-1"><span className="text-gray-500">Mentation</span><span className={`font-bold ${isCritical ? 'text-red-400 animate-pulse' : 'text-green-400'}`}>{isCritical ? 'Altered / Confused' : 'Alert & Oriented'}</span></div>
              <div className="flex justify-between text-[11px]"><span className="text-gray-500">GCS (Est)</span><span className="font-bold text-gray-900 dark:text-gray-100">{isCritical ? '12' : '15'}</span></div>
            </div>
          )}
          {selectedSystem === 'Cardio' && current && (
            <div>
              <h4 className="text-red-400 font-bold text-[10px] uppercase tracking-widest border-b border-red-900/50 pb-1.5 mb-2">Cardiovascular</h4>
              <div className="flex justify-between text-[11px] mb-1"><span className="text-gray-500">Heart Rate</span><span className="font-bold text-gray-900 dark:text-gray-100">{current.vitals.HR.toFixed(0)} bpm</span></div>
              <div className="flex justify-between text-[11px] mb-1"><span className="text-gray-500">MAP</span><span className={`font-bold ${current.vitals.MAP < 65 ? 'text-red-400' : 'text-gray-900 dark:text-gray-100'}`}>{current.vitals.MAP.toFixed(0)} mmHg</span></div>
              <div className="flex justify-between text-[11px]"><span className="text-gray-500">Rhythm</span><span className={`font-bold ${current.vitals.HR > 110 ? 'text-yellow-400' : 'text-green-400'}`}>{current.vitals.HR > 110 ? 'Tachycardia' : 'Normal Sinus'}</span></div>
            </div>
          )}
          {selectedSystem === 'Respiratory' && current && (
            <div>
              <h4 className="text-blue-400 font-bold text-[10px] uppercase tracking-widest border-b border-blue-900/50 pb-1.5 mb-2">Respiratory</h4>
              <div className="flex justify-between text-[11px] mb-1"><span className="text-gray-500">SpO₂</span><span className="font-bold text-gray-900 dark:text-gray-100">{isCritical ? '88%' : '96%'}</span></div>
              <div className="flex justify-between text-[11px] mb-1"><span className="text-gray-500">RR</span><span className={`font-bold ${isCritical ? 'text-red-400' : 'text-gray-900 dark:text-gray-100'}`}>{isCritical ? '28 /min' : '16 /min'}</span></div>
              <div className="flex justify-between text-[11px]"><span className="text-gray-500">O₂ Support</span><span className="font-bold text-gray-900 dark:text-gray-100">{isCritical ? 'Nasal 4L' : 'Room Air'}</span></div>
            </div>
          )}
          {selectedSystem === 'Metabolic' && current && (
            <div>
              <h4 className="text-yellow-400 font-bold text-[10px] uppercase tracking-widest border-b border-yellow-900/50 pb-1.5 mb-2">Metabolic/Hepatic</h4>
              <div className="flex justify-between text-[11px] mb-1"><span className="text-gray-500">Serum Lactate</span><span className={`font-bold ${current.vitals.Lactate > 2.0 ? 'text-red-400 animate-pulse' : 'text-gray-900 dark:text-gray-100'}`}>{current.vitals.Lactate.toFixed(1)} mmol/L</span></div>
              <div className="flex justify-between text-[11px] mb-1"><span className="text-gray-500">Renal</span><span className="font-bold text-gray-900 dark:text-gray-100">{isCritical ? 'AKI Warning' : 'Stable'}</span></div>
              <div className="flex justify-between text-[11px]"><span className="text-gray-500">Glucose</span><span className="font-bold text-gray-900 dark:text-gray-100">110 mg/dL</span></div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f0f4f9] dark:bg-[#080c14] text-gray-800 dark:text-gray-300 p-6 font-mono selection:bg-cyan-900 relative">
      
      {/* Inventory DB Action Popup */}
      {activeInventoryAlert && (
        <div className="fixed top-6 right-6 z-50 bg-[#0b1220] border-2 border-red-500 rounded-xl shadow-[0_0_30px_rgba(239,68,68,0.4)] p-4 max-w-sm w-full animate-bounce">
          <div className="flex items-center gap-3 border-b border-red-900/50 pb-2 mb-3">
            <Package className="text-red-500 animate-pulse" size={24} />
            <div>
              <h3 className="text-red-400 font-bold tracking-widest uppercase text-xs">Supply Chain Triggered</h3>
              <p className="text-white font-mono text-[10px]">{activeInventoryAlert.protocol} ({activeInventoryAlert.patient})</p>
            </div>
          </div>
          <p className="text-gray-400 text-[10px] mb-2 font-mono">{activeInventoryAlert.status}</p>
          <div className="space-y-2">
            {activeInventoryAlert.items.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between bg-black/40 p-2 rounded border border-gray-800">
                <div className="flex items-center gap-2">
                  {item.available ? <CheckCircle2 size={14} className="text-green-500" /> : <XCircle size={14} className="text-yellow-500" />}
                  <span className={`text-[10px] ${item.available ? 'text-green-100' : 'text-yellow-100'}`}>{item.name}</span>
                </div>
                <span className={`text-[10px] font-bold ${item.available ? 'text-green-400' : 'text-yellow-400'}`}>{item.qty}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-end mb-5 border-b border-gray-200 dark:border-gray-800 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-widest flex items-center gap-3">
            <Activity className="text-cyan-500" /> Setu-Drishti <span className="text-sm font-normal text-cyan-700 dark:text-cyan-500 bg-cyan-50 dark:bg-cyan-950/30 px-2 py-1 rounded border border-cyan-200 dark:border-cyan-900">v2.0</span>
          </h1>
          <p className="text-gray-500 mt-1 text-sm uppercase tracking-widest">Unified ICU Decision Support System</p>
        </div>
        {current && (
          <div className="text-right">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{current.patient_id} : {current.patient_name}</h2>
            <p className="text-gray-500 text-sm mt-0.5">BED {current.bed_number} • {current.age}Y • {current.admit_reason}</p>
          </div>
        )}
      </div>

      {/* Back button and Action buttons */}
      <div className="mb-5 flex justify-between items-center flex-wrap gap-3">
        <button onClick={() => setView('ward')} className="flex items-center gap-2 text-sm text-cyan-700 dark:text-cyan-500 hover:text-cyan-800 dark:hover:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/30 px-4 py-2 rounded-md border border-cyan-200 dark:border-cyan-900 uppercase tracking-widest font-bold transition-colors">
          <ArrowLeft size={16} /> Return to Ward Command
        </button>
        <div className="flex gap-3 flex-wrap">
          <button onClick={generateFamilyUpdate} className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white dark:hover:bg-emerald-500/20 bg-emerald-50 dark:bg-emerald-950/30 px-4 py-2 rounded-md border border-emerald-200 dark:border-emerald-900 uppercase tracking-widest font-bold transition-colors shadow-[0_0_15px_rgba(16,185,129,0.4)]">
            <Users size={16} /> Family-Link Update
          </button>
          <button onClick={generateHandoff} className="flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400 hover:bg-purple-500 hover:text-white dark:hover:bg-purple-500/20 bg-purple-50 dark:bg-purple-950/30 px-4 py-2 rounded-md border border-purple-200 dark:border-purple-900 uppercase tracking-widest font-bold transition-colors shadow-[0_0_15px_rgba(168,85,247,0.4)]">
            <BrainCircuit size={16} /> GenAI Auto-Briefing (Shift Handoff)
          </button>
        </div>
      </div>

      {handoffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#0b1220] border-2 border-purple-500 w-full max-w-2xl rounded-xl shadow-[0_0_40px_rgba(168,85,247,0.4)] overflow-hidden flex flex-col">
            <div className="bg-purple-950/40 p-4 border-b border-purple-900/50 flex justify-between items-center">
              <h2 className="text-purple-300 font-bold uppercase tracking-widest flex items-center gap-2">
                <FileText size={18} /> Shift Handoff Narrative
              </h2>
              <button onClick={() => setHandoffModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              {handoffLoading ? (
                <div className="flex flex-col items-center justify-center py-10">
                  <BrainCircuit size={40} className="text-purple-500 animate-pulse mb-3" />
                  <p className="text-purple-400 font-mono tracking-widest animate-pulse">Generative AI swallowing 8-hour telemetry...</p>
                </div>
              ) : (
                <div className="text-sm font-mono leading-relaxed text-gray-800 dark:text-gray-300 whitespace-pre-wrap">
                  {handoffText}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Family-Link Modal */}
      {familyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div style={{ background: '#0b1220', border: '2px solid #10b981', borderRadius: '12px', boxShadow: '0 0 40px rgba(16,185,129,0.4)', width: '100%', maxWidth: '640px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ background: 'rgba(6,78,59,0.5)', padding: '16px 20px', borderBottom: '1px solid rgba(16,185,129,0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ color: '#6ee7b7', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={18} /> Family-Link: Multilingual Patient Update
              </h2>
              <button onClick={() => setFamilyModalOpen(false)} style={{ color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            {/* Body */}
            <div style={{ padding: '20px', overflowY: 'auto' }}>
              {familyLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 0' }}>
                  <Users size={40} style={{ color: '#10b981', marginBottom: '12px' }} className="animate-pulse" />
                  <p style={{ color: '#6ee7b7', fontFamily: 'monospace', letterSpacing: '2px' }} className="animate-pulse">Translating medical data into comforting language...</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {[
                    { lang: 'English', flag: '🇬🇧', headerColor: '#93c5fd', bg: '#1e3a5f', border: '#3b82f6' },
                    { lang: 'Hindi',   flag: '🇮🇳', headerColor: '#fdba74', bg: '#431407', border: '#f97316' },
                    { lang: 'Punjabi', flag: '🟡',  headerColor: '#fde047', bg: '#422006', border: '#eab308' },
                  ].map(({ lang, flag, headerColor, bg, border }) => {
                    const regex = new RegExp(`${lang}:([\\s\\S]*?)(?=English:|Hindi:|Punjabi:|$)`, 'i');
                    const match = familyText.match(regex);
                    const content = match ? match[1].trim() : '';
                    return content ? (
                      <div key={lang} style={{ background: bg, border: `1px solid ${border}`, borderRadius: '8px', padding: '16px' }}>
                        <div style={{ color: headerColor, fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>{flag}</span> {lang}
                        </div>
                        <p style={{ color: '#ffffff', fontSize: '14px', lineHeight: '1.7', margin: 0 }}>{content}</p>
                      </div>
                    ) : null;
                  })}
                  {!familyText.includes('English:') && familyText && (
                    <p className="text-sm font-mono leading-relaxed text-gray-200 whitespace-pre-wrap">{familyText}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {!current ? (
        <div className="flex flex-col items-center justify-center h-[50vh] text-cyan-500 animate-pulse border border-gray-200 dark:border-gray-800 rounded-lg bg-gray-100/50 dark:bg-gray-900/50">
          <Activity size={48} className="mb-4" /><p className="tracking-widest uppercase">Loading Patient Telemetry...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

          {/* ══ LEFT COLUMN ══════════════════════════════════════════ */}
          <div className="lg:col-span-4 space-y-5">

            {/* Master Risk Card */}
            <div className={`rounded-xl p-5 border-2 transition-all duration-300 ${colors.bg} ${colors.border} relative overflow-hidden`}
              style={{ boxShadow: isCritical ? `0 0 40px ${colors.hex}30` : 'none' }}>
              {isCritical && <div className="absolute inset-0 animate-pulse pointer-events-none" style={{ background: `radial-gradient(ellipse at top, ${colors.hex}10, transparent 70%)` }} />}
              <div className="flex justify-between items-start mb-3 relative z-10">
                <span className={`text-xs font-bold uppercase tracking-widest ${colors.text}`}>System Status · H{current.hour}</span>
                {isCritical && <AlertTriangle className="animate-pulse text-red-500" size={22} />}
              </div>
              <div className="flex items-baseline gap-2 relative z-10">
                <span className={`text-7xl font-black tracking-tighter ${colors.text}`}>{current.combined_risk_score}</span>
                <span className={`text-xl font-bold ${colors.text}`}>%</span>
              </div>
              <div className={`text-xl font-bold tracking-widest mt-1 mb-4 ${colors.text} relative z-10`}>{current.alert_level}</div>
              {/* Wide risk bar */}
              <div className="w-full bg-black/30 rounded-full h-2 mb-4 overflow-hidden relative z-10">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${current.combined_risk_score}%`, background: `linear-gradient(90deg, #22d3ee, ${colors.hex})`, boxShadow: `0 0 12px ${colors.hex}` }} />
              </div>
              {/* Dual engine row */}
              <div className="grid grid-cols-2 gap-3 relative z-10">
                {[{ label: 'XGBoost ML', val: current.xgb_score, color: 'bg-purple-500', text: 'text-purple-300' },
                  { label: 'Clinical Rules', val: current.clinical_score, color: 'bg-blue-500', text: 'text-blue-300' }].map(e => (
                  <div key={e.label} className="bg-black/30 rounded-lg p-2.5 border border-white/5">
                    <p className={`text-[9px] uppercase tracking-widest ${e.text} mb-1`}>{e.label}</p>
                    <div className="flex items-baseline gap-1 mb-1.5">
                      <span className={`text-xl font-black ${e.text}`}>{e.val}</span>
                      <span className={`text-xs ${e.text}`}>%</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-1.5">
                      <div className={`h-full rounded-full ${e.color} transition-all duration-500`} style={{ width: `${e.val}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Explainable AI Panel ──────────────────────────────── */}
            <div className="bg-white dark:bg-[#0b1220] rounded-xl border border-gray-200 dark:border-purple-900/40 overflow-hidden shadow-[0_0_15px_rgba(168,85,247,0.1)]">
              {/* Tab bar */}
              <div className="flex border-b border-gray-200 dark:border-gray-800">
                {[
                  { id: 'shap',     label: 'SHAP Drivers',  icon: <BrainCircuit size={11}/> },
                  { id: 'cf',       label: 'Interventions', icon: <Zap size={11}/> },
                  { id: 'timeline', label: 'Evidence',      icon: <Clock size={11}/> },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setXaiTab(tab.id)}
                    className={`flex-1 py-2.5 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-1.5 transition-colors ${
                      xaiTab === tab.id
                        ? 'text-purple-400 border-b-2 border-purple-500 bg-purple-950/20'
                        : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    {tab.icon}{tab.label}
                  </button>
                ))}
              </div>

              <div className="p-4">
                {/* AI Narrative */}
                <div className="bg-gray-100/60 dark:bg-black/30 rounded-lg p-3 border-l-2 border-purple-500 mb-4">
                  <p className="text-[10px] uppercase tracking-widest text-purple-400 mb-1 flex items-center gap-1"><BrainCircuit size={10}/> PrognoAI Insight</p>
                  <p className="text-xs font-medium leading-relaxed text-gray-900 dark:text-gray-100">{current.explanation_text}</p>
                </div>

                {/* SHAP tab */}
                {xaiTab === 'shap' && current.feature_importance && (
                  <div className="space-y-3">
                    <p className="text-[9px] uppercase tracking-widest text-gray-500 flex items-center gap-1"><Info size={9}/> Feature contributions (SHAP values)</p>
                    {current.feature_importance.map((f, i) => {
                      const absVal = Math.abs(f.contribution);
                      const barW = Math.min(100, (absVal / 1.5) * 100);
                      const isDanger = f.contribution > 0;
                      const barColor = isDanger ? '#ef4444' : '#22c55e';
                      return (
                        <div key={i}>
                          <div className="flex justify-between items-end text-xs mb-1">
                            <span className="text-gray-800 dark:text-gray-200 font-bold">
                              {f.feature}
                              <span className="text-gray-500 font-normal ml-1 font-mono">({f.value.toFixed(2)})</span>
                            </span>
                            <span className="font-mono text-[10px]" style={{ color: barColor }}>
                              {isDanger ? '+' : ''}{f.contribution.toFixed(3)}
                            </span>
                          </div>
                          {/* Diverging bar */}
                          <div className="relative w-full bg-gray-200 dark:bg-gray-900 h-2 rounded-full flex items-center overflow-hidden">
                            <div className="absolute left-1/2 w-px h-full bg-gray-400 dark:bg-gray-600 z-10" />
                            {isDanger ? (
                              <div className="absolute left-1/2 h-full rounded-r-full transition-all duration-500"
                                style={{ width: `${barW / 2}%`, background: barColor, boxShadow: `0 0 6px ${barColor}` }} />
                            ) : (
                              <div className="absolute right-1/2 h-full rounded-l-full transition-all duration-500"
                                style={{ width: `${barW / 2}%`, background: barColor, boxShadow: `0 0 6px ${barColor}` }} />
                            )}
                          </div>
                          <div className="flex justify-between mt-0.5">
                            <span className="text-[8px] text-green-500">↓ protective</span>
                            <span className="text-[8px] text-red-500">↑ risk</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Counterfactual tab */}
                {xaiTab === 'cf' && (
                  <div>
                    <p className="text-[9px] uppercase tracking-widest text-gray-500 mb-3">AI-recommended interventions · projected risk Δ</p>
                    <div className="space-y-2.5">
                      {counterfactuals.map((cf, i) => (
                        <div key={i} className="bg-gray-100/60 dark:bg-black/30 rounded-lg p-2.5 border border-gray-200 dark:border-gray-800 flex items-center gap-3">
                          <span className="text-base">{cf.icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">{cf.action}</p>
                            <p className="text-[10px] text-gray-500">{cf.metric}</p>
                          </div>
                          <div className="shrink-0 text-right">
                            <span className="text-sm font-black text-green-400">{cf.delta}%</span>
                            <p className="text-[8px] text-gray-500">risk Δ</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 p-2.5 bg-amber-950/30 border border-amber-700/40 rounded-lg">
                      <p className="text-[10px] text-amber-300 leading-relaxed">⚠ AI projections only. Clinical judgment and local protocols take precedence.</p>
                    </div>
                  </div>
                )}

                {/* Evidence timeline tab */}
                {xaiTab === 'timeline' && (
                  <div>
                    <p className="text-[9px] uppercase tracking-widest text-gray-500 mb-3">Clinical evidence chain leading to flag</p>
                    <div className="relative pl-5">
                      <div className="absolute left-2 top-1 bottom-1 w-px bg-gray-300 dark:bg-gray-800" />
                      {evidenceTimeline.map((ev, i) => {
                        const dot = ev.severity === 'CRITICAL' ? 'bg-red-500' : ev.severity === 'HIGH' ? 'bg-orange-500' : 'bg-yellow-500';
                        const txt = ev.severity === 'CRITICAL' ? 'text-red-400' : ev.severity === 'HIGH' ? 'text-orange-400' : 'text-yellow-400';
                        return (
                          <div key={i} className="relative mb-4 last:mb-0">
                            <div className={`absolute -left-3 top-1 w-2 h-2 rounded-full ${dot} ring-2 ring-[#080c14]`} />
                            <div className="bg-gray-100/60 dark:bg-black/30 rounded-lg p-2.5 border border-gray-200 dark:border-gray-800">
                              <div className="flex justify-between mb-0.5">
                                <span className={`text-[9px] font-bold uppercase tracking-wider ${txt}`}>{ev.event}</span>
                                <span className="text-[9px] text-gray-500 font-mono">{ev.hour}</span>
                              </div>
                              <span className="text-[10px] text-gray-700 dark:text-gray-300 font-mono">{ev.metric}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Outcome Simulator */}
            <div className="bg-white dark:bg-[#0b1220] rounded-xl p-4 border border-purple-500/30 relative overflow-hidden shadow-[0_0_15px_rgba(168,85,247,0.12)]">
              <div className="absolute top-0 left-0 w-1 h-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.8)]" />
              <h3 className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-3 flex items-center gap-2 ml-1">
                <Zap size={13}/> AI Outcome Simulator
              </h3>
              <div className="relative py-6 ml-1">
                <div className="absolute top-1/2 left-4 right-4 h-1 bg-gray-200 dark:bg-gray-800 rounded-full -translate-y-1/2" />
                <div className="absolute top-1/2 left-4 right-4 h-1 bg-gradient-to-r from-purple-500 to-orange-500 rounded-full shadow-[0_0_8px_purple] -translate-y-1/2" />
                <div className="absolute left-1/2 -translate-x-1/2 -top-1 z-20 whitespace-nowrap">
                  <div className="bg-purple-500/20 border border-purple-500/50 px-2.5 py-1 rounded-full text-[9px] font-black tracking-widest text-purple-300 shadow-[0_0_10px_purple] animate-pulse">
                    6 HOURS SAVED
                  </div>
                </div>
                <div className="flex justify-between relative mt-2">
                  <div className="flex flex-col items-center">
                    <div className="w-3.5 h-3.5 rounded-full bg-purple-500 ring-2 ring-[#0b1220]" style={{ boxShadow: '0 0 12px #a855f7' }} />
                    <span className="text-[9px] text-gray-500 font-bold mt-2 tracking-widest"><BrainCircuit size={8} className="inline mr-0.5"/>AI FLAG</span>
                    <span className="text-sm font-black text-purple-400">H{Math.max(1,(current.hour||0)-6)}</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="w-3.5 h-3.5 rounded-full bg-orange-500 ring-2 ring-[#0b1220]" style={{ boxShadow: '0 0 12px #f97316' }} />
                    <span className="text-[9px] text-gray-500 font-bold mt-2 tracking-widest"><Clock size={8} className="inline mr-0.5"/>ONSET</span>
                    <span className="text-sm font-black text-orange-400">H{current.hour||0}</span>
                  </div>
                </div>
              </div>
              <div className="bg-gray-100/60 dark:bg-gray-900/60 rounded p-2.5 border-l-2 border-cyan-500 mt-1 ml-1">
                <p className="text-[10px] text-gray-800 dark:text-gray-300 leading-relaxed">
                  <span className="text-cyan-400 font-bold uppercase mr-1">Impact:</span>
                  ABX in this <span className="text-purple-300 font-bold">golden window</span> reduces projected mortality by <span className="text-red-400 font-bold">~45.6%</span>.
                </p>
              </div>
            </div>

          </div>

          {/* ══ RIGHT COLUMN ═════════════════════════════════════════ */}
          <div className="lg:col-span-8 flex flex-col gap-5">

            {/* ── Live ECG Monitor (full width) ───────────────────── */}
            <div className="bg-[#050d1a] rounded-xl border border-cyan-500/30 p-4" style={{ boxShadow: isCritical ? '0 0 30px rgba(239,68,68,0.15)' : '0 0 20px rgba(34,211,238,0.08)' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Waves size={14} className="text-cyan-400" />
                  <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest">Live ECG Monitor</span>
                  <span className="inline-flex items-center gap-1 text-[9px] text-green-400 font-bold bg-green-950/40 border border-green-800/50 px-2 py-0.5 rounded-full animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 block" /> LIVE
                  </span>
                </div>
                <div className="flex items-center gap-4 text-[10px] font-mono">
                  <span className="text-gray-500">HR: <span className={`font-black ${current.vitals.HR > 110 ? 'text-red-400' : 'text-cyan-300'}`}>{current.vitals.HR.toFixed(0)} BPM</span></span>
                  <span className="text-gray-500">PR: <span className="text-gray-300">160ms</span></span>
                  <span className="text-gray-500">QRS: <span className="text-gray-300">80ms</span></span>
                  <span className="text-gray-500">QTc: <span className={current.vitals.HR > 100 ? 'text-yellow-400 font-bold' : 'text-gray-300'}>{current.vitals.HR > 100 ? '468ms' : '430ms'}</span></span>
                </div>
              </div>
              {/* Lead II — primary large trace */}
              <div className="mb-2">
                <ECGMonitor hr={current.vitals.HR} alertLevel={current.alert_level} label="II" compact={false} />
              </div>
              {/* Second lead row */}
              <div className="grid grid-cols-2 gap-2">
                <ECGMonitor hr={current.vitals.HR * 0.98 + 1} alertLevel={current.alert_level} label="V1" compact={true} />
                <ECGMonitor hr={current.vitals.HR * 1.01 - 0.5} alertLevel={current.alert_level} label="V5" compact={true} />
              </div>
              {/* Arrhythmia flag */}
              {current.vitals.HR > 110 && (
                <div className="mt-2 flex items-center gap-2 bg-red-950/30 border border-red-700/40 rounded-lg px-3 py-1.5">
                  <AlertTriangle size={12} className="text-red-400 animate-pulse shrink-0" />
                  <span className="text-[10px] text-red-300 font-bold">SINUS TACHYCARDIA — HR {current.vitals.HR.toFixed(0)} bpm · Ventricular rate elevated · Consider causes</span>
                </div>
              )}
            </div>

            {/* ── Vitals Strip (6-panel) ───────────────────────────── */}
            <div className="grid grid-cols-6 gap-3">
              {[
                { icon: <HeartPulse size={14} className="text-red-400"/>, label: 'HR', unit: 'bpm',   val: current.vitals.HR.toFixed(0),    warn: current.vitals.HR > 110 || current.vitals.HR < 45,  history: historyVital('HR'),    color: '#ef4444' },
                { icon: <Activity size={14} className="text-cyan-400"/>,  label: 'MAP',unit: 'mmHg',  val: current.vitals.MAP.toFixed(0),   warn: current.vitals.MAP < 65,                            history: historyVital('MAP'),   color: '#22d3ee' },
                { icon: <Thermometer size={14} className="text-orange-400"/>, label: 'TEMP', unit:'°C', val: current.vitals.Temp.toFixed(1), warn: current.vitals.Temp > 38.3 || current.vitals.Temp < 36, history: historyVital('Temp'), color: '#f97316' },
                { icon: <Droplets size={14} className="text-yellow-400"/>, label: 'LAC', unit:'mmol/L',val:current.vitals.Lactate.toFixed(1),warn:current.vitals.Lactate>2.0, history:historyVital('Lactate'), color:'#eab308' },
                { icon: <Waves size={14} className="text-blue-400"/>,     label: 'SBP', unit:'mmHg',  val:(current.vitals.SBP??120).toFixed(0),warn:(current.vitals.SBP??120)<90,history:historyVital('SBP'),color:'#3b82f6' },
                { icon: <FlaskConical size={14} className="text-purple-400"/>, label:'DBP',unit:'mmHg',val:(current.vitals.DBP??75).toFixed(0),warn:false,history:historyVital('DBP'),color:'#a855f7' },
              ].map(v => (
                <div key={v.label} className={`bg-white dark:bg-[#0b1220] rounded-xl p-3 border flex flex-col gap-1 ${v.warn ? 'border-red-600/60' : 'border-gray-200 dark:border-gray-800'}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-gray-500 uppercase tracking-widest flex items-center gap-1">{v.icon}{v.label}</span>
                    <TrendIcon values={v.history} />
                  </div>
                  <span className={`text-2xl font-black ${v.warn ? 'text-red-400' : 'text-gray-900 dark:text-gray-100'}`}>{v.val}</span>
                  <span className="text-[8px] text-gray-500">{v.unit}</span>
                  <MiniSparkline data={v.history} color={v.warn ? '#ef4444' : v.color} height={22} />
                </div>
              ))}
            </div>

            {/* ── Hologram + Trajectory grid ───────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 flex-grow">
              {renderHologram()}

              {/* Trajectory Chart */}
              <div className="bg-white dark:bg-[#0b1220] rounded-xl p-5 border border-gray-200 dark:border-gray-800 flex flex-col min-h-[360px]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Deterioration Trajectory</h3>
                  <div className="flex gap-3 text-[9px] font-bold">
                    <span className="text-red-500 flex items-center gap-1"><span className="w-3 h-0.5 bg-red-500 inline-block rounded"/>CRIT 75</span>
                    <span className="text-orange-500 flex items-center gap-1"><span className="w-3 h-0.5 bg-orange-500 inline-block rounded"/>HIGH 55</span>
                  </div>
                </div>
                <div className="flex-grow">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={patientData.history} margin={{ top: 10, right: 8, left: -22, bottom: 0 }}>
                      <defs>
                        <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={colors.hex} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={colors.hex} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                      <XAxis dataKey="hour" stroke="#4b5563" tick={{ fontSize: 10 }} tickFormatter={v => `H${v}`} />
                      <YAxis stroke="#4b5563" domain={[0, 100]} tick={{ fontSize: 10 }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#080c14', border: '1px solid #1f2937', borderRadius: 6, fontFamily: 'monospace', fontSize: 11 }}
                        itemStyle={{ color: colors.hex }}
                        labelStyle={{ color: '#9ca3af' }}
                        formatter={(val) => [`${val}% risk`]}
                        labelFormatter={(v) => `Hour ${v}`}
                      />
                      <ReferenceLine y={75} stroke="#ef4444" strokeDasharray="4 3" />
                      <ReferenceLine y={55} stroke="#f97316" strokeDasharray="4 3" />
                      <Area
                        type="monotone"
                        dataKey="combined_risk_score"
                        stroke={colors.hex}
                        strokeWidth={2.5}
                        fill="url(#riskGrad)"
                        dot={false}
                        activeDot={{ r: 5, fill: colors.hex, stroke: '#080c14', strokeWidth: 2 }}
                        animationDuration={300}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}