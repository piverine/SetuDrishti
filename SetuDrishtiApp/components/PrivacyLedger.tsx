import React, { useState } from 'react';
import { View, Text, StyleSheet, Button, Switch, Alert } from 'react-native';

export default function PrivacyLedger() {
    const [dataSharing, setDataSharing] = useState(true);
    const [trialConsent, setTrialConsent] = useState(false);

    const toggleDataSharing = () => setDataSharing(previousState => !previousState);
    const toggleTrialConsent = () => setTrialConsent(previousState => !previousState);

    const handleExport = () => {
        Alert.alert("Export Medical Passport", "Your encrypted health data and consent logs have been exported. Scan QR for transit.");
    };

    const handleRevoke = () => {
        Alert.alert("Revoke Consent", "Are you sure you want to delete your data from the federated edge network?", [
            { text: "Cancel", style: "cancel" },
            { text: "Revoke Everything", style: "destructive", onPress: () => setDataSharing(false) }
        ]);
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Data Privacy Ledger</Text>
                <Text style={styles.subtitle}>Manage your Edge AI Consent</Text>
            </View>

            <View style={styles.consentItem}>
                <View style={styles.consentTextContainer}>
                    <Text style={styles.consentTitle}>Edge-to-Cloud Analytics</Text>
                    <Text style={styles.consentDesc}>Allow AI triage data to sync with healthcare backend</Text>
                </View>
                <Switch
                    trackColor={{ false: "#767577", true: "#00cc99" }}
                    thumbColor={dataSharing ? "#ffffff" : "#f4f3f4"}
                    onValueChange={toggleDataSharing}
                    value={dataSharing}
                />
            </View>

            <View style={styles.consentItem}>
                <View style={styles.consentTextContainer}>
                    <Text style={styles.consentTitle}>Clinical Trial Search (TrialBridge)</Text>
                    <Text style={styles.consentDesc}>Allow matching symptoms with active clinical trials</Text>
                </View>
                <Switch
                    trackColor={{ false: "#767577", true: "#00cc99" }}
                    thumbColor={trialConsent ? "#ffffff" : "#f4f3f4"}
                    onValueChange={toggleTrialConsent}
                    value={trialConsent}
                />
            </View>

            <View style={styles.actions}>
                <View style={styles.buttonWrapper}>
                    <Button title="QR Export Medical Data" onPress={handleExport} color="#007bff" />
                </View>
                <View style={styles.buttonWrapper}>
                    <Button title="Revoke All Consent" onPress={handleRevoke} color="#ff3366" />
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { backgroundColor: '#111', padding: 20, borderRadius: 15, marginHorizontal: 15, borderWidth: 1, borderColor: '#333' },
    header: { marginBottom: 20, alignItems: 'center' },
    title: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
    subtitle: { fontSize: 13, color: '#00cc99', marginTop: 5 },
    consentItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#222', padding: 15, borderRadius: 10, marginBottom: 15 },
    consentTextContainer: { flex: 1, paddingRight: 10 },
    consentTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    consentDesc: { color: '#aaa', fontSize: 12, marginTop: 4 },
    actions: { marginTop: 10 },
    buttonWrapper: { marginBottom: 10 }
});
