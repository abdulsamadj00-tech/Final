import { GoogleGenAI, Type } from "@google/genai";
import { PatientData, Diagnosis, Encounter, AIRecommendation, ProgressNote, VitalsRecord, MedicationSuggestion } from '../types';

const diagnosisSchema = {
    type: Type.OBJECT,
    properties: {
        diagnosisName: { type: Type.STRING, description: "Name of the medical condition" },
        icdCode: { type: Type.STRING, description: "The most likely ICD-10 or ICD-11 code for the diagnosis." },
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
                guidelines: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of supporting clinical guidelines, e.g., 'IDSA/ATS Guidelines 2019'." },
            },
        },
        morbidity: { type: Type.STRING, description: "A brief description of the potential morbidity, including percentages or common statistics." },
        mortality: { type: Type.STRING, description: "A brief description of the mortality rate or risk, including percentages or common statistics (e.g., '5-year mortality rate is 10-15%')." },
    },
    required: ["diagnosisName", "icdCode", "probability", "supportingEvidence", "contradictingEvidence", "recommendedTests", "treatmentSuggestions", "morbidity", "mortality"]
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

const medicationSuggestionSchema = {
    type: Type.OBJECT,
    properties: {
        drugName: { type: Type.STRING, description: "The generic name of the medication." },
        dosage: { type: Type.STRING, description: "A typical starting dosage and frequency, e.g., '500 mg twice daily'." },
        rationale: { type: Type.STRING, description: "A brief clinical rationale for using this medication for the given diagnosis." },
        line: { type: Type.STRING, enum: ['First-line', 'Second-line', 'Supportive'], description: "The line of therapy." },
        guideline: { type: Type.STRING, description: "The name and year of the clinical guideline supporting this recommendation, e.g., 'IDSA Guidelines 2021'." }
    },
    required: ["drugName", "dosage", "rationale", "line", "guideline"]
};

const medicationResponseSchema = {
    type: Type.OBJECT,
    properties: {
        medications: {
            type: Type.ARRAY,
            items: medicationSuggestionSchema
        }
    },
    required: ["medications"]
};

const getAiClient = () => {
    const API_KEY = process.env.API_KEY;
    if (!API_KEY) {
        throw new Error("API_KEY environment variable not set. Application cannot connect to the AI service.");
    }
    return new GoogleGenAI({ apiKey: API_KEY });
};

