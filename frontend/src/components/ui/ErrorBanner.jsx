import React from 'react';
import PropTypes from 'prop-types';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function ErrorBanner({ message = "Failed to load data. Please try again.", onRetry }) {
  return (
    <div className="w-full bg-red-50 border border-red-100 rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-3">
      <AlertCircle className="w-8 h-8 text-red-500" />
      <p className="text-red-800 font-medium text-sm">{message}</p>
      {onRetry && (
        <button 
          onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg text-sm font-bold hover:bg-red-50 transition-colors shadow-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Retry Request
        </button>
      )}
    </div>
  );
}

ErrorBanner.propTypes = {
  message: PropTypes.string,
  onRetry: PropTypes.func,
};
