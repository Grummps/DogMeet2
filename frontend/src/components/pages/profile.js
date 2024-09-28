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
        <div className="flex flex-col items-start justify-start h-screen relative overflow-visible pt-0  bg-gray-100">
            {/* Background placeholder */}
            <div className="w-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 -mb-24 h-full">
                <div className="text-center py-10">
                    <p className="text-gray-600 italic">Add a background picture here in the future</p>
                </div>
            </div>
            
            {/* Profile image and username in a row */}
            <div className="flex items-center relative -mt-7 -mb-10 ml-56">
                {/* Profile Image */}
                <div className="flex-shrink-0 relative z-10">
                    {user.profileImage ? (
                        <img
                            src={user.profileImage}
                            alt={`${user.username}'s profile`}
                            className="w-40 h-40 qhd:w-52 qhd:h-52 rounded-full object-cover border-4 border-white shadow-lg"
                        />
                    ) : (
                        <div className="w-40 h-40 qhd:w-52 qhd:h-52 bg-gray-300 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                            <span className="text-gray-500 text-xl">No Image</span>
                        </div>
                    )}
                </div>

                {/* User's name */}
                <div className="bg-gray-100 relative rounded-lg pr-5 -ml-14 -mb-16 mt-5 flex-shrink-0 ">
                    <h1 className="pl-20 text-2xl qhd:text-4xl font-bold text-gray-800 mt-2 ">
                        {user.username}
                    </h1>
                    <p className="pl-20 text-gray-600 mt-2 text-sm">Member since: {new Date(user.createdAt).toLocaleDateString()}</p>
                </div>
            </div>

            {/* Dog Form */}
            <div className="mt-10 px-4 ml-56">
                <DogForm updateUser={updateUser} />
            </div>
        </div>
    );
};

export default Profile;
