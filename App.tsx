
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { PatientData, Diagnosis, Encounter, DoctorDetails, ReportModules } from './types';
import Header from './components/Header';
import DisclaimerFooter from './components/DisclaimerFooter';
import { generateComprehensivePdf } from './utils/reportGenerator';
import SymptomCheckerModal from './components/SymptomCheckerModal';
import InsightsModal from './components/InsightsModal';
import { generateDiagnoses, generatePersonalizedInsights } from './services/geminiService';
import UserProfileModal from './components/UserProfileModal';
import GenerateReportModal from './components/GenerateReportModal';
import EncounterDashboard from './components/EncounterDashboard';
import PatientRecordsView from './components/PatientRecordsView';
import { generateAutoTags } from './services/autoTaggingService';

const BLANK_PATIENT_DATA: PatientData = {
    name: '',
    age: '',
    sex: 'Male',
    symptoms: '',
    findings: '',
    labs: '',
    imaging: '',
    vitals: { temp: '', hr: '', rr: '', bp: '', spo2: '' },
    pmh: '',
    psh: '',
    socialHistory: '',
    allergies: '',
};

const MAX_ENCOUNTERS = 50;

const App: React.FC = () => {
    const [view, setView] = useState<'dashboard' | 'records'>('dashboard');
    const [encounters, setEncounters] = useState<Encounter[]>([]);
    const [currentEncounterId, setCurrentEncounterId] = useState<string | null>(null);

    // Form/Dashboard State
    const [patientData, setPatientData] = useState<PatientData>(BLANK_PATIENT_DATA);
    const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
    const [progressNotes, setProgressNotes] = useState<Encounter['progressNotes']>([]);
    const [vitalsHistory, setVitalsHistory] = useState<Encounter['vitalsHistory']>([]);
    const [encounterStatus, setEncounterStatus] = useState<Encounter['status']>('Needs Review');
    const [encounterTags, setEncounterTags] = useState<Encounter['tags']>([]);

    // UI State
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isSymptomCheckerOpen, setIsSymptomCheckerOpen] = useState<boolean>(false);
    const [isInsightsModalOpen, setIsInsightsModalOpen] = useState<boolean>(false);
    const [tempUnit, setTempUnit] = useState<'C' | 'F'>('C');
    const [isGeneratingInsights, setIsGeneratingInsights] = useState<boolean>(false);
    const [insightsReport, setInsightsReport] = useState<string | null>(null);
    const [insightsError, setInsightsError] = useState<string | null>(null);
    const [doctorDetails, setDoctorDetails] = useState<DoctorDetails>({ name: '', role: '', licenseNumber: '' });
    const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
    
    // Load initial data from localStorage
    useEffect(() => {
        try {
            const savedDetails = localStorage.getItem('medDxDoctorDetails');
            if (savedDetails) setDoctorDetails(JSON.parse(savedDetails));

            const storedEncounters = localStorage.getItem('medDxEncounters');
            if (storedEncounters) setEncounters(JSON.parse(storedEncounters));

        } catch (e) {
            console.error("Failed to load data from localStorage", e);
        }
    }, []);

    // Persist encounters whenever they change
    useEffect(() => {
        try {
            localStorage.setItem('medDxEncounters', JSON.stringify(encounters));
        } catch (error) {
            console.error("Failed to save encounters to localStorage", error);
        }
    }, [encounters]);
    
    // Auto-tagging effect
    useEffect(() => {
        // Debounce this effect to avoid running on every keystroke
        const handler = setTimeout(() => {
            if (view === 'dashboard') {
                const newAutoTags = generateAutoTags(patientData, diagnoses);
                setEncounterTags(prevTags => {
                    const combined = [...prevTags, ...newAutoTags];
                    const uniqueTags = [...new Set(combined)];
                    // Only update state if tags have actually changed to prevent re-renders
                    if (JSON.stringify(prevTags.sort()) !== JSON.stringify(uniqueTags.sort())) {
                       return uniqueTags;
                    }
                    return prevTags;
                });
            }
        }, 500); // 500ms debounce
        
        return () => clearTimeout(handler);

    }, [patientData.labs, patientData.imaging, diagnoses, view]);

    const handleSaveCurrentEncounter = useCallback(() => {
        const encounterData: Omit<Encounter, 'id' | 'timestamp'> = {
            patientData,
            diagnoses,
            progressNotes,
            vitalsHistory,
            status: encounterStatus,
            tags: encounterTags,
        };

        setEncounters(prev => {
            if (currentEncounterId) {
                // Update existing encounter
                return prev.map(enc => enc.id === currentEncounterId ? { ...enc, ...encounterData } : enc);
            } else {
                // Create new encounter
                const newEncounter: Encounter = {
                    ...encounterData,
                    id: new Date().toISOString() + Math.random(),
                    timestamp: Date.now(),
                };
                setCurrentEncounterId(newEncounter.id);
                const updatedEncounters = [newEncounter, ...prev];
                return updatedEncounters.length > MAX_ENCOUNTERS ? updatedEncounters.slice(0, MAX_ENCOUNTERS) : updatedEncounters;
            }
        });
    }, [patientData, diagnoses, progressNotes, vitalsHistory, encounterStatus, encounterTags, currentEncounterId]);
    
    const handleFormSubmit = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setDiagnoses([]);
        try {
            const result = await generateDiagnoses(patientData, tempUnit);
            const autoTags = generateAutoTags(patientData, result);
            const currentTags = encounterTags;
            const newTags = [...new Set([...currentTags, ...autoTags])];

            setDiagnoses(result);
            setEncounterTags(newTags);
            
            const encounterData: Omit<Encounter, 'id' | 'timestamp'> = {
                patientData,
                diagnoses: result,
                progressNotes,
                vitalsHistory,
                status: 'Needs Review',
                tags: newTags,
            };

            setEncounters(prev => {
                if (currentEncounterId) {
                    return prev.map(enc => enc.id === currentEncounterId ? { ...enc, ...encounterData, diagnoses: result, tags: newTags } : enc);
                } else {
                    const newEncounter: Encounter = { ...encounterData, id: new Date().toISOString(), timestamp: Date.now() };
                    setCurrentEncounterId(newEncounter.id);
                    const updatedEncounters = [newEncounter, ...prev];
                    return updatedEncounters.length > MAX_ENCOUNTERS ? updatedEncounters.slice(0, MAX_ENCOUNTERS) : updatedEncounters;
                }
            });

        } catch (err) {
            setError('Failed to generate diagnosis. Please check your input and try again.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [patientData, tempUnit, progressNotes, vitalsHistory, encounterTags, currentEncounterId]);
    
    const handleLoadEncounter = (id: string) => {
        const encounter = encounters.find(e => e.id === id);
        if (encounter) {
            setPatientData(encounter.patientData);
            setDiagnoses(encounter.diagnoses);
            setProgressNotes(encounter.progressNotes || []);
            setVitalsHistory(encounter.vitalsHistory || []);
            setEncounterStatus(encounter.status || 'Needs Review');
            setEncounterTags(encounter.tags || []);
            setCurrentEncounterId(encounter.id);
            setError(null);
            setView('dashboard');
        }
    };

    const handleNewEncounter = () => {
        setPatientData(BLANK_PATIENT_DATA);
        setDiagnoses([]);
        setProgressNotes([]);
        setVitalsHistory([]);
        setEncounterStatus('Needs Review');
        setEncounterTags([]);
        setCurrentEncounterId(null);
        setError(null);
        setView('dashboard');
    };

    const handleOpenInsightsModal = async () => {
        setIsGeneratingInsights(true);
        setInsightsError(null);
        setInsightsReport(null);
        setIsInsightsModalOpen(true);

        if (encounters.length < 5) {
            setInsightsError("Not enough data. Please complete at least 5 encounters to enable insights.");
            setIsGeneratingInsights(false);
            return;
        }

        try {
            const report = await generatePersonalizedInsights(encounters);
            setInsightsReport(report);
        } catch (err) {
            setInsightsError('Failed to generate personalized insights report. Please try again.');
            console.error(err);
        } finally {
            setIsGeneratingInsights(false);
        }
    };

    const handleSaveProfile = (details: DoctorDetails) => {
        setDoctorDetails(details);
        try {
            localStorage.setItem('medDxDoctorDetails', JSON.stringify(details));
        } catch (e) { console.error("Failed to save doctor details", e); }
    };

    const handleGenerateReport = (reportDoctorDetails: DoctorDetails, modules: ReportModules) => {
        generateComprehensivePdf(patientData, diagnoses, reportDoctorDetails, modules);
        setEncounterStatus('Completed'); // Mark as completed when report is generated
    };

    // Auto-save on changes, but only for the dashboard view
    useEffect(() => {
        if (view === 'dashboard' && (patientData !== BLANK_PATIENT_DATA || currentEncounterId)) {
            const handler = setTimeout(() => {
                handleSaveCurrentEncounter();
            }, 1000); // Debounce time
            return () => clearTimeout(handler);
        }
    }, [patientData, diagnoses, progressNotes, vitalsHistory, encounterStatus, encounterTags, view, handleSaveCurrentEncounter]);


    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
            <Header onOpenInsights={handleOpenInsightsModal} onOpenProfile={() => setIsProfileModalOpen(true)} onNavigate={setView} />
            <main className="container mx-auto p-4 lg:p-8">
                {view === 'dashboard' ? (
                     <EncounterDashboard
                        patientData={patientData} setPatientData={setPatientData}
                        diagnoses={diagnoses}
                        progressNotes={progressNotes || []} setProgressNotes={setProgressNotes}
                        vitalsHistory={vitalsHistory || []} setVitalsHistory={setVitalsHistory}
                        encounterStatus={encounterStatus} setEncounterStatus={setEncounterStatus}
                        encounterTags={encounterTags} setEncounterTags={setEncounterTags}
                        isLoading={isLoading} error={error}
                        tempUnit={tempUnit} setTempUnit={setTempUnit}
                        onFormSubmit={handleFormSubmit}
                        onOpenSymptomChecker={() => setIsSymptomCheckerOpen(true)}
                        onOpenReportModal={() => setIsReportModalOpen(true)}
                        onNewEncounter={handleNewEncounter}
                    />
                ) : (
                    <PatientRecordsView encounters={encounters} onLoadEncounter={handleLoadEncounter} />
                )}
            </main>
            <DisclaimerFooter />
            {isSymptomCheckerOpen && <SymptomCheckerModal onClose={() => setIsSymptomCheckerOpen(false)} onPopulate={(symptomText, conditions) => {
                 const conditionsText = conditions.length > 0 ? `\n\nPotential Conditions Identified by AI Symptom Checker:\n- ${conditions.join('\n- ')}` : '';
                 setPatientData(prev => ({...prev, symptoms: `${symptomText}${conditionsText}`}));
                 setIsSymptomCheckerOpen(false);
            }} />}
            {isInsightsModalOpen && <InsightsModal onClose={() => setIsInsightsModalOpen(false)} isLoading={isGeneratingInsights} report={insightsReport} error={insightsError} />}
            {isProfileModalOpen && <UserProfileModal onClose={() => setIsProfileModalOpen(false)} onSave={handleSaveProfile} initialDetails={doctorDetails} />}
            {isReportModalOpen && diagnoses.length > 0 && <GenerateReportModal onClose={() => setIsReportModalOpen(false)} onGenerate={handleGenerateReport} patientData={patientData} diagnoses={diagnoses} initialDoctorDetails={doctorDetails} />}
        </div>
    );
};

export default App;