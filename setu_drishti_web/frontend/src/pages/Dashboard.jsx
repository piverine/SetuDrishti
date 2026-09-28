import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { AlertTriangle, Activity, Thermometer, Droplets, HeartPulse, ShieldAlert, BrainCircuit, Clock, Zap, ArrowLeft, Users, Scan, Home, UserPlus } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import DoctorDispatchModal from '../components/DoctorDispatchModal';
import ResourceAllocationModal from '../components/ResourceAllocationModal';
import { apiCallJson } from '../utils/apiClient';

// ECG Component - Data-driven from simulator
const ECGDisplay = ({ isDark, vitals = null, alertLevel = 'SAFE' }) => {
  const [ecgData, setEcgData] = useState([]);
  const [displayStats, setDisplayStats] = useState({ hr: 72, pr: 160, qt: 400, oxygenation: 'Normal', rhythm: 'Normal' });

  useEffect(() => {
    // Generate realistic ECG waveform based on vital signs
    const generateECGWave = () => {
      const points = [];
      
      // Get heart rate from vitals or use default
      const hr = vitals?.HR || 72;
      const spO2 = vitals?.O2Sat || 98;
      const map = vitals?.MAP || 85;
      
      // Calculate ECG parameters based on HR
      // Normal: 60-100 bpm, Tachy: >100, Brady: <60
      const beatFrequency = hr / 60; // Beats per second
      const cycleLength = 60 / hr; // Seconds per beat
      
      // Calculate intervals based on HR and alert status
      const baselineQT = 400;
      const baselinePR = 160;
      const heartRateFactor = 100 / Math.max(hr, 40);
      const prInterval = Math.round(baselinePR * heartRateFactor);
      const qtInterval = Math.round(baselineQT * heartRateFactor);
      
      // Determine waveform characteristics based on alert level
      let amplitudeMultiplier = 1.0;
      let irregularityFactor = 0;
      
      if (alertLevel === 'CRITICAL') {
        amplitudeMultiplier = 0.6; // Reduced amplitude in critical state
        irregularityFactor = 0.15; // High irregular oscillation
      } else if (alertLevel === 'HIGH') {
        amplitudeMultiplier = 0.8;
        irregularityFactor = 0.08;
      } else if (alertLevel === 'WATCH') {
        amplitudeMultiplier = 0.9;
        irregularityFactor = 0.04;
      } else {
        amplitudeMultiplier = 1.0;
        irregularityFactor = 0.01; // Minimal noise
      }
      
      // Generate points for multiple heartbeats
      for (let i = 0; i < 300; i++) {
        const t = (i / 300) * (300 / beatFrequency) * cycleLength; // Time in heartbeats
        const beatPhase = (t * beatFrequency) % 1; // 0-1 within one beat cycle
        
        // Build ECG complex using normalized beat phase
        let y = 0;
        
        // P wave (atrial depolarization) - 0 to 0.2
        if (beatPhase < 0.15) {
          y += Math.sin(beatPhase * Math.PI / 0.15) * 8;
        }
        
        // QRS complex (ventricular depolarization) - 0.2 to 0.35
        if (beatPhase >= 0.18 && beatPhase < 0.35) {
          const qrsPhase = (beatPhase - 0.18) / 0.17;
          // Q wave
          if (qrsPhase < 0.2) {
            y -= Math.sin(qrsPhase * Math.PI) * 5;
          }
          // R wave (main spike)
          else if (qrsPhase < 0.6) {
            const rPhase = (qrsPhase - 0.2) / 0.4;
            y += Math.sin(rPhase * Math.PI) * 35 * amplitudeMultiplier;
          }
          // S wave
          else {
            const sPhase = (qrsPhase - 0.6) / 0.4;
            y -= Math.sin(sPhase * Math.PI) * 12;
          }
        }
        
        // T wave (ventricular repolarization) - 0.4 to 0.7
        if (beatPhase >= 0.4 && beatPhase < 0.7) {
          const tPhase = (beatPhase - 0.4) / 0.3;
          y += Math.sin(tPhase * Math.PI) * 10 * amplitudeMultiplier;
        }
        
        // Add irregularity based on alert status
        if (irregularityFactor > 0) {
          y += (Math.random() - 0.5) * irregularityFactor * 20;
        } else {
          y += (Math.random() - 0.5) * 0.5; // Minimal noise in stable state
        }
        
        // Clamp to reasonable range
        points.push({ time: i, voltage: Math.max(-50, Math.min(50, y)) });
      }
      return points;
    };

    // Generate ECG data
    setEcgData(generateECGWave());
    
    // Update display statistics
    const hr = Math.round(vitals?.HR || 72);
    const spO2 = vitals?.O2Sat || 98;
    const map = vitals?.MAP || 85;
    const beatFrequency = hr / 60;
    const cycleLength = 60 / hr;
    const heartRateFactor = 100 / Math.max(hr, 40);
    
    setDisplayStats({
      hr,
      pr: Math.round(160 * heartRateFactor),
      qt: Math.round(400 * heartRateFactor),
      oxygenation: spO2 >= 95 ? 'Excellent' : spO2 >= 90 ? 'Normal' : 'Low',
      rhythm: hr > 110 ? 'Tachycardia' : hr < 60 ? 'Bradycardia' : 'Normal',
    });
  }, [vitals, alertLevel]);

  return (
    <div className={`rounded-xl p-6 border-2 overflow-hidden relative ${
      isDark 
        ? 'bg-gradient-to-br from-slate-800 to-slate-900 border-red-500/40 shadow-hospital-dark'
        : 'bg-gradient-to-br from-white to-gray-50 border-red-400/50 shadow-hospital'
    }`}>
      {/* ECG Header */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b" style={{
        borderColor: isDark ? 'rgba(31, 41, 55, 0.5)' : 'rgba(209, 213, 219, 0.5)'
      }}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isDark ? 'bg-red-500/20 border border-red-500/40' : 'bg-red-100 border border-red-300'}`}>
            <HeartPulse size={20} className={isDark ? 'text-red-400' : 'text-red-600'} />
          </div>
          <div>
            <h3 className={`text-sm font-semibold tracking-widest uppercase ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Real-time ECG Monitoring
            </h3>
            <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>12-lead equivalent</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full animate-pulse ${isDark ? 'bg-red-500' : 'bg-red-600'}`}></div>
          <span className={`text-xs font-semibold ${isDark ? 'text-red-400' : 'text-red-600'}`}>LIVE</span>
        </div>
      </div>

      {/* ECG Grid Background */}
      <div className="relative h-56 mb-4 rounded-lg overflow-hidden" style={{
        backgroundColor: isDark ? 'rgba(15, 23, 42, 0.5)' : 'rgba(248, 250, 252, 0.8)',
        backgroundImage: `
          linear-gradient(to right, ${isDark ? 'rgba(225, 29, 72, 0.1)' : 'rgba(239, 68, 68, 0.08)'} 1px, transparent 1px),
          linear-gradient(to bottom, ${isDark ? 'rgba(225, 29, 72, 0.1)' : 'rgba(239, 68, 68, 0.08)'} 1px, transparent 1px)
        `,
        backgroundSize: '20px 20px'
      }}>
        {/* SVG Chart */}
        {ecgData.length > 0 && (
          <svg viewBox="0 0 300 120" className="w-full h-full" preserveAspectRatio="none">
            {/* Center line */}
            <line x1="0" y1="60" x2="300" y2="60" stroke={isDark ? 'rgba(225, 29, 72, 0.4)' : 'rgba(239, 68, 68, 0.3)'} strokeWidth="0.5" opacity="0.8" />
            
            {/* ECG Waveform */}
            <polyline
              points={ecgData.map((d, i) => `${i},${60 - (d.voltage / 50) * 30}`).join(' ')}
              fill="none"
              stroke={isDark ? '#ef4444' : '#dc2626'}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              filter={isDark ? 'drop-shadow(0 0 3px rgba(239, 68, 68, 0.8))' : 'drop-shadow(0 0 2px rgba(220, 38, 38, 0.6))'}
            />

            {/* Animated scanning line */}
            <g>
              <style>{`
                @keyframes scan2 {
                  0% { transform: translateX(-300px); }
                  100% { transform: translateX(300px); }
                }
                .ecg-scan { animation: scan2 6s linear infinite; }
              `}</style>
              <line 
                x1="0" y1="0" x2="0" y2="120" 
                stroke={isDark ? 'rgba(239, 68, 68, 0.5)' : 'rgba(220, 38, 38, 0.4)'} 
                strokeWidth="0.8"
                className="ecg-scan"
              />
            </g>
          </svg>
        )}
      </div>

      {/* ECG Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className={`p-3 rounded-lg border ${isDark ? 'bg-slate-900/50 border-slate-700' : 'bg-gray-100 border-gray-300'} text-center`}>
          <p className={`text-xs font-semibold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Heart Rate</p>
          <p className={`text-2xl font-bold ${displayStats.hr > 110 ? (isDark ? 'text-orange-400' : 'text-orange-600') : displayStats.hr < 60 ? (isDark ? 'text-yellow-400' : 'text-yellow-600') : (isDark ? 'text-red-400' : 'text-red-600')}`}>
            {displayStats.hr}<span className="text-xs font-normal ml-1">bpm</span>
          </p>
        </div>
        <div className={`p-3 rounded-lg border ${isDark ? 'bg-slate-900/50 border-slate-700' : 'bg-gray-100 border-gray-300'} text-center`}>
          <p className={`text-xs font-semibold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>PR Interval</p>
          <p className={`text-2xl font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>{displayStats.pr}<span className="text-xs font-normal ml-1">ms</span></p>
        </div>
        <div className={`p-3 rounded-lg border ${isDark ? 'bg-slate-900/50 border-slate-700' : 'bg-gray-100 border-gray-300'} text-center`}>
          <p className={`text-xs font-semibold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>QT Interval</p>
          <p className={`text-2xl font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>{displayStats.qt}<span className="text-xs font-normal ml-1">ms</span></p>
        </div>
      </div>

      {/* ECG Status */}
      <div className={`mt-4 p-3 rounded-lg border-l-4 ${
        alertLevel === 'CRITICAL' 
          ? (isDark ? 'bg-red-950/20 border-l-red-500 text-red-400' : 'bg-red-100 border-l-red-600 text-red-700')
          : alertLevel === 'HIGH'
          ? (isDark ? 'bg-orange-950/20 border-l-orange-500 text-orange-400' : 'bg-orange-100 border-l-orange-600 text-orange-700')
          : alertLevel === 'WATCH'
          ? (isDark ? 'bg-yellow-950/20 border-l-yellow-500 text-yellow-400' : 'bg-yellow-100 border-l-yellow-600 text-yellow-700')
          : (isDark ? 'bg-green-950/20 border-l-green-500 text-green-400' : 'bg-green-100 border-l-green-600 text-green-700')
      }`}>
        <p className="text-xs font-semibold">
          {alertLevel === 'CRITICAL' ? '⚠ Critical: Severe cardiac abnormalities detected.' : 
           alertLevel === 'HIGH' ? '⚠ High: Significant changes detected.' :
           alertLevel === 'WATCH' ? '◐ Watch: Monitor for changes.' :
           '✓ Normal: '} Rhythm {displayStats.rhythm}, O₂ {displayStats.oxygenation}
        </p>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const [view, setView] = useState('ward');
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [selectedSystem, setSelectedSystem] = useState('Cardio');
  const [showDoctorDispatch, setShowDoctorDispatch] = useState(false);
  const [showResourceAllocation, setShowResourceAllocation] = useState(false);
  const [dispatchedDoctors, setDispatchedDoctors] = useState([]);
  const [allocatedResources, setAllocatedResources] = useState([]);
  
  const [wardData, setWardData] = useState([]);
  const [patientData, setPatientData] = useState({ history: [], current_state: null });

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (view === 'ward') {
          const data = await apiCallJson('http://127.0.0.1:8000/api/v1/patients');
          data.sort((a, b) => b.combined_risk_score - a.combined_risk_score);
          setWardData(data);
        } else if (view === 'patient' && selectedPatientId) {
          const data = await apiCallJson(`http://127.0.0.1:8000/api/v1/patient/${selectedPatientId}/timeline`);
          setPatientData(data);
        }
      } catch (error) {
        // Backend error handling
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 1000);
    return () => clearInterval(interval);
  }, [view, selectedPatientId]);

  const current = patientData.current_state;

  const getColors = (level) => {
    if (level === 'CRITICAL') {
      return {
        bg: isDark ? 'bg-red-950/30' : 'bg-red-50',
        border: isDark ? 'border-red-500/50' : 'border-red-300',
        text: isDark ? 'text-red-400' : 'text-red-700',
        fill: '#ef4444',
        badge: isDark ? 'bg-red-500/20 text-red-400 border-red-600' : 'bg-red-200 text-red-800 border-red-300'
      };
    }
    if (level === 'HIGH') {
      return {
        bg: isDark ? 'bg-orange-950/30' : 'bg-orange-50',
        border: isDark ? 'border-orange-500/50' : 'border-orange-300',
        text: isDark ? 'text-orange-400' : 'text-orange-700',
        fill: '#f97316',
        badge: isDark ? 'bg-orange-500/20 text-orange-400 border-orange-600' : 'bg-orange-200 text-orange-800 border-orange-300'
      };
    }
    if (level === 'WATCH') {
      return {
        bg: isDark ? 'bg-yellow-950/30' : 'bg-yellow-50',
        border: isDark ? 'border-yellow-500/50' : 'border-yellow-300',
        text: isDark ? 'text-yellow-400' : 'text-yellow-700',
        fill: '#eab308',
        badge: isDark ? 'bg-yellow-500/20 text-yellow-400 border-yellow-600' : 'bg-yellow-200 text-yellow-800 border-yellow-300'
      };
    }
    return {
      bg: isDark ? 'bg-green-950/30' : 'bg-green-50',
      border: isDark ? 'border-green-500/50' : 'border-green-300',
      text: isDark ? 'text-green-400' : 'text-green-700',
      fill: '#10b981',
      badge: isDark ? 'bg-green-500/20 text-green-400 border-green-600' : 'bg-green-200 text-green-800 border-green-300'
    };
  };

  const handleDoctorDispatch = (dispatchData) => {
    setDispatchedDoctors([...dispatchedDoctors, dispatchData]);
  };

  const handleResourceAllocation = (allocationData) => {
    setAllocatedResources([...allocatedResources, allocationData]);
  };

  const renderHeader = () => (
    <div className={`flex justify-between items-end mb-8 pb-6 border-b transition-smooth ${
      isDark ? 'border-slate-700' : 'border-gray-200'
    }`}>
      <div>
        <h1 className={`text-4xl font-display font-bold flex items-center gap-3 transition-smooth ${
          isDark ? 'text-cyan-400' : 'text-blue-700'
        }`}>
          <Activity size={32} /> Setu-Drishti
          <span className={`text-sm font-normal px-4 py-2 rounded-full border font-sans tracking-widest transition-smooth ${
            isDark ? 'bg-cyan-950/30 text-cyan-400 border-cyan-800/50' : 'bg-blue-100 text-blue-700 border-blue-300'
          }`}>Hospital Edition</span>
        </h1>
        <p className={`mt-3 text-sm uppercase tracking-widest font-semibold transition-smooth ${
          isDark ? 'text-gray-400' : 'text-gray-600'
        }`}>AI-Powered ICU Clinical Decision Support</p>
      </div>
      <div className="text-right">
        {view === 'patient' && current && (
          <>
            <h2 className={`text-2xl font-bold font-display transition-smooth ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
              {current.patient_id} • {current.patient_name}
            </h2>
            <p className={`text-sm mt-2 font-sans transition-smooth ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              BED {current.bed_number} | {current.age}Y | {current.admit_reason}
            </p>
          </>
        )}
        {view === 'ward' && (
          <>
            <h2 className={`text-2xl font-display font-bold flex items-center gap-2 justify-end transition-smooth ${
              isDark ? 'text-gray-100' : 'text-gray-900'
            }`}>
              <Users size={24} className={isDark ? 'text-cyan-400' : 'text-blue-600'}/> 
              WARD COMMAND
            </h2>
            <p className={`text-sm mt-2 font-sans transition-smooth ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {wardData.length} Monitored Patients
            </p>
          </>
        )}
      </div>
    </div>
  );

  if (view === 'ward') {
    return (
      <div className={`min-h-screen p-8 font-sans transition-smooth ${
        isDark ? 'bg-slate-950' : 'bg-gray-50'
      }`}>
        {renderHeader()}
        
        {wardData.length === 0 ? (
          <div className={`flex flex-col items-center justify-center h-[60vh] rounded-2xl border-2 backdrop-blur-sm transition-smooth ${
            isDark
              ? 'border-cyan-500/30 bg-cyan-900/10 text-cyan-400'
              : 'border-blue-300 bg-blue-50 text-blue-700'
          }`}>
            <Activity size={64} className="mb-6 opacity-40 animate-pulse-slow" />
            <p className="text-2xl font-display font-bold tracking-tight">Awaiting Live Telemetry</p>
            <p className={`text-sm mt-4 font-sans ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Start simulator.py to populate patient data
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wardData.map((patient) => {
              const c = getColors(patient.alert_level);
              return (
                <div 
                  key={patient.patient_id} 
                  onClick={() => {
                    setSelectedPatientId(patient.patient_id);
                    setView('patient');
                  }}
                  className={`rounded-xl p-6 border-2 cursor-pointer transition-smooth hover:shadow-hospital-lg hover:-translate-y-1 ${
                    isDark
                      ? `bg-gradient-to-br from-slate-800/50 to-slate-900/50 ${c.border}`
                      : `bg-gradient-to-br from-white to-gray-50 ${c.border}`
                  }`}
                >
                  <div className={`flex justify-between items-start mb-4 pb-4 border-b transition-smooth ${
                    isDark ? 'border-slate-700/50' : 'border-gray-300'
                  }`}>
                    <div className="flex-grow">
                      <h3 className={`text-lg font-bold font-display transition-smooth ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                        {patient.patient_id}
                      </h3>
                      <p className={`text-sm font-semibold mt-1 transition-smooth ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>
                        {patient.patient_name.toUpperCase()}
                      </p>
                      <p className={`text-xs mt-2 transition-smooth ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                        BED {patient.bed_number} • {patient.age} Years
                      </p>
                    </div>
                    <div className="text-right">
                      {patient.alert_level === 'CRITICAL' && (
                        <div className={`animate-pulse px-3 py-1 rounded-lg text-xs font-bold mb-2 ${
                          isDark ? 'bg-red-500/30 text-red-300' : 'bg-red-200 text-red-800'
                        }`}>⚠ CRITICAL</div>
                      )}
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border transition-smooth ${c.badge}`}>
                        {patient.alert_level}
                      </span>
                    </div>
                  </div>

                  <div className={`mb-4 p-4 rounded-lg border transition-smooth ${
                    isDark ? 'bg-slate-900/50 border-slate-700' : 'bg-gray-100 border-gray-300'
                  }`}>
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className={`text-4xl font-black font-display ${c.text}`}>{patient.combined_risk_score}</span>
                      <span className={`text-lg font-bold ${c.text}`}>%</span>
                    </div>
                    <p className={`text-xs font-semibold transition-smooth ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                      Combined Risk Score
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {[
                      { icon: HeartPulse, label: 'HR', value: patient.vitals.HR, unit: 'bpm', color: 'red' },
                      { icon: Activity, label: 'MAP', value: patient.vitals.MAP, unit: 'mmHg', color: 'blue' },
                      { icon: Thermometer, label: 'TEMP', value: patient.vitals.Temp, unit: '°C', color: 'orange' },
                      { icon: Droplets, label: 'LACTATE', value: patient.vitals.Lactate, unit: 'mmol/L', color: 'yellow' },
                    ].map((vital, idx) => (
                      <div 
                        key={idx}
                        className={`p-3 rounded-lg border transition-smooth ${
                          isDark ? 'bg-slate-900/30 border-slate-700/50' : 'bg-gray-100/60 border-gray-300/60'
                        }`}
                      >
                        <span className={`text-[10px] flex items-center gap-1 uppercase font-semibold tracking-wide transition-smooth ${
                          isDark ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          <vital.icon size={12} />
                          {vital.label}
                        </span>
                        <span className={`font-bold text-base mt-1 block transition-smooth ${
                          vital.value > 2.0 ? (isDark ? 'text-red-400' : 'text-red-600') : (isDark ? 'text-gray-100' : 'text-gray-900')
                        }`}>
                          {vital.value.toFixed(vital.label === 'TEMP' ? 1 : 0)}
                          <span className={`text-xs font-normal ml-1 transition-smooth ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                            {vital.unit}
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className={`p-3 rounded-lg border transition-smooth ${
                      isDark ? 'bg-purple-950/20 border-purple-700/30' : 'bg-purple-100 border-purple-300'
                    }`}>
                      <span className={`text-[10px] uppercase font-semibold flex items-center gap-1 transition-smooth ${
                        isDark ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        <BrainCircuit size={11} className={isDark ? 'text-purple-400' : 'text-purple-600'} />
                        Sepsis
                      </span>
                      <span className={`font-bold text-lg mt-1 transition-smooth ${isDark ? 'text-purple-400' : 'text-purple-700'}`}>
                        {patient.xgb_score}%
                      </span>
                    </div>
                    <div className={`p-3 rounded-lg border transition-smooth ${
                      isDark ? 'bg-yellow-950/20 border-yellow-700/30' : 'bg-yellow-100 border-yellow-300'
                    }`}>
                      <span className={`text-[10px] uppercase font-semibold flex items-center gap-1 transition-smooth ${
                        isDark ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        <Zap size={11} className={isDark ? 'text-yellow-400' : 'text-yellow-600'} />
                        Deterioration
                      </span>
                      <span className={`font-bold text-lg mt-1 transition-smooth ${isDark ? 'text-yellow-400' : 'text-yellow-700'}`}>
                        {patient.deterioration_score}%
                      </span>
                    </div>
                  </div>
                  
                  <div className={`rounded-lg p-3 border transition-smooth ${
                    isDark ? 'bg-slate-900/50 border-slate-700' : 'bg-gray-100 border-gray-300'
                  }`}>
                    <p className={`text-[10px] uppercase tracking-widest font-semibold mb-1 transition-smooth ${
                      isDark ? 'text-gray-500' : 'text-gray-600'
                    }`}>Primary Risk Factor</p>
                    <p className={`text-sm font-semibold truncate transition-smooth ${isDark ? 'text-cyan-400' : 'text-blue-600'}`}>
                      {patient.top_risk_driver}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  const colors = current ? getColors(current.alert_level) : getColors('SAFE');

  const renderHologram = () => {
   const isActive = (sys) => selectedSystem === sys;
   
   return (
     <div className={`rounded-xl p-6 border-2 flex flex-col h-full relative overflow-hidden transition-smooth ${
       isDark 
         ? 'bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-cyan-500/40 shadow-hospital-dark'
         : 'bg-gradient-to-br from-white to-gray-50 border-blue-400/40 shadow-hospital'
     }`}>
       <h3 className={`text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2 transition-smooth ${
         isDark ? 'text-cyan-400' : 'text-blue-600'
       }`}>
         <Scan size={16} /> Biometric Scan
       </h3>
       
       <div className="flex-grow flex items-center justify-center relative mb-4">
         <svg viewBox="0 0 200 400" className="w-full h-full max-h-[280px]">
           <path 
             d="M 85 40 C 85 20, 115 20, 115 40 C 115 55, 108 65, 105 70 C 120 70, 140 80, 150 90 C 180 110, 185 170, 180 230 C 175 240, 165 240, 165 230 C 170 170, 155 120, 145 105 C 145 120, 125 220, 120 240 C 125 280, 135 350, 130 380 C 125 390, 115 390, 115 380 C 115 340, 105 280, 100 245 C 95 280, 85 340, 85 380 C 85 390, 75 390, 70 380 C 65 350, 75 280, 80 240 C 75 220, 55 120, 55 105 C 45 120, 30 170, 35 230 C 35 240, 25 240, 20 230 C 15 170, 20 110, 50 90 C 60 80, 80 70, 95 70 C 92 65, 85 55, 85 40 Z" 
             className={`stroke-2 fill-none transition-smooth ${
               isDark ? 'stroke-cyan-700/60' : 'stroke-blue-600/40'
             }`}
           />

           <g onClick={() => setSelectedSystem('Neuro')} className={`cursor-pointer transition-all duration-300 ${
             isActive('Neuro') ? (isDark ? 'fill-cyan-400' : 'fill-blue-500') : (isDark ? 'fill-cyan-900/50 hover:fill-cyan-500/70' : 'fill-blue-900/30 hover:fill-blue-500/50')
           }`} style={{ filter: isActive('Neuro') ? (isDark ? 'drop-shadow(0 0 12px rgba(34, 211, 238, 0.6))' : 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.5))') : 'none' }}>
             <path d="M 88 35 C 88 20, 112 20, 112 35 C 112 50, 100 55, 100 55 C 100 55, 88 50, 88 35 Z" />
           </g>

           <g onClick={() => setSelectedSystem('Respiratory')} className={`cursor-pointer transition-all duration-300 ${
             isActive('Respiratory') ? (isDark ? 'fill-blue-400' : 'fill-blue-500') : (isDark ? 'fill-blue-900/50 hover:fill-blue-500/70' : 'fill-blue-900/30 hover:fill-blue-500/50')
           }`} style={{ filter: isActive('Respiratory') ? (isDark ? 'drop-shadow(0 0 12px rgba(96, 165, 250, 0.6))' : 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.5))') : 'none' }}>
             <path d="M 75 100 C 60 110, 65 140, 85 150 C 95 150, 95 110, 90 95 Z" />
             <path d="M 125 100 C 140 110, 135 140, 115 150 C 105 150, 105 110, 110 95 Z" />
           </g>

           <g onClick={() => setSelectedSystem('Cardio')} className={`cursor-pointer transition-all duration-300 ${
             isActive('Cardio') ? (isDark ? 'fill-red-500 animate-pulse' : 'fill-red-500 animate-pulse') : (isDark ? 'fill-red-900/50 hover:fill-red-500/80' : 'fill-red-900/30 hover:fill-red-500/50')
           }`} style={{ filter: isActive('Cardio') ? (isDark ? 'drop-shadow(0 0 15px rgba(239, 68, 68, 0.8))' : 'drop-shadow(0 0 10px rgba(220, 38, 38, 0.6))') : 'none' }}>
             <path d="M 100 110 C 105 100, 115 100, 115 110 C 115 125, 100 135, 100 135 C 100 135, 85 125, 85 110 C 85 100, 95 100, 100 110 Z" />
           </g>

           <g onClick={() => setSelectedSystem('Metabolic')} className={`cursor-pointer transition-all duration-300 ${
             isActive('Metabolic') ? (isDark ? 'fill-yellow-400' : 'fill-yellow-500') : (isDark ? 'fill-yellow-900/50 hover:fill-yellow-500/70' : 'fill-yellow-900/30 hover:fill-yellow-500/50')
           }`} style={{ filter: isActive('Metabolic') ? (isDark ? 'drop-shadow(0 0 12px rgba(234, 179, 8, 0.6))' : 'drop-shadow(0 0 8px rgba(202, 138, 4, 0.5))') : 'none' }}>
             <path d="M 70 165 C 65 195, 80 225, 100 230 C 120 225, 135 195, 130 165 C 110 175, 90 175, 70 165 Z" />
           </g>
         </svg>
       </div>
       
       <div className={`p-4 border rounded-lg transition-smooth ${
         isDark ? 'bg-slate-900/60 border-slate-700' : 'bg-gray-100 border-gray-300'
       }`}>
         {selectedSystem === 'Neuro' && (
           <div className="animate-fade-in">
             <h4 className={`font-bold text-xs uppercase tracking-widest pb-2 mb-3 border-b transition-smooth ${
               isDark ? 'text-cyan-400 border-slate-700' : 'text-blue-600 border-gray-300'
             }`}>Neurological</h4>
             <div className="space-y-2 text-xs">
               <div className="flex justify-between"><span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Core Temp</span><span className={isDark ? 'text-gray-100 font-semibold' : 'text-gray-900 font-semibold'}>{current.vitals.Temp.toFixed(1)} °C</span></div>
               <div className="flex justify-between"><span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Mentation</span><span className={`font-semibold ${current.alert_level === 'CRITICAL' ? (isDark ? 'text-red-400' : 'text-red-600') : (isDark ? 'text-green-400' : 'text-green-600')}`}>{current.alert_level === 'CRITICAL' ? 'Altered' : 'A&O'}</span></div>
               <div className="flex justify-between"><span className={isDark ? 'text-gray-400' : 'text-gray-600'}>GCS</span><span className={isDark ? 'text-gray-100 font-semibold' : 'text-gray-900 font-semibold'}>{current.alert_level === 'CRITICAL' ? '12' : '15'}</span></div>
             </div>
           </div>
         )}
         {selectedSystem === 'Cardio' && (
           <div className="animate-fade-in">
             <h4 className={`font-bold text-xs uppercase tracking-widest pb-2 mb-3 border-b transition-smooth ${
               isDark ? 'text-red-400 border-slate-700' : 'text-red-600 border-gray-300'
             }`}>Cardiovascular</h4>
             <div className="space-y-2 text-xs">
               <div className="flex justify-between"><span className={isDark ? 'text-gray-400' : 'text-gray-600'}>HR</span><span className={isDark ? 'text-gray-100 font-semibold' : 'text-gray-900 font-semibold'}>{current.vitals.HR.toFixed(0)} bpm</span></div>
               <div className="flex justify-between"><span className={isDark ? 'text-gray-400' : 'text-gray-600'}>MAP</span><span className={`font-semibold ${current.vitals.MAP < 65 ? (isDark ? 'text-red-400' : 'text-red-600') : (isDark ? 'text-gray-100' : 'text-gray-900')}`}>{current.vitals.MAP.toFixed(0)} mmHg</span></div>
               <div className="flex justify-between"><span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Rhythm</span><span className={`font-semibold ${(current.vitals.HR > 110 || current.vitals.HR < 60) ? (isDark ? 'text-yellow-400' : 'text-yellow-600') : (isDark ? 'text-green-400' : 'text-green-600')}`}>{current.vitals.HR > 110 ? 'Tachy' : current.vitals.HR < 60 ? 'Brady' : 'Normal'}</span></div>
             </div>
           </div>
         )}
         {selectedSystem === 'Respiratory' && (
           <div className="animate-fade-in">
             <h4 className={`font-bold text-xs uppercase tracking-widest pb-2 mb-3 border-b transition-smooth ${
               isDark ? 'text-blue-400 border-slate-700' : 'text-blue-600 border-gray-300'
             }`}>Respiratory</h4>
             <div className="space-y-2 text-xs">
               <div className="flex justify-between"><span className={isDark ? 'text-gray-400' : 'text-gray-600'}>SpO2</span><span className={isDark ? 'text-gray-100 font-semibold' : 'text-gray-900 font-semibold'}>{current.alert_level === 'CRITICAL' ? '88%' : '96%'}</span></div>
               <div className="flex justify-between"><span className={isDark ? 'text-gray-400' : 'text-gray-600'}>RR</span><span className={`font-semibold ${current.alert_level === 'CRITICAL' ? (isDark ? 'text-red-400' : 'text-red-600') : (isDark ? 'text-gray-100' : 'text-gray-900')}`}>{current.alert_level === 'CRITICAL' ? '28' : '16'} /min</span></div>
               <div className="flex justify-between"><span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Support</span><span className={isDark ? 'text-gray-100 font-semibold' : 'text-gray-900 font-semibold'}>{current.alert_level === 'CRITICAL' ? 'NC 4L' : 'Room'}</span></div>
             </div>
           </div>
         )}
         {selectedSystem === 'Metabolic' && (
           <div className="animate-fade-in">
             <h4 className={`font-bold text-xs uppercase tracking-widest pb-2 mb-3 border-b transition-smooth ${
               isDark ? 'text-yellow-400 border-slate-700' : 'text-yellow-600 border-gray-300'
             }`}>Metabolic</h4>
             <div className="space-y-2 text-xs">
               <div className="flex justify-between"><span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Lactate</span><span className={`font-semibold ${current.vitals.Lactate > 2.0 ? (isDark ? 'text-red-400 animate-pulse' : 'text-red-600') : (isDark ? 'text-gray-100' : 'text-gray-900')}`}>{current.vitals.Lactate.toFixed(1)} mmol/L</span></div>
               <div className="flex justify-between"><span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Renal</span><span className={isDark ? 'text-gray-100 font-semibold' : 'text-gray-900 font-semibold'}>{current.alert_level === 'CRITICAL' ? 'AKI' : 'Stable'}</span></div>
               <div className="flex justify-between"><span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Glucose</span><span className={isDark ? 'text-gray-100 font-semibold' : 'text-gray-900 font-semibold'}>110 mg/dL</span></div>
             </div>
           </div>
         )}
       </div>
     </div>
   );
  };

  return (
    <div className={`min-h-screen p-8 font-sans transition-smooth ${
      isDark ? 'bg-slate-950' : 'bg-gray-50'
    }`}>
      {renderHeader()}

      <div className="mb-6">
        <button 
          onClick={() => setView('ward')}
          className={`flex items-center gap-2 text-sm font-semibold uppercase tracking-widest px-4 py-2 rounded-lg border transition-smooth ${
            isDark 
              ? 'text-cyan-400 bg-cyan-950/20 border-cyan-800/50 hover:bg-cyan-900/30'
              : 'text-blue-600 bg-blue-100/40 border-blue-300 hover:bg-blue-100/60'
          }`}
        >
          <ArrowLeft size={16} /> Return to Ward
        </button>
      </div>

      {!current ? (
        <div className={`flex flex-col items-center justify-center h-[50vh] rounded-2xl border-2 backdrop-blur-sm transition-smooth ${
          isDark
            ? 'border-cyan-500/30 bg-cyan-900/10 text-cyan-400'
            : 'border-blue-300 bg-blue-50 text-blue-700'
        }`}>
          <Activity size={64} className="mb-6 opacity-40 animate-pulse-slow" />
          <p className="text-2xl font-display font-bold">Loading Patient Telemetry</p>
          <p className={`text-sm mt-3 font-sans ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Connecting to backend...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* LEFT PANEL */}
          <div className="lg:col-span-4 space-y-6">

            {/* Master Alert Card */}
            <div className={`rounded-xl p-6 border-2 transition-smooth ${colors.bg} ${colors.border}`}>
              <div className="flex justify-between items-start mb-4">
                <span className={`text-xs font-bold uppercase tracking-widest transition-smooth ${colors.text}`}>System Status</span>
                {current.alert_level === 'CRITICAL' && <AlertTriangle className="animate-pulse text-red-500" size={24} />}
              </div>

              <div className="flex items-baseline gap-2 mb-2">
                <span className={`text-6xl font-black font-display transition-smooth ${colors.text}`}>{current.combined_risk_score}</span>
                <span className={`text-xl font-bold transition-smooth ${colors.text}`}>%</span>
              </div>
              <div className={`text-2xl font-bold font-display tracking-tight mb-6 transition-smooth ${colors.text}`}>
                {current.alert_level}
              </div>

              <div className={`p-4 border rounded-lg transition-smooth ${
                isDark ? 'bg-slate-900/30 border-slate-700' : 'bg-gray-100 border-gray-300'
              }`}>
                <h3 className={`text-xs uppercase tracking-widest font-semibold mb-3 flex items-center gap-2 transition-smooth ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  <BrainCircuit size={14} className={isDark ? 'text-cyan-500' : 'text-blue-600'} />
                  Diagnostic Insight
                </h3>
                <p className={`text-sm leading-relaxed mb-3 transition-smooth ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                  {current.explanation_text}
                </p>
                
                {current.feature_importance && (
                  <div className={`space-y-2 border-t pt-3 transition-smooth ${isDark ? 'border-slate-700' : 'border-gray-300'}`}>
                    <p className={`text-xs uppercase tracking-widest transition-smooth ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                      Key Risk Factors
                    </p>
                    {current.feature_importance.slice(0, 3).map((f, i) => (
                      <div key={i} className="flex justify-between items-center text-xs">
                        <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{f.feature}</span>
                        <span className={`font-bold ${f.contribution > 0 ? (isDark ? 'text-red-400' : 'text-red-600') : (isDark ? 'text-green-400' : 'text-green-600')}`}>
                          {f.contribution > 0 ? '+' : ''}{f.contribution.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Dual Engine */}
            <div className={`rounded-xl p-5 border transition-smooth ${
              isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-gray-300'
            }`}>
              <h3 className={`text-xs font-bold uppercase tracking-widest mb-4 transition-smooth ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Dual-Engine Breakdown
              </h3>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className={`flex items-center gap-2 transition-smooth ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      <BrainCircuit size={14} className={isDark ? 'text-purple-400' : 'text-purple-600'} />
                      ML (XGBoost)
                    </span>
                    <span className={`font-bold transition-smooth ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
                      {current.xgb_score}%
                    </span>
                  </div>
                  <div className={`w-full h-2 rounded-full overflow-hidden transition-smooth ${
                    isDark ? 'bg-slate-900/50' : 'bg-gray-200'
                  }`}>
                    <div 
                      className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full transition-all duration-300" 
                      style={{ width: `${current.xgb_score}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className={`flex items-center gap-2 transition-smooth ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      <ShieldAlert size={14} className={isDark ? 'text-blue-400' : 'text-blue-600'} />
                      Clinical Rules
                    </span>
                    <span className={`font-bold transition-smooth ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                      {current.clinical_score}%
                    </span>
                  </div>
                  <div className={`w-full h-2 rounded-full overflow-hidden transition-smooth ${
                    isDark ? 'bg-slate-900/50' : 'bg-gray-200'
                  }`}>
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-300"
                      style={{ width: `${current.clinical_score}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Deterioration Panel */}
            <div className={`rounded-xl p-5 border-l-4 transition-smooth ${
              isDark 
                ? 'bg-yellow-950/20 border-l-yellow-500 border border-yellow-700/50'
                : 'bg-yellow-50 border-l-yellow-600 border border-yellow-300'
            }`}>
              <div className="flex justify-between items-start mb-3">
                <span className={`flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-smooth ${
                  isDark ? 'text-yellow-400' : 'text-yellow-700'
                }`}>
                  <Zap size={14} /> Deterioration Model
                </span>
                <span className={`text-2xl font-black font-display transition-smooth ${isDark ? 'text-yellow-400' : 'text-yellow-700'}`}>
                  {current.deterioration_score}%
                </span>
              </div>
              <div className={`w-full h-2.5 rounded-full overflow-hidden transition-smooth ${
                isDark ? 'bg-slate-900/30' : 'bg-gray-200'
              }`}>
                <div 
                  className="h-full bg-gradient-to-r from-yellow-500 to-orange-600 rounded-full transition-all duration-300"
                  style={{ width: `${current.deterioration_score}%` }}
                ></div>
              </div>
              <p className={`text-xs mt-3 transition-smooth ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Trained on 40K+ patients • 40 vital features
              </p>
            </div>
          </div>

          {/* RIGHT PANEL */}
          <div className="lg:col-span-8 space-y-6">

            {/* Vitals Grid */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { icon: HeartPulse, label: 'HR', value: current.vitals.HR, unit: '', color: isDark ? 'text-red-400' : 'text-red-600' },
                { icon: Activity, label: 'MAP', value: current.vitals.MAP, unit: '', color: isDark ? 'text-cyan-400' : 'text-blue-600' },
                { icon: Thermometer, label: 'TEMP', value: current.vitals.Temp, unit: '', color: isDark ? 'text-orange-400' : 'text-orange-600' },
                { icon: Droplets, label: 'LACTATE', value: current.vitals.Lactate, unit: '', color: isDark ? 'text-yellow-400' : 'text-yellow-600' },
              ].map((vital, idx) => (
                <div 
                  key={idx}
                  className={`p-4 rounded-lg border transition-smooth ${
                    isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-gray-300'
                  }`}
                >
                  <span className={`text-xs font-semibold uppercase tracking-widest flex items-center gap-2 transition-smooth ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    <vital.icon size={16} className={vital.color} />
                    {vital.label}
                  </span>
                  <span className={`text-3xl font-bold font-display mt-2 transition-smooth ${vital.color}`}>
                    {vital.value.toFixed(0)}
                  </span>
                </div>
              ))}
            </div>

            {/* Two-column layout for biometric scan and ECG */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Biometric Scan */}
              {renderHologram()}

              {/* ECG Display */}
              <ECGDisplay isDark={isDark} vitals={current?.vitals} alertLevel={current?.alert_level} />
            </div>

            {/* Timeline Chart */}
            <div className={`rounded-xl p-6 border transition-smooth ${
              isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-gray-300'
            }`}>
              <h3 className={`text-sm font-bold uppercase tracking-widest mb-6 transition-smooth ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>Deterioration Trajectory</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={patientData.history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1f2937' : '#d1d5db'} vertical={false} />
                    <XAxis dataKey="hour" stroke={isDark ? '#6b7280' : '#9ca3af'} tick={{ fontSize: 12 }} tickFormatter={(val) => `H${val}`} />
                    <YAxis stroke={isDark ? '#6b7280' : '#9ca3af'} domain={[0, 100]} tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{ 
                        backgroundColor: isDark ? '#1f2937' : '#f3f4f6',
                        border: `1px solid ${isDark ? '#374151' : '#d1d5db'}`,
                        borderRadius: '8px',
                        fontFamily: 'monospace'
                      }}
                      itemStyle={{ color: isDark ? '#22d3ee' : '#0369a1' }}
                      labelStyle={{ color: isDark ? '#9ca3af' : '#6b7280' }}
                    />
                    <ReferenceLine y={75} stroke="#ef4444" strokeDasharray="3 3" />
                    <ReferenceLine y={55} stroke="#f97316" strokeDasharray="3 3" />
                    <Line
                      type="stepAfter"
                      dataKey="combined_risk_score"
                      stroke={colors.fill}
                      strokeWidth={3}
                      dot={false}
                      activeDot={{ r: 6, fill: colors.fill, strokeWidth: 2 }}
                      animationDuration={300}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showDoctorDispatch && (
        <DoctorDispatchModal
          patientId={current?.patient_id}
          patientName={current?.patient_name}
          onDispatch={handleDoctorDispatch}
          onClose={() => setShowDoctorDispatch(false)}
          isDark={isDark}
        />
      )}

      {showResourceAllocation && (
        <ResourceAllocationModal
          patientId={current?.patient_id}
          patientName={current?.patient_name}
          onAllocate={handleResourceAllocation}
          onClose={() => setShowResourceAllocation(false)}
          isDark={isDark}
        />
      )}
    </div>
  );
}
