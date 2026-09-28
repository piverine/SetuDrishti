import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity,
  Vibration, TextInput, FlatList,
  ActivityIndicator, Animated, Dimensions, StatusBar, Platform, Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useThemeContext } from '../../components/ThemeContext';
import { Moon, Sun } from 'lucide-react-native';import {
  Activity, ShieldAlert, Package, MessageSquare, AlertCircle,
  TrendingUp, CheckCircle, Circle, Send, ChevronRight, Users,
  Thermometer, Heart, Wind, Droplets, Zap, ArrowLeft,
  Clock, Bed, User, FileText, Download, Scan
} from 'lucide-react-native';

// ─── Config ──────────────────────────────────────────────────────
const API_BASE = "http://10.188.53.227:8000/api/v1";
const POLL_MS = 2000;
const { width: SW } = Dimensions.get('window');

// ─── Types ────────────────────────────────────────────────────────
type AlertLevel = 'CRITICAL' | 'HIGH' | 'WATCH' | 'SAFE' | 'IDLE';
type Patient = {
  patient_id: string; patient_name: string; bed_number: string;
  age: number; admit_reason: string; hour: number;
  combined_risk_score: number; xgb_score: number; clinical_score: number;
  alert_level: AlertLevel; explanation_text: string; top_risk_driver: string;
  feature_importance: { feature: string; contribution: number; value: number }[];
  vitals: {
    HR: number; MAP: number; Temp: number; Lactate: number;
    SBP: number; Resp: number; WBC: number; Creatinine: number;
    Platelets: number; pH: number; O2Sat: number;
  };
};

// ─── Alert helpers ────────────────────────────────────────────────
const alertTheme = (l: string, T: any) => {
  if (l === 'CRITICAL') return { fg: T.critical, bg: T.critBg, bdr: T.critBdr, label: 'CRITICAL' };
  if (l === 'HIGH') return { fg: T.high, bg: T.highBg, bdr: T.highBdr, label: 'HIGH' };
  if (l === 'WATCH') return { fg: T.watch, bg: T.watchBg, bdr: T.watchBdr, label: 'WATCH' };
  return { fg: T.safe, bg: T.safeBg, bdr: T.safeBdr, label: 'STABLE' };
};

// ─── Risk Score Badge ─────────────────────────────────────────────
function RiskBadge({ score, level }: { score: number; level: string }) {
  const { theme: T } = useThemeContext();
  const S = getStyles(T);
  const th = alertTheme(level, T);
  return (
    <View style={[S.riskBadge, { backgroundColor: th.bg, borderColor: th.bdr }]}>
      <Text style={[S.riskBadgeScore, { color: th.fg }]}>{score}</Text>
      <Text style={[S.riskBadgeLabel, { color: th.fg }]}>%</Text>
    </View>
  );
}

// ─── Status Pill ──────────────────────────────────────────────────
function StatusPill({ level }: { level: string }) {
  const { theme: T } = useThemeContext();
  const S = getStyles(T);
  const th = alertTheme(level, T);
  return (
    <View style={[S.statusPill, { backgroundColor: th.bg, borderColor: th.bdr }]}>
      <View style={[S.statusDot, { backgroundColor: th.fg }]} />
      <Text style={[S.statusPillText, { color: th.fg }]}>{th.label}</Text>
    </View>
  );
}

// ─── Vital Cell ───────────────────────────────────────────────────
function VitalCell({ label, value, unit, warn }: { label: string; value: any; unit: string; warn?: boolean; }) {
  const { theme: T } = useThemeContext();
  const S = getStyles(T);
  return (
    <View style={[S.vitalCell, warn && { borderColor: T.critBdr, backgroundColor: T.critBg }]}>
      <Text style={S.vitalCellLabel}>{label}</Text>
      <Text style={[S.vitalCellValue, warn && { color: T.critical }]}>
        {value ?? '—'}
      </Text>
      <Text style={[S.vitalCellUnit, warn && { color: T.critical }]}>{unit}</Text>
    </View>
  );
}

