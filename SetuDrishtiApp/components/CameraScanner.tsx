import React, { useState, useRef } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import NidanaModelRunner from '../services/ModelRunner';

export default function CameraScanner() {
    const [permission, requestPermission] = useCameraPermissions();
    const [status, setStatus] = useState("Waiting for image...");
    const cameraRef = useRef<CameraView>(null);

    if (!permission) return <View />;
    if (!permission.granted) {
        return (
            <View style={styles.container}>
                <Text>We need your permission to show the camera</Text>
                <Button onPress={requestPermission} title="grant permission" />
            </View>
        );
    }

    const takePictureAndAnalyze = async () => {
        if (cameraRef.current) {
            setStatus("Capturing...");
            const photo = await cameraRef.current.takePictureAsync({ base64: true });

            setStatus("Resizing for AI...");
            // Resize to 224x224 for MobileNetV3
            const manipulated = await ImageManipulator.manipulateAsync(
                photo!.uri,
                [{ resize: { width: 224, height: 224 } }],
                { format: ImageManipulator.SaveFormat.JPEG, base64: true }
            );

            setStatus("Analyzing via Secure Edge Cloud...");
            try {
                // Safely extract the base64 string and transmit it!
                if (!manipulated.base64) throw new Error("Image conversion failed");
                const results = await NidanaModelRunner.predict(manipulated.base64);
                
                setStatus(`Diagnosis: ${results.diagnosis}\nConfidence: ${results.confidence_score}\nUrgency: ${results.urgency_level}`);
            } catch (e) {
                setStatus("Error reaching AI model.");
                console.error(e);
            }
        }
    };

    return (
        <View style={styles.container}>
            <CameraView style={styles.camera} ref={cameraRef} facing="back" />
            <View style={[styles.overlay, { position: 'absolute', bottom: 0, left: 0, right: 0 }]}>
                <Text style={styles.statusText}>{status}</Text>
                <Button title="Scan Skin Lesion" onPress={takePictureAndAnalyze} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center' },
    camera: { flex: 1 },
    overlay: { flex: 1, justifyContent: 'flex-end', padding: 20, backgroundColor: 'rgba(0,0,0,0.3)' },
    statusText: { color: 'white', textAlign: 'center', marginBottom: 10, fontSize: 16 }
});
