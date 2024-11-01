import React, { createContext, useState, useEffect } from 'react';
import getUserInfo from '../../utilities/decodeJwt';

export const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true); // Loading state to prevent premature rendering

    useEffect(() => {
        const initializeUser = () => {
            const decodedUser = getUserInfo();
            setUser(decodedUser);
            setLoading(false);
        };

        initializeUser();

        // Optionally, handle `storage` events only for multi-tab syncing:
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
    }, []);


    if (loading) {
        return <div>Loading...</div>; // Optional: Display a loading indicator
    }

    return (
        <UserContext.Provider value={{ user, setUser }}>
            {children}
        </UserContext.Provider>
    );
};
