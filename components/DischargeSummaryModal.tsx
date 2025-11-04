
import React, { useState } from 'react';
import { PatientData, Diagnosis, DoctorDetails, DischargeData } from '../types';
import { XMarkIcon, DownloadIcon } from './icons';
import { generateDischargeSummaryPdf } from '../utils/reportGenerator';

interface DischargeSummaryModalProps {
    onClose: () => void;
    patientData: PatientData;
    finalDiagnosis: Diagnosis | null;
    doctorDetails: DoctorDetails;
}

const DischargeSummaryModal: React.FC<DischargeSummaryModalProps> = ({ onClose, patientData, finalDiagnosis, doctorDetails }) => {
    const [dischargeData, setDischargeData] = useState<DischargeData>({
        finalDiagnosis: finalDiagnosis?.diagnosisName || '',
        hospitalCourse: '',
        dischargeMedications: '',
        followUpPlan: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setDischargeData(prev => ({ ...prev, [name]: value }));
    };

    const handleGenerate = () => {
        generateDischargeSummaryPdf(patientData, dischargeData, doctorDetails);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-xl font-semibold">Generate Discharge Summary</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800">
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto space-y-4">
                    <div>
                        <label htmlFor="finalDiagnosis" className="block text-sm font-medium text-slate-600 mb-1">Final Diagnosis</label>
                        <input type="text" name="finalDiagnosis" id="finalDiagnosis" value={dischargeData.finalDiagnosis} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm" />
                    </div>
                     <div>
                        <label htmlFor="hospitalCourse" className="block text-sm font-medium text-slate-600 mb-1">Hospital Course Summary</label>
                        <textarea name="hospitalCourse" id="hospitalCourse" rows={5} value={dischargeData.hospitalCourse} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm" placeholder="Summarize key events, treatments, and patient progress..."/>
                    </div>
                     <div>
                        <label htmlFor="dischargeMedications" className="block text-sm font-medium text-slate-600 mb-1">Discharge Medications</label>
                        <textarea name="dischargeMedications" id="dischargeMedications" rows={4} value={dischargeData.dischargeMedications} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm" placeholder="List all medications, dosages, and frequencies..."/>
                    </div>
                    <div>
                        <label htmlFor="followUpPlan" className="block text-sm font-medium text-slate-600 mb-1">Follow-up Plan</label>
                        <textarea name="followUpPlan" id="followUpPlan" rows={3} value={dischargeData.followUpPlan} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm" placeholder="e.g., Follow up with PCP in 2 weeks. Return to ER if symptoms worsen..."/>
                    </div>
                </div>
                <div className="flex justify-end p-4 border-t bg-slate-50">
                    <button onClick={handleGenerate} className="flex items-center bg-primary-600 text-white font-bold py-2 px-4 rounded-md shadow-sm hover:bg-primary-700">
                        <DownloadIcon className="h-5 w-5 mr-2"/>
                        Generate & Download PDF
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DischargeSummaryModal;