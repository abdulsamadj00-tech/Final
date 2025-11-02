
import React, { useState } from 'react';
import { Diagnosis } from '../types';
import { ChevronDownIcon, CheckCircleIcon, XCircleIcon, BeakerIcon, PillIcon, HeartPulseIcon, SkullIcon } from './icons';

interface DiagnosisCardProps {
    diagnosis: Diagnosis;
    index: number;
}

const DiagnosisCard: React.FC<DiagnosisCardProps> = ({ diagnosis, index }) => {
    const [isOpen, setIsOpen] = useState(index === 0);

    const getProbabilityColor = (prob: number) => {
        if (prob > 75) return 'bg-red-500';
        if (prob > 50) return 'bg-orange-500';
        if (prob > 25) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    return (
        <div className="bg-white rounded-lg shadow-md transition-all duration-300">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 text-left focus:outline-none"
            >
                <div className="flex items-center">
                    <span className="text-lg font-bold text-blue-700 mr-4">{index + 1}.</span>
                    <h3 className="text-lg font-semibold text-slate-800">{diagnosis.diagnosisName}</h3>
                </div>
                <div className="flex items-center">
                    <div className="w-24 bg-slate-200 rounded-full h-2.5 mr-4">
                        <div className={`h-2.5 rounded-full ${getProbabilityColor(diagnosis.probability)}`} style={{ width: `${diagnosis.probability}%` }}></div>
                    </div>
                    <span className="font-bold text-slate-700 w-12 text-right">{diagnosis.probability}%</span>
                    <ChevronDownIcon className={`h-6 w-6 text-slate-500 ml-2 transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </button>

            {isOpen && (
                <div className="px-6 pb-6 border-t border-slate-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mt-4">
                        
                        {/* Evidence */}
                        <div>
                            <h4 className="font-semibold text-slate-700 mb-2">Key Evidence</h4>
                            <div className="space-y-2">
                                {diagnosis.supportingEvidence.map((item, i) => (
                                    <div key={i} className="flex items-start">
                                        <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                                        <span className="text-slate-600">{item}</span>
                                    </div>
                                ))}
                                {diagnosis.contradictingEvidence.map((item, i) => (
                                    <div key={i} className="flex items-start">
                                        <XCircleIcon className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                                        <span className="text-slate-600">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Recommended Tests */}
                        <div>
                            <h4 className="font-semibold text-slate-700 mb-2 flex items-center"><BeakerIcon className="h-5 w-5 mr-2 text-indigo-500"/>Recommended Tests</h4>
                            <ul className="list-disc list-inside space-y-1 text-slate-600">
                                {diagnosis.recommendedTests.map((item, i) => <li key={i}>{item}</li>)}
                            </ul>
                        </div>
                        
                        {/* Treatment Suggestions */}
                        <div className="md:col-span-2">
                             <h4 className="font-semibold text-slate-700 mb-3 flex items-center"><PillIcon className="h-5 w-5 mr-2 text-teal-500"/>Treatment Suggestions</h4>
                             <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="bg-slate-50 p-3 rounded-md">
                                    <h5 className="font-semibold text-sm text-slate-600 mb-1">First-Line</h5>
                                    <ul className="list-disc list-inside space-y-1 text-slate-600 text-sm">
                                        {diagnosis.treatmentSuggestions.firstLine.map((item, i) => <li key={i}>{item}</li>)}
                                    </ul>
                                </div>
                                 <div className="bg-slate-50 p-3 rounded-md">
                                    <h5 className="font-semibold text-sm text-slate-600 mb-1">Second-Line</h5>
                                    <ul className="list-disc list-inside space-y-1 text-slate-600 text-sm">
                                        {diagnosis.treatmentSuggestions.secondLine.map((item, i) => <li key={i}>{item}</li>)}
                                    </ul>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-md">
                                    <h5 className="font-semibold text-sm text-slate-600 mb-1">Lifestyle</h5>
                                    <ul className="list-disc list-inside space-y-1 text-slate-600 text-sm">
                                        {diagnosis.treatmentSuggestions.lifestyle.map((item, i) => <li key={i}>{item}</li>)}
                                    </ul>
                                </div>
                             </div>
                        </div>

                        {/* Morbidity & Mortality */}
                         <div className="md:col-span-2">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <h4 className="font-semibold text-slate-700 mb-2 flex items-center"><HeartPulseIcon className="h-5 w-5 mr-2 text-orange-500"/>Morbidity</h4>
                                    <p className="text-slate-600 text-sm">{diagnosis.morbidity}</p>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-slate-700 mb-2 flex items-center"><SkullIcon className="h-5 w-5 mr-2 text-gray-500"/>Mortality</h4>
                                    <p className="text-slate-600 text-sm">{diagnosis.mortality}</p>
                                </div>
                            </div>
                         </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DiagnosisCard;
