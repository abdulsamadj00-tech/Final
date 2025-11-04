// This file is conceptually renamed to EncounterView.tsx
// It now orchestrates the entire tab-based interface for a single patient encounter.
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Encounter, PatientData, Diagnosis, Treatment, ProgressNote, VitalsRecord, Vitals, DoctorDetails, ReportModules, MedicationSuggestion } from '../types';
import { generateDiagnoses, generateProgressSummary, generateAIRecommendations, extractTextFromImage, suggestMedications } from '../services/geminiService';
import { generateAutoTags } from '../services/autoTaggingService';
import ModuleCard from './ModuleCard';
import DiagnosisCard from './DiagnosisCard';
import { 
    UserGroupIcon, PillIcon, ChartPieIcon, SparklesIcon, DocumentTextIcon, ChevronDownIcon, XCircleIcon,
    PlusCircleIcon, CheckCircleIcon, BeakerIcon, HeartPulseIcon, SkullIcon, BookOpenIcon, CameraIcon,
    ExclamationCircleIcon, ArrowUpOnSquareIcon, ClipboardDocumentListIcon,
    PencilSquareIcon
} from './icons';
import DischargeSummaryModal from './DischargeSummaryModal';
import ReferralLetterModal from './ReferralLetterModal';
import LamaModal from './LamaModal';
import GenerateReportModal from './GenerateReportModal';
import { generateComprehensivePdf } from '../utils/reportGenerator';

// --- PROPS ---
interface EncounterViewProps {
    encounter: Encounter;
    onSave: (encounter: Encounter) => void;
    doctorDetails: DoctorDetails;
}

// --- TABS ---
type ActiveTab = 'case' | 'treatment' | 'progress' | 'analysis' | 'reports';

const TABS: { id: ActiveTab; name: string; icon: React.ReactNode }[] = [
    { id: 'case', name: 'Patient Case', icon: <UserGroupIcon className="h-5 w-5 mr-2"/> },
    { id: 'treatment', name: 'Diagnosis & Treatment', icon: <PillIcon className="h-5 w-5 mr-2"/> },
    { id: 'progress', name: 'Daily Progress', icon: <ChartPieIcon className="h-5 w-5 mr-2"/> },
    { id: 'analysis', name: 'AI Analysis', icon: <SparklesIcon className="h-5 w-5 mr-2"/> },
    { id: 'reports', name: 'Reports', icon: <DocumentTextIcon className="h-5 w-5 mr-2"/> },
];

// --- MAIN COMPONENT ---
const EncounterView: React.FC<EncounterViewProps> = ({ encounter: initialEncounter, onSave, doctorDetails }) => {
    const [encounter, setEncounter] = useState<Encounter>(initialEncounter);
    const [activeTab, setActiveTab] = useState<ActiveTab>('case');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Debounced save
    useEffect(() => {
        const handler = setTimeout(() => {
            if (JSON.stringify(encounter) !== JSON.stringify(initialEncounter)) {
                onSave(encounter);
            }
        }, 1500);
        return () => clearTimeout(handler);
    }, [encounter, onSave, initialEncounter]);

    // Auto-tagging
     useEffect(() => {
        const handler = setTimeout(() => {
            const newAutoTags = generateAutoTags(encounter.patientData, encounter.provisionalDiagnoses);
            const userTags = encounter.tags.filter(t => !generateAutoTags(initialEncounter.patientData, initialEncounter.provisionalDiagnoses).includes(t));
            const combined = [...new Set([...userTags, ...newAutoTags])];
            
            if (JSON.stringify(encounter.tags.sort()) !== JSON.stringify(combined.sort())) {
                setEncounter(prev => ({...prev, tags: combined }));
            }
        }, 500);
        return () => clearTimeout(handler);
    }, [encounter.patientData, encounter.provisionalDiagnoses]);

    const handleGenerateDiagnoses = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await generateDiagnoses(encounter.patientData, 'C'); // Assuming Celsius for now
            setEncounter(prev => ({ ...prev, provisionalDiagnoses: result }));
            setActiveTab('treatment'); // Move to next logical tab
        } catch (err) {
            setError('Failed to generate diagnosis. Please check your input and try again.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };
    
    const renderTabContent = () => {
        switch (activeTab) {
            case 'case':
                return <PatientCaseTab encounter={encounter} setEncounter={setEncounter} onGenerateDiagnoses={handleGenerateDiagnoses} isLoading={isLoading} error={error} />;
            case 'treatment':
                return <DiagnosisTreatmentTab encounter={encounter} setEncounter={setEncounter} />;
            case 'progress':
                return <ProgressMonitoringTab encounter={encounter} setEncounter={setEncounter} />;
            case 'analysis':
                return <AIAnalysisTab encounter={encounter} setEncounter={setEncounter} />;
            case 'reports':
                return <ReportsTab encounter={encounter} doctorDetails={doctorDetails} />;
            default:
                return null;
        }
    };

    return (
        <div>
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800">{encounter.patientData.name || 'New Patient Case'}</h2>
                    <p className="text-slate-500 text-sm">Case ID: {encounter.id} | Opened: {new Date(encounter.timestamp).toLocaleDateString()}</p>
                </div>
                 <div className="flex flex-wrap gap-2 max-w-xs justify-end">
                    {encounter.tags.map(tag => (
                        <span key={tag} className="bg-slate-200 text-slate-700 text-xs font-semibold px-2 py-1 rounded-full">{tag}</span>
                    ))}
                </div>
            </div>

            <div className="mb-6 border-b border-slate-200">
                <nav className="-mb-px flex space-x-6 overflow-x-auto">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`whitespace-nowrap flex items-center pb-4 px-1 border-b-2 font-medium text-sm ${
                                activeTab === tab.id
                                    ? 'border-primary-500 text-primary-600'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                            }`}
                        >
                            {tab.icon} {tab.name}
                        </button>
                    ))}
                </nav>
            </div>
            
            <div>{renderTabContent()}</div>
        </div>
    );
};

