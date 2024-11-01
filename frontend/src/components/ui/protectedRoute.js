import React from 'react';
import { Navigate } from 'react-router-dom';
import { UserContext } from '../contexts/userContext';
import { useContext } from 'react';

const ProtectedRoute = ({ children, isAdminOnly = false }) => {
    console.log('ProtectedRoute - isAdmin:', isAdminOnly); // Add this line
    const user = useContext(UserContext);

    if (!user) {
        return <Navigate to="/login" replace />
    }

    if (!isAdminOnly && !user.isAdmin) {
        console.log('User is not admin. Redirecting to /unauthorized'); // Add this line
        return <Navigate to="/unauthorized" replace />;
    }
    console.log('User is admin. Access granted.'); // Add this line
    return children;
};

export default ProtectedRoute;
