import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import OfflineSyncService from '../services/OfflineSync';

export default function PulseWatch() {
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [heartRate, setHeartRate] = useState('--');
    const [spo2, setSpo2] = useState('--');
    const [status, setStatus] = useState('Disconnected');
    
    // Glowing pulse animation value
    const pulseAnim = useRef(new Animated.Value(1)).current;

    // Simulate Bluetooth Handshake
    const connectDevice = () => {
        setIsConnecting(true);
        setStatus("Scanning for BLE Medical Devices...");
        
        setTimeout(() => {
            setStatus("Pairing with Omni-Oximeter_V2...");
            setTimeout(() => {
                setIsConnecting(false);
                setIsConnected(true);
                setStatus("Connected securely.");
                setHeartRate('72');
                setSpo2('98');
                startPulseAnimation();
            }, 1500);
        }, 1500);
    };

    const startPulseAnimation = () => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.2, duration: 200, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 400, useNativeDriver: true })
            ])
        ).start();
    };

    // Vitals Simulation Loop
    useEffect(() => {
        let interval: any;
        if (isConnected) {
            interval = setInterval(() => {
                setHeartRate(prev => {
                    const num = parseInt(prev);
                    // Fluctuate HR by giving a random step between -2 to +2
                    const newHr = num + (Math.floor(Math.random() * 5) - 2);
                    return newHr.toString();
                });
                
                setSpo2(prev => {
                    const num = parseInt(prev);
                    // Slightly fluctuate SpO2 (usually stays 97-99)
                    if (num < 90) return prev; // If already dropped, keep it low!
                    const newSpo2 = (Math.random() > 0.8) ? (num === 99 ? 98 : num + 1) : num;
                    return newSpo2.toString();
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isConnected]);

    // Triggers a simulated medical crash to test the AI sync module
    const triggerCrisis = () => {
        if (!isConnected) return;
        setStatus("⚠️ VITALS CRASH DETECTED ⚠️");
        setHeartRate('145'); // Tachycardia
        setSpo2('86'); // Hypoxia
        
        // Immediately sync the extreme anomaly payload to the FastAPI backend!
        OfflineSyncService.syncPatientData("CRISIS_PATIENT_01", "CRITICAL: Hypoxia and Tachycardia sequence detected via PulseWatch edge device.", 0.95);
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>PulseWatch Monitor</Text>
                <Text style={[styles.status, isConnected ? styles.textSuccess : styles.textWait]}>{status}</Text>
            </View>

            <View style={styles.monitorRing}>
                <Animated.View style={[styles.pulseCircle, { transform: [{ scale: pulseAnim }] }]} />
                <View style={styles.vitalRow}>
                    <Text style={styles.vitalLabel}>Heart Rate</Text>
                    <Text style={[styles.vitalValue, parseInt(heartRate) > 100 ? styles.textDanger : {}]}>{heartRate} <Text style={styles.unit}>BPM</Text></Text>
                </View>
                <View style={styles.vitalRow}>
                    <Text style={styles.vitalLabel}>Blood O2</Text>
                    <Text style={[styles.vitalValue, parseInt(spo2) < 95 ? styles.textDanger : {}]}>{spo2} <Text style={styles.unit}>%</Text></Text>
                </View>
            </View>

            {!isConnected ? (
                <TouchableOpacity 
                    style={[styles.button, isConnecting ? styles.buttonDisabled : {}]} 
                    onPress={connectDevice} 
                    disabled={isConnecting}
                >
                    <Text style={styles.buttonText}>{isConnecting ? "Connecting..." : "Connect BLE Sensor"}</Text>
                </TouchableOpacity>
            ) : (
                <TouchableOpacity style={[styles.button, styles.buttonDanger]} onPress={triggerCrisis}>
                    <Text style={styles.buttonText}>Simulate Patient Crash</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#0a0a0a',
        padding: 20,
        borderRadius: 15,
        margin: 15,
        borderWidth: 1,
        borderColor: '#333'
    },
    header: {
        marginBottom: 20,
        alignItems: 'center'
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        letterSpacing: 1
    },
    status: {
        fontSize: 14,
        marginTop: 5,
        fontStyle: 'italic'
    },
    textWait: { color: '#888' },
    textSuccess: { color: '#00ffcc' },
    textDanger: { color: '#ff3366' },
    monitorRing: {
        borderColor: '#222',
        borderWidth: 3,
        borderRadius: 150,
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 30,
        position: 'relative'
    },
    pulseCircle: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        borderRadius: 150,
        backgroundColor: 'rgba(0, 255, 204, 0.05)',
    },
    vitalRow: {
        alignItems: 'center',
        marginVertical: 10
    },
    vitalLabel: {
        color: '#aaa',
        fontSize: 16,
        textTransform: 'uppercase',
        letterSpacing: 2
    },
    vitalValue: {
        color: '#fff',
        fontSize: 48,
        fontWeight: 'bold'
    },
    unit: {
        fontSize: 18,
        color: '#666'
    },
    button: {
        backgroundColor: '#00cc99',
        paddingVertical: 15,
        borderRadius: 10,
        alignItems: 'center'
    },
    buttonDisabled: {
        backgroundColor: '#333'
    },
    buttonDanger: {
        backgroundColor: '#cc0000'
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold'
    }
});
