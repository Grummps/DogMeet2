import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import getUserInfo from '../../utilities/decodeJwt';  // Import getUserInfo
import DogForm from './dogForm';  // Corrected to dogForm

const Profile = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchUserData = async () => {
            setLoading(true);
            const userInfo = getUserInfo();  // Get the decoded user info from the token

            if (!userInfo) {
                console.error("No access token found, redirecting to login.");
                navigate('/login');
                return;
            }

            const userId = userInfo.id || userInfo.sub;  // Adjust this based on how your JWT stores the user ID
            console.log('User ID from token:', userId);  // Log the user ID

            try {
                const response = await axios.get(`${process.env.REACT_APP_BACKEND_URI}/users/${userId}`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('accessToken')}`
                    }
                });
                setUser(response.data);
                setError(null);
            } catch (error) {
                console.error('Error fetching user data:', error);
                setError('Failed to load user data');
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();  // Trigger the request
    }, [navigate]);

    const updateUser = (updatedData) => {
        setUser({ ...user, ...updatedData });
    };

    if (loading) {
        return <div className="text-center text-lg text-gray-600">Loading...</div>;
    }

    if (error) {
        return <div className="text-center text-lg text-red-500">{error}</div>;
    }

    return (
        <div className="flex h-screen relative">
            {/* Adjust the left position for DogForm to be halfway between left and center */}
            <div className="absolute left-1/4 top-1/2 transform -translate-y-1/2 flex flex-col items-center z-10">
                <DogForm updateUser={updateUser} />
            </div>

            {/* Center for the user's name, 3/4ths up the screen */}
            <div className="absolute inset-0 flex items-start justify-center" style={{ top: '26%' }}>
                <h1 className="text-4xl font-bold text-center text-gray-800">
                    {user.username}'s Profile
                </h1>
            </div>
        </div>
    );
};

export default Profile;
