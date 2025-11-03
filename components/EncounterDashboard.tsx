import React, { useState, useRef } from 'react';
import { PatientData, Diagnosis, ProgressNote, VitalsRecord, Encounter, Vitals } from '../types';
import ModuleCard from './ModuleCard';
import DiagnosisCard from './DiagnosisCard';
import ActionButtons from './ActionButtons';
// Fix: Import the missing ExclamationCircleIcon component.
import { 
    UserCircleIcon, HeartPulseIcon, ClipboardDocumentListIcon, BeakerIcon, LightBulbIcon, PencilSquareIcon, CameraIcon, SparklesIcon, AnalyzeIcon, 
    ErrorIcon, PlusCircleIcon, TagIcon, XCircleIcon, ChevronDownIcon, DocumentTextIcon, ArrowUpOnSquareIcon, ExclamationCircleIcon
} from './icons';
import { analyzeLabReportImage, analyzeExamImage, analyzeImagingImage } from '../services/geminiService';

interface EncounterDashboardProps {
    patientData: PatientData;
    setPatientData: React.Dispatch<React.SetStateAction<PatientData>>;
    diagnoses: Diagnosis[];
    progressNotes: ProgressNote[];
    setProgressNotes: React.Dispatch<React.SetStateAction<ProgressNote[]>>;
    vitalsHistory: VitalsRecord[];
    setVitalsHistory: React.Dispatch<React.SetStateAction<VitalsRecord[]>>;
    encounterStatus: Encounter['status'];
    setEncounterStatus: React.Dispatch<React.SetStateAction<Encounter['status']>>;
    encounterTags: string[];
    setEncounterTags: React.Dispatch<React.SetStateAction<string[]>>;
    isLoading: boolean;
    error: string | null;
    tempUnit: 'C' | 'F';
    setTempUnit: (unit: 'C' | 'F') => void;
    onFormSubmit: () => void;
    onOpenSymptomChecker: () => void;
    onOpenReportModal: () => void;
    onNewEncounter: () => void;
    onOpenDischargeModal: () => void;
    onOpenReferralModal: () => void;
    onOpenLamaModal: () => void;
}

const formatVitalsRecord = (vitals: Vitals, tempUnit: 'C' | 'F'): string => {
    const parts = [
        vitals.temp && `T: ${vitals.temp}°${tempUnit}`,
        vitals.hr && `HR: ${vitals.hr}`,
        vitals.rr && `RR: ${vitals.rr}`,
        vitals.bp && `BP: ${vitals.bp}`,
        vitals.spo2 && `SpO2: ${vitals.spo2}%`,
    ].filter(Boolean);
    return parts.join(' | ');
}

type DashboardTab = 'dataEntry' | 'progress' | 'documents';

