import React, { useState, useRef } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet,
    Animated, TextInput, ActivityIndicator, Alert
} from 'react-native';
import { WebView } from 'react-native-webview';
import axios from 'axios';

const BACKEND_URL = "http://10.188.53.227:8000";

// Animated wave values — created outside component to avoid hooks-in-loop
const createWaves = () => Array.from({ length: 5 }, () => new Animated.Value(10));

// The Web Speech API HTML page injected into a hidden WebView
// This uses Chrome's built-in speech recognition (works on all Android phones)
// KEY: finalTranscript is accumulated INSIDE the WebView to avoid React Native
// double-counting when onresult fires repeatedly in continuous mode.
const SPEECH_HTML = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body>
<script>
  const recog = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recog.lang = 'en-US';
  recog.interimResults = true;
  recog.continuous = true;
  recog.maxAlternatives = 1;

  let finalTranscript = '';

  recog.onstart = () => {
    finalTranscript = '';
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'STATUS', value: 'STARTED' }));
  };
  recog.onend = () => {
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'STATUS', value: 'ENDED' }));
  };
  recog.onerror = (e) => {
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ERROR', value: e.error }));
  };

  recog.onresult = (event) => {
    let currentFinal = '';
    let currentInterim = '';
    
    // Always start from 0 to rebuild the exact 1:1 phrase from the speech engine's memory
    // (Android WebViews have a bug where resultIndex doesn't increment properly, causing loops)
    for (let i = 0; i < event.results.length; i++) {
      const t = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        currentFinal += t + ' ';
      } else {
        currentInterim += t;
      }
    }
    
    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: 'RESULT',
      full: currentFinal.trim(),
      interim: currentInterim.trim()
    }));
  };

  function startListening()  { finalTranscript = ''; try { recog.start(); } catch(e){} }
  function stopListening()   { try { recog.stop();  } catch(e){} }
