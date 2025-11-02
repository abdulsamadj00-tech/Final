
import React from 'react';
import { ClipboardIcon, XMarkIcon } from './icons';

interface ModalProps {
    title: string;
    content: string;
    onClose: () => void;
}

const Modal: React.FC<ModalProps> = ({ title, content, onClose }) => {
    const [copied, setCopied] = React.useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-xl font-semibold">{title}</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800">
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto">
                    <textarea
                        readOnly
                        value={content}
                        className="w-full h-96 p-3 bg-slate-50 border rounded-md font-mono text-sm"
                    />
                </div>
                <div className="flex justify-end p-4 border-t">
                    <button
                        onClick={handleCopy}
                        className="flex items-center bg-blue-600 text-white font-semibold py-2 px-4 rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        <ClipboardIcon className="h-5 w-5 mr-2" />
                        {copied ? 'Copied!' : 'Copy to Clipboard'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Modal;
