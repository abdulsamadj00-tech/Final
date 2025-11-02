
import React from 'react';
import { DownloadIcon, DocumentTextIcon, ShareIcon } from './icons';

interface ActionButtonsProps {
    onPdfDownload: () => void;
    onDischarge: () => void;
    onReferral: () => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ onPdfDownload, onDischarge, onReferral }) => {
    return (
        <div className="flex flex-wrap gap-2 mb-4">
            <button 
                onClick={onPdfDownload}
                className="flex items-center bg-white text-slate-700 font-semibold py-2 px-4 rounded-md shadow border border-slate-200 hover:bg-slate-50 transition-colors"
            >
                <DownloadIcon className="h-5 w-5 mr-2"/>
                Download PDF
            </button>
            <button 
                onClick={onDischarge}
                className="flex items-center bg-white text-slate-700 font-semibold py-2 px-4 rounded-md shadow border border-slate-200 hover:bg-slate-50 transition-colors"
            >
                <DocumentTextIcon className="h-5 w-5 mr-2"/>
                Create Discharge Summary
            </button>
            <button 
                onClick={onReferral}
                className="flex items-center bg-white text-slate-700 font-semibold py-2 px-4 rounded-md shadow border border-slate-200 hover:bg-slate-50 transition-colors"
            >
                <ShareIcon className="h-5 w-5 mr-2"/>
                Create Referral Letter
            </button>
        </div>
    );
};

export default ActionButtons;
