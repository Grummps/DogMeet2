import React from 'react';

const Alert = ({ message, onClose }) => {
  return (
    <div
      className="flex items-center text-green-600 text-base font-medium"
      role="alert"
    >
      <p className="flex-1">
        {message} <span className="font-semibold">successfully</span>.
      </p>
      {onClose && (
        <button
          onClick={onClose}
          className="text-green-600 hover:text-green-800 focus:outline-none"
          aria-label="Close"
        >
          <svg
            className="fill-current h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
          >
            <title>Close</title>
            <path d="M10 10l5-5a1 1 0 10-1.414-1.414L10 8.586 6.414 5 5 6.414l4.586 4.586L5 15.586 6.414 17l4.586-4.586L15.586 17 17 15.586l-4.586-4.586L17 6.414 15.586 5 10 10z" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default Alert;
