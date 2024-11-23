import React, { createContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; // Import useNavigate
import getUserInfo from '../../utilities/decodeJwt';

export const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate(); // Initialize navigate
    const location = useLocation();

    // List of routes to exclude from authentication
    const excludedRoutes = ['/signup', '/login'];

    useEffect(() => {
        const initializeUser = () => {
            const decodedUser = getUserInfo();
            setUser(decodedUser);

            if (!decodedUser && !excludedRoutes.includes(location.pathname)) {
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
