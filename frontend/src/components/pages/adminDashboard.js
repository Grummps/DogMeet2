// src/components/AdminDashboard.jsx
import React from 'react';
import AddPark from '../addPark'; // Ensure the path is correct

const AdminDashboard = () => {
    return (
        <div className="admin-dashboard p-6">
            <h1 className="text-3xl font-bold mb-4">Admin Dashboard</h1>
            
            {/* AddPark Form */}
            <AddPark />
            
            {/* You can add more admin functionalities here */}
        </div>
    );
};

export default AdminDashboard;
