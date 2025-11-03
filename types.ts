
export interface Vitals {
    temp: string; // Temperature
    hr: string;   // Heart Rate
    rr: string;   // Respiratory Rate
    bp: string;   // Blood Pressure
    spo2: string; // Oxygen Saturation
}

export interface PatientData {
    name: string;
    age: string;
    sex: 'Male' | 'Female' | 'Other';
    symptoms: string;
    findings: string;
    labs: string;
    imaging: string;
    vitals: Vitals;
    pmh?: string;
    psh?: string;
    socialHistory?: string;
    allergies?: string;
}

export interface TreatmentSuggestions {
    firstLine: string[];
    secondLine: string[];
    lifestyle: string[];
    guidelines?: string[];
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

export interface ProgressNote {
    id: string;
    timestamp: number;
    note: string;
}

export interface VitalsRecord extends Vitals {
    timestamp: number;
}

export interface Encounter {
    id: string;
    patientData: PatientData;
    diagnoses: Diagnosis[];
    timestamp: number;
    progressNotes?: ProgressNote[];
    vitalsHistory?: VitalsRecord[];
    status: 'Needs Review' | 'Completed';
    tags: string[];
}

export interface DoctorDetails {
    name: string;
    role: string;
    licenseNumber: string;
}

export type ReportModuleKey = 'demographics' | 'history' | 'vitals' | 'findings' | 'investigations' | 'diagnoses';

export type ReportModules = Record<ReportModuleKey, boolean>;