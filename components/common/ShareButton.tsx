import React from 'react';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard';

interface ShareButtonProps {
  textToShare: string | null;
  className?: string;
}

const ShareButton: React.FC<ShareButtonProps> = ({ textToShare, className }) => {
  const { copied, copy } = useCopyToClipboard();

  const handleShare = () => {
    copy(textToShare);
  };

  const buttonTitle = copied ? "Đã sao chép!" : "Chia sẻ (sao chép)";

  return (
    <button
      onClick={handleShare}
      title={buttonTitle}
      disabled={!textToShare}
      className={`p-2 rounded-full text-gray-400 bg-gray-700 hover:bg-gray-600 hover:text-cyan-300 transition duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      aria-label={buttonTitle}
    >
      {copied ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12s-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.368a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
        </svg>
      )}
    </button>
  );
};

export default ShareButton;