// --- TAB SUB-COMPONENTS ---

// NOTE: In a real application, these would be in separate files.
// They are combined here due to platform constraints.

// --- 1. Patient Case Tab ---
interface PatientCaseTabProps {
    encounter: Encounter;
    setEncounter: React.Dispatch<React.SetStateAction<Encounter>>;
    onGenerateDiagnoses: () => void;
    isLoading: boolean;
    error: string | null;
}
const PatientCaseTab: React.FC<PatientCaseTabProps> = ({ encounter, setEncounter, onGenerateDiagnoses, isLoading, error }) => {
    const investigationTemplates = {
        "CBC": "Hemoglobin: \nWBC: \nPlatelets: ",
        "Renal Panel": "Sodium: \nPotassium: \nChloride: \nBicarbonate: \nBUN: \nCreatinine: ",
        "Liver Panel": "AST: \nALT: \nAlkaline Phosphatase: \nBilirubin (Total): \nAlbumin: ",
        "Thyroid Panel": "TSH: \nFree T4: ",
        "ANA": "Result: \nTiter: \nPattern: ",
    };
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadTarget, setUploadTarget] = useState<string | null>(null);
    const [processingImageFor, setProcessingImageFor] = useState<string | null>(null);

    const handlePatientDataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setEncounter(prev => ({...prev, patientData: {...prev.patientData, [name]: value }}));
    };
    
    const handleInvestigationChange = (key: string, value: string) => {
        setEncounter(prev => ({...prev, patientData: {...prev.patientData, investigations: {...prev.patientData.investigations, [key]: value }}}));
    };

    const addInvestigation = (templateKey: keyof typeof investigationTemplates) => {
         if (!encounter.patientData.investigations[templateKey]) {
             handleInvestigationChange(templateKey, investigationTemplates[templateKey]);
         }
    };
    
    const removeInvestigation = (key: string) => {
        const newInvestigations = {...encounter.patientData.investigations};
        delete newInvestigations[key];
        setEncounter(prev => ({...prev, patientData: {...prev.patientData, investigations: newInvestigations }}));
    };
    
    const blobToBase64 = (blob: Blob): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (reader.result) {
                    resolve((reader.result as string).split(',')[1]);
                } else {
                    reject(new Error("Failed to convert blob to base64."));
                }
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    };

    const triggerFileUpload = (target: string) => {
        setUploadTarget(target);
        fileInputRef.current?.click();
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !uploadTarget) return;

        setProcessingImageFor(uploadTarget);
        try {
            const base64Data = await blobToBase64(file);
            
            let context = "a medical document";
            if (uploadTarget === 'hopi') context = "a patient's history of present illness notes";
            else if (uploadTarget === 'findings') context = "a clinician's examination findings sheet";
            else if (uploadTarget === 'pmh') context = "a patient's past medical history summary";
            else if (uploadTarget === 'psh') context = "a patient's past surgical history summary";
            else if (uploadTarget === 'allergies') context = "a patient's list of allergies";
            else if (Object.keys(investigationTemplates).includes(uploadTarget)) {
                context = `a lab report for ${uploadTarget}`;
            }

            const extractedText = await extractTextFromImage(base64Data, file.type, context);
            const formattedText = `\n\n--- Extracted from image ---\n${extractedText}`;

            if (['hopi', 'findings', 'pmh', 'psh', 'allergies', 'primaryComplaint'].includes(uploadTarget)) {
                setEncounter(prev => {
                    const currentVal = prev.patientData[uploadTarget as keyof PatientData] as string;
                    return {...prev, patientData: {...prev.patientData, [uploadTarget]: currentVal + formattedText}};
                });
            } else { // It's an investigation
                 setEncounter(prev => {
                     const currentVal = prev.patientData.investigations[uploadTarget] || '';
                     return {...prev, patientData: {...prev.patientData, investigations: {...prev.patientData.investigations, [uploadTarget]: currentVal + formattedText }}};
                 });
            }

        } catch (err) {
            console.error("Image analysis failed:", err);
            alert(`Image analysis failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } finally {
            setProcessingImageFor(null);
            setUploadTarget(null);
            if (fileInputRef.current) fileInputRef.current.value = ''; // Reset file input
        }
    };


    const isFormValid = encounter.patientData.age && encounter.patientData.primaryComplaint;
    
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" capture="environment" className="hidden" />
            <div className="space-y-6">
                <ModuleCard title="Patient Demographics" icon={<UserGroupIcon className="h-6 w-6"/>} initialOpen>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">Patient Name</label>
                            <input name="name" value={encounter.patientData.name} onChange={handlePatientDataChange} className="w-full px-3 py-2 border border-slate-300 rounded-md" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">Age</label>
                                <input name="age" type="number" value={encounter.patientData.age} onChange={handlePatientDataChange} className="w-full px-3 py-2 border border-slate-300 rounded-md" required/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">Sex</label>
                                <select name="sex" value={encounter.patientData.sex} onChange={handlePatientDataChange} className="w-full px-3 py-2 border border-slate-300 rounded-md">
                                    <option>Male</option><option>Female</option><option>Other</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </ModuleCard>
                <ModuleCard title="History & Examination" icon={<ClipboardDocumentListIcon className="h-6 w-6"/>} initialOpen>
                     <div className="space-y-4">
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="block text-sm font-medium text-slate-600">Primary Complaint(s)</label>
                                <button type="button" onClick={() => triggerFileUpload('primaryComplaint')} disabled={!!processingImageFor} className="flex items-center text-xs text-primary-600 font-semibold hover:underline disabled:text-slate-400 disabled:cursor-not-allowed"><CameraIcon className="h-4 w-4 mr-1"/>{processingImageFor === 'primaryComplaint' ? 'Analyzing...' : 'Upload'}</button>
                            </div>
                            <textarea name="primaryComplaint" value={encounter.patientData.primaryComplaint} onChange={handlePatientDataChange} rows={2} className="w-full px-3 py-2 border border-slate-300 rounded-md" required/>
                        </div>
                         <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="block text-sm font-medium text-slate-600">History of Present Illness (HOPI)</label>
                                <button type="button" onClick={() => triggerFileUpload('hopi')} disabled={!!processingImageFor} className="flex items-center text-xs text-primary-600 font-semibold hover:underline disabled:text-slate-400 disabled:cursor-not-allowed"><CameraIcon className="h-4 w-4 mr-1"/>{processingImageFor === 'hopi' ? 'Analyzing...' : 'Upload'}</button>
                            </div>
                            <textarea name="hopi" value={encounter.patientData.hopi} onChange={handlePatientDataChange} rows={4} className="w-full px-3 py-2 border border-slate-300 rounded-md" />
                        </div>
                         <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="block text-sm font-medium text-slate-600">Examination Findings</label>
                                <button type="button" onClick={() => triggerFileUpload('findings')} disabled={!!processingImageFor} className="flex items-center text-xs text-primary-600 font-semibold hover:underline disabled:text-slate-400 disabled:cursor-not-allowed"><CameraIcon className="h-4 w-4 mr-1"/>{processingImageFor === 'findings' ? 'Analyzing...' : 'Upload'}</button>
                            </div>
                            <textarea name="findings" value={encounter.patientData.findings} onChange={handlePatientDataChange} rows={3} className="w-full px-3 py-2 border border-slate-300 rounded-md" />
                        </div>
                         <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="block text-sm font-medium text-slate-600">Past Medical History (PMH)</label>
                                <button type="button" onClick={() => triggerFileUpload('pmh')} disabled={!!processingImageFor} className="flex items-center text-xs text-primary-600 font-semibold hover:underline disabled:text-slate-400 disabled:cursor-not-allowed"><CameraIcon className="h-4 w-4 mr-1"/>{processingImageFor === 'pmh' ? 'Analyzing...' : 'Upload'}</button>
                            </div>
                            <textarea name="pmh" value={encounter.patientData.pmh} onChange={handlePatientDataChange} rows={2} className="w-full px-3 py-2 border border-slate-300 rounded-md" />
                        </div>
                         <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="block text-sm font-medium text-slate-600">Past Surgical History (PSH)</label>
                                <button type="button" onClick={() => triggerFileUpload('psh')} disabled={!!processingImageFor} className="flex items-center text-xs text-primary-600 font-semibold hover:underline disabled:text-slate-400 disabled:cursor-not-allowed"><CameraIcon className="h-4 w-4 mr-1"/>{processingImageFor === 'psh' ? 'Analyzing...' : 'Upload'}</button>
                            </div>
                            <textarea name="psh" value={encounter.patientData.psh} onChange={handlePatientDataChange} rows={2} className="w-full px-3 py-2 border border-slate-300 rounded-md" />
                        </div>
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="block text-sm font-medium text-slate-600">Allergies</label>
                                <button type="button" onClick={() => triggerFileUpload('allergies')} disabled={!!processingImageFor} className="flex items-center text-xs text-primary-600 font-semibold hover:underline disabled:text-slate-400 disabled:cursor-not-allowed"><CameraIcon className="h-4 w-4 mr-1"/>{processingImageFor === 'allergies' ? 'Analyzing...' : 'Upload'}</button>
                            </div>
                            <textarea name="allergies" value={encounter.patientData.allergies} onChange={handlePatientDataChange} rows={2} className="w-full px-3 py-2 border border-slate-300 rounded-md" />
                        </div>
                     </div>
                </ModuleCard>
            </div>
            <div className="space-y-6">
                <ModuleCard title="Investigations" icon={<BeakerIcon className="h-6 w-6"/>} initialOpen>
                     <div className="space-y-4">
                        <div className="p-3 bg-slate-50 rounded-md">
                            <label className="block text-sm font-medium text-slate-600 mb-2">Add Investigation Template:</label>
                             <div className="flex flex-wrap gap-2">
                                {Object.keys(investigationTemplates).map(key => (
                                    <button key={key} onClick={() => addInvestigation(key as any)} className="px-2 py-1 text-xs bg-white border border-slate-300 rounded-md hover:bg-slate-100">
                                        + {key}
                                    </button>
                                ))}
                             </div>
                        </div>
                        {Object.entries(encounter.patientData.investigations).map(([key, value]) => (
                            <div key={key}>
                                 <div className="flex justify-between items-center mb-1">
                                    <label className="block text-sm font-medium text-slate-600">{key}</label>
                                    <div className="flex items-center gap-2">
                                        <button type="button" onClick={() => triggerFileUpload(key)} disabled={!!processingImageFor} className="flex items-center text-xs text-primary-600 font-semibold hover:underline disabled:text-slate-400 disabled:cursor-not-allowed"><CameraIcon className="h-4 w-4 mr-1"/>{processingImageFor === key ? 'Analyzing...' : 'Upload'}</button>
                                        <button onClick={() => removeInvestigation(key)} className="text-red-500 hover:text-red-700">
                                            <XCircleIcon className="h-5 w-5"/>
                                        </button>
                                    </div>
                                </div>
                                <textarea value={value} onChange={e => handleInvestigationChange(key, e.target.value)} rows={3} className="w-full px-3 py-2 border border-slate-300 rounded-md" />
                            </div>
                        ))}
                     </div>
                </ModuleCard>
                 <div className="sticky top-24">
                    <ModuleCard title="Generate Provisional Diagnosis" icon={<SparklesIcon className="h-6 w-6"/>} initialOpen>
                        <p className="text-sm text-slate-600 mb-4">Once all relevant data is entered, let the AI assistant analyze the case to generate a differential diagnosis.</p>
                        <button onClick={onGenerateDiagnoses} disabled={!isFormValid || isLoading || !!processingImageFor} className="w-full flex items-center justify-center bg-primary-600 text-white font-bold py-3 px-4 rounded-lg shadow-md hover:bg-primary-700 disabled:bg-slate-400 transition-colors">
                            {isLoading ? 'Analyzing...' : 'Generate Diagnosis'}
                        </button>
                         {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
                    </ModuleCard>
                 </div>
            </div>
        </div>
    );
};

// --- 2. Diagnosis & Treatment Tab ---
interface DiagnosisTreatmentTabProps {
    encounter: Encounter;
    setEncounter: React.Dispatch<React.SetStateAction<Encounter>>;
}
const DiagnosisTreatmentTab: React.FC<DiagnosisTreatmentTabProps> = ({ encounter, setEncounter }) => {
    const [medicationSuggestions, setMedicationSuggestions] = useState<MedicationSuggestion[]>([]);
    const [isSuggestingMeds, setIsSuggestingMeds] = useState(false);
    const [suggestionError, setSuggestionError] = useState<string | null>(null);
    
    const setFinalDiagnosis = (dx: Diagnosis) => {
        setEncounter(prev => ({...prev, finalDiagnosis: dx }));
    };

    const handleSuggestMedications = async () => {
        if (!encounter.finalDiagnosis) return;
        setIsSuggestingMeds(true);
        setSuggestionError(null);
        setMedicationSuggestions([]);
        try {
            const suggestions = await suggestMedications(encounter.finalDiagnosis.diagnosisName);
            setMedicationSuggestions(suggestions);
        } catch (err) {
            setSuggestionError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsSuggestingMeds(false);
        }
    };

    const addTreatment = (tx: Partial<Treatment> | MedicationSuggestion) => {
        const isSuggestion = 'guideline' in tx;

        const newTreatment: Treatment = {
            id: `tx-${Date.now()}`,
            drugName: tx.drugName || '',
            dosage: tx.dosage || '',
            duration: isSuggestion ? 'As per guidelines' : (tx as Partial<Treatment>).duration || '',
            line: tx.line || 'First-line',
            source: isSuggestion ? 'AI-Recommended' : (tx as Partial<Treatment>).source || 'Clinician-Decided',
            rationale: tx.rationale || '',
            isActive: true,
            history: [],
        };
        setEncounter(prev => ({...prev, treatments: [...prev.treatments, newTreatment]}));
    };

    const toggleTreatmentStatus = (id: string) => {
        setEncounter(prev => ({...prev, treatments: prev.treatments.map(tx => 
            tx.id === id ? {...tx, isActive: !tx.isActive, history: [...tx.history, { date: Date.now(), reason: tx.isActive ? 'Deactivated' : 'Reactivated'}]} : tx
        )}));
    };

    return (
        <div className="space-y-6">
            <ModuleCard title="Provisional Diagnoses" icon={<BeakerIcon className="h-6 w-6"/>} initialOpen>
                 {encounter.provisionalDiagnoses.length > 0 ? (
                    <div className="space-y-4">
                        {encounter.provisionalDiagnoses.map((dx, index) => (
                           <div key={index} className="relative">
                               <DiagnosisCard diagnosis={dx} index={index} />
                               {!encounter.finalDiagnosis && (
                                   <button onClick={() => setFinalDiagnosis(dx)} className="absolute top-3 right-3 text-xs bg-green-600 text-white font-semibold px-2 py-1 rounded-md hover:bg-green-700">
                                       Set as Final
                                   </button>
                               )}
                           </div>
                        ))}
                    </div>
                ) : <p className="text-slate-500">No provisional diagnoses generated yet. Go to the 'Patient Case' tab to generate them.</p> }
            </ModuleCard>

            <ModuleCard title="Final Diagnosis & Treatment Plan" icon={<PillIcon className="h-6 w-6"/>} initialOpen>
                 {encounter.finalDiagnosis ? (
                    <div className="p-4 bg-primary-50 border border-primary-200 rounded-lg mb-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <h4 className="font-bold text-lg text-primary-800">{encounter.finalDiagnosis.diagnosisName}</h4>
                                <p className="text-sm text-primary-700">ICD Code: {encounter.finalDiagnosis.icdCode}</p>
                            </div>
                            <button 
                                onClick={handleSuggestMedications} 
                                disabled={isSuggestingMeds}
                                className="flex items-center text-sm bg-primary-600 text-white font-semibold py-2 px-3 rounded-md shadow-sm hover:bg-primary-700 disabled:bg-slate-400"
                            >
                                <SparklesIcon className="h-5 w-5 mr-2"/>
                                {isSuggestingMeds ? 'Suggesting...' : 'Suggest Medications'}
                            </button>
                        </div>
                    </div>
                 ) : <p className="text-slate-500 mb-4">No final diagnosis has been set.</p>}
                 
                {isSuggestingMeds && (
                    <div className="text-center p-4">
                        <svg className="animate-spin h-8 w-8 text-primary-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    </div>
                )}
                {suggestionError && <p className="text-red-600 text-sm">{suggestionError}</p>}
                {medicationSuggestions.length > 0 && (
                    <div className="mb-4 space-y-3">
                        <h4 className="font-semibold text-slate-700">AI Medication Suggestions</h4>
                        {medicationSuggestions.map((sugg, index) => (
                            <div key={index} className="bg-slate-50 p-3 rounded-md border border-slate-200 flex justify-between items-start">
                                <div>
                                    <p className="font-bold text-slate-800">{sugg.drugName} <span className="font-normal text-sm">{sugg.dosage}</span></p>
                                    <p className="text-xs text-slate-500">Guideline: {sugg.guideline} | {sugg.line}</p>
                                    <p className="text-sm mt-1 text-slate-600"><strong>Rationale:</strong> {sugg.rationale}</p>
                                </div>
                                <button onClick={() => addTreatment(sugg)} className="text-xs bg-green-600 text-white font-semibold px-2 py-1 rounded-md hover:bg-green-700 ml-4 flex-shrink-0">
                                    Add to Plan
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                 <h4 className="font-semibold text-slate-700 mb-2">Current Treatments</h4>
                 <div className="space-y-3">
                    {encounter.treatments.map(tx => (
                        <div key={tx.id} className={`p-3 rounded-md border ${tx.isActive ? 'bg-white' : 'bg-slate-100 opacity-70'}`}>
                             <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-bold text-slate-800">{tx.drugName} <span className="font-normal text-sm">{tx.dosage}</span></p>
                                    <p className="text-xs text-slate-500">{tx.duration} | {tx.line} | Source: {tx.source}</p>
                                    <p className="text-sm mt-1 text-slate-600"><strong>Rationale:</strong> {tx.rationale}</p>
                                </div>
                                <button onClick={() => toggleTreatmentStatus(tx.id)} className={`px-2 py-1 text-xs font-semibold rounded-md ${tx.isActive ? 'bg-amber-500 text-white' : 'bg-green-500 text-white'}`}>
                                    {tx.isActive ? 'Deactivate' : 'Reactivate'}
                                </button>
                             </div>
                        </div>
                    ))}
                 </div>
                 <div className="mt-4 pt-4 border-t">
                    <button onClick={() => addTreatment({ drugName: "New Medication", rationale: "Clinician decision" })} className="flex items-center text-sm bg-slate-600 text-white font-semibold py-2 px-3 rounded-md shadow-sm hover:bg-slate-700">
                        <PlusCircleIcon className="h-5 w-5 mr-2"/> Add New Treatment
                    </button>
                 </div>
            </ModuleCard>
        </div>
    );
};

// --- 3. Progress Monitoring Tab ---
interface ProgressMonitoringTabProps {
    encounter: Encounter;
    setEncounter: React.Dispatch<React.SetStateAction<Encounter>>;
}

// Simple Line Chart Component
const LineChart: React.FC<{ data: { value: number; label: string }[], color: string }> = ({ data, color }) => {
    if (data.length < 2) return <div className="text-center text-sm text-slate-400 h-[100px] flex items-center justify-center">Not enough data for a trend line.</div>;
    const width = 300, height = 100, padding = 20;
    const values = data.map(d => d.value);
    const min = Math.min(...values) * 0.95;
    const max = Math.max(...values) * 1.05;

    const points = data.map((point, i) => {
        const x = (width - padding * 2) / (data.length - 1) * i + padding;
        const y = height - padding - ((point.value - min) / (max - min)) * (height - padding * 2);
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
            <polyline fill="none" stroke={color} strokeWidth="2" points={points} />
            {data.map((point, i) => {
                 const x = (width - padding * 2) / (data.length - 1) * i + padding;
                 const y = height - padding - ((point.value - min) / (max - min)) * (height - padding * 2);
                 return <circle key={i} cx={x} cy={y} r="3" fill={color} />;
            })}
        </svg>
    );
};

const ProgressMonitoringTab: React.FC<ProgressMonitoringTabProps> = ({ encounter, setEncounter }) => {
    const BLANK_VITALS: Vitals = { temp: '', hr: '', rr: '', bp: '', spo2: '' };
    const [newNote, setNewNote] = useState('');
    const [newVitals, setNewVitals] = useState<Vitals>(BLANK_VITALS);
    const [newSymptomScore, setNewSymptomScore] = useState<number>(5);
    const [summary, setSummary] = useState('');
    const [isSummarizing, setIsSummarizing] = useState(false);

    const handleVitalsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setNewVitals(prev => ({ ...prev, [name]: value }));
    };

    const handleAddVitalsRecord = () => {
        // Fix: Add a type guard to ensure `v` is a string before calling `trim()`.
        // `Object.values()` can return `unknown[]`, causing a type error.
        const hasAtLeastOneValue = Object.values(newVitals).some(v => typeof v === 'string' && v.trim() !== '');
        if (!hasAtLeastOneValue) {
            alert("Please enter at least one vital sign value.");
            return;
        }
        const vitalsRecord: VitalsRecord = { ...newVitals, timestamp: Date.now() };
        setEncounter(prev => ({
            ...prev,
            vitalsHistory: [vitalsRecord, ...prev.vitalsHistory]
        }));
        setNewVitals(BLANK_VITALS); // Reset form
    };

    const addProgressNote = () => {
        if (!newNote.trim()) return;
        const note: ProgressNote = { 
            id: `note-${Date.now()}`, 
            timestamp: Date.now(), 
            note: newNote,
            symptomScore: newSymptomScore
        };
        setEncounter(prev => ({...prev, progressNotes: [note, ...prev.progressNotes]}));
        setNewNote('');
    };
    
    const handleGenerateSummary = async () => {
        setIsSummarizing(true);
        const result = await generateProgressSummary(encounter.progressNotes, encounter.vitalsHistory);
        setSummary(result);
        setIsSummarizing(false);
    };

    const bpData = encounter.vitalsHistory.map(v => ({ value: parseInt(v.bp.split('/')[0]) || 0, label: new Date(v.timestamp).toLocaleTimeString() })).reverse();
    const hrData = encounter.vitalsHistory.map(v => ({ value: parseInt(v.hr) || 0, label: new Date(v.timestamp).toLocaleTimeString() })).reverse();
    const symptomScoreData = encounter.progressNotes.filter(n => n.symptomScore !== undefined).map(n => ({ value: n.symptomScore!, label: new Date(n.timestamp).toLocaleTimeString() })).reverse();
    
    return (
        <div className="space-y-6">
            <ModuleCard title="Daily Progress Notes & Symptom Tracker" icon={<PencilSquareIcon className="h-6 w-6"/>} initialOpen>
                <div>
                    <textarea value={newNote} onChange={e => setNewNote(e.target.value)} rows={4} className="w-full px-3 py-2 border border-slate-300 rounded-md" placeholder="Enter today's progress, new complaints, or observations..."/>
                    <div className="my-3">
                        <label htmlFor="symptomScore" className="block text-sm font-medium text-slate-600 mb-1">Symptom Severity (1=Mild, 10=Severe): {newSymptomScore}</label>
                        <input type="range" id="symptomScore" min="1" max="10" value={newSymptomScore} onChange={e => setNewSymptomScore(parseInt(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary-600"/>
                    </div>
                    <button onClick={addProgressNote} className="mt-2 flex items-center text-sm bg-slate-600 text-white font-semibold py-2 px-3 rounded-md shadow-sm hover:bg-slate-700">
                        <PlusCircleIcon className="h-5 w-5 mr-2"/> Add Note
                    </button>
                </div>
                <div className="mt-4 pt-4 border-t max-h-96 overflow-y-auto space-y-3 pr-2">
                    {encounter.progressNotes.map(note => (
                        <div key={note.id} className="bg-slate-50 p-3 rounded-md border border-slate-200">
                             <div className="flex justify-between items-center">
                                <p className="text-xs text-slate-500 mb-1">{new Date(note.timestamp).toLocaleString()}</p>
                                {note.symptomScore && <p className="text-xs font-semibold bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">Score: {note.symptomScore}</p>}
                             </div>
                             <p className="text-sm text-slate-800 whitespace-pre-wrap">{note.note}</p>
                        </div>
                    ))}
                </div>
            </ModuleCard>

            <ModuleCard title="Record New Vitals" icon={<HeartPulseIcon className="h-6 w-6"/>} initialOpen>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div><label className="block text-sm font-medium text-slate-600 mb-1">Temp (°C)</label><input type="text" name="temp" value={newVitals.temp} onChange={handleVitalsChange} className="w-full px-3 py-2 border border-slate-300 rounded-md"/></div>
                    <div><label className="block text-sm font-medium text-slate-600 mb-1">HR (bpm)</label><input type="text" name="hr" value={newVitals.hr} onChange={handleVitalsChange} className="w-full px-3 py-2 border border-slate-300 rounded-md"/></div>
                    <div><label className="block text-sm font-medium text-slate-600 mb-1">RR (breaths/min)</label><input type="text" name="rr" value={newVitals.rr} onChange={handleVitalsChange} className="w-full px-3 py-2 border border-slate-300 rounded-md"/></div>
                    <div><label className="block text-sm font-medium text-slate-600 mb-1">BP (mmHg)</label><input type="text" name="bp" value={newVitals.bp} onChange={handleVitalsChange} className="w-full px-3 py-2 border border-slate-300 rounded-md"/></div>
                    <div><label className="block text-sm font-medium text-slate-600 mb-1">SpO2 (%)</label><input type="text" name="spo2" value={newVitals.spo2} onChange={handleVitalsChange} className="w-full px-3 py-2 border border-slate-300 rounded-md"/></div>
                </div>
                <button onClick={handleAddVitalsRecord} className="mt-4 flex items-center text-sm bg-primary-600 text-white font-semibold py-2 px-3 rounded-md shadow-sm hover:bg-primary-700">
                    <PlusCircleIcon className="h-5 w-5 mr-2"/> Add Vitals Record
                </button>
                <div className="mt-4 pt-4 border-t">
                    <h4 className="font-semibold text-slate-700 mb-2">Vitals History</h4>
                    <div className="max-h-60 overflow-y-auto">
                        <table className="w-full text-sm text-left text-slate-500">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-50 sticky top-0">
                                <tr>
                                    <th scope="col" className="px-4 py-2">Time</th><th scope="col" className="px-4 py-2">BP</th><th scope="col" className="px-4 py-2">HR</th><th scope="col" className="px-4 py-2">RR</th><th scope="col" className="px-4 py-2">SpO2</th><th scope="col" className="px-4 py-2">Temp</th>
                                </tr>
                            </thead>
                            <tbody>
                                {encounter.vitalsHistory.map(v => (
                                    <tr key={v.timestamp} className="bg-white border-b"><td className="px-4 py-2 font-medium text-slate-900">{new Date(v.timestamp).toLocaleString()}</td><td className="px-4 py-2">{v.bp || '-'}</td><td className="px-4 py-2">{v.hr || '-'}</td><td className="px-4 py-2">{v.rr || '-'}</td><td className="px-4 py-2">{v.spo2 || '-'}</td><td className="px-4 py-2">{v.temp || '-'}</td></tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </ModuleCard>

            <ModuleCard title="Trends & Summary" icon={<ChartPieIcon className="h-6 w-6"/>}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div><h5 className="text-sm font-medium text-slate-600">Systolic BP (mmHg)</h5><LineChart data={bpData} color="#ef4444" /></div>
                        <div><h5 className="text-sm font-medium text-slate-600">Heart Rate (bpm)</h5><LineChart data={hrData} color="#3b82f6" /></div>
                        <div><h5 className="text-sm font-medium text-slate-600">Symptom Score Trend</h5><LineChart data={symptomScoreData} color="#84cc16" /></div>
                    </div>
                     <div>
                        <h4 className="font-semibold text-slate-700 mb-2">AI Progress Summary</h4>
                        <button onClick={handleGenerateSummary} disabled={isSummarizing} className="mb-3 flex items-center text-sm bg-primary-600 text-white font-semibold py-2 px-3 rounded-md shadow-sm hover:bg-primary-700 disabled:bg-slate-400">
                           {isSummarizing ? "Generating..." : "Generate Short AI Summary"}
                        </button>
                        {isSummarizing ? <p className="text-slate-500">Analyzing...</p> : (
                            summary && <div className="p-3 bg-primary-50 border border-primary-200 rounded-md text-sm text-primary-800">{summary}</div>
                        )}
                    </div>
                </div>
            </ModuleCard>
        </div>
    );
};

// --- 4. AI Analysis Tab ---
interface AIAnalysisTabProps {
    encounter: Encounter;
    setEncounter: React.Dispatch<React.SetStateAction<Encounter>>;
}
const AIAnalysisTab: React.FC<AIAnalysisTabProps> = ({ encounter, setEncounter }) => {
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const handleAnalysis = async () => {
        setIsAnalyzing(true);
        const recommendations = await generateAIRecommendations(encounter);
        setEncounter(prev => ({ ...prev, aiRecommendations: recommendations }));
        setIsAnalyzing(false);
    };

    const severityStyles = {
        'Mild Adjustment': { icon: '🔹', bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200' },
        'Significant Review Needed': { icon: '🔸', bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
        'Urgent Action Required': { icon: '🔴', bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-200' },
    };

    return (
         <ModuleCard title="AI-Driven Cause Detection & Future Steps" icon={<SparklesIcon className="h-6 w-6"/>} initialOpen>
            <p className="text-slate-600 text-sm mb-4">Analyze the patient's entire case history and progress to detect underlying causes for their condition's trend and get recommendations for next steps.</p>
            <button onClick={handleAnalysis} disabled={isAnalyzing} className="mb-6 flex items-center text-sm bg-primary-600 text-white font-semibold py-2 px-3 rounded-md shadow-sm hover:bg-primary-700 disabled:bg-slate-400">
                {isAnalyzing ? "Analyzing Full Case..." : "Run AI Analysis"}
            </button>
            
            {isAnalyzing && <p>Analyzing...</p>}
            
            <div className="space-y-4">
                {encounter.aiRecommendations.map(rec => {
                    const styles = severityStyles[rec.severity];
                    return (
                        <div key={rec.id} className={`p-4 rounded-lg border ${styles.bg} ${styles.border}`}>
                            <h4 className={`font-bold ${styles.text}`}>{styles.icon} {rec.severity}</h4>
                            <p className={`text-sm mt-2 ${styles.text}`}><strong>Recommendation:</strong> {rec.recommendation}</p>
                            <p className={`text-xs mt-1 italic ${styles.text} opacity-80`}><strong>AI's Rationale:</strong> {rec.causeAnalysis}</p>
                        </div>
                    );
                })}
            </div>
         </ModuleCard>
    );
};

// --- 5. Reports Tab ---
interface ReportsTabProps {
    encounter: Encounter;
    doctorDetails: DoctorDetails;
}
const ReportsTab: React.FC<ReportsTabProps> = ({ encounter, doctorDetails }) => {
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [isDischargeModalOpen, setIsDischargeModalOpen] = useState(false);
    const [isReferralModalOpen, setIsReferralModalOpen] = useState(false);
    const [isLamaModalOpen, setIsLamaModalOpen] = useState(false);

    const handleGenerateComprehensiveReport = (details: DoctorDetails, modules: ReportModules) => {
        generateComprehensivePdf(encounter.patientData, encounter.provisionalDiagnoses, details, modules);
    };

    return (
        <>
            <ModuleCard title="Generate & Download Reports" icon={<DocumentTextIcon className="h-6 w-6"/>} initialOpen>
                <p className="text-slate-600 mb-4 text-sm">Generate standardized medical documents for this encounter. All documents are editable before final PDF generation.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button onClick={() => setIsReportModalOpen(true)} className="flex flex-col items-center justify-center p-4 bg-primary-50 text-primary-800 rounded-lg border-2 border-primary-200 hover:bg-primary-100 transition-colors">
                        <DocumentTextIcon className="h-8 w-8 mb-2"/>
                        <span className="font-semibold">Comprehensive Report</span>
                    </button>
                    <button onClick={() => setIsReferralModalOpen(true)} className="flex flex-col items-center justify-center p-4 bg-blue-50 text-blue-800 rounded-lg border-2 border-blue-200 hover:bg-blue-100 transition-colors">
                        <ArrowUpOnSquareIcon className="h-8 w-8 mb-2"/>
                        <span className="font-semibold">Referral Letter</span>
                    </button>
                    <button onClick={() => setIsDischargeModalOpen(true)} className="flex flex-col items-center justify-center p-4 bg-green-50 text-green-800 rounded-lg border-2 border-green-200 hover:bg-green-100 transition-colors">
                        <ClipboardDocumentListIcon className="h-8 w-8 mb-2"/>
                        <span className="font-semibold">Discharge Summary</span>
                    </button>
                    <button onClick={() => setIsLamaModalOpen(true)} className="flex flex-col items-center justify-center p-4 bg-amber-50 text-amber-800 rounded-lg border-2 border-amber-200 hover:bg-amber-100 transition-colors">
                        <ExclamationCircleIcon className="h-8 w-8 mb-2"/>
                        <span className="font-semibold">LAMA Form</span>
                    </button>
                </div>
            </ModuleCard>

            {/* Modals */}
            {isReportModalOpen && <GenerateReportModal onClose={() => setIsReportModalOpen(false)} onGenerate={handleGenerateComprehensiveReport} patientData={encounter.patientData} diagnoses={encounter.provisionalDiagnoses} initialDoctorDetails={doctorDetails} />}
            {isDischargeModalOpen && <DischargeSummaryModal onClose={() => setIsDischargeModalOpen(false)} patientData={encounter.patientData} finalDiagnosis={encounter.finalDiagnosis} doctorDetails={doctorDetails} />}
            {isReferralModalOpen && <ReferralLetterModal onClose={() => setIsReferralModalOpen(false)} patientData={encounter.patientData} diagnoses={encounter.provisionalDiagnoses} doctorDetails={doctorDetails} />}
            {isLamaModalOpen && <LamaModal onClose={() => setIsLamaModalOpen(false)} patientData={encounter.patientData} doctorDetails={doctorDetails} />}
        </>
    );
};


export default EncounterView;