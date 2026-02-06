import React, { useState, useEffect } from 'react';
import { generateAndPlaySpeech, stopCurrentSpeech } from '../../services/ttsService';
import { getApiErrorMessage } from '../../utils/errorUtils';

interface ReadAloudButtonProps {
    textToRead: string | null;
}

/**
 * Dọn dẹp văn bản markdown để API đọc mượt mà hơn.
 */
export const cleanTextForSpeech = (text: string): string => {
    if (!text) return '';
    return text
        .replace(/###?\s/g, '')      // Tiêu đề
        .replace(/[\*_`]/g, '')      // In đậm, in nghiêng, code
        .replace(/---/g, '. ')       // Dòng kẻ ngang
        .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Liên kết
        .replace(/\s+/g, ' ')        // Nhiều khoảng trắng
        .trim();
}

const ReadAloudButton: React.FC<ReadAloudButtonProps> = ({ textToRead }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Dừng âm thanh nếu component bị unmount khi đang phát
    useEffect(() => {
        return () => {
            // Không cần kiểm tra isPlaying vì stopCurrentSpeech đã an toàn
            stopCurrentSpeech();
        };
    }, []);

    const handleTogglePlayback = async () => {
        setError(null);
        if (isPlaying) {
            stopCurrentSpeech();
            setIsPlaying(false);
        } else {
            const cleanedText = cleanTextForSpeech(textToRead || '');
            if (!cleanedText) return;

            setIsLoading(true);
            try {
                // generateAndPlaySpeech sẽ tự động dừng âm thanh trước đó
                await generateAndPlaySpeech(cleanedText, () => {
                    setIsPlaying(false);
                });
                setIsPlaying(true);
            } catch (err: any) {
                console.error("Lỗi TTS:", err);
                setError(getApiErrorMessage(err, "Lỗi phát âm thanh."));
                setIsPlaying(false);
            } finally {
                setIsLoading(false);
            }
        }
    };
    
    if (!textToRead) {
        return null;
    }

    const buttonTitle = isPlaying ? "Dừng đọc" : "Đọc nội dung";

    return (
        <div className="flex flex-col items-center">
            <button
                onClick={handleTogglePlayback}
                disabled={isLoading}
                title={buttonTitle}
                className="p-2 rounded-full text-gray-400 bg-gray-700 hover:bg-gray-600 hover:text-cyan-300 transition duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-wait"
                aria-label={buttonTitle}
            >
                {isLoading ? (
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                ) : isPlaying ? (
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cyan-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                    </svg>
                )}
            </button>
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
    );
};

export default ReadAloudButton;
