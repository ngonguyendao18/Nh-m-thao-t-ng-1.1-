import React, { useState } from 'react';
import { generateSpeechBlob } from '../../services/ttsService';
import { cleanTextForSpeech } from './ReadAloudButton';

interface DownloadActionsProps {
    textToRead: string | null;
    fileNamePrefix: string;
}

const DownloadActions: React.FC<DownloadActionsProps> = ({ textToRead, fileNamePrefix }) => {
    const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const downloadBlob = (blob: Blob, fileName: string) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleDownloadText = () => {
        const cleanedText = cleanTextForSpeech(textToRead || '');
        if (!cleanedText) return;
        
        const blob = new Blob([cleanedText], { type: 'text/plain' });
        downloadBlob(blob, `${fileNamePrefix}.txt`);
    };

    const handleDownloadAudio = async () => {
        setError(null);
        const cleanedText = cleanTextForSpeech(textToRead || '');
        if (!cleanedText) return;

        setIsGeneratingAudio(true);
        try {
            const blob = await generateSpeechBlob(cleanedText);
            downloadBlob(blob, `${fileNamePrefix}.wav`);
        } catch (err) {
            console.error("Lỗi tạo file âm thanh:", err);
            setError("Lỗi tạo file âm thanh.");
        } finally {
            setIsGeneratingAudio(false);
        }
    };
    
    if (!textToRead) {
        return null;
    }

    return (
        <>
            <button
                onClick={handleDownloadText}
                title="Tải văn bản (.txt)"
                className="p-2 rounded-full text-gray-400 bg-gray-700 hover:bg-gray-600 hover:text-cyan-300 transition duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                aria-label="Tải văn bản"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            </button>
            <button
                onClick={handleDownloadAudio}
                disabled={isGeneratingAudio}
                title="Tải âm thanh (.wav)"
                className="p-2 rounded-full text-gray-400 bg-gray-700 hover:bg-gray-600 hover:text-cyan-300 transition duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-wait"
                aria-label="Tải âm thanh"
            >
                {isGeneratingAudio ? (
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.636 5.636a9 9 0 0112.728 0M8.464 15.536a5 5 0 010-7.072" />
                    </svg>
                )}
            </button>
            {error && <p className="text-red-500 text-xs">{error}</p>}
        </>
    );
};

export default DownloadActions;
