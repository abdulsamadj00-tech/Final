
import React, { useState, useCallback, useEffect } from 'react';
import { PatientData, Diagnosis, Encounter, DoctorDetails, ReportModules, Treatment, ProgressNote, VitalsRecord, AIRecommendation } from './types';
import Header from './components/Header';
import DisclaimerFooter from './components/DisclaimerFooter';
import { generateComprehensivePdf, generateDischargeSummaryPdf, generateLamaPdf, generateReferralPdf } from './utils/reportGenerator';
import InsightsModal from './components/InsightsModal';
import { generateDiagnoses, generatePersonalizedInsights, generateAIRecommendations, generateProgressSummary } from './services/geminiService';
import UserProfileModal from './components/UserProfileModal';
import PatientRecordsView from './components/PatientRecordsView';
import EncounterView from './components/EncounterDashboard';

const BLANK_PATIENT_DATA: PatientData = {
    name: '',
    age: '',
    sex: 'Male',
    primaryComplaint: '',
    hopi: '',
    findings: '',
    vitals: { temp: '', hr: '', rr: '', bp: '', spo2: '' },
    pmh: '',
    psh: '',
    socialHistory: '',
    allergies: '',
    investigations: {},
};

const BLANK_ENCOUNTER: Omit<Encounter, 'id' | 'timestamp'> = {
    patientData: BLANK_PATIENT_DATA,
    provisionalDiagnoses: [],
    finalDiagnosis: null,
    treatments: [],
    progressNotes: [],
    vitalsHistory: [],
    aiRecommendations: [],
    status: 'Active',
    tags: [],
};

const MAX_ENCOUNTERS = 50;

const App: React.FC = () => {
    const [activeView, setActiveView] = useState<'records' | 'encounter'>('records');
    const [encounters, setEncounters] = useState<Encounter[]>([]);
    const [currentEncounterId, setCurrentEncounterId] = useState<string | null>(null);

    // UI State
    const [isInsightsModalOpen, setIsInsightsModalOpen] = useState<boolean>(false);
    const [isGeneratingInsights, setIsGeneratingInsights] = useState<boolean>(false);
    const [insightsReport, setInsightsReport] = useState<string | null>(null);
    const [insightsError, setInsightsError] = useState<string | null>(null);
    const [doctorDetails, setDoctorDetails] = useState<DoctorDetails>({ name: '', role: '', licenseNumber: '' });
    const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
    
    // Load initial data from localStorage
    useEffect(() => {
        try {
            const savedDetails = localStorage.getItem('medDxDoctorDetails');
            if (savedDetails) setDoctorDetails(JSON.parse(savedDetails));

            const storedEncounters = localStorage.getItem('medDxEncounters');
            if (storedEncounters) {
                const parsedEncounters = JSON.parse(storedEncounters);
                setEncounters(parsedEncounters);
                // If there are no encounters, start a new one
                if (parsedEncounters.length === 0) {
                    handleNewEncounter();
                }
            } else {
                 // If no encounters stored, start with a new one
                handleNewEncounter();
            }
        } catch (e) {
            console.error("Failed to load data from localStorage", e);
            handleNewEncounter();
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

    const handleSaveEncounter = useCallback((updatedEncounter: Encounter) => {
        setEncounters(prev => {
            const index = prev.findIndex(enc => enc.id === updatedEncounter.id);
            if (index !== -1) {
                const newEncounters = [...prev];
                newEncounters[index] = updatedEncounter;
                return newEncounters;
            }
            // If it's a new encounter, add it to the beginning
            const updatedEncounters = [updatedEncounter, ...prev];
            return updatedEncounters.length > MAX_ENCOUNTERS ? updatedEncounters.slice(0, MAX_ENCOUNTERS) : updatedEncounters;
        });
    }, []);

    const handleLoadEncounter = (id: string) => {
        const encounter = encounters.find(e => e.id === id);
        if (encounter) {
            setCurrentEncounterId(encounter.id);
            setActiveView('encounter');
        }
    };

    const handleNewEncounter = () => {
        const newEncounter: Encounter = {
            ...BLANK_ENCOUNTER,
            id: `CASE-${Date.now()}`,
            timestamp: Date.now(),
        };
        setEncounters(prev => [newEncounter, ...prev].slice(0, MAX_ENCOUNTERS));
        setCurrentEncounterId(newEncounter.id);
        setActiveView('encounter');
    };

    const handleOpenInsightsModal = async () => {
        setIsGeneratingInsights(true);
        setInsightsError(null);
        setInsightsReport(null);
        setIsInsightsModalOpen(true);

        if (encounters.length < 2) { // Lowered for easier testing
            setInsightsError("Not enough data. Please complete at least 2 encounters to enable insights.");
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

    const currentEncounter = encounters.find(e => e.id === currentEncounterId);

    const navigateTo = (view: 'records' | 'encounter') => {
        if (view === 'encounter' && !currentEncounter) {
            handleNewEncounter();
        } else {
            setActiveView(view);
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
            <Header
                onOpenInsights={handleOpenInsightsModal}
                onOpenProfile={() => setIsProfileModalOpen(true)}
                onNavigate={navigateTo}
                onNewEncounter={handleNewEncounter}
            />
            <main className="container mx-auto p-4 lg:p-8">
                {activeView === 'records' ? (
                    <PatientRecordsView encounters={encounters} onLoadEncounter={handleLoadEncounter} />
                ) : currentEncounter ? (
                    <EncounterView
                        key={currentEncounter.id} // Re-mount component on encounter change
                        encounter={currentEncounter}
                        onSave={handleSaveEncounter}
                        doctorDetails={doctorDetails}
                    />
                ) : (
                    <div className="text-center py-16">
                        <p className="text-slate-500">No encounter selected. Please select one from records or create a new one.</p>
                        <button onClick={handleNewEncounter} className="mt-4 bg-primary-600 text-white font-semibold py-2 px-4 rounded-md shadow hover:bg-primary-700">
                            Create New Case
                        </button>
                    </div>
                )}
            </main>
            <DisclaimerFooter />
            {isInsightsModalOpen && <InsightsModal onClose={() => setIsInsightsModalOpen(false)} isLoading={isGeneratingInsights} report={insightsReport} error={insightsError} />}
            {isProfileModalOpen && <UserProfileModal onClose={() => setIsProfileModalOpen(false)} onSave={handleSaveProfile} initialDetails={doctorDetails} />}
        </div>
    );
};

export default App;
