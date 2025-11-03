
import { GoogleGenAI, Type } from "@google/genai";
import { PatientData, Diagnosis, Encounter } from '../types';

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
                guidelines: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of supporting clinical guidelines, e.g., 'IDSA/ATS Guidelines 2019'." },
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

const getAiClient = () => {
    const API_KEY = process.env.API_KEY;
    if (!API_KEY) {
        throw new Error("API_KEY environment variable not set. Application cannot connect to the AI service.");
    }
    return new GoogleGenAI({ apiKey: API_KEY });
};

export const generateDiagnoses = async (patientData: PatientData, tempUnit: 'C' | 'F'): Promise<Diagnosis[]> => {
    const ai = getAiClient();

    const prompt = `
        You are an expert medical AI assistant, "MediDx Assistant". Your purpose is to help clinicians and medical students by generating a differential diagnosis based on patient data. You must adhere to strict safety protocols.

        **Input Data:**
        - Age: ${patientData.age}
        - Sex: ${patientData.sex}
        - Vital Signs:
            - Temperature: ${patientData.vitals.temp ? `${patientData.vitals.temp} °${tempUnit}` : 'N/A'}
            - Heart Rate: ${patientData.vitals.hr || 'N/A'}
            - Respiratory Rate: ${patientData.vitals.rr || 'N/A'}
            - Blood Pressure: ${patientData.vitals.bp || 'N/A'}
            - SpO2: ${patientData.vitals.spo2 || 'N/A'}
        - Symptoms & Chief Complaint: ${patientData.symptoms}
        - Examination Findings: ${patientData.findings}
        - Past Medical History: ${patientData.pmh || 'N/A'}
        - Past Surgical History: ${patientData.psh || 'N/A'}
        - Personal/Social History: ${patientData.socialHistory || 'N/A'}
        - Allergies: ${patientData.allergies || 'N/A'}
        - Lab Results: ${patientData.labs}
        - Imaging: ${patientData.imaging}

        **Task:**
        Analyze the provided patient data and generate a ranked list of the top 3-5 most likely differential diagnoses. 
        For each diagnosis, provide the required information in the specified JSON format.
        The probabilities should be estimations for clinical support and not definitive.
        For morbidity and mortality, provide a brief description including common statistics or percentages (e.g., "5-year mortality rate is approx. 10-15%").
        For treatment suggestions, you MUST include the source guidelines (e.g., name of the guideline and year) that the suggestions are based on. Prioritize recent and authoritative international guidelines (e.g., WHO, IDSA, AHA, ESC, NICE).
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

export const analyzeLabReportImage = async (base64Data: string, mimeType: string): Promise<string> => {
    const ai = getAiClient();

    const imagePart = {
        inlineData: {
            data: base64Data,
            mimeType: mimeType,
        },
    };

    const textPart = {
        text: `You are an expert clinical pathologist AI. You will be provided with an image of a laboratory report. Your task is to:
        1.  Perform OCR to extract all text from the lab report image with high fidelity.
        2.  Identify the Test Panel (e.g., "Complete Blood Count," "Comprehensive Metabolic Panel").
        3.  For each clinically significant parameter, extract the name, measured value, unit, and reference range.
        4.  Flag any values that are 'Low' or 'High' based on the reference range.
        5.  Generate a one-line clinical summary of the most significant findings (e.g., 'Microcytic anemia with thrombocytosis').
        
        Format the output as a concise, readable string suitable for a clinical notes field. Start with the test panel name in bold. Use bullet points for each parameter. Mark abnormal values clearly.
        Example:
**Complete Blood Count**
- WBC: 12.5 x10^9/L (4.0-11.0) - HIGH
- Hgb: 10.1 g/dL (13.5-17.5) - LOW
- Plt: 450 x10^9/L (150-400) - HIGH
**Summary:** Microcytic anemia with thrombocytosis.
        `,
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, textPart] },
        });

        const resultText = response.text?.trim();
        if (!resultText) {
            throw new Error("AI did not return any text from the image.");
        }
        return resultText;
    } catch (error) {
        console.error("Error analyzing lab report image:", error);
        throw new Error("Failed to analyze the lab report image.");
    }
};

export const analyzeSymptoms = async (symptomText: string): Promise<string[]> => {
    const ai = getAiClient();
    
    const prompt = `
        You are an AI medical assistant. Analyze the following symptom description and provide a list of 3-5 potential underlying medical conditions.
        This is for preliminary informational purposes to help guide further investigation, not for diagnosis.
        Respond with ONLY a comma-separated list of the condition names. Do not use markdown, numbering, or any other formatting.
        Example response: Condition A, Condition B, Condition C

        Symptom description: "${symptomText}"
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });

        const text = response.text?.trim();
        if (!text) {
            return [];
        }
        
        return text.split(',').map(condition => condition.trim());

    } catch (error) {
        console.error("Error calling Gemini API for symptom analysis:", error);
        throw new Error("Failed to communicate with the AI service for symptom analysis.");
    }
};