// ─── Section Header ───────────────────────────────────────────────
function SectionHeader({ title, icon }: { title: string; icon?: React.ReactNode }) {
  const { theme: T } = useThemeContext();
  const S = getStyles(T);
  return (
    <View style={S.sectionHeader}>
      {icon}
      <Text style={S.sectionHeaderText}>{title}</Text>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════
// WARD VIEW
// ═══════════════════════════════════════════════════════════════════
function WardView({ onSelect }: { onSelect: (p: Patient) => void }) {
  const { theme: T, isDark, toggleTheme } = useThemeContext();
  const S = getStyles(T);
  const router = useRouter();
  const { role } = useLocalSearchParams();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastPoll, setLastPoll] = useState('');
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.4, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    const poll = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        const res = await fetch(`${API_BASE}/patients`, { signal: controller.signal });
        clearTimeout(timeoutId);

        const json: Patient[] = await res.json();
        setPatients(json.sort((a, b) => b.combined_risk_score - a.combined_risk_score));
        setLastPoll(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        setLoading(false);
        if (json.some(p => p.alert_level === 'CRITICAL')) Vibration.vibrate([0, 300, 150, 300]);
      } catch {
        setLoading(false);
      }
    };
    poll();
    const t = setInterval(poll, POLL_MS);
    return () => clearInterval(t);
  }, []);

  const critical = patients.filter(p => p.alert_level === 'CRITICAL').length;
  const high = patients.filter(p => p.alert_level === 'HIGH').length;
  const watch = patients.filter(p => p.alert_level === 'WATCH').length;

  return (
    <SafeAreaView style={S.page}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={T.pageBg} />

      {/* ── Top Header ── */}
      <View style={S.wardHeader}>
        <View style={S.wardHeaderLeft}>
          <Text style={S.appTitle}>Setu-Drishti</Text>
          <Text style={S.appSubtitle}>ICU Patient Monitor</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity 
            style={{ backgroundColor: 'rgba(0,255,255,0.15)', borderWidth: 1, borderColor: '#0ff', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, flexDirection: 'row', alignItems: 'center' }} 
            onPress={() => router.push('/(tabs)/ar-lens')}
          >
            <Scan size={14} color="#0ff" style={{ marginRight: 4 }} />
            <Text style={{ color: '#0ff', fontWeight: 'bold', fontSize: 12, letterSpacing: 1 }}>AR Lens</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={{ backgroundColor: '#1155A6', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, flexDirection: 'row', alignItems: 'center' }} 
            onPress={() => {
              if (role === 'patient') {
                router.push('/omnimed-patient');
              } else {
                router.push('/(tabs)/omnimed');
              }
            }}
          >
            <Zap size={14} color="#FFF" style={{ marginRight: 4 }} />
            <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 12 }}>OmniMed OS</Text>
          </TouchableOpacity>
        </View>
        <View style={S.liveChip}>
          <Animated.View style={[S.liveDot, { transform: [{ scale: pulseAnim }] }]} />
          <Text style={S.liveText}>LIVE</Text>
        </View>
      </View>

      {/* ── Last Updated Bar ── */}
      <View style={S.updateBar}>
        <Clock size={12} color={T.textMuted} />
        <Text style={S.updateText}>Last updated: {lastPoll || 'Connecting...'}</Text>
      </View>

      {/* ── Summary Strip ── */}
      <View style={S.summaryStrip}>
        <View style={[S.summaryCard, { borderLeftColor: T.critical }]}>
          <Text style={[S.summaryNum, { color: T.critical }]}>{critical}</Text>
          <Text style={S.summaryLabel}>Critical</Text>
        </View>
        <View style={[S.summaryCard, { borderLeftColor: T.high }]}>
          <Text style={[S.summaryNum, { color: T.high }]}>{high}</Text>
          <Text style={S.summaryLabel}>High</Text>
        </View>
        <View style={[S.summaryCard, { borderLeftColor: T.watch }]}>
          <Text style={[S.summaryNum, { color: T.watch }]}>{watch}</Text>
          <Text style={S.summaryLabel}>Watch</Text>
        </View>
        <View style={[S.summaryCard, { borderLeftColor: T.blue500 }]}>
          <Text style={[S.summaryNum, { color: T.blue500 }]}>{patients.length}</Text>
          <Text style={S.summaryLabel}>Total</Text>
        </View>
      </View>

      {/* ── Patient List ── */}
      {loading ? (
        <View style={S.loadingBox}>
          <ActivityIndicator size="large" color={T.blue500} />
          <Text style={S.loadingTitle}>Connecting to ICU Backend</Text>
          <Text style={S.loadingNote}>Ensure the backend and simulator are both running.</Text>
        </View>
      ) : (
        <FlatList
          data={patients}
          keyExtractor={p => p.patient_id}
          contentContainerStyle={{ padding: 12, gap: 10 }}
          renderItem={({ item: p }) => {
            const th = alertTheme(p.alert_level, T);
            const v = p.vitals ?? {};
            return (
              <TouchableOpacity
                style={[S.wardCard, { borderLeftColor: th.fg }]}
                onPress={() => onSelect(p)}
                activeOpacity={0.92}
              >
                {/* Patient Header Row */}
                <View style={S.wardCardTopRow}>
                  <View style={S.wardCardId}>
                    <Bed size={13} color={T.blue600} />
                    <Text style={S.wardBed}>Bed {p.bed_number}</Text>
                    <Text style={S.wardPid}>{p.patient_id}</Text>
                  </View>
                  <StatusPill level={p.alert_level} />
                </View>

                {/* Name + Admit */}
                <Text style={S.wardName}>{p.patient_name}</Text>
                <Text style={S.wardAdmit}>{p.admit_reason} · Age {p.age}</Text>

                {/* Divider */}
                <View style={S.cardDivider} />

                {/* Vitals Row + Risk */}
                <View style={S.wardBottomRow}>
                  <View style={S.wardMiniVitals}>
                    <Text style={S.wardMiniVital}>
                      <Text style={S.wardMiniLabel}>HR </Text>
                      <Text style={[S.wardMiniVal, v.HR > 110 && { color: T.critical }]}>
                        {v.HR ?? '—'}
                      </Text>
                    </Text>
                    <Text style={S.wardMiniSep}>|</Text>
                    <Text style={S.wardMiniVital}>
                      <Text style={S.wardMiniLabel}>MAP </Text>
                      <Text style={[S.wardMiniVal, v.MAP < 65 && { color: T.critical }]}>
                        {v.MAP ?? '—'}
                      </Text>
                    </Text>
                    <Text style={S.wardMiniSep}>|</Text>
                    <Text style={S.wardMiniVital}>
                      <Text style={S.wardMiniLabel}>Lac </Text>
                      <Text style={[S.wardMiniVal, v.Lactate >= 2 && { color: T.critical }]}>
                        {v.Lactate ?? '—'}
                      </Text>
                    </Text>
                    <Text style={S.wardMiniSep}>|</Text>
                    <Text style={S.wardMiniVital}>
                      <Text style={S.wardMiniLabel}>SpO₂ </Text>
                      <Text style={[S.wardMiniVal, v.O2Sat < 92 && { color: T.critical }]}>
                        {v.O2Sat ?? '—'}
                      </Text>
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <RiskBadge score={p.combined_risk_score} level={p.alert_level} />
                    <ChevronRight size={18} color={T.textMuted} />
                  </View>
                </View>

                {/* Critical Insight Line */}
                {p.alert_level !== 'SAFE' && (
                  <Text style={[S.wardInsight, { color: th.fg }]} numberOfLines={1}>
                    ⚠ {p.explanation_text}
                  </Text>
                )}
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PATIENT DETAIL VIEW
// ═══════════════════════════════════════════════════════════════════
const BASE_CHECKLIST = [
  { text: 'Lactate Level Drawn (within 3 hrs)', done: false, usesMeds: false },
  { text: 'Blood Cultures × 2 Obtained', done: false, usesMeds: false },
  { text: 'Broad-Spectrum Antibiotics Initiated', done: false, usesMeds: true },
  { text: '30 mL/kg IV Crystalloid Bolus', done: false, usesMeds: true },
  { text: 'Vasopressors if MAP < 65 mmHg', done: false, usesMeds: true },
  { text: 'Re-measure Serum Lactate at 2 hrs', done: false, usesMeds: false },
];

type Tab = 'overview' | 'chat' | 'protocol' | 'inventory';
const TABS: { key: Tab; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'chat', label: 'MediAssist' },
  { key: 'protocol', label: 'Protocol' },
  { key: 'inventory', label: 'Inventory' },
];

function PatientDetailView({ patient: init, onBack }: { patient: Patient; onBack: () => void }) {
  const { theme: T, isDark } = useThemeContext();
  const S = getStyles(T);
  const [patient, setPatient] = useState<Patient>(init);
  const [tab, setTab] = useState<Tab>('overview');
  const [briefing, setBriefing] = useState('');
  const [chatLog, setChatLog] = useState<{ sender: 'Doc' | 'Bot'; text: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatBusy, setChatBusy] = useState(false);
  const [checklist, setChecklist] = useState(BASE_CHECKLIST.map(i => ({ ...i })));
  const [reserved, setReserved] = useState(false);
  const [medsUsed, setMedsUsed] = useState(0);
  const chatRef = useRef<ScrollView>(null);

  // Live poll
  useEffect(() => {
    const t = setInterval(async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        const res = await fetch(`${API_BASE}/patient/${patient.patient_id}/timeline`, { signal: controller.signal });
        clearTimeout(timeoutId);

        const json = await res.json();
        if (json.current_state) {
          setPatient(json.current_state);
          if (json.current_state.alert_level === 'CRITICAL') Vibration.vibrate([0, 400, 200, 400]);
        }
      } catch { /* waiting */ }
    }, POLL_MS);
    return () => clearInterval(t);
  }, [patient.patient_id]);

  const th = alertTheme(patient.alert_level, T);
  const v = patient.vitals ?? {};
  const doneCount = checklist.filter(c => c.done).length;

  const handleBriefMe = async () => {
    setBriefing(''); setChatBusy(true);
    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'brief me with full status', patient_id: patient.patient_id }),
      });
      setBriefing((await res.json()).reply ?? 'Unable to get briefing.');
    } catch { setBriefing('Backend unreachable.'); }
    finally { setChatBusy(false); }
  };

  const handleSend = async () => {
    if (!chatInput.trim()) return;
    const msg = chatInput.trim();
    setChatLog(p => [...p, { sender: 'Doc', text: msg }]);
    setChatInput(''); setChatBusy(true);
    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, patient_id: patient.patient_id }),
      });
      const reply = (await res.json()).reply ?? 'No response.';
      setChatLog(p => [...p, { sender: 'Bot', text: reply }]);
    } catch {
      setChatLog(p => [...p, { sender: 'Bot', text: '⚠ Backend unreachable.' }]);
    } finally { setChatBusy(false); }
    setTimeout(() => chatRef.current?.scrollToEnd({ animated: true }), 200);
  };

  const toggleCheck = (i: number) => {
    const next = checklist.map((c, idx) => idx === i ? { ...c, done: !c.done } : c);
    setChecklist(next);
    if (next[i].done && next[i].usesMeds) { setMedsUsed(m => m + 1); setReserved(true); }
    if (!next[i].done && next[i].usesMeds) setMedsUsed(m => Math.max(0, m - 1));
  };

  const downloadReport = async () => {
    const url = `${API_BASE}/patient/${patient.patient_id}/report`;
    if (Platform.OS === 'web') {
      window.open(url, '_blank');
    } else {
      Linking.openURL(url).catch(err => {
        alert('Failed to open download link: ' + err.message);
      });
    }
  };

  return (
    <SafeAreaView style={S.page}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={T.pageBg} />

      {/* ── Top Bar ── */}
      <View style={S.detailHeader}>
        <TouchableOpacity onPress={onBack} style={S.backBtn}>
          <ArrowLeft size={18} color={T.blue700} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={S.detailName}>{patient.patient_name}</Text>
          <Text style={S.detailMeta}>{patient.patient_id} · Bed {patient.bed_number} · {patient.admit_reason}</Text>
        </View>
        <TouchableOpacity style={S.downloadBtn} onPress={downloadReport}>
          <Download size={14} color={T.blue700} />
          <Text style={S.downloadBtnText}>Report</Text>
        </TouchableOpacity>
        <StatusPill level={patient.alert_level} />
      </View>

      {/* ── Critical Banner ── */}
      {patient.combined_risk_score >= 75 && (
        <View style={[S.critBanner, { backgroundColor: th.bg, borderColor: th.bdr }]}>
          <AlertCircle size={16} color={th.fg} style={{ flexShrink: 0 }} />
          <View style={{ flex: 1, marginHorizontal: 10 }}>
            <Text style={[S.critBannerTitle, { color: th.fg }]}>
              {patient.alert_level === 'CRITICAL' ? 'CRITICAL — Action Required' : 'HIGH RISK — Monitor Closely'}
            </Text>
            <Text style={[S.critBannerBody, { color: th.fg }]} numberOfLines={2}>
              {patient.top_risk_driver}
            </Text>
          </View>
          <TouchableOpacity
            style={[S.critBannerBtn, { backgroundColor: th.fg }]}
            onPress={() => { setReserved(true); setTab('inventory'); }}
          >
            <Text style={S.critBannerBtnText}>Reserve Meds</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Tab Bar ── */}
      <View style={S.tabBar}>
        {TABS.map(t => (
          <TouchableOpacity key={t.key} style={[S.tabItem, tab === t.key && S.tabItemActive]}
            onPress={() => setTab(t.key)}>
            <Text style={[S.tabLabel, tab === t.key && S.tabLabelActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={S.detailScroll}
        showsVerticalScrollIndicator={false}
      >

        {/* ═══ OVERVIEW TAB ═══════════════════════════════════════════ */}
        {tab === 'overview' && <>

          {/* Risk Score Card */}
          <View style={S.card}>
            <View style={S.riskHeaderRow}>
              <View>
                <Text style={S.cardTitle}>Sepsis Risk Score</Text>
                <Text style={S.cardSubtitle}>Hybrid AI + Clinical Engine</Text>
              </View>
              <View style={[S.bigRiskBadge, { backgroundColor: th.bg, borderColor: th.bdr }]}>
                <Text style={[S.bigRiskNum, { color: th.fg }]}>{patient.combined_risk_score}</Text>
                <Text style={[S.bigRiskPct, { color: th.fg }]}>%</Text>
              </View>
            </View>

            {/* Engine Bars */}
            <View style={S.engineSection}>
              <View style={S.engineRow}>
                <Text style={S.engineLabel}>XGBoost</Text>
                <View style={S.engineTrack}>
                  <View style={[S.engineFill, { width: `${patient.xgb_score}%`, backgroundColor: T.blue400 }]} />
                </View>
                <Text style={S.engineVal}>{patient.xgb_score}%</Text>
              </View>
              <View style={S.engineRow}>
                <Text style={S.engineLabel}>Clinical</Text>
                <View style={S.engineTrack}>
                  <View style={[S.engineFill, { width: `${patient.clinical_score}%`, backgroundColor: th.fg }]} />
                </View>
                <Text style={S.engineVal}>{patient.clinical_score}%</Text>
              </View>
            </View>

            <View style={S.insightBox}>
              <Text style={S.insightText}>{patient.explanation_text}</Text>
            </View>
          </View>

          {/* Vitals Grid */}
          <View style={S.card}>
            <SectionHeader title="Current Vitals" icon={<Activity size={15} color={T.blue600} />} />
            <View style={S.vitalsGrid}>
              <VitalCell label="Heart Rate" value={v.HR} unit="bpm" warn={v.HR > 110} />
              <VitalCell label="MAP" value={v.MAP} unit="mmHg" warn={v.MAP < 65} />
              <VitalCell label="Temp" value={v.Temp} unit="°C" warn={v.Temp > 38.5} />
              <VitalCell label="Lactate" value={v.Lactate} unit="mmol/L" warn={v.Lactate >= 2} />
              <VitalCell label="SpO₂" value={v.O2Sat} unit="%" warn={v.O2Sat < 92} />
              <VitalCell label="Resp Rate" value={v.Resp} unit="/min" warn={v.Resp >= 22} />
              <VitalCell label="WBC" value={v.WBC} unit="×10⁹/L" warn={v.WBC > 12} />
              <VitalCell label="Creatinine" value={v.Creatinine} unit="mg/dL" warn={v.Creatinine >= 2} />
              <VitalCell label="Platelets" value={v.Platelets} unit="×10⁹/L" warn={v.Platelets < 100} />
              <VitalCell label="pH" value={v.pH} unit="" warn={v.pH < 7.35} />
            </View>
          </View>

          {/* AI Risk Drivers */}
          <View style={S.card}>
            <SectionHeader title="AI Risk Drivers" icon={<Zap size={15} color={T.blue600} />} />
            {patient.feature_importance?.map((f, i) => (
              <View key={i} style={S.driverRow}>
                <View style={S.driverLeft}>
                  <Text style={S.driverFeature}>{f.feature}</Text>
                  <Text style={S.driverValue}>Value: {f.value?.toFixed(2)}</Text>
                </View>
                <View style={S.driverTrack}>
                  <View style={[S.driverFill, {
                    width: `${Math.min(Math.abs(f.contribution) * 150, 100)}%`,
                    backgroundColor: f.contribution > 0 ? T.critical : T.safe,
                  }]} />
                </View>
                <Text style={[S.driverScore, { color: f.contribution > 0 ? T.critical : T.safe }]}>
                  {f.contribution > 0 ? '+' : ''}{f.contribution?.toFixed(3)}
                </Text>
              </View>
            ))}
          </View>
        </>}

        {/* ═══ MEDIASSIST TAB ══════════════════════════════════════════ */}
        {tab === 'chat' && <>
          <View style={S.card}>
            <SectionHeader title="MediAssist AI — Virtual Rounds" icon={<MessageSquare size={15} color={T.blue600} />} />
            <TouchableOpacity style={S.briefBtn} onPress={handleBriefMe} disabled={chatBusy}>
              {chatBusy && briefing === ''
                ? <ActivityIndicator size="small" color={T.blue600} />
                : <TrendingUp size={16} color={T.blue600} />
              }
              <Text style={S.briefBtnText}>Brief Me — {patient.patient_name.split(',')[0]}</Text>
            </TouchableOpacity>

            {briefing !== '' && (
              <View style={S.briefingBox}>
                <View style={S.briefingHeader}>
                  <Text style={S.briefingHeadLabel}>🤖 MediAssist Briefing</Text>
                </View>
                <Text style={S.briefingBody}>{briefing}</Text>
              </View>
            )}
          </View>

          <View style={S.card}>
            <SectionHeader title="Stat-Chat" icon={<Send size={15} color={T.blue600} />} />

            {/* Quick-query chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 12 }} contentContainerStyle={{ gap: 8 }}>
              {['Check MAP', 'Lactate status', 'Heart Rate', 'Full vitals', 'Risk score', 'Temperature'].map(s => (
                <TouchableOpacity key={s} style={S.chip} onPress={() => setChatInput(s)}>
                  <Text style={S.chipText}>{s}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Chat log */}
            <ScrollView ref={chatRef} style={{ maxHeight: 260 }} nestedScrollEnabled
              onContentSizeChange={() => chatRef.current?.scrollToEnd({ animated: true })}>
              {chatLog.length === 0 && (
                <Text style={S.chatEmpty}>Ask a question or tap a quick query above.</Text>
              )}
              {chatLog.map((msg, i) => (
                <View key={i} style={msg.sender === 'Doc' ? S.docBubble : S.botBubble}>
                  {msg.sender === 'Bot' && <Text style={S.botLabel}>MediAssist</Text>}
                  <Text style={msg.sender === 'Doc' ? S.docBubbleText : S.botBubbleText}>
                    {msg.text}
                  </Text>
                </View>
              ))}
              {chatBusy && chatLog.length > 0 && (
                <View style={S.botBubble}>
                  <ActivityIndicator size="small" color={T.blue500} />
                </View>
              )}
            </ScrollView>

            {/* Input row */}
            <View style={S.chatInputRow}>
              <TextInput
                style={S.chatInput}
                placeholder={`e.g. What is ${patient.patient_id}'s MAP?`}
                placeholderTextColor={T.textMuted}
                value={chatInput}
                onChangeText={setChatInput}
                onSubmitEditing={handleSend}
                returnKeyType="send"
              />
              <TouchableOpacity style={S.sendBtn} onPress={handleSend} disabled={chatBusy}>
                {chatBusy
                  ? <ActivityIndicator size="small" color={T.textWhite} />
                  : <Send size={16} color={T.textWhite} />
                }
              </TouchableOpacity>
            </View>
          </View>
        </>}

        {/* ═══ PROTOCOL TAB ════════════════════════════════════════════ */}
        {tab === 'protocol' && <>
          <View style={S.card}>
            <SectionHeader title="Surviving Sepsis — Hour‑1 Bundle" icon={<ShieldAlert size={15} color={T.blue600} />} />
            <Text style={S.protocolNote}>
              Based on the 2021 Surviving Sepsis Campaign International Guidelines.
              Check off each intervention as completed.
            </Text>

            {/* Progress Bar */}
            <View style={S.progressSection}>
              <View style={S.progressTrack}>
                <View style={[S.progressFill, { width: `${(doneCount / checklist.length) * 100}%` }]} />
              </View>
              <Text style={S.progressLabel}>{doneCount} / {checklist.length} completed</Text>
            </View>

            {/* Checklist */}
            {checklist.map((item, i) => (
              <TouchableOpacity key={i} style={S.checkRow} onPress={() => toggleCheck(i)}>
                {item.done
                  ? <CheckCircle size={22} color={T.safe} style={{ flexShrink: 0 }} />
                  : <Circle size={22} color={T.textMuted} style={{ flexShrink: 0 }} />
                }
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[S.checkText, item.done && S.checkDone]}>{item.text}</Text>
                  {item.usesMeds && (
                    <Text style={item.done ? S.medTagDone : S.medTag}>
                      {item.done ? '✓ Inventory deducted' : '⚕ Requires inventory item'}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}

            {doneCount === checklist.length && (
              <View style={S.completedBox}>
                <CheckCircle size={18} color={T.safe} />
                <Text style={S.completedText}>All bundle steps completed. Document in EMR.</Text>
              </View>
            )}
          </View>
        </>}

        {/* ═══ INVENTORY TAB ═══════════════════════════════════════════ */}
        {tab === 'inventory' && <>
          <View style={S.card}>
            <SectionHeader title="MediStock — Emergency Inventory" icon={<Package size={15} color={T.blue600} />} />

            {/* Reserve Button */}
            <TouchableOpacity
              style={[S.reserveBtn, reserved && { backgroundColor: T.safe }]}
              onPress={() => setReserved(true)}
            >
              <Package size={16} color={T.textWhite} />
              <Text style={S.reserveBtnText}>
                {reserved
                  ? `✓ Sepsis Bundle Reserved${medsUsed > 0 ? ` (${medsUsed} item${medsUsed > 1 ? 's' : ''} used)` : ''}`
                  : 'Reserve Sepsis Emergency Bundle'}
              </Text>
            </TouchableOpacity>

            {reserved && (
              <View style={S.reservedNote}>
                <Text style={S.reservedNoteText}>
                  Bundle flagged for Priority Pick-up. Pharmacy has been notified.
                </Text>
              </View>
            )}
          </View>

          {/* Stock Items */}
          <View style={S.card}>
            <Text style={S.cardTitle}>Sepsis Bundle Contents</Text>
            {[
              { name: '0.9% Normal Saline 1 L', qty: 24, low: false },
              { name: 'Piperacillin-Tazobactam 4.5g', qty: 9, low: false },
              { name: 'Vancomycin 1g', qty: 6, low: true },
              { name: 'Norepinephrine 4mg/250ml', qty: 4, low: true },
              { name: 'Meropenem 1g', qty: 11, low: false },
              { name: 'Dopamine 200mg', qty: 3, low: true },
            ].map((s, i) => (
              <View key={i} style={S.stockRow}>
                <Text style={S.stockName}>{s.name}</Text>
                <View style={[S.stockBadge,
                {
                  backgroundColor: s.low ? T.highBg : T.safeBg,
                  borderColor: s.low ? T.highBdr : T.safeBdr
                }]}>
                  <Text style={[S.stockQty, { color: s.low ? T.high : T.safe }]}>
                    {s.qty} units{s.low ? ' ⚠' : ''}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </>}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ROOT
// ═══════════════════════════════════════════════════════════════════
export default function App() {
  const [selected, setSelected] = useState<Patient | null>(null);
  const [htmlChatOpen, setHtmlChatOpen] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleMessage = (e: any) => {
        if (e.data?.type === 'CHAT_TOGGLE') {
          setHtmlChatOpen(e.data.isOpen);
        }
      };
      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
    }
  }, []);

  return (
    <View style={{ flex: 1, position: 'relative' }}>
      {selected
        ? <PatientDetailView patient={selected} onBack={() => setSelected(null)} />
        : <WardView onSelect={setSelected} />}

      {Platform.OS === 'web' ? (
        <View style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: htmlChatOpen ? SW : 120,
          height: htmlChatOpen ? '100%' : 120,
          zIndex: 99999,
          pointerEvents: 'box-none'
        }}>
          {React.createElement('iframe', {
            src: "/healthcare-chatbot.html",
            style: { width: '100%', height: '100%', border: 'none', backgroundColor: 'transparent' },
            allow: "microphone"
          })}
        </View>
      ) : (
        <View style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: htmlChatOpen ? SW : 120,
          height: htmlChatOpen ? '100%' : 120,
          zIndex: 99999,
        }} pointerEvents="box-none">
          <WebView
            originWhitelist={['*']}
            source={{ uri: "http://10.188.53.227:8081/healthcare-chatbot.html" }}
            containerStyle={{ backgroundColor: 'transparent' }}
            style={{ flex: 1, backgroundColor: 'transparent' }}
            onMessage={(e) => {
              try {
                const data = JSON.parse(e.nativeEvent.data);
                if (data.type === 'CHAT_TOGGLE') {
                  setHtmlChatOpen(data.isOpen);
                }
              } catch (err) { }
            }}
          />
        </View>
      )}
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════
// STYLESHEET
// ═══════════════════════════════════════════════════════════════════
const getStyles = (T: any) => StyleSheet.create({
  page: { flex: 1, backgroundColor: T.pageBg },

  // ── Ward Header ──
  wardHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: T.white, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: T.border,
    ...Platform.select({ ios: { shadowColor: T.shadow, shadowOpacity: 1, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } }, android: { elevation: 3 } }),
  },
  wardHeaderLeft: {},
  appTitle: { fontSize: 20, fontWeight: '800', color: T.blue800, letterSpacing: 0.3 },
  appSubtitle: { fontSize: 11, color: T.textMuted, marginTop: 1 },
  liveChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: T.blue50, borderRadius: 20, borderWidth: 1, borderColor: T.blue100,
    paddingHorizontal: 10, paddingVertical: 5
  },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#E53935' },
  liveText: { fontSize: 11, fontWeight: '700', color: T.blue700 },

  // ── Update bar ──
  updateBar: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: T.white, borderBottomWidth: 1, borderBottomColor: T.divider,
    paddingHorizontal: 16, paddingVertical: 6,
  },
  updateText: { fontSize: 11, color: T.textMuted },

  // ── Summary strip ──
  summaryStrip: {
    flexDirection: 'row', gap: 10, paddingHorizontal: 12, paddingVertical: 10,
  },
  summaryCard: {
    flex: 1, backgroundColor: T.white, borderRadius: 8, padding: 10,
    borderLeftWidth: 3, alignItems: 'center',
    borderWidth: 1, borderColor: T.border,
    ...Platform.select({ ios: { shadowColor: T.shadow, shadowOpacity: 0.8, shadowRadius: 2, shadowOffset: { width: 0, height: 1 } }, android: { elevation: 1 } }),
  },
  summaryNum: { fontSize: 22, fontWeight: '800', color: T.textPrimary },
  summaryLabel: { fontSize: 10, color: T.textMuted, marginTop: 2, fontWeight: '600' },

  // ── Loading ──
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 14, padding: 40 },
  loadingTitle: { fontSize: 15, fontWeight: '700', color: T.textPrimary },
  loadingNote: { fontSize: 12, color: T.textMuted, textAlign: 'center' },

  // ── Ward Card ──
  wardCard: {
    backgroundColor: T.white, borderRadius: 10, padding: 14,
    borderLeftWidth: 4, borderWidth: 1, borderColor: T.border,
    ...Platform.select({ ios: { shadowColor: T.shadow, shadowOpacity: 1, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } }, android: { elevation: 2 } }),
  },
  wardCardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  wardCardId: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  wardBed: { fontSize: 11, fontWeight: '700', color: T.blue700 },
  wardPid: { fontSize: 11, color: T.textMuted },
  wardName: { fontSize: 16, fontWeight: '800', color: T.textPrimary, marginBottom: 2 },
  wardAdmit: { fontSize: 11, color: T.textSecondary, marginBottom: 10 },
  cardDivider: { height: 1, backgroundColor: T.divider, marginBottom: 10 },
  wardBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  wardMiniVitals: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, flex: 1 },
  wardMiniVital: { fontSize: 12 },
  wardMiniLabel: { color: T.textMuted, fontSize: 11 },
  wardMiniVal: { color: T.textPrimary, fontWeight: '700', fontSize: 12 },
  wardMiniSep: { color: T.divider, fontSize: 12 },
  wardInsight: { marginTop: 8, fontSize: 11, fontStyle: 'italic' },

  // ── Risk Badge (small) ──
  riskBadge: {
    borderRadius: 8, borderWidth: 1.5,
    paddingHorizontal: 10, paddingVertical: 4,
    flexDirection: 'row', alignItems: 'baseline', gap: 1,
  },
  riskBadgeScore: { fontSize: 18, fontWeight: '900' },
  riskBadgeLabel: { fontSize: 12, fontWeight: '700' },

  // ── Status Pill ──
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: 20, borderWidth: 1,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusPillText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },

  // ── Detail Header ──
  detailHeader: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: T.white, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 10,
    borderBottomWidth: 1, borderBottomColor: T.border,
    ...Platform.select({ ios: { shadowColor: T.shadow, shadowOpacity: 1, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } }, android: { elevation: 3 } }),
  },
  backBtn: { padding: 8, backgroundColor: T.blue50, borderRadius: 8, borderWidth: 1, borderColor: T.blue100 },
  detailName: { fontSize: 15, fontWeight: '800', color: T.textPrimary },
  detailMeta: { fontSize: 10, color: T.textMuted, marginTop: 1 },
  downloadBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: T.blue50, paddingHorizontal: 8, paddingVertical: 6,
    borderRadius: 6, borderWidth: 1, borderColor: T.blue100, marginRight: 8
  },
  downloadBtnText: { fontSize: 11, fontWeight: '700', color: T.blue700 },

  // ── Critical Banner ──
  critBanner: {
    flexDirection: 'row', alignItems: 'center',
    margin: 10, padding: 12, borderRadius: 8, borderWidth: 1,
  },
  critBannerTitle: { fontSize: 12, fontWeight: '800' },
  critBannerBody: { fontSize: 11, marginTop: 1 },
  critBannerBtn: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 6 },
  critBannerBtnText: { color: T.textWhite, fontSize: 11, fontWeight: '700' },

  // ── Tab Bar ──
  tabBar: {
    flexDirection: 'row', backgroundColor: T.white,
    borderBottomWidth: 1, borderBottomColor: T.border,
  },
  tabItem: { flex: 1, paddingVertical: 11, alignItems: 'center' },
  tabItemActive: { borderBottomWidth: 2, borderBottomColor: T.blue600 },
  tabLabel: { fontSize: 11, fontWeight: '600', color: T.textMuted },
  tabLabelActive: { color: T.blue700, fontWeight: '800' },

  detailScroll: { padding: 12, gap: 12 },

  // ── Card ──
  card: {
    backgroundColor: T.white, borderRadius: 10, padding: 16,
    borderWidth: 1, borderColor: T.border,
    ...Platform.select({ ios: { shadowColor: T.shadow, shadowOpacity: 1, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } }, android: { elevation: 2 } }),
    gap: 12,
  },
  cardTitle: { fontSize: 14, fontWeight: '800', color: T.textPrimary },
  cardSubtitle: { fontSize: 11, color: T.textMuted },

  // ── Section Header ──
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionHeaderText: { fontSize: 12, fontWeight: '800', color: T.blue800, letterSpacing: 0.5, textTransform: 'uppercase' },

  // ── Risk score card internals ──
  riskHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  bigRiskBadge: {
    width: 72, height: 72, borderRadius: 36, borderWidth: 2.5,
    alignItems: 'center', justifyContent: 'center', flexDirection: 'row',
  },
  bigRiskNum: { fontSize: 28, fontWeight: '900' },
  bigRiskPct: { fontSize: 14, fontWeight: '700', alignSelf: 'flex-end', marginBottom: 4 },
  engineSection: { gap: 8 },
  engineRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  engineLabel: { color: T.textMuted, fontSize: 11, width: 54 },
  engineTrack: { flex: 1, height: 6, backgroundColor: T.divider, borderRadius: 3, overflow: 'hidden' },
  engineFill: { height: '100%', borderRadius: 3 },
  engineVal: { color: T.textSecondary, fontSize: 11, fontWeight: '700', width: 36, textAlign: 'right' },
  insightBox: { backgroundColor: T.blue50, borderRadius: 7, padding: 10, borderLeftWidth: 3, borderLeftColor: T.blue400 },
  insightText: { color: T.blue900, fontSize: 12, lineHeight: 18 },

  // ── Vitals Grid ──
  vitalsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  vitalCell: {
    width: (SW - 24 - 32 - 32) / 5,
    backgroundColor: T.offWhite, borderRadius: 8,
    borderWidth: 1, borderColor: T.border,
    padding: 8, alignItems: 'center', gap: 2,
  },
  vitalCellLabel: { fontSize: 8, color: T.textMuted, fontWeight: '700', textAlign: 'center' },
  vitalCellValue: { fontSize: 14, color: T.textPrimary, fontWeight: '900' },
  vitalCellUnit: { fontSize: 8, color: T.textMuted, fontWeight: '600' },

  // ── AI Drivers ──
  driverRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: T.divider },
  driverLeft: { width: 90 },
  driverFeature: { fontSize: 11, fontWeight: '700', color: T.textPrimary },
  driverValue: { fontSize: 9, color: T.textMuted },
  driverTrack: { flex: 1, height: 5, backgroundColor: T.divider, borderRadius: 3, overflow: 'hidden' },
  driverFill: { height: '100%', borderRadius: 3 },
  driverScore: { fontSize: 10, fontWeight: '700', width: 50, textAlign: 'right' },

  // ── Chat / MediAssist ──
  briefBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: T.blue50, borderRadius: 8, padding: 13,
    borderWidth: 1, borderColor: T.blue100,
  },
  briefBtnText: { fontSize: 13, fontWeight: '700', color: T.blue700, flex: 1 },
  briefingBox: { backgroundColor: T.blue50, borderRadius: 10, borderWidth: 1, borderColor: T.blue100, overflow: 'hidden' },
  briefingHeader: { backgroundColor: T.blue100, paddingHorizontal: 12, paddingVertical: 8 },
  briefingHeadLabel: { fontSize: 11, fontWeight: '800', color: T.blue800 },
  briefingBody: { padding: 12, fontSize: 12, color: T.blue900, lineHeight: 20 },
  chip: {
    backgroundColor: T.white, borderRadius: 20, borderWidth: 1,
    borderColor: T.blue100, paddingHorizontal: 12, paddingVertical: 6,
  },
  chipText: { fontSize: 11, color: T.blue700, fontWeight: '600' },
  chatEmpty: { color: T.textMuted, fontSize: 12, textAlign: 'center', paddingVertical: 20 },
  docBubble: {
    alignSelf: 'flex-end', backgroundColor: T.blue600, maxWidth: '80%',
    borderRadius: 12, borderBottomRightRadius: 2, padding: 10, marginBottom: 8,
  },
  docBubbleText: { color: T.textWhite, fontSize: 13 },
  botBubble: {
    alignSelf: 'flex-start', backgroundColor: T.offWhite, maxWidth: '88%',
    borderRadius: 12, borderBottomLeftRadius: 2, padding: 10, marginBottom: 8,
    borderWidth: 1, borderColor: T.border,
  },
  botLabel: { fontSize: 9, fontWeight: '800', color: T.blue600, marginBottom: 4 },
  botBubbleText: { fontSize: 13, color: T.textPrimary, lineHeight: 20 },
  chatInputRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  chatInput: {
    flex: 1, backgroundColor: T.offWhite, borderRadius: 8,
    paddingHorizontal: 12, color: T.textPrimary, height: 44,
    borderWidth: 1, borderColor: T.border, fontSize: 13,
  },
  sendBtn: {
    backgroundColor: T.blue600, width: 44, height: 44,
    borderRadius: 8, justifyContent: 'center', alignItems: 'center',
  },

  // ── Protocol ──
  protocolNote: { fontSize: 11, color: T.textSecondary, lineHeight: 17 },
  progressSection: { gap: 6 },
  progressTrack: { height: 7, backgroundColor: T.divider, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: T.safe, borderRadius: 4 },
  progressLabel: { fontSize: 11, color: T.textSecondary, fontWeight: '600' },
  checkRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: T.divider,
  },
  checkText: { fontSize: 13, fontWeight: '600', color: T.textPrimary, lineHeight: 20 },
  checkDone: { textDecorationLine: 'line-through', color: T.textMuted },
  medTag: { fontSize: 10, color: T.high, marginTop: 2, fontWeight: '600' },
  medTagDone: { fontSize: 10, color: T.safe, marginTop: 2, fontWeight: '600' },
  completedBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: T.safeBg, borderRadius: 8, padding: 12,
    borderWidth: 1, borderColor: T.safeBdr, marginTop: 4,
  },
  completedText: { fontSize: 12, color: T.safe, fontWeight: '700', flex: 1 },

  // ── Inventory ──
  reserveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: T.blue600, borderRadius: 8, padding: 14,
  },
  reserveBtnText: { color: T.textWhite, fontWeight: '800', fontSize: 13 },
  reservedNote: {
    backgroundColor: T.safeBg, borderRadius: 7, padding: 10,
    borderWidth: 1, borderColor: T.safeBdr,
  },
  reservedNoteText: { fontSize: 12, color: T.safe, fontWeight: '600' },
  stockRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: T.divider },
  stockName: { fontSize: 12, color: T.textPrimary, fontWeight: '600', flex: 1 },
  stockBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  stockQty: { fontSize: 11, fontWeight: '700' },
});
