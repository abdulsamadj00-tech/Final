
import React, { useState } from 'react';
import { DoctorDetails } from '../types';
import { XMarkIcon } from './icons';

interface UserProfileModalProps {
    onClose: () => void;
    onSave: (details: DoctorDetails) => void;
    initialDetails: DoctorDetails;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({ onClose, onSave, initialDetails }) => {
    const [details, setDetails] = useState<DoctorDetails>(initialDetails);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setDetails(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = () => {
        onSave(details);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-md">
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-xl font-semibold">Clinician Details</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800">
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-slate-600 mb-1">Full Name</label>
                        <input type="text" name="name" id="name" value={details.name} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm" placeholder="e.g., Dr. Jane Doe" />
                    </div>
                    <div>
                        <label htmlFor="role" className="block text-sm font-medium text-slate-600 mb-1">Role / Speciality</label>
                        <input type="text" name="role" id="role" value={details.role} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm" placeholder="e.g., General Practitioner" />
                    </div>
                    <div>
                        <label htmlFor="licenseNumber" className="block text-sm font-medium text-slate-600 mb-1">License / ID Number (Optional)</label>
                        <input type="text" name="licenseNumber" id="licenseNumber" value={details.licenseNumber} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm" placeholder="e.g., GMC #1234567" />
                    </div>
                </div>
                <div className="flex justify-end p-4 border-t bg-slate-50">
                    <button onClick={handleSave} className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-md shadow-sm hover:bg-blue-700">
                        Save Details
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UserProfileModal;
