import React from 'react';

const Alert = ({ type, message, onClose }) => {
  const bgColor = type === 'success' ? 'bg-green-100' : 'bg-red-100';
  const textColor = type === 'success' ? 'text-green-800' : 'text-red-800';

  return (
    <div className={`${bgColor} border ${textColor} px-4 py-3 rounded relative`} role="alert">
      <strong className="font-bold">{type === 'success' ? 'Success' : 'Error'}: </strong>
      <span className="block sm:inline">{message}</span>
      <span
        onClick={onClose}
        className="absolute top-0 bottom-0 right-0 px-4 py-3 cursor-pointer"
      >
        <svg
          className={`${textColor} fill-current h-6 w-6`}
          role="button"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
        >
          <title>Close</title>
          <path d="M14.348 5.652a.5.5 0 00-.707 0L10 9.293 6.354 5.646a.5.5 0 00-.708.708L9.293 10l-3.647 3.646a.5.5 0 00.708.708L10 10.707l3.646 3.647a.5.5 0 00.708-.708L10.707 10l3.647-3.646a.5.5 0 000-.708z" />
        </svg>
      </span>
    </div>
  );
};

export default Alert;
