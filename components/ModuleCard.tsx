
import React, { useState } from 'react';
import { ChevronDownIcon } from './icons';

interface ModuleCardProps {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    initialOpen?: boolean;
}

const ModuleCard: React.FC<ModuleCardProps> = ({ title, icon, children, initialOpen = false }) => {
    const [isOpen, setIsOpen] = useState(initialOpen);

    return (
        <div className="bg-white rounded-lg shadow-md transition-all duration-300 ease-in-out border border-slate-200">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 text-left focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-400 rounded-t-lg"
                aria-expanded={isOpen}
            >
                <div className="flex items-center">
                    <span className="text-primary-600 mr-3">{icon}</span>
                    <h3 className="text-xl font-semibold text-slate-800">{title}</h3>
                </div>
                <ChevronDownIcon className={`h-6 w-6 text-slate-500 ml-2 transform transition-transform duration-300 ease-in-out ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="px-6 pb-6 border-t border-slate-200">
                    <div className="mt-4">
                        {children}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ModuleCard;