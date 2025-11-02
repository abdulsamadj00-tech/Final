
export interface Vitals {
    temp: string; // Temperature
    hr: string;   // Heart Rate
    rr: string;   // Respiratory Rate
    bp: string;   // Blood Pressure
    spo2: string; // Oxygen Saturation
}

export interface PatientData {
    age: string;
    sex: 'Male' | 'Female' | 'Other';
    symptoms: string;
    findings: string;
    labs: string;
    imaging: string;
    vitals: Vitals;
}

export interface TreatmentSuggestions {
    firstLine: string[];
    secondLine: string[];
    lifestyle: string[];
}

export interface Diagnosis {
    diagnosisName: string;
    probability: number;
    supportingEvidence: string[];
    contradictingEvidence: string[];
    recommendedTests: string[];
    treatmentSuggestions: TreatmentSuggestions;
    morbidity: string;
    mortality: string;
}
