
import React from 'react';
import { StethoscopeIcon } from './icons';

const Header: React.FC = () => {
    return (
        <header className="bg-white shadow-md">
            <div className="container mx-auto px-4 lg:px-8 py-4 flex items-center">
                <StethoscopeIcon className="h-8 w-8 text-blue-600 mr-3" />
                <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                    MediDx <span className="text-blue-600">Assistant</span>
                </h1>
            </div>
        </header>
    );
};

export default Header;
