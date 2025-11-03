
import React, { useState } from 'react';
import { PatientData, Diagnosis, DoctorDetails, ReportModules, ReportModuleKey } from '../types';
import { XMarkIcon, DownloadIcon } from './icons';

interface GenerateReportModalProps {
    onClose: () => void;
    onGenerate: (doctorDetails: DoctorDetails, modules: ReportModules) => void;
    patientData: PatientData;
    diagnoses: Diagnosis[];
    initialDoctorDetails: DoctorDetails;
}

const moduleLabels: Record<ReportModuleKey, string> = {
    demographics: "Patient Demographics",
    history: "Past Medical & Social History",
    vitals: "Vital Signs",
    findings: "Examination Findings",
    investigations: "Lab & Imaging Results",
    diagnoses: "AI-Generated Differential Diagnoses",
};


const GenerateReportModal: React.FC<GenerateReportModalProps> = ({ onClose, onGenerate, patientData, diagnoses, initialDoctorDetails }) => {
    const [doctorDetails, setDoctorDetails] = useState<DoctorDetails>(initialDoctorDetails);
    const [modules, setModules] = useState<ReportModules>({
        demographics: true,
        history: true,
        vitals: true,
        findings: true,
        investigations: true,
        diagnoses: true,
    });

    const handleDoctorDetailsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setDoctorDetails(prev => ({ ...prev, [name]: value }));
    };

    const handleModuleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setModules(prev => ({...prev, [name as ReportModuleKey]: checked}));
    };

    const handleGenerate = () => {
        onGenerate(doctorDetails, modules);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-xl font-semibold">Generate Patient Report</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800">
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-700 mb-3 border-b pb-2">Clinician Details for Report</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div>
                                <label htmlFor="name" className="block text-sm font-medium text-slate-600 mb-1">Full Name</label>
                                <input type="text" name="name" id="name" value={doctorDetails.name} onChange={handleDoctorDetailsChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm" />
                            </div>
                            <div>
                                <label htmlFor="role" className="block text-sm font-medium text-slate-600 mb-1">Role / Speciality</label>
                                <input type="text" name="role" id="role" value={doctorDetails.role} onChange={handleDoctorDetailsChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm" />
                            </div>
                            <div className="md:col-span-2">
                                <label htmlFor="licenseNumber" className="block text-sm font-medium text-slate-600 mb-1">License / ID Number</label>
                                <input type="text" name="licenseNumber" id="licenseNumber" value={doctorDetails.licenseNumber} onChange={handleDoctorDetailsChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm" />
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-slate-700 mb-3 border-b pb-2">Select Report Content</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                            {(Object.keys(modules) as ReportModuleKey[]).map(key => (
                                <div key={key} className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id={key}
                                        name={key}
                                        checked={modules[key]}
                                        onChange={handleModuleChange}
                                        className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                                    />
                                    <label htmlFor={key} className="ml-2 block text-sm text-slate-700">{moduleLabels[key]}</label>
                                </div>
                            ))}
                        </div>
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

export default GenerateReportModal;