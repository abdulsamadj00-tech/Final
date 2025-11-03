
import React from 'react';
import { StethoscopeIcon, ChartBarIcon, UserCircleIcon, FolderOpenIcon } from './icons';

interface HeaderProps {
    onOpenInsights: () => void;
    onOpenProfile: () => void;
    onNavigate: (view: 'dashboard' | 'records') => void;
}

const Header: React.FC<HeaderProps> = ({ onOpenInsights, onOpenProfile, onNavigate }) => {
    return (
        <header className="bg-white shadow-md sticky top-0 z-20">
            <div className="container mx-auto px-4 lg:px-8 py-4 flex items-center justify-between">
                <button onClick={() => onNavigate('dashboard')} className="flex items-center focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md">
                    <StethoscopeIcon className="h-8 w-8 text-blue-600 mr-3" />
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                        MediDx <span className="text-blue-600">Assistant</span>
                    </h1>
                </button>
                <div className="flex items-center gap-2">
                     <button
                        onClick={() => onNavigate('records')}
                        className="hidden sm:flex items-center text-sm bg-slate-100 text-slate-700 font-semibold py-2 px-3 rounded-md shadow-sm border border-slate-200 hover:bg-slate-200 transition-colors"
                        title="View All Patient Records"
                    >
                        <FolderOpenIcon className="h-5 w-5 mr-2" />
                        Patient Records
                    </button>
                    <button
                        onClick={onOpenInsights}
                        className="flex items-center text-sm bg-slate-100 text-slate-700 font-semibold py-2 px-3 rounded-md shadow-sm border border-slate-200 hover:bg-slate-200 transition-colors"
                        title="View My Personalized Insights"
                    >
                        <ChartBarIcon className="h-5 w-5 mr-2" />
                        My Insights
                    </button>
                    <button
                        onClick={onOpenProfile}
                        className="flex items-center text-sm bg-slate-100 text-slate-700 font-semibold p-2 rounded-full shadow-sm border border-slate-200 hover:bg-slate-200 transition-colors"
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
