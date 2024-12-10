import React, { useState, useEffect } from 'react';
import AddPark from '../ui/addPark';
import ExpiredEvents from '../ui/expiredEvents';
import AdminUserList from '../ui/userList';
import apiClient from '../../utilities/apiClient';

const AdminDashboard = () => {
    const [parks, setParks] = useState([]);
    const [selectedParkId, setSelectedParkId] = useState('');
    const [loadingParks, setLoadingParks] = useState(false);
    const [errorParks, setErrorParks] = useState(null);

    // Fetch all parks on component mount
    useEffect(() => {
        fetchParks();
    }, []);

    const fetchParks = async () => {
        setLoadingParks(true);
        setErrorParks(null);
        try {
            const response = await apiClient.get('/parks/all'); // Ensure this endpoint exists and is correct
            setParks(response.data);
            if (response.data.length > 0) {
                setSelectedParkId(response.data[0]._id); // Select the first park by default
            }
        } catch (err) {
            console.error(err);
            setErrorParks(err.response?.data?.message || 'Failed to fetch parks.');
        } finally {
            setLoadingParks(false);
        }
    };

    const handleParkChange = (e) => {
        setSelectedParkId(e.target.value);
    };

    return (
        <div className=" p-6">
            <div className="max-w-7xl mx-auto">
                {/* Heading */}
                <h1 className="text-4xl font-bold mb-8 text-center text-gray-800">Admin Dashboard</h1>

                {/* Main Content: AddPark and Select Park + ExpiredEvents */}
                <div className="flex flex-col lg:flex-row lg:space-x-6">
                    {/* AddPark Section */}
                    <div className="flex-1 mb-6 lg:mb-0">
                        <div className="bg-white p-6 rounded-lg shadow-md h-full flex flex-col">
                            <div className="flex-1">
                                <AddPark />
                            </div>
                        </div>
                    </div>

                    {/* Select Park and ExpiredEvents Section */}
                    <div className="flex-1">
                        <div className="bg-white p-6 rounded-lg shadow-md h-full flex flex-col">
                            {/* Select Park */}
                            <div className="mb-6">
                                <label htmlFor="parkSelect" className="block text-lg font-medium mb-2 text-gray-700">
                                    Select Park:
                                </label>
                                {loadingParks ? (
                                    <div className="flex items-center">
                                        <svg className="animate-spin h-5 w-5 text-gray-600 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                                        </svg>
                                        <span className="text-gray-600">Loading parks...</span>
                                    </div>
                                ) : errorParks ? (
                                    <p className="text-red-500 text-center">{errorParks}</p>
                                ) : parks.length === 0 ? (
                                    <p className="text-center text-gray-600">No parks available. Please add a park.</p>
                                ) : (
                                    <select
                                        id="parkSelect"
                                        value={selectedParkId}
                                        onChange={handleParkChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                                    >
                                        {parks.map((park) => (
                                            <option key={park._id} value={park._id}>
                                                {park.parkName}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            {/* ExpiredEvents Component */}
                            <div className="flex-1">
                                {selectedParkId ? (
                                    <ExpiredEvents parkId={selectedParkId} />
                                ) : (
                                    <p className="text-center text-gray-600">Please select a park to view expired events.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                {/* Second row: AdminUserList */}
                <div className="flex flex-col">
                    <AdminUserList />
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
