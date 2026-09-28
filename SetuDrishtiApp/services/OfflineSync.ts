import axios from 'axios';

// IMPORTANT: Replace this with your computer's actual local IP address on your Wi-Fi network.
// If you use 'localhost' or '127.0.0.1', the phone will try to connect to ITSELF, not your laptop!
// For Android Emulator, you can use '10.0.2.2'.
const BACKEND_URL = "http://10.188.53.227:8000";

class OfflineSyncService {

    async syncPatientData(patientId: string, clinicalNotes: string, vitalsScore: number) {
        try {
            console.log(`Attempting to sync data for Patient ${patientId}...`);

            const payload = {
                patient_id: patientId,
                clinical_notes: clinicalNotes,
                vitals_drift_score: vitalsScore
            };

            // Send the data to your FastAPI backend
            const response = await axios.post(`${BACKEND_URL}/api/v1/sync`, payload);

            console.log("Sync Successful!", response.data);
            return response.data;

        } catch (error) {
            console.error("Sync Failed! Device might be offline.", error);
            // In a full offline-first app, you would save this to SQLite here to try again later
            throw error;
        }
    }
}

export default new OfflineSyncService();