const EncounterDashboard: React.FC<EncounterDashboardProps> = (props) => {
    const { patientData, setPatientData, diagnoses, progressNotes, setProgressNotes, vitalsHistory, setVitalsHistory, encounterStatus, setEncounterStatus, encounterTags, setEncounterTags, isLoading, error, tempUnit, setTempUnit, onFormSubmit, onOpenSymptomChecker, onOpenReportModal, onNewEncounter, onOpenDischargeModal, onOpenReferralModal, onOpenLamaModal } = props;
    
    const [activeTab, setActiveTab] = useState<DashboardTab>('dataEntry');
    const [newProgressNote, setNewProgressNote] = useState('');
    const [isProcessingLabs, setIsProcessingLabs] = useState<boolean>(false);
    const [isProcessingFindings, setIsProcessingFindings] = useState<boolean>(false);
    const [isProcessingImaging, setIsProcessingImaging] = useState<boolean>(false);
    const [tagInput, setTagInput] = useState('');
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadTarget, setUploadTarget] = useState<'labs' | 'findings' | 'imaging' | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setPatientData(prev => ({ ...prev, [name]: value }));
    };

    const handleVitalsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setPatientData(prev => ({ ...prev, vitals: { ...prev.vitals, [name]: value } }));
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !uploadTarget) return;

        const processImage = async (analyzer: (b64: string, mime: string) => Promise<string>, field: keyof PatientData, setter: (loading: boolean) => void) => {
            setter(true);
            try {
                const reader = new FileReader();
                reader.onloadend = async () => {
                    if (reader.result) {
                        const base64String = (reader.result as string).split(',')[1];
                        const extractedText = await analyzer(base64String, file.type);
                        setPatientData(prev => ({ ...prev, [field]: prev[field] ? `${prev[field]}\n\n--- AI Analysis ---\n${extractedText}` : extractedText }));
                    }
                };
                reader.readAsDataURL(file);
            } catch (err) {
                console.error(`Failed to analyze ${field} image`, err);
            } finally {
                setter(false);
            }
        };

        if (uploadTarget === 'labs') processImage(analyzeLabReportImage, 'labs', setIsProcessingLabs);
        else if (uploadTarget === 'findings') processImage(analyzeExamImage, 'findings', setIsProcessingFindings);
        else if (uploadTarget === 'imaging') processImage(analyzeImagingImage, 'imaging', setIsProcessingImaging);
        
        e.target.value = '';
    };

    const triggerFileUpload = (target: 'labs' | 'findings' | 'imaging') => {
        setUploadTarget(target);
        fileInputRef.current?.click();
    };

    const handleAddProgressNote = () => {
        if (newProgressNote.trim() === '') return;
        const note: ProgressNote = {
            id: new Date().toISOString(),
            timestamp: Date.now(),
            note: newProgressNote.trim(),
        };
        setProgressNotes(prev => [note, ...prev]);
        setNewProgressNote('');
    };

    const handleAddVitalsRecord = () => {
        const hasVitals = Object.values(patientData.vitals).some(v => v.trim() !== '');
        if (!hasVitals) return;

        const record: VitalsRecord = { ...patientData.vitals, timestamp: Date.now() };
        setVitalsHistory(prev => [record, ...prev]);
    };

    const handleAddTag = () => {
        const newTag = tagInput.trim();
        if (newTag && !encounterTags.includes(newTag)) {
            setEncounterTags(prev => [...prev, newTag]);
        }
        setTagInput('');
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setEncounterTags(prev => prev.filter(tag => tag !== tagToRemove));
    };

    const isFormValid = patientData.age && patientData.symptoms;

    const renderTabContent = () => {
        switch (activeTab) {
            case 'dataEntry':
                return (
                    <div className="space-y-6">
                        <ModuleCard title="Patient Details & History" icon={<UserCircleIcon className="h-6 w-6"/>} initialOpen={true}>
                        <div className="space-y-4">
                            <div className="mb-4">
                                <button
                                    type="button"
                                    onClick={onOpenSymptomChecker}
                                    className="w-full flex items-center justify-center text-sm bg-primary-50 text-primary-700 font-semibold py-2 px-3 rounded-md shadow-sm border border-primary-200 hover:bg-primary-100 transition-colors"
                                >
                                    <SparklesIcon className="h-5 w-5 mr-2" />
                                    AI Symptom Checker
                                </button>
                            </div>
                             <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-slate-600 mb-1">Patient Name</label>
                                    <input type="text" name="name" id="name" value={patientData.name} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm" placeholder="e.g., John Doe" />
                                </div>
                                <div/>
                                <div>
                                    <label htmlFor="age" className="block text-sm font-medium text-slate-600 mb-1">Age</label>
                                    <input type="number" name="age" id="age" value={patientData.age} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm" placeholder="e.g., 28" required />
                                </div>
                                <div>
                                    <label htmlFor="sex" className="block text-sm font-medium text-slate-600 mb-1">Sex</label>
                                    <select name="sex" id="sex" value={patientData.sex} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm">
                                        <option>Male</option>
                                        <option>Female</option>
                                        <option>Other</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label htmlFor="symptoms" className="block text-sm font-medium text-slate-600 mb-1">Symptoms & Chief Complaint</label>
                                <textarea name="symptoms" id="symptoms" rows={4} value={patientData.symptoms} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm" placeholder="e.g., Fever, joint pain, rash on cheeks..." required />
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label htmlFor="findings" className="block text-sm font-medium text-slate-600">Examination Findings</label>
                                    <button type="button" onClick={() => triggerFileUpload('findings')} disabled={isProcessingFindings} className="flex items-center text-xs text-primary-600 font-semibold hover:underline disabled:text-slate-400 disabled:cursor-not-allowed">
                                    <CameraIcon className="h-4 w-4 mr-1"/> {isProcessingFindings ? 'Analyzing...' : 'Upload Photo'}
                                    </button>
                                </div>
                                <textarea name="findings" id="findings" rows={3} value={patientData.findings} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm" placeholder="e.g., Malar rash, non-erosive arthritis..." />
                            </div>
                            <div className="border-t pt-4">
                                <button type="button" onClick={() => setIsHistoryOpen(!isHistoryOpen)} className="w-full flex justify-between items-center text-left font-semibold text-slate-700 mb-3 focus:outline-none">
                                    <span>Past History & Allergies</span>
                                    <ChevronDownIcon className={`h-5 w-5 text-slate-500 transform transition-transform ${isHistoryOpen ? 'rotate-180' : ''}`} />
                                </button>
                                {isHistoryOpen && (
                                    <div className="space-y-4">
                                        <div><label htmlFor="pmh" className="block text-sm font-medium text-slate-600 mb-1">Past Medical History</label><textarea name="pmh" id="pmh" rows={2} value={patientData.pmh} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm" placeholder="e.g., Hypertension, Type 2 Diabetes" /></div>
                                        <div><label htmlFor="psh" className="block text-sm font-medium text-slate-600 mb-1">Past Surgical History</label><textarea name="psh" id="psh" rows={2} value={patientData.psh} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm" placeholder="e.g., Appendectomy (2005)" /></div>
                                        <div><label htmlFor="socialHistory" className="block text-sm font-medium text-slate-600 mb-1">Personal/Social History</label><textarea name="socialHistory" id="socialHistory" rows={2} value={patientData.socialHistory} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm" placeholder="e.g., Smoking: 10 pack-years" /></div>
                                        <div><label htmlFor="allergies" className="block text-sm font-medium text-slate-600 mb-1">Allergies</label><textarea name="allergies" id="allergies" rows={2} value={patientData.allergies} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm" placeholder="e.g., Penicillin (rash)" /></div>
                                    </div>
                                )}
                            </div>
                        </div>
                        </ModuleCard>
                        <ModuleCard title="Investigations" icon={<BeakerIcon className="h-6 w-6"/>}>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label htmlFor="labs" className="block text-sm font-medium text-slate-600">Lab Results</label>
                                    <button type="button" onClick={() => triggerFileUpload('labs')} disabled={isProcessingLabs} className="flex items-center text-xs text-primary-600 font-semibold hover:underline disabled:text-slate-400 disabled:cursor-not-allowed">
                                    <CameraIcon className="h-4 w-4 mr-1"/> {isProcessingLabs ? 'Analyzing...' : 'Upload Photo'}
                                    </button>
                                </div>
                                <textarea name="labs" id="labs" rows={3} value={patientData.labs} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm" placeholder="e.g., ANA positive, ESR 50 mm/hr, or upload a photo of the report." />
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label htmlFor="imaging" className="block text-sm font-medium text-slate-600">Imaging Results</label>
                                    <button type="button" onClick={() => triggerFileUpload('imaging')} disabled={isProcessingImaging} className="flex items-center text-xs text-primary-600 font-semibold hover:underline disabled:text-slate-400 disabled:cursor-not-allowed">
                                    <CameraIcon className="h-4 w-4 mr-1"/> {isProcessingImaging ? 'Analyzing...' : 'Upload Photo'}
                                    </button>
                                </div>
                                <textarea name="imaging" id="imaging" rows={3} value={patientData.imaging} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm" placeholder="e.g., Chest X-ray clear, MRI brain shows..." />
                            </div>
                        </div>
                        </ModuleCard>
                    </div>
                );
            case 'progress':
                return (
                    <div className="space-y-6">
                        <ModuleCard title="Vital Signs" icon={<HeartPulseIcon className="h-6 w-6"/>} initialOpen={true}>
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-sm font-medium text-slate-600">Temp Unit:</span>
                            <button type="button" onClick={() => setTempUnit('C')} className={`px-3 py-1 text-sm rounded-md transition-colors ${tempUnit === 'C' ? 'bg-primary-600 text-white shadow-sm' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}>°C</button>
                            <button type="button" onClick={() => setTempUnit('F')} className={`px-3 py-1 text-sm rounded-md transition-colors ${tempUnit === 'F' ? 'bg-primary-600 text-white shadow-sm' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}>°F</button>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3">
                            <div><label htmlFor="temp" className="block text-sm font-medium text-slate-600 mb-1">Temp ({`°${tempUnit}`})</label><input type="text" name="temp" id="temp" value={patientData.vitals.temp} onChange={handleVitalsChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm" placeholder={tempUnit === 'C' ? '38.5' : '101.3'} /></div>
                            <div><label htmlFor="hr" className="block text-sm font-medium text-slate-600 mb-1">HR (bpm)</label><input type="text" name="hr" id="hr" value={patientData.vitals.hr} onChange={handleVitalsChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm" placeholder="e.g., 95" /></div>
                            <div><label htmlFor="rr" className="block text-sm font-medium text-slate-600 mb-1">RR (breaths/min)</label><input type="text" name="rr" id="rr" value={patientData.vitals.rr} onChange={handleVitalsChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm" placeholder="e.g., 18" /></div>
                            <div><label htmlFor="bp" className="block text-sm font-medium text-slate-600 mb-1">BP (mmHg)</label><input type="text" name="bp" id="bp" value={patientData.vitals.bp} onChange={handleVitalsChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm" placeholder="e.g., 120/80" /></div>
                            <div className="col-span-2 sm:col-span-1"><label htmlFor="spo2" className="block text-sm font-medium text-slate-600 mb-1">SpO2 (%)</label><input type="text" name="spo2" id="spo2" value={patientData.vitals.spo2} onChange={handleVitalsChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm" placeholder="e.g., 98" /></div>
                        </div>
                         <div className="mt-4 flex justify-end">
                            <button onClick={handleAddVitalsRecord} className="flex items-center bg-white text-slate-700 text-sm font-semibold py-2 px-3 rounded-md shadow-sm border border-slate-300 hover:bg-slate-50">
                                <PlusCircleIcon className="h-5 w-5 mr-2" />
                                Record Current Vitals
                            </button>
                        </div>
                        {vitalsHistory.length > 0 && (
                            <div className="mt-4 pt-4 border-t">
                                <h4 className="font-semibold text-slate-700 mb-2">Vitals History</h4>
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                                    {vitalsHistory.map(record => (
                                        <div key={record.timestamp} className="text-sm p-2 bg-slate-50 rounded-md border border-slate-200">
                                            <p className="font-medium text-slate-600">{new Date(record.timestamp).toLocaleString()}</p>
                                            <p className="text-slate-500 mt-1">{formatVitalsRecord(record, tempUnit)}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </ModuleCard>
                     <ModuleCard title="Progress Notes" icon={<PencilSquareIcon className="h-6 w-6"/>} initialOpen={true}>
                        <div className="space-y-4">
                            <div>
                                <textarea
                                    value={newProgressNote}
                                    onChange={(e) => setNewProgressNote(e.target.value)}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm"
                                    placeholder="Add a new note..."
                                />
                                <button onClick={handleAddProgressNote} className="mt-2 bg-slate-600 text-white font-semibold py-2 px-4 rounded-md shadow-sm hover:bg-slate-700">
                                    Add Note
                                </button>
                            </div>
                            <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                                {progressNotes.map(note => (
                                    <div key={note.id} className="bg-slate-50 p-3 rounded-md border border-slate-200">
                                        <p className="text-xs text-slate-500 mb-1">{new Date(note.timestamp).toLocaleString()}</p>
                                        <p className="text-sm text-slate-800 whitespace-pre-wrap">{note.note}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </ModuleCard>
                    </div>
                );
            case 'documents':
                 return (
                    <ModuleCard title="Documents & Export" icon={<DocumentTextIcon className="h-6 w-6"/>} initialOpen={true}>
                        <p className="text-slate-600 mb-4 text-sm">Generate standardized medical documents for this encounter. All documents can be edited before final PDF generation.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button onClick={onOpenReportModal} className="flex flex-col items-center justify-center p-4 bg-primary-50 text-primary-800 rounded-lg border-2 border-primary-200 hover:bg-primary-100 transition-colors">
                                <DocumentTextIcon className="h-8 w-8 mb-2"/>
                                <span className="font-semibold">Comprehensive Report</span>
                            </button>
                            <button onClick={onOpenReferralModal} className="flex flex-col items-center justify-center p-4 bg-blue-50 text-blue-800 rounded-lg border-2 border-blue-200 hover:bg-blue-100 transition-colors">
                                <ArrowUpOnSquareIcon className="h-8 w-8 mb-2"/>
                                <span className="font-semibold">Referral Letter</span>
                            </button>
                            <button onClick={onOpenDischargeModal} className="flex flex-col items-center justify-center p-4 bg-green-50 text-green-800 rounded-lg border-2 border-green-200 hover:bg-green-100 transition-colors">
                                <ClipboardDocumentListIcon className="h-8 w-8 mb-2"/>
                                <span className="font-semibold">Discharge Summary</span>
                            </button>
                            <button onClick={onOpenLamaModal} className="flex flex-col items-center justify-center p-4 bg-amber-50 text-amber-800 rounded-lg border-2 border-amber-200 hover:bg-amber-100 transition-colors">
                                <ExclamationCircleIcon className="h-8 w-8 mb-2"/>
                                <span className="font-semibold">LAMA Form</span>
                            </button>
                        </div>
                    </ModuleCard>
                 );
            default:
                return null;
        }
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800">Encounter Dashboard</h2>
                    <p className="text-slate-500">A unified view for patient assessment and diagnosis.</p>
                </div>
                <button onClick={onNewEncounter} className="flex items-center bg-white text-slate-700 font-semibold py-2 px-4 rounded-md shadow-sm border border-slate-300 hover:bg-slate-50">
                    <PlusCircleIcon className="h-5 w-5 mr-2" />
                    New Encounter
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
                {/* Left Column: Workstation */}
                <div className="lg:col-span-3">
                    <div className="mb-4 border-b border-slate-200">
                        <nav className="-mb-px flex space-x-6">
                            <button onClick={() => setActiveTab('dataEntry')} className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'dataEntry' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>
                                Data Entry
                            </button>
                             <button onClick={() => setActiveTab('progress')} className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'progress' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>
                                Progress & Notes
                            </button>
                             <button onClick={() => setActiveTab('documents')} className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'documents' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>
                                Documents & Export
                            </button>
                        </nav>
                    </div>
                    {renderTabContent()}
                </div>

                {/* Right Column: AI Console */}
                <div className="lg:col-span-2">
                    <div className="sticky top-24 space-y-6">
                        <div className="bg-white rounded-lg shadow-md p-6 border border-slate-200">
                            <h3 className="text-xl font-semibold text-slate-800 mb-2">AI Assistant</h3>
                            <p className="text-slate-500 text-sm mb-4">When patient data is entered, click the button below to generate a differential diagnosis.</p>
                            <button onClick={onFormSubmit} disabled={!isFormValid || isLoading} className="w-full flex items-center justify-center bg-primary-600 text-white font-bold py-3 px-4 rounded-lg shadow-md hover:bg-primary-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                                {isLoading ? (<svg className="animate-spin h-5 w-5 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>) : (<AnalyzeIcon className="h-5 w-5 mr-2" />)}
                                {isLoading ? 'Analyzing...' : 'Generate Diagnosis'}
                            </button>
                        </div>
                        
                        <ModuleCard title="Encounter Status & Tags" icon={<TagIcon className="h-6 w-6"/>}>
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label htmlFor="encounter-status" className="block text-sm font-medium text-slate-600 mb-1">Status</label>
                                    <select
                                        id="encounter-status"
                                        value={encounterStatus}
                                        onChange={(e) => setEncounterStatus(e.target.value as Encounter['status'])}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm"
                                    >
                                        <option value="Needs Review">Needs Review</option>
                                        <option value="Completed">Completed</option>
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="encounter-tags" className="block text-sm font-medium text-slate-600 mb-1">Tags</label>
                                    <div className="flex">
                                        <input
                                            type="text"
                                            id="encounter-tags"
                                            value={tagInput}
                                            onChange={(e) => setTagInput(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-l-md shadow-sm"
                                            placeholder="e.g., Follow-up"
                                        />
                                        <button onClick={handleAddTag} className="bg-slate-600 text-white font-semibold px-4 rounded-r-md hover:bg-slate-700">Add</button>
                                    </div>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {encounterTags.map(tag => (
                                            <span key={tag} className="flex items-center bg-slate-200 text-slate-800 text-xs font-semibold px-2 py-1 rounded-full">
                                                {tag}
                                                <button onClick={() => handleRemoveTag(tag)} className="ml-1.5 text-slate-500 hover:text-slate-800">
                                                    <XCircleIcon className="h-4 w-4" />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </ModuleCard>

                        {(diagnoses.length > 0 || isLoading || error) && (
                            <ModuleCard title="AI Analysis & Treatment Plan" icon={<LightBulbIcon className="h-6 w-6"/>} initialOpen={true}>
                                {diagnoses.length > 0 && <ActionButtons onGenerateReport={onOpenReportModal} />}
                                <div className="mt-4 space-y-4">
                                    {isLoading && (
                                        <div className="flex flex-col items-center justify-center text-center p-8 bg-white rounded-lg h-full">
                                            <svg className="animate-spin h-12 w-12 text-primary-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            <h3 className="text-xl font-semibold text-slate-700">Analyzing Patient Data...</h3>
                                            <p className="text-slate-500 mt-2">The AI is processing the information. This may take a moment.</p>
                                        </div>
                                    )}
                                    {error && (
                                        <div className="flex flex-col items-center justify-center text-center p-8 bg-red-50 border border-red-200 rounded-lg h-full">
                                            <ErrorIcon className="h-12 w-12 text-red-500 mb-4"/>
                                            <h3 className="text-xl font-semibold text-red-700">An Error Occurred</h3>
                                            <p className="text-red-600 mt-2">{error}</p>
                                        </div>
                                    )}
                                    {diagnoses.map((diagnosis, index) => (
                                        <DiagnosisCard key={index} diagnosis={diagnosis} index={index} />
                                    ))}
                                </div>
                            </ModuleCard>
                        )}
                    </div>
                </div>
            </div>
            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" capture="environment" className="hidden" />
        </div>
    );
};

export default EncounterDashboard;