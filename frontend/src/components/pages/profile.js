import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import getUserInfo from '../../utilities/decodeJwt';  // Import getUserInfo
import DogForm from './dogForm';

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
        return <div style={styles.loading}>Loading...</div>;
    }

    if (error) {
        return <div style={styles.error}>{error}</div>;
    }

    return (
        <div style={styles.profileContainer}>
            <h1 style={styles.title}>{user.username}'s Profile</h1>

            <div style={styles.profileDetails}>
                <h2 style={styles.subTitle}>Dog's Name: {user.dogId ? user.dogId.dogName : 'No dog registered'}</h2>

                {user.dogId && user.dogId.image ? (
                    <img src={user.dogId.image} alt={`${user.dogId.dogName}'s picture`} style={styles.dogImage} />
                ) : (
                    <p style={styles.noImageText}>No dog picture available</p>
                )}

                <DogForm updateUser={updateUser} /> {/* Include the form to add a dog */}
            </div>
        </div>
    );
};

export default Profile;

// Styling using CSS-in-JS
const styles = {
    profileContainer: {
        maxWidth: '600px',
        margin: '0 auto',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
        backgroundColor: '#f9f9f9',
    },
    title: {
        textAlign: 'center',
        color: '#333',
        marginBottom: '20px',
    },
    subTitle: {
        fontSize: '20px',
        fontWeight: 'bold',
        marginBottom: '15px',
        color: '#555',
    },
    profileDetails: {
        marginBottom: '30px',
        textAlign: 'center',
    },
    dogImage: {
        width: '200px',
        height: '200px',
        borderRadius: '50%',
        objectFit: 'cover',
        border: '2px solid #ccc',
        marginBottom: '20px',
    },
    noImageText: {
        fontStyle: 'italic',
        color: '#888',
        marginBottom: '20px',
    },
    loading: {
        textAlign: 'center',
        fontSize: '18px',
        color: '#666',
    },
    error: {
        textAlign: 'center',
        fontSize: '18px',
        color: 'red',
    },
};
