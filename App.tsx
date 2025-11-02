
import React, { useState, useCallback, useRef } from 'react';
import { PatientData, Diagnosis } from './types';
import Header from './components/Header';
import InputForm from './components/InputForm';
import ResultsDisplay from './components/ResultsDisplay';
import DisclaimerFooter from './components/DisclaimerFooter';
import ActionButtons from './components/ActionButtons';
import { generatePdf, generateDischargeSummary, generateReferralLetter } from './utils/reportGenerator';
import Modal from './components/Modal';
import SymptomCheckerModal from './components/SymptomCheckerModal';

const App: React.FC = () => {
    const [patientData, setPatientData] = useState<PatientData>({
        age: '',
        sex: 'Male',
        symptoms: '',
        findings: '',
        labs: '',
        imaging: '',
        vitals: {
            temp: '',
            hr: '',
            rr: '',
            bp: '',
            spo2: '',
        },
    });
    const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [isSymptomCheckerOpen, setIsSymptomCheckerOpen] = useState<boolean>(false);
    const [modalContent, setModalContent] = useState({ title: '', content: '' });

    const resultsRef = useRef<HTMLDivElement>(null);

    const handleFormSubmit = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setDiagnoses([]);
        try {
            const { generateDiagnoses } = await import('./services/geminiService');
            const result = await generateDiagnoses(patientData);
            setDiagnoses(result);
        } catch (err) {
            setError('Failed to generate diagnosis. Please check your input and try again.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [patientData]);

    const handlePdfDownload = () => {
        if (resultsRef.current) {
            generatePdf(resultsRef.current, patientData);
        }
    };
    
    const openModalWithContent = (type: 'discharge' | 'referral') => {
        const content = type === 'discharge'
            ? generateDischargeSummary(patientData, diagnoses)
            : generateReferralLetter(patientData, diagnoses);
        const title = type === 'discharge' ? 'Discharge Summary' : 'Referral Letter';
        setModalContent({ title, content });
        setIsModalOpen(true);
    };
    
    const handlePopulateFromSymptomChecker = (symptomText: string, conditions: string[]) => {
        const conditionsText = conditions.length > 0
            ? `\n\nPotential Conditions Identified by AI Symptom Checker:\n- ${conditions.join('\n- ')}`
            : '';
        
        setPatientData(prev => ({
            ...prev,
            symptoms: `${symptomText}${conditionsText}`
        }));
        setIsSymptomCheckerOpen(false);
    };


    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
            <Header />
            <main className="container mx-auto p-4 lg:p-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-4 xl:col-span-3">
                        <InputForm
                            patientData={patientData}
                            setPatientData={setPatientData}
                            onSubmit={handleFormSubmit}
                            isLoading={isLoading}
                            onOpenSymptomChecker={() => setIsSymptomCheckerOpen(true)}
                        />
                    </div>
                    <div className="lg:col-span-8 xl:col-span-9">
                        {diagnoses.length > 0 && (
                            <ActionButtons
                                onPdfDownload={handlePdfDownload}
                                onDischarge={() => openModalWithContent('discharge')}
                                onReferral={() => openModalWithContent('referral')}
                            />
                        )}
                        <ResultsDisplay
                            diagnoses={diagnoses}
                            isLoading={isLoading}
                            error={error}
                            ref={resultsRef}
                        />
                    </div>
                </div>
            </main>
            <DisclaimerFooter />
            {isModalOpen && (
                <Modal
                    title={modalContent.title}
                    content={modalContent.content}
                    onClose={() => setIsModalOpen(false)}
                />
            )}
            {isSymptomCheckerOpen && (
                <SymptomCheckerModal
                    onClose={() => setIsSymptomCheckerOpen(false)}
                    onPopulate={handlePopulateFromSymptomChecker}
                />
            )}
        </div>
    );
};

export default App;
