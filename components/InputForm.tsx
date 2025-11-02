import React from 'react';
import { PatientData } from '../types';
import { AnalyzeIcon } from './icons';

interface InputFormProps {
    patientData: PatientData;
    setPatientData: React.Dispatch<React.SetStateAction<PatientData>>;
    onSubmit: () => void;
    isLoading: boolean;
}

const InputForm: React.FC<InputFormProps> = ({ patientData, setPatientData, onSubmit, isLoading }) => {
    
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

    const isFormValid = patientData.age && patientData.symptoms;

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg sticky top-8">
            <h2 className="text-xl font-semibold mb-4 text-slate-700 border-b pb-3">Patient Information</h2>
            <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <label htmlFor="age" className="block text-sm font-medium text-slate-600 mb-1">Age</label>
                        <input
                            type="number"
                            name="age"
                            id="age"
                            value={patientData.age}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            placeholder="e.g., 28"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="sex" className="block text-sm font-medium text-slate-600 mb-1">Sex</label>
                        <select
                            name="sex"
                            id="sex"
                            value={patientData.sex}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option>Female</option>
                            <option>Male</option>
                            <option>Other</option>
                        </select>
                    </div>
                </div>

                <div className="mb-4">
                    <label htmlFor="symptoms" className="block text-sm font-medium text-slate-600 mb-1">Symptoms & Chief Complaint</label>
                    <textarea
                        name="symptoms"
                        id="symptoms"
                        rows={4}
                        value={patientData.symptoms}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., Fever, joint pain, rash on cheeks..."
                        required
                    />
                </div>

                <div className="mb-4">
                    <label htmlFor="findings" className="block text-sm font-medium text-slate-600 mb-1">Examination Findings</label>
                    <textarea
                        name="findings"
                        id="findings"
                        rows={3}
                        value={patientData.findings}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., Malar rash, non-erosive arthritis..."
                    />
                </div>

                <h3 className="text-lg font-semibold mb-3 text-slate-700 border-t pt-4 mt-4">Vital Signs</h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 mb-4">
                    <div>
                        <label htmlFor="temp" className="block text-sm font-medium text-slate-600 mb-1">Temp (°C)</label>
                        <input
                            type="text"
                            name="temp"
                            id="temp"
                            value={patientData.vitals.temp}
                            onChange={handleVitalsChange}
                            className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            placeholder="e.g., 38.5"
                        />
                    </div>
                    <div>
                        <label htmlFor="hr" className="block text-sm font-medium text-slate-600 mb-1">HR (bpm)</label>
                        <input
                            type="text"
                            name="hr"
                            id="hr"
                            value={patientData.vitals.hr}
                            onChange={handleVitalsChange}
                            className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            placeholder="e.g., 95"
                        />
                    </div>
                    <div>
                        <label htmlFor="rr" className="block text-sm font-medium text-slate-600 mb-1">RR (breaths/min)</label>
                        <input
                            type="text"
                            name="rr"
                            id="rr"
                            value={patientData.vitals.rr}
                            onChange={handleVitalsChange}
                            className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            placeholder="e.g., 18"
                        />
                    </div>
                     <div>
                        <label htmlFor="bp" className="block text-sm font-medium text-slate-600 mb-1">BP (mmHg)</label>
                        <input
                            type="text"
                            name="bp"
                            id="bp"
                            value={patientData.vitals.bp}
                            onChange={handleVitalsChange}
                            className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            placeholder="e.g., 120/80"
                        />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                        <label htmlFor="spo2" className="block text-sm font-medium text-slate-600 mb-1">SpO2 (%)</label>
                        <input
                            type="text"
                            name="spo2"
                            id="spo2"
                            value={patientData.vitals.spo2}
                            onChange={handleVitalsChange}
                            className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                            placeholder="e.g., 98"
                        />
                    </div>
                </div>

                <div className="mb-4">
                    <label htmlFor="labs" className="block text-sm font-medium text-slate-600 mb-1">Lab Results</label>
                    <textarea
                        name="labs"
                        id="labs"
                        rows={3}
                        value={patientData.labs}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., ANA positive, ESR 50 mm/hr..."
                    />
                </div>

                <div className="mb-6">
                    <label htmlFor="imaging" className="block text-sm font-medium text-slate-600 mb-1">Imaging Results</label>
                    <textarea
                        name="imaging"
                        id="imaging"
                        rows={3}
                        value={patientData.imaging}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., Chest X-ray clear, MRI brain shows..."
                    />
                </div>

                <button
                    type="submit"
                    disabled={!isFormValid || isLoading}
                    className="w-full flex items-center justify-center bg-blue-600 text-white font-bold py-3 px-4 rounded-lg shadow-md hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    {isLoading ? (
                        <svg className="animate-spin h-5 w-5 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : (
                       <AnalyzeIcon className="h-5 w-5 mr-2" />
                    )}
                    {isLoading ? 'Analyzing...' : 'Generate Diagnosis'}
                </button>
            </form>
        </div>
    );
};

export default InputForm;