export const analyzeExamImage = async (base64Data: string, mimeType: string): Promise<string> => {
    const ai = getAiClient();

    const imagePart = {
        inlineData: {
            data: base64Data,
            mimeType: mimeType,
        },
    };

    const textPart = {
        text: `Analyze this clinical image. Your task is to describe the findings in objective, medical terms suitable for a clinical note. Do not provide a diagnosis.
Focus on:
- Morphology: Describe the primary lesion (e.g., macule, papule, vesicle, plaque).
- Distribution: Describe the pattern and location on the body (e.g., central, peripheral, diffuse, localized to extremities).
- Color: Note the color (e.g., erythematous, violaceous, flesh-colored).
- Edema: If present, note its severity (e.g., 1+ pitting to 4+ pitting).
- Other: Note any scale, exudate, warmth, or skin breakdown.`,
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, textPart] },
        });

        const resultText = response.text?.trim();
        if (!resultText) {
            throw new Error("AI did not return any text from the image.");
        }
        return resultText;
    } catch (error) {
        console.error("Error analyzing clinical image:", error);
        throw new Error("Failed to analyze the clinical image.");
    }
};

export const analyzeImagingImage = async (base64Data: string, mimeType: string): Promise<string> => {
    const ai = getAiClient();

    const imagePart = {
        inlineData: {
            data: base64Data,
            mimeType: mimeType,
        },
    };

    const textPart = {
        text: `Analyze the provided medical image. Act as a support tool for a radiologist. Identify and describe key findings for a preliminary report. Do not provide a definitive diagnosis.
If it appears to be a Chest X-Ray, comment on:
- Impression: Provide a general impression (e.g., "No acute cardiopulmonary process," "Findings suggestive of pneumonia").
- Lungs: Comment on opacity (consolidation, nodule), effusion, pneumothorax. State location (e.g., "left lower lobe").
- Cardiomediastinum: Comment on cardiac silhouette size (e.g., "cardiomegaly") and mediastinal contours.
- Bones: Note any fractures or destructive lesions.
- Support Devices: Identify and note the position of lines, tubes, and leads.
If it is another type of study, describe the most salient findings objectively.`,
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: { parts: [imagePart, textPart] },
        });

        const resultText = response.text?.trim();
        if (!resultText) {
            throw new Error("AI did not return any text from the image.");
        }
        return resultText;
    } catch (error) {
        console.error("Error analyzing radiological image:", error);
        throw new Error("Failed to analyze the radiological image.");
    }
};

export const generatePersonalizedInsights = async (encounters: Encounter[]): Promise<string> => {
    const ai = getAiClient();

    // To avoid exceeding token limits, we'll summarize the encounter data.
    const summarizedEncounters = encounters.map(e => ({
        diagnoses: e.diagnoses.map(d => d.diagnosisName),
        chiefComplaint: e.patientData.symptoms.slice(0, 150) + '...', // Truncate
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
            - Example: "In the last ${encounters.length} encounters, your top diagnoses were: Upper Respiratory Infection (15 encounters), Hypertension (10 encounters)..."

        2.  **### Diagnostic Patterns**
            - Analyze the types of chief complaints and resulting diagnoses.
            - Example: "Your diagnostic patterns for patients presenting with chest pain show a consistent and appropriate consideration of both cardiac and non-cardiac causes." OR "For cases with suspected infectious causes, you consistently recommend appropriate first-line investigations."

        3.  **### AI Collaboration Insights**
            - Create a positive, statistic about how the user is leveraging the AI.
            - Example: "The AI-powered image analysis feature has been used in several complex cases, suggesting effective integration of multimodal data into your workflow."

        4.  **### Efficiency Gains**
            - Provide an encouraging metric about efficiency.
            - Example: "Using this tool to structure your differential diagnoses can help streamline the clinical reasoning process, potentially saving valuable time on complex cases."

        Structure the output clearly with Markdown headings for each section. Keep the tone professional, supportive, and data-driven. Do not invent specific patient details. Focus on patterns.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            contents: prompt,
        });

        const reportText = response.text?.trim();
        if (!reportText) {
            throw new Error("AI did not return any insights text.");
        }
        return reportText;
    } catch (error) {
        console.error("Error generating personalized insights:", error);
        throw new Error("Failed to generate personalized insights.");
    }
};
