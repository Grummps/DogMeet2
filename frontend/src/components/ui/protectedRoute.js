import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, isAdmin }) => {
    console.log('ProtectedRoute - isAdmin:', isAdmin); // Add this line

    if (!isAdmin) {
        console.log('User is not admin. Redirecting to /unauthorized'); // Add this line
        return <Navigate to="/unauthorized" replace />;
    }
    console.log('User is admin. Access granted.'); // Add this line
    return children;
};

export default ProtectedRoute;
