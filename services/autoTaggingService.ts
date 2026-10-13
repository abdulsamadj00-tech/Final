import { PatientData, Diagnosis } from '../types';

export const generateAutoTags = (patientData: PatientData, diagnoses: Diagnosis[]): string[] => {
    const tags: string[] = [];
    const text = (patientData.primaryComplaint + " " + patientData.hopi + " " + (patientData.findings || "")).toLowerCase();
    
    if (text.includes('chest pain') || text.includes('angina') || text.includes('heart') || text.includes('palpitations')) {
        tags.push('Cardiology');
    }
    if (text.includes('dyspnea') || text.includes('breath') || text.includes('cough') || text.includes('lung') || text.includes('pneumonia') || text.includes('embolism')) {
        tags.push('Pulmonology');
    }
    if (text.includes('fever') || text.includes('infection') || text.includes('sepsis')) {
        tags.push('Infectious Disease');
    }
    if (text.includes('headache') || text.includes('dizziness') || text.includes('neuropathy') || text.includes('stroke')) {
        tags.push('Neurology');
    }
    if (text.includes('diabetes') || text.includes('glucose') || text.includes('thyroid')) {
        tags.push('Endocrinology');
    }

    diagnoses.forEach(d => {
        const name = d.diagnosisName.toLowerCase();
        if (name.includes('embolism') || name.includes('infarction') || name.includes('sepsis') || name.includes('acute')) {
            tags.push('High Acuity');
        } else {
            tags.push('Chronic Care');
        }
    });

    if (tags.length === 0) {
        tags.push('General Medicine');
    }

    return Array.from(new Set(tags));
};
