
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
    primaryComplaint: string;
    hopi: string; // History of Present Illness
    findings: string;
    vitals: Vitals;
    pmh: string;
    psh: string;
    socialHistory: string;
    allergies: string;
    investigations: { [key: string]: string }; // e.g., { "CBC": "WBC 12.5...", "TSH": "TSH 5.2..." }
}

export interface Treatment {
    id: string;
    drugName: string;
    dosage: string;
    duration: string;
    line: 'First-line' | 'Second-line' | 'Empirical' | 'Combination' | 'Supportive';
    source: 'AI-Recommended' | 'Clinician-Decided';
    rationale: string;
    isActive: boolean;
    history: { date: number; reason: string }[];
}

export interface Diagnosis {
    diagnosisName: string;
    icdCode: string;
    probability: number;
    supportingEvidence: string[];
    contradictingEvidence: string[];
    recommendedTests: string[];
    treatmentSuggestions: {
        firstLine: string[];
        secondLine: string[];
        lifestyle: string[];
        guidelines?: string[];
    };
    morbidity: string;
    mortality: string;
}

export interface ProgressNote {
    id: string;
    timestamp: number;
    note: string;
    symptomScore?: number; // Optional symptom score 1-10
}

export interface VitalsRecord extends Vitals {
    timestamp: number;
}

export interface AIRecommendation {
    id: string;
    recommendation: string;
    causeAnalysis: string;
    severity: 'Mild Adjustment' | 'Significant Review Needed' | 'Urgent Action Required';
    timestamp: number;
}

export interface Encounter {
    id: string; // Case ID / Serial Number
    patientData: PatientData;
    provisionalDiagnoses: Diagnosis[];
    finalDiagnosis: Diagnosis | null;
    treatments: Treatment[];
    timestamp: number; // Date of entry
    progressNotes: ProgressNote[];
    vitalsHistory: VitalsRecord[];
    aiRecommendations: AIRecommendation[];
    status: 'Active' | 'Discharged' | 'Referred' | 'LAMA';
    tags: string[];
}


// These types are used by various modals and reports
export interface DoctorDetails {
    name: string;
    role: string;
    licenseNumber: string;
}

export type ReportModuleKey = 'demographics' | 'history' | 'vitals' | 'findings' | 'investigations' | 'diagnoses' | 'treatmentPlan' | 'progressSummary';
export type ReportModules = Record<ReportModuleKey, boolean>;

export interface DischargeData {
    finalDiagnosis: string;
    hospitalCourse: string;
    dischargeMedications: string;
    followUpPlan: string;
}

export interface ReferralData {
    receivingDoctor: string;
    reasonForReferral: string;
    clinicalSummary: string;
}

export interface MedicationSuggestion {
    drugName: string;
    dosage: string;
    rationale: string;
    line: 'First-line' | 'Second-line' | 'Supportive';
    guideline: string;
}