export const generateDiagnoses = async (patientData: PatientData, tempUnit: 'C' | 'F'): Promise<Diagnosis[]> => {
    const ai = getAiClient();

    const investigationsSummary = Object.entries(patientData.investigations)
        .map(([key, value]) => `- ${key}: ${value}`)
        .join('\n');

    const prompt = `
        You are an expert medical AI assistant, "MediDx Assistant". Your purpose is to help clinicians by generating a differential diagnosis based on patient data.

        **Input Data:**
        - Age: ${patientData.age}
        - Sex: ${patientData.sex}
        - Vital Signs:
            - Temperature: ${patientData.vitals.temp ? `${patientData.vitals.temp} °${tempUnit}` : 'N/A'}
            - Heart Rate: ${patientData.vitals.hr || 'N/A'} bpm
            - Respiratory Rate: ${patientData.vitals.rr || 'N/A'} breaths/min
            - Blood Pressure: ${patientData.vitals.bp || 'N/A'} mmHg
            - SpO2: ${patientData.vitals.spo2 || 'N/A'}%
        - Primary Complaint: ${patientData.primaryComplaint}
        - History of Present Illness: ${patientData.hopi}
        - Examination Findings: ${patientData.findings}
        - Past Medical History: ${patientData.pmh || 'N/A'}
        - Past Surgical History: ${patientData.psh || 'N/A'}
        - Personal/Social History: ${patientData.socialHistory || 'N/A'}
        - Allergies: ${patientData.allergies || 'N/A'}
        - Investigations:
        ${investigationsSummary || 'N/A'}

        **Task:**
        Analyze the provided patient data and generate a ranked list of the top 3-5 most likely differential diagnoses. 
        For each diagnosis, provide the required information in the specified JSON format, including a likely ICD-10/11 code.
        The probabilities are estimations for clinical support, not definitive.
        For treatment suggestions, you MUST cite the source guidelines (e.g., name and year). Prioritize recent, authoritative international guidelines.
        Do not provide a final diagnosis. Frame all information as suggestions for a qualified medical professional.

        **Output Format:**
        You MUST respond with ONLY a valid JSON object matching the provided schema. Do not include any text or markdown outside of the JSON.
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
        
        const jsonText = response.text.trim();

        if (!jsonText) {
            throw new Error("Received an empty response from the AI.");
        }

        const result = JSON.parse(jsonText);

        if (result && result.diagnoses) {
            return result.diagnoses.sort((a: Diagnosis, b: Diagnosis) => b.probability - a.probability);
        } else {
            throw new Error("Invalid response format from AI.");
        }

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error("Failed to communicate with the AI service.");
    }
};


export const generateProgressSummary = async (progressNotes: ProgressNote[], vitalsHistory: VitalsRecord[]): Promise<string> => {
    if (progressNotes.length === 0 && vitalsHistory.length === 0) {
        return "No progress data available to summarize.";
    }
    const ai = getAiClient();
    // In a real app, you would send summarized data to the AI. For this demo, we'll simulate it.
    // This is a placeholder. A full implementation would involve a proper prompt and Gemini call.
    await new Promise(res => setTimeout(res, 1500)); // Simulate network delay
    
    const lastNote = progressNotes[0]?.note || "No recent notes.";
    const improvementKeywords = ['better', 'improving', 'stable', 'recovering'];
    const deteriorationKeywords = ['worse', 'deteriorating', 'declining'];

    if (improvementKeywords.some(kw => lastNote.toLowerCase().includes(kw))) {
        return "Patient is showing signs of clinical improvement. Vitals are stabilizing, and subjective complaints are reducing.";
    }
    if (deteriorationKeywords.some(kw => lastNote.toLowerCase().includes(kw))) {
        return "Patient's condition appears to be deteriorating, with worsening symptoms noted in the latest entry.";
    }
    return "Patient remains clinically stable with no significant changes noted in the recent period.";
};


export const generateAIRecommendations = async (encounter: Encounter): Promise<AIRecommendation[]> => {
    // This is a placeholder for a complex AI call.
    // In a real scenario, you'd summarize the encounter and send it to Gemini Pro.
    await new Promise(res => setTimeout(res, 2000));

    const recommendations: AIRecommendation[] = [];

    // Example logic
    if (encounter.provisionalDiagnoses.some(d => d.diagnosisName.toLowerCase().includes('pneumonia'))) {
        recommendations.push({
            id: `rec-${Date.now()}`,
            timestamp: Date.now(),
            causeAnalysis: "Patient's persistent fever despite 48 hours of broad-spectrum antibiotics may indicate resistant organisms or a non-infectious inflammatory process.",
            recommendation: "Consider obtaining sputum cultures and a procalcitonin level. A switch to guideline-directed therapy based on local antibiogram is advised if no improvement.",
            severity: 'Significant Review Needed',
        });
    }

    if (encounter.vitalsHistory.length > 2) {
        const lastTwoVitals = encounter.vitalsHistory.slice(0, 2);
        const lastBp = parseInt(lastTwoVitals[0].bp.split('/')[0]);
        const prevBp = parseInt(lastTwoVitals[1].bp.split('/')[0]);
        if (lastBp > prevBp + 15) {
            recommendations.push({
                id: `rec-${Date.now() + 1}`,
                timestamp: Date.now(),
                causeAnalysis: "A rising trend in systolic blood pressure is noted over the last two readings, which could be related to pain, anxiety, or suboptimal antihypertensive efficacy.",
                recommendation: "Re-check BP in 30 minutes. Assess patient's pain level and comfort. Review current antihypertensive regimen for potential dose adjustment.",
                severity: 'Mild Adjustment',
            });
        }
    }
    
     if (recommendations.length === 0) {
          recommendations.push({
            id: `rec-${Date.now()}`,
            timestamp: Date.now(),
            causeAnalysis: "The current treatment plan appears to be effective, with positive trends in both clinical notes and vital signs.",
            recommendation: "Continue current management. Monitor for any changes.",
            severity: 'Mild Adjustment',
        });
    }

    return recommendations;
};


export const generatePersonalizedInsights = async (encounters: Encounter[]): Promise<string> => {
    const ai = getAiClient();
    
    const summarizedEncounters = encounters.map(e => ({
        diagnoses: (e.finalDiagnosis ? [e.finalDiagnosis.diagnosisName] : e.provisionalDiagnoses.map(d => d.diagnosisName)),
        primaryComplaint: e.patientData.primaryComplaint.slice(0, 150) + '...', // Truncate
        age: e.patientData.age,
        sex: e.patientData.sex,
    }));

    const prompt = `
        You are an AI analytics engine for a clinical support app called "MediDx Assistant".
        Analyze the following anonymized clinical encounter data for a single clinician user and generate a private, personalized insights report.
        The report should be encouraging, insightful, and help the user understand their practice patterns.
        The data represents the last ${encounters.length} encounters.

        **Encounter Data (Summarized):**
        ${JSON.stringify(summarizedEncounters, null, 2)}

        **Report Generation Requirements:**
        Generate the report in Markdown format. The report MUST include the following sections:

        1.  **### Practice Summary**
            - Identify the top 3-5 most frequent diagnoses the user has encountered.
            - Provide a count for each.

        2.  **### Diagnostic Patterns**
            - Analyze the types of chief complaints and resulting diagnoses. Provide a meaningful insight.

        3.  **### AI Collaboration Insights**
            - Create a positive, encouraging statement about how the user is leveraging the AI.

        Structure the output clearly with Markdown headings for each section. Keep the tone professional, supportive, and data-driven.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            contents: prompt,
        });

        const reportText = response.text.trim();
        if (!reportText) {
            throw new Error("AI did not return any insights text.");
        }
        return reportText;
    } catch (error) {
        console.error("Error generating personalized insights:", error);
        throw new Error("Failed to generate personalized insights.");
    }
};

