
import React, { useState } from 'react';
import { PatientData, DoctorDetails } from '../types';
import { XMarkIcon, DownloadIcon, ExclamationCircleIcon } from './icons';
import { generateLamaPdf } from '../utils/reportGenerator';

interface LamaModalProps {
    onClose: () => void;
    patientData: PatientData;
    doctorDetails: DoctorDetails;
}

const LamaModal: React.FC<LamaModalProps> = ({ onClose, patientData, doctorDetails }) => {
    const [witnessName, setWitnessName] = useState('');

    const handleGenerate = () => {
        generateLamaPdf(patientData, doctorDetails, witnessName);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-xl font-semibold flex items-center"><ExclamationCircleIcon className="h-6 w-6 mr-2 text-amber-500"/>Leave Against Medical Advice</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800">
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto space-y-4">
                   <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                       <p className="text-sm text-amber-800">
                           I, <strong>{patientData.name || '[Patient Name]'}</strong>, hereby declare that I am leaving the facility against the advice of my treating physician, <strong>{doctorDetails.name || '[Doctor Name]'}</strong>.
                           I have been informed of the potential risks of my decision, which include but are not limited to: worsening of my condition, permanent disability, or death.
                           Despite understanding these risks, I voluntarily choose to discharge myself. I release the medical staff and the facility from all liability for any adverse events that may result from my decision.
                       </p>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                        <div>
                            <label htmlFor="patientName" className="block text-sm font-medium text-slate-600 mb-1">Patient Name (Confirm)</label>
                            <input type="text" name="patientName" id="patientName" value={patientData.name} readOnly className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm bg-slate-100" />
                        </div>
                        <div>
                            <label htmlFor="witnessName" className="block text-sm font-medium text-slate-600 mb-1">Witness Name</label>
                            <input type="text" name="witnessName" id="witnessName" value={witnessName} onChange={(e) => setWitnessName(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm" placeholder="e.g., Nurse Name" />
                        </div>
                   </div>
                </div>
                <div className="flex justify-end p-4 border-t bg-slate-50">
                    <button onClick={handleGenerate} className="flex items-center bg-amber-600 text-white font-bold py-2 px-4 rounded-md shadow-sm hover:bg-amber-700">
                        <DownloadIcon className="h-5 w-5 mr-2"/>
                        Generate LAMA PDF
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LamaModal;
