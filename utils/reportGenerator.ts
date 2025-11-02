import { PatientData, Diagnosis, Vitals } from '../types';
// Note: Ensure jsPDF and html2canvas are loaded via script tags in index.html
declare const jspdf: any;
declare const html2canvas: any;

export const generatePdf = (element: HTMLElement, patientData: PatientData) => {
    if (typeof jspdf === 'undefined' || typeof html2canvas === 'undefined') {
        alert('PDF generation library could not be loaded. Please check your internet connection and try again.');
        console.error('jsPDF or html2canvas is not available.');
        return;
    }

    const { jsPDF } = jspdf;
    const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
    });
    
    doc.setFontSize(18);
    doc.text('MediDx Assistant - Differential Diagnosis Report', 15, 20);
    
    doc.setFontSize(12);
    doc.text('Patient Information:', 15, 30);
    doc.setFontSize(10);
    doc.text(`Age: ${patientData.age}`, 15, 36);
    doc.text(`Sex: ${patientData.sex}`, 55, 36);
    
    html2canvas(element, { scale: 2 }).then((canvas: HTMLCanvasElement) => {
        const imgData = canvas.toDataURL('image/png');
        const imgProps = doc.getImageProperties(imgData);
        const pdfWidth = doc.internal.pageSize.getWidth() - 30;
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        
        let heightLeft = pdfHeight;
        let position = 45;

        doc.addImage(imgData, 'PNG', 15, position, pdfWidth, pdfHeight);
        heightLeft -= doc.internal.pageSize.getHeight() - 50;

        while (heightLeft >= 0) {
            position = heightLeft - pdfHeight;
            doc.addPage();
            doc.addImage(imgData, 'PNG', 15, position, pdfWidth, pdfHeight);
            heightLeft -= doc.internal.pageSize.getHeight();
        }

        doc.save(`MediDx-Report-${new Date().toISOString().split('T')[0]}.pdf`);
    });
};

const formatDate = () => new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

const formatDiagnosesList = (diagnoses: Diagnosis[]) => {
    if (diagnoses.length === 0) return "No potential diagnoses generated.";
    return diagnoses.map((d, i) => `${i + 1}. ${d.diagnosisName} (Likelihood: ${d.probability}%)`).join('\n');
};

const formatVitals = (vitals: Vitals): string => {
    const parts = [
        vitals.temp && `Temp: ${vitals.temp}°C`,
        vitals.hr && `HR: ${vitals.hr} bpm`,
        vitals.rr && `RR: ${vitals.rr} breaths/min`,
        vitals.bp && `BP: ${vitals.bp} mmHg`,
        vitals.spo2 && `SpO2: ${vitals.spo2}%`,
    ].filter(Boolean); // Filter out any empty/falsy values
    
    if (parts.length === 0) return 'Not recorded.';
    return parts.join(' | ');
}

export const generateDischargeSummary = (patientData: PatientData, diagnoses: Diagnosis[]): string => {
    return `
DISCHARGE SUMMARY
---------------------------------

Date: ${formatDate()}

Patient Information:
Age: ${patientData.age}
Sex: ${patientData.sex}

Vital Signs:
${formatVitals(patientData.vitals)}

Presenting Complaint:
${patientData.symptoms}

Key Examination & Investigation Findings:
- Examination: ${patientData.findings || 'N/A'}
- Labs: ${patientData.labs || 'N/A'}
- Imaging: ${patientData.imaging || 'N/A'}

AI-Assisted Differential Diagnoses Considered:
${formatDiagnosesList(diagnoses)}

Working Diagnosis / Plan:
[**PHYSICIAN TO COMPLETE** - Based on clinical judgment, list the most likely diagnosis and management plan.]

Discharge Medications:
[**PHYSICIAN TO COMPLETE**]

Follow-up:
[**PHYSICIAN TO COMPLETE** - e.g., Follow up with primary care physician in 1 week.]

---------------------------------
**IMPORTANT NOTE FOR THE PATIENT AND CLINICIAN:**

This summary was generated with the assistance of an AI tool (MediDx Assistant) and REQUIRES thorough review, editing, and final approval by a qualified medical professional. It is not a substitute for professional clinical judgment.

**Always consult a physician or other qualified health provider with any questions you may have regarding a medical condition.**
    `;
};

export const generateReferralLetter = (patientData: PatientData, diagnoses: Diagnosis[]): string => {
    return `
[Physician's Name/Office]
[Address]
[Phone Number]
[Date: ${formatDate()}]

[Specialist's Name/Department]
[Clinic/Hospital Address]

RE: Patient Referral - Age ${patientData.age}, ${patientData.sex}

Dear Dr. [Specialist's Last Name],

I am referring this ${patientData.age}-year-old ${patientData.sex.toLowerCase()} for your expert consultation regarding [**PHYSICIAN TO INSERT REASON, e.g., evaluation of autoimmune disease**].

The patient presented with the following symptoms:
${patientData.symptoms}

Vital Signs on presentation:
${formatVitals(patientData.vitals)}

Relevant findings include:
- Examination: ${patientData.findings || 'N/A'}
- Labs: ${patientData.labs || 'N/A'}
- Imaging: ${patientData.imaging || 'N/A'}

An AI-assisted differential diagnosis tool was utilized for clinical support and suggested the following possibilities based on the provided data:
${formatDiagnosesList(diagnoses)}

Given these findings, your assessment and recommendations for further management would be greatly appreciated. All relevant reports have been attached.

Thank you for your time and consideration.

Sincerely,

[Physician's Name]

---------------------------------
**NOTE:** This referral letter was drafted with AI assistance. All clinical information and AI-generated suggestions must be verified and signed off by the referring physician. The content is for informational purposes and does not constitute a formal diagnosis. **Please consult a physician for final medical decisions.**
    `;
};