export const extractTextFromImage = async (base64Data: string, mimeType: string, context: string): Promise<string> => {
    const ai = getAiClient();
    const imagePart = {
        inlineData: {
            data: base64Data,
            mimeType,
        },
    };

    const prompt = `
        You are an expert medical data extraction AI.
        Your task is to analyze the provided image of a medical document and extract the relevant text.
        The context for this image is: "${context}".
        
        Instructions:
        1.  Accurately transcribe all relevant text from the image, including handwritten notes.
        2.  Format the output as clean, readable text. If it's a form or has key-value pairs, try to preserve that structure.
        3.  Do not add any commentary, greetings, or text that is not present in the document.
        4.  Return ONLY the extracted text.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash", // Efficient vision-capable model
            contents: { parts: [{text: prompt}, imagePart] },
        });

        const text = response.text.trim();
        if (!text) {
            throw new Error("AI could not extract any text from the image.");
        }
        return text;
    } catch (error) {
        console.error("Error calling Gemini API for image analysis:", error);
        throw new Error("Failed to communicate with the AI service for image analysis.");
    }
};

// Fix: Added missing analyzeSymptoms function to resolve import error.
export const analyzeSymptoms = async (symptomText: string): Promise<string[]> => {
    const ai = getAiClient();

    const symptomAnalysisSchema = {
        type: Type.OBJECT,
        properties: {
            conditions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "A list of potential medical conditions based on the symptoms."
            },
        },
        required: ["conditions"],
    };

    const prompt = `
        You are an expert medical AI assistant. Your purpose is to help clinicians by suggesting potential conditions based on a patient's symptoms.

        **Symptom Description:**
        ${symptomText}

        **Task:**
        Analyze the provided symptoms and generate a list of 3-5 potential differential diagnoses. This is for informational purposes to aid a qualified medical professional and is not a definitive diagnosis.

        **Output Format:**
        You MUST respond with ONLY a valid JSON object matching the provided schema. Do not include any text or markdown outside of the JSON.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: symptomAnalysisSchema,
            },
        });

        const jsonText = response.text.trim();

        if (!jsonText) {
            throw new Error("Received an empty response from the AI for symptom analysis.");
        }

        const result = JSON.parse(jsonText);

        if (result && Array.isArray(result.conditions)) {
            return result.conditions;
        } else {
            throw new Error("Invalid response format from AI for symptom analysis.");
        }

    } catch (error) {
        console.error("Error calling Gemini API for symptom analysis:", error);
        throw new Error("Failed to communicate with the AI service for symptom analysis.");
    }
};

export const suggestMedications = async (diagnosisName: string): Promise<MedicationSuggestion[]> => {
    const ai = getAiClient();

    const prompt = `
        You are an expert medical AI assistant, "MediDx Assistant". Your purpose is to help clinicians by suggesting evidence-based medication options.

        **Diagnosis:**
        ${diagnosisName}

        **Task:**
        Based on the provided diagnosis, suggest 3-5 common, evidence-based medications.
        For each medication, provide the required information in the specified JSON format.
        You MUST cite a specific, authoritative clinical guideline (e.g., "GOLD 2023 Report", "ACC/AHA 2022 Guidelines") for each suggestion.

        **Output Format:**
        You MUST respond with ONLY a valid JSON object matching the provided schema. Do not include any text or markdown outside of the JSON.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: medicationResponseSchema,
            },
        });

        const jsonText = response.text.trim();

        if (!jsonText) {
            throw new Error("Received an empty response from the AI for medication suggestions.");
        }

        const result = JSON.parse(jsonText);

        if (result && Array.isArray(result.medications)) {
            return result.medications;
        } else {
            throw new Error("Invalid response format from AI for medication suggestions.");
        }
    } catch (error) {
        console.error("Error calling Gemini API for medication suggestions:", error);
        throw new Error("Failed to communicate with the AI service for medication suggestions.");
    }
};
