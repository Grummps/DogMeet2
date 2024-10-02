import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import getUserInfo from '../../utilities/decodeJwt';

const HomePage = () => {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    const handleLogout = (e) => {
        e.preventDefault();
        localStorage.removeItem('accessToken');
        setUser(null); // Clear user state
        navigate('/');
    };

    useEffect(() => {
        const token = localStorage.getItem("accessToken");
        if (token) {
            const obj = getUserInfo(token);
            console.log('Decoded User:', obj); // For debugging
            setUser(obj);
        }
    }, []);

    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <h4 className="text-xl font-semibold">Log in to view this page.</h4>
            </div>
        );
    }

    // Destructure only the fields present in the token
    const { id, email, username, isAdmin } = user;

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
            <div className="p-6 bg-white rounded-lg shadow-lg w-3/4 md:w-1/2 lg:w-1/3">
                <h3 className="text-2xl font-semibold mb-4">
                    Welcome <span className='text-pink-600'>@{username}</span>!
                </h3>
                <p className="mb-2"><strong>User ID:</strong> {id}</p>
                <p className="mb-2"><strong>Email:</strong> {email}</p>
                <p className="mb-4"><strong>Admin:</strong> {isAdmin ? 'Yes' : 'No'}</p>
                {isAdmin && (
                    <div className="mb-4 p-4 bg-pink-100 rounded-md">
                        <h4 className="text-lg font-semibold mb-2">Admin Panel</h4>
                        {/* Add admin-specific features here */}
                        <p>You have administrative privileges.</p>
                    </div>
                )}
                <button
                    onClick={handleLogout}
                    className="mt-4 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition duration-300"
                >
                    Log Out
                </button>
            </div>
        </div>
    );
};

export default HomePage;
