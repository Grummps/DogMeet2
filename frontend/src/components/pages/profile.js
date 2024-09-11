import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import getUserInfo from '../../utilities/decodeJwt';  // Import getUserInfo

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
                const response = await axios.get(`${process.env.REACT_APP_BACKEND_URI}/user/${userId}`, {
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

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    return (
        <div>
            <h1>{user?.username}'s Profile</h1>
            <h2>Dog's Name: {user?.dogId?.dogName || 'No dog registered'}</h2>
            {user?.dogId?.image && (
                <img src={user.dogId.image} alt={`${user.dogId.dogName}'s picture`} style={{ width: '200px', height: '200px' }} />
            )}
            <button onClick={() => navigate(`/editProfile/${user._id}`)}>Edit Profile</button>
        </div>
    );
};

export default Profile;
