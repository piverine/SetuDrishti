import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import axios from 'axios';

export default function TrialBridge() {
    const [symptoms, setSymptoms] = useState("Patient is experiencing severe tachycardia with a resting rate of 135 BPM and severe palpitations.");
    const [matches, setMatches] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [scannedFiles, setScannedFiles] = useState(0);

    const searchClinicalTrials = async () => {
        setIsSearching(true);
        setMatches([]);
        try {
            // Replace with your laptop's true IP
            const BACKEND_URL = "http://10.188.53.227:8000";
            
            const response = await axios.post(`${BACKEND_URL}/api/v1/trials/match`, {
                medical_text: symptoms
            });

            setMatches(response.data.matches);
            setScannedFiles(response.data.total_active_trials_scanned);
        } catch (error) {
            console.error("TrialBridge API Error:", error);
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>TrialBridge API</Text>
            <Text style={styles.subtitle}>Semantic NLP Search Engine</Text>

            <View style={styles.inputBox}>
                <Text style={styles.label}>Patient Symptoms / Clinical Notes:</Text>
                <TextInput 
                    style={styles.textInput}
                    multiline
                    value={symptoms}
                    onChangeText={setSymptoms}
                    placeholder="Enter clinical symptoms here..."
                    placeholderTextColor="#666"
                />
            </View>

            <TouchableOpacity 
                style={[styles.button, isSearching ? styles.buttonDisabled : {}]} 
                onPress={searchClinicalTrials} 
                disabled={isSearching}
            >
                {isSearching ? <ActivityIndicator color="#000" /> : <Text style={styles.buttonText}>Search Global Clinical Trials</Text>}
            </TouchableOpacity>

            <View style={styles.resultsContainer}>
                {matches.length > 0 && (
                    <Text style={styles.resultHeader}>✨ Found {matches.length} matches (Scanned {scannedFiles} Databases):</Text>
                )}
                
                {matches.map((trial, index) => (
                    <View key={index} style={styles.matchCard}>
                        <View style={styles.matchHeader}>
                            <Text style={styles.trialId}>{trial.trial_id}</Text>
                            <View style={styles.scoreBadge}>
                                <Text style={styles.scoreText}>{trial.confidence_score}% Match</Text>
                            </View>
                        </View>
                        <Text style={styles.condition}>{trial.condition}</Text>
                        <Text style={styles.reason}>{trial.match_reason}</Text>
                    </View>
                ))}

                {matches.length === 0 && !isSearching && (
                    <Text style={styles.noResults}>No active NLP trial queries run yet.</Text>
                )}
            </View>
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
    title: { fontSize: 24, fontWeight: 'bold', color: '#fff', letterSpacing: 1 },
    subtitle: { fontSize: 14, color: '#00cc99', marginBottom: 20, fontStyle: 'italic' },
    inputBox: { marginBottom: 15 },
    label: { color: '#aaa', marginBottom: 5, fontSize: 14 },
    textInput: {
        backgroundColor: '#111',
        color: '#fff',
        borderWidth: 1,
        borderColor: '#444',
        borderRadius: 8,
        padding: 15,
        minHeight: 100,
        textAlignVertical: 'top',
        fontSize: 16
    },
    button: {
        backgroundColor: '#00cc99',
        paddingVertical: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginBottom: 20
    },
    buttonDisabled: { backgroundColor: '#333' },
    buttonText: { color: '#000', fontSize: 16, fontWeight: 'bold' },
    resultsContainer: { marginTop: 10 },
    resultHeader: { color: '#fff', fontSize: 16, marginBottom: 15, fontWeight: 'bold' },
    matchCard: {
        backgroundColor: '#1a1a1a',
        padding: 15,
        borderRadius: 10,
        borderLeftWidth: 4,
        borderLeftColor: '#007bff',
        marginBottom: 10
    },
    matchHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
    trialId: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    scoreBadge: { backgroundColor: '#00264d', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
    scoreText: { color: '#00cc99', fontWeight: 'bold', fontSize: 12 },
    condition: { color: '#aaa', fontSize: 14, marginVertical: 3 },
    reason: { color: '#666', fontSize: 12, fontStyle: 'italic' },
    noResults: { color: '#555', textAlign: 'center', marginTop: 20, fontStyle: 'italic' }
});
