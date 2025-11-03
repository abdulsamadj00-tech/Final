
import React from 'react';
import { StethoscopeIcon, ChartBarIcon, UserCircleIcon, FolderOpenIcon, PlusCircleIcon } from './icons';

interface HeaderProps {
    onOpenInsights: () => void;
    onOpenProfile: () => void;
    onNavigate: (view: 'records' | 'encounter') => void;
    onNewEncounter: () => void;
}

const Header: React.FC<HeaderProps> = ({ onOpenInsights, onOpenProfile, onNavigate, onNewEncounter }) => {
    return (
        <header className="bg-white/80 backdrop-blur-lg shadow-sm sticky top-0 z-20 border-b border-slate-200">
            <div className="container mx-auto px-4 lg:px-8 py-3 flex items-center justify-between">
                <div className="flex items-center">
                    <StethoscopeIcon className="h-8 w-8 text-primary-600 mr-3" />
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                        MediDx <span className="gradient-text">Assistant</span>
                    </h1>
                </div>
                <div className="flex items-center gap-2">
                     <button
                        onClick={() => onNavigate('records')}
                        className="hidden sm:flex items-center text-sm bg-white text-slate-700 font-semibold py-2 px-3 rounded-md shadow-sm border border-slate-200 hover:bg-slate-100 transition-colors"
                        title="View All Patient Cases"
                    >
                        <FolderOpenIcon className="h-5 w-5 mr-2" />
                        All Cases
                    </button>
                    <button
                        onClick={onNewEncounter}
                        className="flex items-center text-sm bg-primary-600 text-white font-semibold py-2 px-3 rounded-md shadow-sm border border-primary-700 hover:bg-primary-700 transition-colors"
                        title="Create a New Patient Case"
                    >
                        <PlusCircleIcon className="h-5 w-5 mr-2" />
                        New Case
                    </button>
                    <button
                        onClick={onOpenInsights}
                        className="hidden md:flex items-center text-sm bg-white text-slate-700 font-semibold py-2 px-3 rounded-md shadow-sm border border-slate-200 hover:bg-slate-100 transition-colors"
                        title="View My Personalized Insights"
                    >
                        <ChartBarIcon className="h-5 w-5 mr-2" />
                        My Insights
                    </button>
                    <button
                        onClick={onOpenProfile}
                        className="flex items-center text-sm bg-white text-slate-700 p-2 rounded-full shadow-sm border border-slate-200 hover:bg-slate-100 transition-colors"
                        title="Edit Clinician Details"
                    >
                        <UserCircleIcon className="h-6 w-6" />
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;
