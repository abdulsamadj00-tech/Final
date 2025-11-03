
import { PatientData, Diagnosis, DoctorDetails, ReportModules, Vitals } from '../types';
declare const jspdf: any;

// Helper class for PDF generation to manage layout
class PdfWriter {
    doc: any;
    y: number;
    pageMargin: number;
    pageHeight: number;
    
    constructor(jsPDF: any) {
        this.doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
        this.pageMargin = 15;
        this.y = this.pageMargin;
        this.pageHeight = this.doc.internal.pageSize.getHeight();
    }

    checkPageBreak(heightNeeded: number) {
        if (this.y + heightNeeded > this.pageHeight - this.pageMargin) {
            this.doc.addPage();
            this.y = this.pageMargin;
        }
    }

    writeTitle(text: string) {
        this.checkPageBreak(15);
        this.doc.setFontSize(18);
        this.doc.setFont(undefined, 'bold');
        this.doc.text(text, this.pageMargin, this.y);
        this.y += 10;
        this.doc.setFont(undefined, 'normal');
    }

    writeSectionHeader(text: string) {
        this.checkPageBreak(10);
        this.doc.setFontSize(14);
        this.doc.setFont(undefined, 'bold');
        this.doc.text(text, this.pageMargin, this.y);
        this.y += 8;
        this.doc.setFont(undefined, 'normal');
    }
    
    writeSubHeader(text: string) {
        this.checkPageBreak(8);
        this.doc.setFontSize(11);
        this.doc.setFont(undefined, 'bold');
        this.doc.text(text, this.pageMargin, this.y);
        this.y += 5;
        this.doc.setFont(undefined, 'normal');
    }

    writeText(text: string | string[], indent = 0) {
        if (!text || (Array.isArray(text) && text.length === 0)) {
            text = 'N/A';
        }
        
        const maxWidth = this.doc.internal.pageSize.getWidth() - (this.pageMargin * 2) - indent;
        const lines = this.doc.splitTextToSize(text, maxWidth);
        this.checkPageBreak(lines.length * 5);
        this.doc.setFontSize(10);
        this.doc.text(lines, this.pageMargin + indent, this.y);
        this.y += lines.length * 5;
    }
    
    writeKeyValue(key: string, value: string) {
        const fullText = `${key}: ${value || 'N/A'}`;
        this.writeText(fullText);
    }
    
    addSignatureLine() {
        this.checkPageBreak(25);
        this.y += 15;
        this.doc.line(this.pageMargin, this.y, this.pageMargin + 70, this.y);
        this.y += 5;
        this.doc.text('Signature', this.pageMargin, this.y);
    }

    save(filename: string) {
        this.doc.save(filename);
    }
}

const formatVitals = (vitals: Vitals): string => {
    const parts = [
        vitals.temp && `Temp: ${vitals.temp}`,
        vitals.hr && `HR: ${vitals.hr} bpm`,
        vitals.rr && `RR: ${vitals.rr} breaths/min`,
        vitals.bp && `BP: ${vitals.bp} mmHg`,
        vitals.spo2 && `SpO2: ${vitals.spo2}%`,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(' | ') : 'Not recorded.';
}

export const generateComprehensivePdf = (
    patientData: PatientData, 
    diagnoses: Diagnosis[], 
    doctorDetails: DoctorDetails,
    modules: ReportModules
) => {
    if (typeof jspdf === 'undefined') {
        alert('PDF generation library not loaded. Please check your internet connection and try again.');
        console.error('jsPDF is not available.');
        return;
    }

    const writer = new PdfWriter(jspdf.jsPDF);

    writer.writeTitle('Clinical Summary Report');
    writer.writeText(`Date: ${new Date().toLocaleDateString()}`);
    writer.y += 5;

    if (modules.demographics) {
        writer.writeSectionHeader('Patient Demographics');
        writer.writeKeyValue('Age', patientData.age);
        writer.writeKeyValue('Sex', patientData.sex);
        writer.writeSubHeader('Presenting Complaint');
        writer.writeText(patientData.symptoms);
        writer.y += 5;
    }

    if (modules.history) {
        writer.writeSectionHeader('Patient History');
        writer.writeSubHeader('Past Medical History');
        writer.writeText(patientData.pmh);
        writer.writeSubHeader('Past Surgical History');
        writer.writeText(patientData.psh);
        writer.writeSubHeader('Personal/Social History');
        writer.writeText(patientData.socialHistory);
        writer.writeSubHeader('Allergies');
        writer.writeText(patientData.allergies);
        writer.y += 5;
    }

    if (modules.vitals) {
        writer.writeSectionHeader('Vital Signs');
        writer.writeText(formatVitals(patientData.vitals));
        writer.y += 5;
    }

    if (modules.findings) {
        writer.writeSectionHeader('Examination Findings');
        writer.writeText(patientData.findings);
        writer.y += 5;
    }

    if (modules.investigations) {
        writer.writeSectionHeader('Investigation Summary');
        writer.writeSubHeader('Lab Results');
        writer.writeText(patientData.labs);
        writer.writeSubHeader('Imaging Results');
        writer.writeText(patientData.imaging);
        writer.y += 5;
    }

    if (modules.diagnoses) {
        writer.writeSectionHeader('AI-Assisted Differential Diagnosis');
        diagnoses.forEach((dx, index) => {
            writer.checkPageBreak(30);
            writer.writeSubHeader(`${index + 1}. ${dx.diagnosisName} (Likelihood: ${dx.probability}%)`);
            writer.writeText(`Supporting Evidence: ${dx.supportingEvidence.join(', ')}`);
            writer.writeText(`Contradicting Evidence: ${dx.contradictingEvidence.join(', ')}`);
            writer.writeText(`Recommended Tests: ${dx.recommendedTests.join(', ')}`);
            writer.writeText(`Treatment Guidelines: ${dx.treatmentSuggestions.guidelines?.join(', ') || 'N/A'}`);
            writer.y += 3;
        });
    }

    writer.y += 10;
    writer.writeText('Report generated by:');
    writer.writeText(doctorDetails.name);
    writer.writeText(doctorDetails.role);
    writer.writeText(doctorDetails.licenseNumber);
    writer.addSignatureLine();

    writer.save(`MediDx-Report-${new Date().toISOString().split('T')[0]}.pdf`);
};
