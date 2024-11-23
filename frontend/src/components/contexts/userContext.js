import React, { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import getUserInfo from '../../utilities/decodeJwt';

export const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate(); // Initialize navigate

    useEffect(() => {
        const initializeUser = () => {
            const decodedUser = getUserInfo();
            setUser(decodedUser);

            if (!decodedUser) {
                navigate('/login'); // Redirect to login if no user is found
            }

            setLoading(false);
        };

        initializeUser();

        const handleStorageChange = (event) => {
            if (event.key === 'accessToken') {
                const decodedUser = getUserInfo();
                setUser(decodedUser);
            }
        };

        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [navigate]); // Add navigate to dependency array

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <UserContext.Provider value={{ user, setUser }}>
            {children}
        </UserContext.Provider>
    );
};
