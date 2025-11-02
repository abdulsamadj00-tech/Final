import { GoogleGenAI, Type } from "@google/genai";
import { PatientData, Diagnosis } from '../types';

const diagnosisSchema = {
    type: Type.OBJECT,
    properties: {
        diagnosisName: { type: Type.STRING, description: "Name of the medical condition" },
        probability: { type: Type.NUMBER, description: "A score from 0 to 100 representing the likelihood." },
        supportingEvidence: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Key findings from the input that support this diagnosis." },
        contradictingEvidence: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Key findings that argue against this diagnosis." },
        recommendedTests: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Next logical investigations." },
        treatmentSuggestions: {
            type: Type.OBJECT,
            properties: {
                firstLine: { type: Type.ARRAY, items: { type: Type.STRING } },
                secondLine: { type: Type.ARRAY, items: { type: Type.STRING } },
                lifestyle: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
        },
        morbidity: { type: Type.STRING, description: "A brief description of the potential morbidity, including percentages or common statistics." },
        mortality: { type: Type.STRING, description: "A brief description of the mortality rate or risk, including percentages or common statistics (e.g., '5-year mortality rate is 10-15%')." },
    },
    required: ["diagnosisName", "probability", "supportingEvidence", "contradictingEvidence", "recommendedTests", "treatmentSuggestions", "morbidity", "mortality"]
};

const fullSchema = {
    type: Type.OBJECT,
    properties: {
        diagnoses: {
            type: Type.ARRAY,
            items: diagnosisSchema,
        },
    },
    required: ["diagnoses"],
};

export const generateDiagnoses = async (patientData: PatientData): Promise<Diagnosis[]> => {
    const API_KEY = process.env.API_KEY;

    if (!API_KEY) {
        throw new Error("API_KEY environment variable not set. Application cannot connect to the AI service.");
    }
    
    const ai = new GoogleGenAI({ apiKey: API_KEY });

    const prompt = `
        You are an expert medical AI assistant, "MediDx Assistant". Your purpose is to help clinicians and medical students by generating a differential diagnosis based on patient data. You must adhere to strict safety protocols.

        **Input Data:**
        - Age: ${patientData.age}
        - Sex: ${patientData.sex}
        - Vital Signs:
            - Temperature: ${patientData.vitals.temp || 'N/A'}
            - Heart Rate: ${patientData.vitals.hr || 'N/A'}
            - Respiratory Rate: ${patientData.vitals.rr || 'N/A'}
            - Blood Pressure: ${patientData.vitals.bp || 'N/A'}
            - SpO2: ${patientData.vitals.spo2 || 'N/A'}
        - Symptoms: ${patientData.symptoms}
        - Examination Findings: ${patientData.findings}
        - Lab Results: ${patientData.labs}
        - Imaging: ${patientData.imaging}

        **Task:**
        Analyze the provided patient data and generate a ranked list of the top 3-5 most likely differential diagnoses. 
        For each diagnosis, provide the required information in the specified JSON format.
        The probabilities should be estimations for clinical support and not definitive.
        For morbidity and mortality, provide a brief description including common statistics or percentages (e.g., "5-year mortality rate is approx. 10-15%").
        Do not provide a final diagnosis. Frame all information as suggestions for a qualified medical professional.

        **Output Format:**
        You MUST respond with ONLY a valid JSON object matching the provided schema. Do not include any introductory text, explanations, or markdown formatting outside of the JSON.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: fullSchema,
            },
        });
        
        const jsonText = response.text?.trim();

        if (!jsonText) {
            throw new Error("Received an empty response from the AI.");
        }

        const result = JSON.parse(jsonText);

        if (result && result.diagnoses) {
            // Sort diagnoses by probability in descending order
            return result.diagnoses.sort((a: Diagnosis, b: Diagnosis) => b.probability - a.probability);
        } else {
            throw new Error("Invalid response format from AI.");
        }

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error("Failed to communicate with the AI service.");
    }
};