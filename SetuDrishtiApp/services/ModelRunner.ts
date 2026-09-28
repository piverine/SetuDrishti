import axios from 'axios';

class NidanaModelRunner {
    async loadModel() {
        console.log("Connecting to Cloud Edge node...");
        return true;
    }

    async predict(base64ImageData: string) {
        console.log("Transmitting raw image pixels to the Python backend for real analysis...");
        
        try {
            // Replace with your laptop's true IP (found in your OfflineSync.ts)
            const BACKEND_URL = "http://10.188.53.227:8000";
            
            const response = await axios.post(`${BACKEND_URL}/api/v1/analyze_image`, {
                image_base64: base64ImageData
            });

            console.log("Neural Network results received:", response.data);
            return response.data;
            
        } catch (error) {
            console.error("Failed to reach Python backend:", error);
            throw new Error("Cloud Endpoint Disconnected.");
        }
    }
}

export default new NidanaModelRunner();