</script>
</body>
</html>
`;

export default function ToneScore() {
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [interimText, setInterimText] = useState("");
    const [analysis, setAnalysis] = useState<any>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [statusMessage, setStatusMessage] = useState("Microphone Ready");

    const webviewRef = useRef<WebView>(null);
    const wavesRef = useRef<Animated.Value[]>(createWaves());
    const animRef = useRef<Animated.CompositeAnimation | null>(null);
    const waves = wavesRef.current;

    const startWaveAnimation = () => {
        const anim = Animated.loop(
            Animated.stagger(80, waves.map(wave =>
                Animated.sequence([
                    Animated.timing(wave, { toValue: Math.random() * 45 + 15, duration: 220, useNativeDriver: false }),
                    Animated.timing(wave, { toValue: 10, duration: 220, useNativeDriver: false })
                ])
            ))
        );
        animRef.current = anim;
        anim.start();
    };

    const stopWaveAnimation = () => {
        animRef.current?.stop();
        waves.forEach(w => w.setValue(10));
    };

    // Handle messages coming back from the WebView Speech engine
    const onWebViewMessage = (event: any) => {
        try {
            const msg = JSON.parse(event.nativeEvent.data);

            if (msg.type === 'STATUS') {
                if (msg.value === 'STARTED') {
                    setIsRecording(true);
                    setStatusMessage("🎙 Listening...");
                    startWaveAnimation();
                } else if (msg.value === 'ENDED') {
                    setIsRecording(false);
                    setInterimText("");
                    stopWaveAnimation();
                    setStatusMessage("Speech captured. Ready to analyze.");
                }
            }

            if (msg.type === 'RESULT') {
                // WebView owns the full transcript — we just SET it, never append
                if (msg.full !== undefined) {
                    setTranscript(msg.full);
                }
                if (msg.interim) {
                    setInterimText(msg.interim);
                } else {
                    setInterimText("");
                }
            }

            if (msg.type === 'ERROR') {
                setIsRecording(false);
                stopWaveAnimation();
                if (msg.value === 'not-allowed') {
                    setStatusMessage("Mic permission denied");
                    Alert.alert("Permission Required", "Please allow microphone access in your phone's Settings for this app.");
                } else if (msg.value === 'network') {
                    setStatusMessage("Network required for Speech API");
                    Alert.alert("Internet Required", "The Web Speech API requires an active internet connection to process audio. Connect to WiFi and try again.");
                } else {
                    setStatusMessage(`Speech error: ${msg.value}`);
                }
            }
        } catch (e) {
            // ignore parse errors
        }
    };

    const toggleRecording = () => {
        if (isRecording) {
            webviewRef.current?.injectJavaScript('stopListening(); true;');
            setIsRecording(false);
            stopWaveAnimation();
            setStatusMessage("Stopped. Tap Process to analyze.");
        } else {
            setTranscript("");
            setInterimText("");
            setAnalysis(null);
            setStatusMessage("Initializing...");
            webviewRef.current?.injectJavaScript('startListening(); true;');
        }
    };

    const processAudioTriage = async () => {
        const finalText = transcript.trim();
        if (finalText.length < 2) {
            Alert.alert("Empty Input", "Please record speech or type patient dialogue first.");
            return;
        }
        setIsAnalyzing(true);
        setStatusMessage("Running NLP analysis...");
        try {
            const response = await axios.post(`${BACKEND_URL}/api/v1/voice/analyze_tone`, {
                audio_base64: "WEB_SPEECH_API",
                transcribed_text: finalText
            });
            setAnalysis(response.data);
            setStatusMessage("✅ Analysis Complete");
        } catch (error) {
            console.error("ToneScore Error:", error);
            setStatusMessage("⚠ Backend connection failed");
            Alert.alert("Connection Failed", `Make sure the backend is running at:\n${BACKEND_URL}`);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const triageColor = analysis?.triage_color;
    const cardBorderColor =
        triageColor === 'RED' ? '#ff3366' :
        triageColor === 'YELLOW' ? '#ffcc00' : '#00cc99';

    return (
        <View style={styles.container}>
            {/* Hidden WebView — runs the Speech Recognition engine */}
            <WebView
                ref={webviewRef}
                source={{ html: SPEECH_HTML }}
                onMessage={onWebViewMessage}
                mediaPlaybackRequiresUserAction={false}
                allowsInlineMediaPlayback={true}
                style={{ width: 0, height: 0, position: 'absolute' }}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                originWhitelist={['*']}
            />

            <View style={styles.header}>
                <Text style={styles.title}>ToneScore Voice AI</Text>
                <Text style={styles.subtitle}>{statusMessage}</Text>
            </View>

            {/* Waveform */}
            <View style={styles.waveformContainer}>
                {waves.map((wave, index) => (
                    <Animated.View
                        key={index}
                        style={[styles.waveBar, {
                            height: wave,
                            backgroundColor: isRecording ? '#ff3366' : '#444'
                        }]}
                    />
                ))}
            </View>

            {/* Live interim transcription hint */}
            {isRecording && interimText !== "" && (
                <Text style={styles.interimText}>"{interimText}..."</Text>
            )}

            {/* Record Button */}
            <TouchableOpacity
                style={[styles.recordButton, isRecording && styles.recordingActive]}
                onPress={toggleRecording}
                activeOpacity={0.8}
            >
                <Text style={styles.recordText}>
                    {isRecording ? "⏹  Stop Recording" : "🎤  Tap & Speak"}
                </Text>
            </TouchableOpacity>

            {/* Transcription Box */}
            <View style={styles.inputBox}>
                <Text style={styles.label}>Patient Speech Transcription:</Text>
                <TextInput
                    style={styles.textInput}
                    multiline
                    value={transcript}
                    onChangeText={setTranscript}
                    editable={!isRecording}
                    placeholder="Speak — your words appear here in real time..."
                    placeholderTextColor="#555"
                />
            </View>

            {/* Analyze Button */}
            <TouchableOpacity
                style={[styles.analyzeButton,
                    (isAnalyzing || transcript.trim() === "") && styles.analyzeDisabled]}
                onPress={processAudioTriage}
                disabled={isAnalyzing || transcript.trim() === ""}
            >
                {isAnalyzing
                    ? <ActivityIndicator color="#000" />
                    : <Text style={styles.analyzeText}>Process NLP Sentiment Risk</Text>}
            </TouchableOpacity>

            {/* Results Card */}
            {analysis && (
                <View style={[styles.resultsCard, { borderLeftColor: cardBorderColor }]}>
                    <Text style={[styles.resultTitle, { color: cardBorderColor }]}>
                        Code {triageColor} — Triage Level
                    </Text>
                    <View style={styles.scoreRow}>
                        <Text style={styles.scoreLabel}>Acoustic Urgency:</Text>
                        <Text style={[styles.scoreValue, { color: cardBorderColor }]}>
                            {analysis.acoustic_urgency_score ?? analysis.urgency_score}%
                        </Text>
                    </View>
                    {analysis.detected_emotions && (
                        <Text style={styles.emotions}>
                            Detected: {analysis.detected_emotions.join(", ")}
                        </Text>
                    )}
                    <Text style={styles.recommendation}>{analysis.recommendation}</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#0a0a0a', padding: 20, borderRadius: 15,
        marginHorizontal: 15, borderWidth: 1, borderColor: '#2a2a2a'
    },
    header: { alignItems: 'center', marginBottom: 16 },
    title: { fontSize: 22, fontWeight: 'bold', color: '#fff', letterSpacing: 0.5 },
    subtitle: { fontSize: 13, color: '#ff3366', fontStyle: 'italic', marginTop: 4 },
    waveformContainer: {
        flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
        height: 80, marginBottom: 12, gap: 6
    },
    waveBar: { width: 9, borderRadius: 5 },
    interimText: {
        color: '#666', fontStyle: 'italic', textAlign: 'center',
        fontSize: 13, marginBottom: 12, paddingHorizontal: 10
    },
    recordButton: {
        backgroundColor: '#1a1a1a', borderWidth: 2, borderColor: '#444',
        paddingVertical: 16, borderRadius: 30, alignItems: 'center', marginBottom: 18
    },
    recordingActive: { borderColor: '#ff3366', backgroundColor: '#1a0008' },
    recordText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
    inputBox: { marginBottom: 15 },
    label: { color: '#777', marginBottom: 6, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.8 },
    textInput: {
        backgroundColor: '#111', color: '#ddd', borderWidth: 1, borderColor: '#333',
        borderRadius: 10, padding: 14, minHeight: 90,
        textAlignVertical: 'top', fontSize: 14, lineHeight: 22
    },
    analyzeButton: {
        backgroundColor: '#00cc99', paddingVertical: 16,
        borderRadius: 12, alignItems: 'center', marginBottom: 10
    },
    analyzeDisabled: { backgroundColor: '#1f3330' },
    analyzeText: { color: '#000', fontWeight: 'bold', fontSize: 15 },
    resultsCard: {
        marginTop: 15, padding: 16, backgroundColor: '#0f0f0f',
        borderLeftWidth: 4, borderRadius: 10
    },
    resultTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
    scoreRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    scoreLabel: { color: '#888', fontSize: 14 },
    scoreValue: { fontSize: 20, fontWeight: 'bold' },
    emotions: { color: '#777', fontStyle: 'italic', marginBottom: 10, fontSize: 13 },
    recommendation: { color: '#eee', fontWeight: '600', fontSize: 14, lineHeight: 21 }
});
