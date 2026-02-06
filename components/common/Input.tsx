import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: boolean;
  errorMessage?: string;
}

const Input: React.FC<InputProps> = ({ label, error = false, errorMessage, ...props }) => {
  const errorClasses = error
    ? 'border-red-500 focus:ring-red-500'
    : 'border-gray-600 focus:ring-cyan-500';

  return (
    <div>
      <label htmlFor={props.id || props.name} className="block text-sm font-medium text-gray-300 mb-1">
        {label}
      </label>
      <input
        {...props}
        className={`w-full bg-gray-700 border rounded-md px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 ${errorClasses}`}
        aria-invalid={error ? 'true' : 'false'}
      />
      {error && errorMessage && (
        <p className="mt-1 text-sm text-red-400" id={`${props.id || props.name}-error`}>
          {errorMessage}
        </p>
      )}
    </div>
  );
};

export default Input;