import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import getUserInfo from '../utilities/decodeJwt'; // Adjust the path as necessary

const AddPark = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [formData, setFormData] = useState({
        parkName: '',
        location: '',
        description: '',
        capacity: '',
        // Add other fields as per your Park model
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            const decodedUser = getUserInfo(token);
            setUser(decodedUser);
            if (!decodedUser || !decodedUser.isAdmin) {
                // Redirect non-admin users
                navigate('/', { replace: true });
            }
        } else {
            // Redirect unauthenticated users
            navigate('/', { replace: true });
        }
    }, [navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        // Basic Frontend Validation
        if (!formData.parkName || !formData.location) {
            setError('Please fill in all required fields.');
            setLoading(false);
            return;
        }

        try {
            const payload = {
                parkName: formData.parkName,
                location: formData.location,
                description: formData.description,
                capacity: formData.capacity ? Number(formData.capacity) : undefined,
                // Include other fields as necessary
            };

            const token = localStorage.getItem('accessToken');

            const response = await axios.post(
                `${process.env.REACT_APP_BACKEND_URI}/parks/create`, // Ensure this matches your backend route
                payload,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            setSuccess('Park added successfully!');
            setFormData({
                parkName: '',
                location: '',
                description: '',
                capacity: '',
                // Reset other fields if added
            });

            // Optionally, navigate to the parks list after a delay
            setTimeout(() => {
                navigate('/parks'); // Ensure this route exists
            }, 2000);

        } catch (err) {
            console.error('Error adding park:', err);
            if (err.response && err.response.data && err.response.data.message) {
                setError(err.response.data.message);
            } else {
                setError('An error occurred while adding the park.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold mb-6 text-center">Add New Park</h2>

                {error && <div className="mb-4 text-red-500">{error}</div>}
                {success && <div className="mb-4 text-green-500">{success}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="parkName" className="block text-gray-700 font-semibold mb-2">
                            Park Name<span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="parkName"
                            name="parkName"
                            value={formData.parkName}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="location" className="block text-gray-700 font-semibold mb-2">
                            Location<span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="location"
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="description" className="block text-gray-700 font-semibold mb-2">
                            Description
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300"
                            rows="4"
                        ></textarea>
                    </div>

                    <div>
                        <label htmlFor="capacity" className="block text-gray-700 font-semibold mb-2">
                            Capacity
                        </label>
                        <input
                            type="number"
                            id="capacity"
                            name="capacity"
                            value={formData.capacity}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300"
                            min="0"
                        />
                    </div>

                    {/* Add other fields as per your Park model */}

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-2 px-4 bg-pink-600 text-white font-semibold rounded-md hover:bg-pink-700 transition-colors duration-300 ${loading ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                    >
                        {loading ? 'Adding Park...' : 'Add Park'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AddPark;
