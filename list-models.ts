
import { GoogleGenAI } from "@google/genai";

const apiKey = "AIzaSyAWumVg44rqCVAyrhb_vI049pc4iqXtl9Y";
const ai = new GoogleGenAI({ apiKey });

async function listModels() {
    try {
        const result = await ai.models.list();
        console.log("Resultado de listModels:", JSON.stringify(result, null, 2));
    } catch (error) {
        console.error("Error listando modelos:", error);
    }
}

listModels();
