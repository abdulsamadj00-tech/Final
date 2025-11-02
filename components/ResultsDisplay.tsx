
import React, { forwardRef } from 'react';
import { Diagnosis } from '../types';
import DiagnosisCard from './DiagnosisCard';
import { EmptyStateIcon, ErrorIcon } from './icons';

interface ResultsDisplayProps {
    diagnoses: Diagnosis[];
    isLoading: boolean;
    error: string | null;
}

const ResultsDisplay = forwardRef<HTMLDivElement, ResultsDisplayProps>(({ diagnoses, isLoading, error }, ref) => {
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center text-center p-8 bg-white rounded-lg shadow-lg h-full">
                <svg className="animate-spin h-12 w-12 text-blue-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <h3 className="text-xl font-semibold text-slate-700">Analyzing Patient Data...</h3>
                <p className="text-slate-500 mt-2">The AI is processing the information to generate differential diagnoses. This may take a moment.</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center text-center p-8 bg-red-50 border border-red-200 rounded-lg shadow-lg h-full">
                <ErrorIcon className="h-12 w-12 text-red-500 mb-4"/>
                <h3 className="text-xl font-semibold text-red-700">An Error Occurred</h3>
                <p className="text-red-600 mt-2">{error}</p>
            </div>
        );
    }

    if (diagnoses.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center text-center p-8 bg-white rounded-lg shadow-lg h-full">
                <EmptyStateIcon className="h-16 w-16 text-slate-400 mb-4"/>
                <h3 className="text-xl font-semibold text-slate-700">Awaiting Patient Data</h3>
                <p className="text-slate-500 mt-2">Enter patient information in the form on the left and click "Generate Diagnosis" to see results.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4" ref={ref}>
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Differential Diagnosis Report</h2>
            {diagnoses.map((diagnosis, index) => (
                <DiagnosisCard key={index} diagnosis={diagnosis} index={index} />
            ))}
        </div>
    );
});

export default ResultsDisplay;
