import React from 'react';
import { useNavigate } from 'react-router-dom';

const Unauthorized = () => {
    const navigate = useNavigate();

    const handleGoHome = () => {
        navigate('/');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
                <h2 className="text-3xl font-bold mb-4 text-red-600">Access Denied</h2>
                <p className="mb-6">You do not have permission to view this page.</p>
                <button
                    onClick={handleGoHome}
                    className="px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 transition-colors duration-300"
                >
                    Go Back Home
                </button>
            </div>
        </div>
    );
};

export default Unauthorized;
