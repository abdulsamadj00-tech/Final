import React, { useState, useRef } from 'react';
import { PatientData } from '../types';
import { AnalyzeIcon, SparklesIcon, ChevronDownIcon, CameraIcon } from './icons';

interface InputFormProps {
    patientData: PatientData;
    setPatientData: React.Dispatch<React.SetStateAction<PatientData>>;
    onSubmit: () => void;
    isLoading: boolean;
    onOpenSymptomChecker: () => void;
    tempUnit: 'C' | 'F';
    setTempUnit: (unit: 'C' | 'F') => void;
    onAnalyzeLabImage: (base64Data: string, mimeType: string) => void;
    onAnalyzeExamImage: (base64Data: string, mimeType: string) => void;
    onAnalyzeImagingImage: (base64Data: string, mimeType: string) => void;
    isProcessingLabs: boolean;
    isProcessingFindings: boolean;
    isProcessingImaging: boolean;
}

const InputForm: React.FC<InputFormProps> = ({ 
    patientData, setPatientData, onSubmit, isLoading, onOpenSymptomChecker,
    tempUnit, setTempUnit,
    onAnalyzeLabImage, onAnalyzeExamImage, onAnalyzeImagingImage,
    isProcessingLabs, isProcessingFindings, isProcessingImaging
}) => {
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadTarget, setUploadTarget] = useState<'labs' | 'findings' | 'imaging' | null>(null);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setPatientData(prev => ({ ...prev, [name]: value }));
    };

    const handleVitalsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setPatientData(prev => ({
            ...prev,
            vitals: {
                ...prev.vitals,
                [name]: value,
            }
        }));
    };
    
    // Fix: Add a handler for investigation fields which are stored in an object.
    const handleInvestigationChange = (key: string, value: string) => {
        setPatientData(prev => ({
            ...prev,
            investigations: {
                ...prev.investigations,
                [key]: value,
            },
        }));
    };

    const triggerFileUpload = (target: 'labs' | 'findings' | 'imaging') => {
        setUploadTarget(target);
        fileInputRef.current?.click();
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !uploadTarget) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            if (reader.result) {
                const base64String = (reader.result as string).split(',')[1];
                if (uploadTarget === 'labs') {
                    onAnalyzeLabImage(base64String, file.type);
                } else if (uploadTarget === 'findings') {
                    onAnalyzeExamImage(base64String, file.type);
                } else if (uploadTarget === 'imaging') {
                    onAnalyzeImagingImage(base64String, file.type);
                }
            }
        };
        reader.readAsDataURL(file);
        e.target.value = ''; // Reset file input
    };

    // Fix: Validate against 'primaryComplaint' instead of non-existent 'symptoms'.
    const isFormValid = patientData.age && patientData.primaryComplaint;

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg sticky top-8">
            <h2 className="text-xl font-semibold mb-4 text-slate-700 border-b pb-3">Patient Information</h2>
            
            <div className="mb-4">
                <button
                    type="button"
                    onClick={onOpenSymptomChecker}
                    className="w-full flex items-center justify-center text-sm bg-blue-50 text-blue-700 font-semibold py-2 px-3 rounded-md shadow-sm border border-blue-200 hover:bg-blue-100 transition-colors"
                >
                    <SparklesIcon className="h-5 w-5 mr-2" />
                    AI Symptom Checker
                </button>
            </div>
            
            <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <label htmlFor="age" className="block text-sm font-medium text-slate-600 mb-1">Age</label>
                        <input type="number" name="age" id="age" value={patientData.age} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" placeholder="e.g., 28" required />
                    </div>
                    <div>
                        <label htmlFor="sex" className="block text-sm font-medium text-slate-600 mb-1">Sex</label>
                        <select name="sex" id="sex" value={patientData.sex} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                            <option>Male</option>
                            <option>Female</option>
                            <option>Other</option>
                        </select>
                    </div>
                </div>

                <div className="mb-4">
                    {/* Fix: Bind to 'primaryComplaint' property. */}
                    <label htmlFor="symptoms" className="block text-sm font-medium text-slate-600 mb-1">Symptoms & Chief Complaint</label>
                    <textarea name="primaryComplaint" id="symptoms" rows={4} value={patientData.primaryComplaint} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" placeholder="e.g., Fever, joint pain, rash on cheeks..." required />
                </div>

                <div className="mb-4">
                     <div className="flex justify-between items-center mb-1">
                        <label htmlFor="findings" className="block text-sm font-medium text-slate-600">Examination Findings</label>
                        <button type="button" onClick={() => triggerFileUpload('findings')} disabled={isProcessingFindings} className="flex items-center text-xs text-blue-600 font-semibold hover:underline disabled:text-slate-400 disabled:cursor-not-allowed">
                           <CameraIcon className="h-4 w-4 mr-1"/> {isProcessingFindings ? 'Analyzing...' : 'Upload Photo'}
                        </button>
                    </div>
                    <textarea name="findings" id="findings" rows={3} value={patientData.findings} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" placeholder="e.g., Malar rash, non-erosive arthritis..." />
                </div>

                <div className="border-t pt-4 mt-4">
                    <button type="button" onClick={() => setIsHistoryOpen(!isHistoryOpen)} className="w-full flex justify-between items-center text-left font-semibold text-slate-700 mb-3 focus:outline-none">
                        <span>Past History & Allergies</span>
                        <ChevronDownIcon className={`h-5 w-5 text-slate-500 transform transition-transform ${isHistoryOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isHistoryOpen && (
                        <div className="space-y-4 mb-4">
                            <div><label htmlFor="pmh" className="block text-sm font-medium text-slate-600 mb-1">Past Medical History</label><textarea name="pmh" id="pmh" rows={2} value={patientData.pmh} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm" placeholder="e.g., Hypertension, Type 2 Diabetes" /></div>
                            <div><label htmlFor="psh" className="block text-sm font-medium text-slate-600 mb-1">Past Surgical History</label><textarea name="psh" id="psh" rows={2} value={patientData.psh} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm" placeholder="e.g., Appendectomy (2005)" /></div>
                            <div><label htmlFor="socialHistory" className="block text-sm font-medium text-slate-600 mb-1">Personal/Social History</label><textarea name="socialHistory" id="socialHistory" rows={2} value={patientData.socialHistory} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm" placeholder="e.g., Smoking: 10 pack-years" /></div>
                            <div><label htmlFor="allergies" className="block text-sm font-medium text-slate-600 mb-1">Allergies</label><textarea name="allergies" id="allergies" rows={2} value={patientData.allergies} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm" placeholder="e.g., Penicillin (rash)" /></div>
                        </div>
                    )}
                </div>

                <h3 className="text-lg font-semibold mb-3 text-slate-700 border-t pt-4 mt-4">Vital Signs</h3>
                <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm font-medium text-slate-600">Temp Unit:</span>
                    <button type="button" onClick={() => setTempUnit('C')} className={`px-3 py-1 text-sm rounded-md transition-colors ${tempUnit === 'C' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}>°C</button>
                    <button type="button" onClick={() => setTempUnit('F')} className={`px-3 py-1 text-sm rounded-md transition-colors ${tempUnit === 'F' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}>°F</button>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 mb-4">
                    <div><label htmlFor="temp" className="block text-sm font-medium text-slate-600 mb-1">Temp ({`°${tempUnit}`})</label><input type="text" name="temp" id="temp" value={patientData.vitals.temp} onChange={handleVitalsChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm" placeholder={tempUnit === 'C' ? '38.5' : '101.3'} /></div>
                    <div><label htmlFor="hr" className="block text-sm font-medium text-slate-600 mb-1">HR (bpm)</label><input type="text" name="hr" id="hr" value={patientData.vitals.hr} onChange={handleVitalsChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm" placeholder="e.g., 95" /></div>
                    <div><label htmlFor="rr" className="block text-sm font-medium text-slate-600 mb-1">RR (breaths/min)</label><input type="text" name="rr" id="rr" value={patientData.vitals.rr} onChange={handleVitalsChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm" placeholder="e.g., 18" /></div>
                    <div><label htmlFor="bp" className="block text-sm font-medium text-slate-600 mb-1">BP (mmHg)</label><input type="text" name="bp" id="bp" value={patientData.vitals.bp} onChange={handleVitalsChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm" placeholder="e.g., 120/80" /></div>
                    <div className="col-span-2 sm:col-span-1"><label htmlFor="spo2" className="block text-sm font-medium text-slate-600 mb-1">SpO2 (%)</label><input type="text" name="spo2" id="spo2" value={patientData.vitals.spo2} onChange={handleVitalsChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm" placeholder="e.g., 98" /></div>
                </div>

                <div className="mb-4">
                    {/* Fix: Bind to 'investigations' object. */}
                    <div className="flex justify-between items-center mb-1">
                        <label htmlFor="labs" className="block text-sm font-medium text-slate-600">Lab Results</label>
                        <button type="button" onClick={() => triggerFileUpload('labs')} disabled={isProcessingLabs} className="flex items-center text-xs text-blue-600 font-semibold hover:underline disabled:text-slate-400 disabled:cursor-not-allowed">
                           <CameraIcon className="h-4 w-4 mr-1"/> {isProcessingLabs ? 'Analyzing...' : 'Upload Photo'}
                        </button>
                    </div>
                    <textarea name="labs" id="labs" rows={3} value={patientData.investigations['Labs'] || ''} onChange={(e) => handleInvestigationChange('Labs', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm" placeholder="e.g., ANA positive, ESR 50 mm/hr, or upload a photo of the report." />
                </div>

                <div className="mb-6">
                    {/* Fix: Bind to 'investigations' object. */}
                    <div className="flex justify-between items-center mb-1">
                        <label htmlFor="imaging" className="block text-sm font-medium text-slate-600">Imaging Results</label>
                         <button type="button" onClick={() => triggerFileUpload('imaging')} disabled={isProcessingImaging} className="flex items-center text-xs text-blue-600 font-semibold hover:underline disabled:text-slate-400 disabled:cursor-not-allowed">
                           <CameraIcon className="h-4 w-4 mr-1"/> {isProcessingImaging ? 'Analyzing...' : 'Upload Photo'}
                        </button>
                    </div>
                    <textarea name="imaging" id="imaging" rows={3} value={patientData.investigations['Imaging'] || ''} onChange={(e) => handleInvestigationChange('Imaging', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm" placeholder="e.g., Chest X-ray clear, MRI brain shows..." />
                </div>
                
                <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" capture="environment" className="hidden" />

                <button type="submit" disabled={!isFormValid || isLoading} className="w-full flex items-center justify-center bg-blue-600 text-white font-bold py-3 px-4 rounded-lg shadow-md hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    {isLoading ? (<svg className="animate-spin h-5 w-5 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>) : (<AnalyzeIcon className="h-5 w-5 mr-2" />)}
                    {isLoading ? 'Analyzing...' : 'Generate Diagnosis'}
                </button>
            </form>
        </div>
    );
};

export default InputForm;
