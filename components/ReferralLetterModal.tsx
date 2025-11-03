
import React, { useState } from 'react';
import { PatientData, Diagnosis, DoctorDetails, ReferralData } from '../types';
import { XMarkIcon, ArrowUpOnSquareIcon } from './icons';
import { generateReferralPdf } from '../utils/reportGenerator';

interface ReferralLetterModalProps {
    onClose: () => void;
    patientData: PatientData;
    diagnoses: Diagnosis[];
    doctorDetails: DoctorDetails;
}

const generateSummary = (patientData: PatientData, diagnoses: Diagnosis[]): string => {
    return `
This ${patientData.age}-year-old ${patientData.sex.toLowerCase()} presents with a chief complaint of: ${patientData.symptoms}.

Key examination findings include: ${patientData.findings || 'Not specified'}.

Relevant investigations show:
Labs: ${patientData.labs || 'Not specified'}
Imaging: ${patientData.imaging || 'Not specified'}

The AI-assisted differential diagnosis includes: ${diagnoses.map(d => `${d.diagnosisName} (${d.probability}%)`).join(', ')}.

Thank you for seeing this patient.
    `.trim();
};


const ReferralLetterModal: React.FC<ReferralLetterModalProps> = ({ onClose, patientData, diagnoses, doctorDetails }) => {
    const [referralData, setReferralData] = useState<ReferralData>({
        receivingDoctor: '',
        reasonForReferral: '',
        clinicalSummary: generateSummary(patientData, diagnoses),
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setReferralData(prev => ({ ...prev, [name]: value }));
    };

    const handleGenerate = () => {
        generateReferralPdf(patientData, referralData, doctorDetails);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-xl font-semibold">Generate Referral Letter</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800">
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto space-y-4">
                    <div>
                        <label htmlFor="receivingDoctor" className="block text-sm font-medium text-slate-600 mb-1">To (Receiving Clinician/Department)</label>
                        <input type="text" name="receivingDoctor" id="receivingDoctor" value={referralData.receivingDoctor} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm" placeholder="e.g., Dr. Smith, Cardiology" />
                    </div>
                     <div>
                        <label htmlFor="reasonForReferral" className="block text-sm font-medium text-slate-600 mb-1">Reason for Referral</label>
                        <textarea name="reasonForReferral" id="reasonForReferral" rows={2} value={referralData.reasonForReferral} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm" placeholder="e.g., For evaluation of persistent chest pain."/>
                    </div>
                     <div>
                        <label htmlFor="clinicalSummary" className="block text-sm font-medium text-slate-600 mb-1">Clinical Summary (Editable)</label>
                        <textarea name="clinicalSummary" id="clinicalSummary" rows={10} value={referralData.clinicalSummary} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm bg-slate-50"/>
                    </div>
                </div>
                <div className="flex justify-end p-4 border-t bg-slate-50">
                    <button onClick={handleGenerate} className="flex items-center bg-primary-600 text-white font-bold py-2 px-4 rounded-md shadow-sm hover:bg-primary-700">
                        <ArrowUpOnSquareIcon className="h-5 w-5 mr-2"/>
                        Generate & Download PDF
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReferralLetterModal;
