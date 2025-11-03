
import React, { useState, useMemo } from 'react';
import { Encounter } from '../types';
import { MagnifyingGlassIcon, TagIcon } from './icons';

interface PatientRecordsViewProps {
    encounters: Encounter[];
    onLoadEncounter: (id: string) => void;
}

const PatientRecordsView: React.FC<PatientRecordsViewProps> = ({ encounters, onLoadEncounter }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | Encounter['status']>('all');
    const [dateFilter, setDateFilter] = useState('all');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);

    const allTags = useMemo(() => {
        const tags = new Set<string>();
        encounters.forEach(e => {
            e.tags?.forEach(t => tags.add(t));
        });
        return Array.from(tags).sort();
    }, [encounters]);

    const handleTagClick = (tag: string) => {
        setSelectedTags(prev => 
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        );
    };

    const filteredEncounters = useMemo(() => {
        const now = Date.now();
        let days = 0;
        if (dateFilter === 'week') days = 7;
        if (dateFilter === 'month') days = 30;
        if (dateFilter === 'year') days = 365;
        const dateCutoff = days > 0 ? now - (days * 24 * 60 * 60 * 1000) : 0;

        return encounters
            .filter(e => {
                if (statusFilter !== 'all' && e.status !== statusFilter) return false;
                if (dateFilter !== 'all' && e.timestamp < dateCutoff) return false;
                if (selectedTags.length > 0 && !selectedTags.every(tag => e.tags?.includes(tag))) return false;
                
                if (searchTerm.trim() === '') return true;
                const lowerSearch = searchTerm.toLowerCase();
                const nameMatch = e.patientData.name?.toLowerCase().includes(lowerSearch);
                const diagnosisMatch = e.provisionalDiagnoses.some(d => d.diagnosisName.toLowerCase().includes(lowerSearch)) || e.finalDiagnosis?.diagnosisName.toLowerCase().includes(lowerSearch);
                const tagMatch = e.tags?.some(t => t.toLowerCase().includes(lowerSearch));
                const idMatch = e.id.toLowerCase().includes(lowerSearch);
                return nameMatch || diagnosisMatch || tagMatch || idMatch;
            })
            .sort((a, b) => b.timestamp - a.timestamp);
    }, [encounters, searchTerm, statusFilter, dateFilter, selectedTags]);
    
    const getStatusColor = (status: Encounter['status']) => {
        switch(status) {
            case 'Active': return 'bg-yellow-100 text-yellow-800';
            case 'Discharged': return 'bg-green-100 text-green-800';
            case 'Referred': return 'bg-blue-100 text-blue-800';
            case 'LAMA': return 'bg-amber-100 text-amber-800';
            default: return 'bg-slate-100 text-slate-800';
        }
    };

    return (
        <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-slate-800">Patient Case Records</h2>
                <p className="text-slate-500">Search, filter, and manage all patient encounters.</p>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-md mb-6 sticky top-[81px] z-10">
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                    <div className="relative md:col-span-3">
                        <MagnifyingGlassIcon className="h-5 w-5 text-slate-400 absolute top-1/2 left-3 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search name, diagnosis, tag, ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md shadow-sm"
                        />
                    </div>
                     <div className="md:col-span-1">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as any)}
                             className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm bg-white"
                        >
                            <option value="all">All Statuses</option>
                            <option value="Active">Active</option>
                            <option value="Discharged">Discharged</option>
                            <option value="Referred">Referred</option>
                            <option value="LAMA">LAMA</option>
                        </select>
                    </div>
                     <div className="md:col-span-2">
                        <select
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                             className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm bg-white"
                        >
                            <option value="all">All Time</option>
                            <option value="week">Last 7 Days</option>
                            <option value="month">Last 30 Days</option>
                            <option value="year">Last Year</option>
                        </select>
                    </div>
                </div>
                {allTags.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-200">
                         <h4 className="text-sm font-semibold text-slate-600 mb-2">Filter by Tags</h4>
                         <div className="flex flex-wrap gap-2">
                            {allTags.map(tag => (
                                <button
                                    key={tag}
                                    onClick={() => handleTagClick(tag)}
                                    className={`px-3 py-1 text-xs font-semibold rounded-full border transition-colors ${
                                        selectedTags.includes(tag)
                                            ? 'bg-primary-600 text-white border-primary-600'
                                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                                    }`}
                                >
                                    {tag}
                                </button>
                            ))}
                         </div>
                    </div>
                )}
            </div>

            <div className="space-y-4">
                {filteredEncounters.length > 0 ? (
                    filteredEncounters.map(encounter => (
                        <div key={encounter.id} className="bg-white rounded-lg shadow-md p-4 flex items-start sm:items-center justify-between flex-col sm:flex-row gap-4 hover:shadow-lg transition-shadow">
                            <div className="flex-grow">
                                <p className="font-bold text-lg text-slate-800">{encounter.patientData.name || 'Unnamed Patient'}</p>
                                <p className="text-sm text-slate-500">
                                    {new Date(encounter.timestamp).toLocaleString()} | ID: {encounter.id}
                                </p>
                                <p className="text-sm text-slate-700 mt-1">
                                    <strong>Diagnosis:</strong> {encounter.finalDiagnosis?.diagnosisName || encounter.provisionalDiagnoses[0]?.diagnosisName || 'N/A'}
                                </p>
                                <div className="mt-2 flex items-center gap-2 flex-wrap">
                                     <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusColor(encounter.status)}`}>
                                        {encounter.status}
                                    </span>
                                    {encounter.tags?.map(tag => (
                                        <span key={tag} className="flex items-center bg-slate-100 text-slate-600 px-2 py-0.5 text-xs font-semibold rounded-full">
                                            <TagIcon className="h-3 w-3 mr-1" /> {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <button
                                onClick={() => onLoadEncounter(encounter.id)}
                                className="bg-primary-600 text-white font-semibold py-2 px-4 rounded-md shadow-sm hover:bg-primary-700 w-full sm:w-auto flex-shrink-0"
                            >
                                Open Case
                            </button>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-16 bg-white rounded-lg shadow-md">
                        <p className="text-slate-500">{encounters.length === 0 ? "No patient cases have been created yet." : "No encounters match your search criteria."}</p>
                        {encounters.length > 0 && (
                            <button onClick={() => { setSearchTerm(''); setStatusFilter('all'); setDateFilter('all'); setSelectedTags([]); }} className="text-sm text-primary-600 hover:underline mt-2">
                                Clear all filters
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PatientRecordsView;
