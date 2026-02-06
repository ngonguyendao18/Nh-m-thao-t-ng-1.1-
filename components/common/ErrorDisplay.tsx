import React from 'react';
import Button from './Button';

interface ErrorDisplayProps {
  message: string;
  onRetry: () => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ message, onRetry }) => {
  return (
    <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-4 rounded-md my-4 flex flex-col items-center text-center animate-fade-in">
      <div className="flex items-center mb-3">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
        <strong className="font-bold">Đã xảy ra lỗi</strong>
      </div>
      <p className="mb-4 text-sm max-w-md">{message}</p>
      <Button 
        onClick={onRetry} 
        className="bg-red-600 hover:bg-red-700 w-auto text-sm py-1 px-4"
      >
        Thử lại
      </Button>
    </div>
  );
};

export default ErrorDisplay;