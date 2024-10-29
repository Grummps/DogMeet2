import React from 'react';
import AddPark from '../addPark'; // Ensure the path is correct

const AdminDashboard = () => {
    return (
        <div className="admin-dashboard p-6">
            <h1 className="text-3xl font-bold ml-48 mt-2">Admin Dashboard</h1>
            
            {/* AddPark Form */}
            <div className="w-1/5 ml-20 qhd:ml-28">
            <AddPark />
            </div>
            {/* You can add more admin functionalities here */}
        </div>
    );
};

export default AdminDashboard;
