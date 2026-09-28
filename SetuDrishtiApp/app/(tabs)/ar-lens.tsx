import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { ArrowLeft, Zap, HeartPulse, Activity } from 'lucide-react-native';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Patient {
  patient_id: string;
  bed_number: string;
  alert_level: string;
  combined_risk_score: number;
  top_risk_driver: string;
  vitals: {
    HR?: number;
    MAP?: number;
    [key: string]: number | undefined;
  };
}

export default function ARLensScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [hologramData, setHologramData] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(false);
  const BACKEND_URL = "http://10.188.53.227:8000";

  if (!permission) return <View style={S.container} />;

  if (!permission.granted) {
    return (
      <View style={S.centered}>
        <Text style={S.text}>We need your permission to show the AR Lens</Text>
        <TouchableOpacity style={S.btn} onPress={requestPermission}>
          <Text style={S.btnText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    if (scanned) return;
    setScanned(true);
    setLoading(true);

    try {
      // In a real hospital, the QR code encodes the Patient ID.
      // For this hackathon AR demo, we'll fetch the most critical patient or PT-6931
      const res = await fetch(`${BACKEND_URL}/api/v1/patients`);
      const patients: Patient[] = await res.json();

      const targetPatient = patients.find((p: Patient) => p.patient_id === data) || patients[0];
      setHologramData(targetPatient ?? null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={S.container}>
      <CameraView 
        style={S.camera} 
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
      >
        <View style={S.overlay}>
          {/* Header */}
          <View style={S.header}>
            <TouchableOpacity onPress={() => router.back()} style={S.backBtn}>
              <ArrowLeft color="#fff" size={24} />
            </TouchableOpacity>
            <Text style={S.title}>AR Lens Mode</Text>
          </View>

          {/* AR Target Reticle */}
          {!scanned && (
            <View style={S.reticleContainer}>
              <View style={S.reticle} />
              <Text style={S.scanText}>Scan Bed QR Code</Text>
            </View>
          )}

          {/* Holographic UI Overlay */}
          {loading && (
            <View style={S.holoLoading}>
              <ActivityIndicator size="large" color="#0ff" />
              <Text style={S.holoLoadingText}>Establishing Matrix Link...</Text>
            </View>
          )}

          {scanned && hologramData && (
            <View style={S.hologramCard}>
              <View style={S.holoHeader}>
                <Text style={S.holoPid}>{hologramData.patient_id} · BED {hologramData.bed_number}</Text>
                <Text style={S.holoLevel}>{hologramData.alert_level}</Text>
              </View>
              
              <Text style={S.holoRisk}>{hologramData.combined_risk_score}<Text style={S.holoRiskPct}>% RISK</Text></Text>
              
              <View style={S.holoVitalsGrid}>
                <View style={S.holoVital}>
                  <HeartPulse color="#ff4444" size={16} />
                  <Text style={S.holoVitalVal}>{hologramData.vitals?.HR?.toFixed(0) || '--'} HR</Text>
                </View>
                <View style={S.holoVital}>
                  <Activity color="#44ff44" size={16} />
                  <Text style={S.holoVitalVal}>{hologramData.vitals?.MAP?.toFixed(0) || '--'} MAP</Text>
                </View>
              </View>

              <View style={S.holoDriverBox}>
                <Zap color="#a855f7" size={14} />
                <Text style={S.holoDriverText}>{hologramData.top_risk_driver}</Text>
              </View>

              <TouchableOpacity 
                style={S.rescanBtn} 
                onPress={() => { setScanned(false); setHologramData(null); }}
              >
                <Text style={S.rescanText}>Scan Another Bed</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </CameraView>
    </View>
  );
}

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0b1220' },
  text: { color: '#fff', fontSize: 16, marginBottom: 20 },
  btn: { backgroundColor: '#22d3ee', padding: 12, borderRadius: 8 },
  btnText: { color: '#000', fontWeight: 'bold' },
  camera: { flex: 1 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 50, paddingHorizontal: 20 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  title: { color: '#0ff', fontSize: 20, fontWeight: '900', letterSpacing: 2, marginLeft: 15, textShadowColor: '#0ff', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 10 },
  reticleContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  reticle: { width: 250, height: 250, borderWidth: 2, borderColor: '#0ff', borderRadius: 20, borderStyle: 'dashed' },
  scanText: { color: '#0ff', marginTop: 20, fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
  holoLoading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  holoLoadingText: { color: '#0ff', marginTop: 10, fontFamily: 'monospace' },
  hologramCard: {
    position: 'absolute',
    top: '30%',
    left: 20,
    right: 20,
    backgroundColor: 'rgba(10, 20, 35, 0.85)',
    borderWidth: 2,
    borderColor: '#0ff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#0ff',
    shadowOpacity: 0.8,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 }
  },
  holoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  holoPid: { color: '#fff', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
  holoLevel: { color: '#f00', fontSize: 12, fontWeight: '900', borderWidth: 1, borderColor: '#f00', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  holoRisk: { color: '#0ff', fontSize: 48, fontWeight: '900', marginBottom: 15, textAlign: 'center' },
  holoRiskPct: { fontSize: 20, color: '#fff' },
  holoVitalsGrid: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 15 },
  holoVital: { alignItems: 'center' },
  holoVitalVal: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginTop: 5 },
  holoDriverBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(168,85,247,0.2)', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#a855f7' },
  holoDriverText: { color: '#e9d5ff', marginLeft: 10, fontSize: 12, fontWeight: 'bold', flex: 1 },
  rescanBtn: { marginTop: 20, backgroundColor: 'rgba(0, 255, 255, 0.2)', borderWidth: 1, borderColor: '#0ff', padding: 12, borderRadius: 8, alignItems: 'center' },
  rescanText: { color: '#0ff', fontWeight: 'bold', letterSpacing: 1 }
});
