import React, { useEffect, useState } from 'react';
import axios from 'axios';
import getUserInfo from '../../utilities/decodeJwt';  // Import getUserInfo

const DogForm = ({ updateUser, userId }) => {
    const [dogName, setDogName] = useState('');
    const [size, setSize] = useState('small');
    const [image, setImage] = useState(null);  // Keep image handling for future
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(null);  // For success message
    const [dogs, setDogs] = useState([]); // State for user's dogs
    const [showForm, setShowForm] = useState(false);  // State to toggle form visibility

    // Fetch user's dogs when the component mounts
    useEffect(() => {
        const userInfo = getUserInfo();  // Get the logged-in user's info from the JWT

        const fetchDogs = async () => {
            try {
                const response = await axios.get(`${process.env.REACT_APP_BACKEND_URI}/users/${userInfo.id}`);
                setDogs(response.data.dogId);  // Assuming dogId contains an array of dog IDs
            } catch (error) {
                console.error('Error fetching dogs:', error);
                setError('Failed to fetch dogs.');
            }
        };

        fetchDogs();
    }, [userId]);

    // Function to handle deleting a dog
    const handleDeleteDog = async (dogId) => {
        try {
            const userInfo = getUserInfo();  // Get the logged-in user's info from the JWT

            await axios.delete(`${process.env.REACT_APP_BACKEND_URI}/users/removeDog/${userInfo.id}/${dogId}`);
            await axios.delete(`${process.env.REACT_APP_BACKEND_URI}/dogs/delete/${dogId}`);  // Delete dog from dogs collection
            setDogs(prevDogs => prevDogs.filter(dog => dog._id.toString() !== dogId.toString()));  // Ensure both are strings
        } catch (error) {
            console.error('Error deleting dog:', error);
            setError('Failed to delete dog.');
        }
    };

    const handleFileChange = (e) => {
        setImage(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        const token = localStorage.getItem('accessToken');
        const userInfo = getUserInfo();  // Get the logged-in user's info from the JWT

        // Create a FormData object and append necessary fields
        const formData = new FormData();
        formData.append('dogName', dogName);
        formData.append('size', size);
        formData.append('userId', userInfo.id || userInfo._id);  // Append the user ID to the form data
        if (image) {
            formData.append('image', image);  // Append the image if it exists
        }

        try {
            // Make the API call to create a new dog
            const response = await axios.post(`${process.env.REACT_APP_BACKEND_URI}/dogs/create`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data',  // Keep multipart/form-data for file uploads
                },
            });

            const newDog = response.data.dog;  // Assuming the response contains the new dog's data
            setDogs(prevDogs => [...prevDogs, newDog]);  // Add the new dog to the state

            // Optional: Update the user profile with the new dogId
            const dogId = response.data.dog._id;  // Assuming the response contains the new dog's ID
            await axios.put(`${process.env.REACT_APP_BACKEND_URI}/users/editUser/${userInfo.id}`, { dogId }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            // Optionally update the local user state if needed
            updateUser({ dogId });

            // Reset form fields after success
            setDogName('');
            setSize('small');
            setImage(null);

            // Show success message
            setSuccess('Dog added successfully!');
        } catch (error) {
            console.error('Error adding dog:', error);
            setError('Failed to add the dog. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Function to toggle form visibility
    const toggleForm = () => {
        setShowForm(!showForm);
    };

    return (
        <div className="max-w-2xl mx-auto p-6">
            {/* Container for the Add a Dog form */}
            <div className="border p-6 mb-6 rounded-lg shadow-lg bg-gray-100 w-[400px]">  {/* Fixed width */}
                {/* Button to show/hide the form */}
                <div className="flex justify-center mb-6">
                    <button
                        onClick={toggleForm}
                        className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition"
                    >
                        {showForm ? 'Cancel' : 'Add Your Dog'}
                    </button>
                </div>

                {/* Conditionally render the form based on showForm state */}
                {showForm && (
                    <form onSubmit={handleSubmit} encType="multipart/form-data" className="mt-6">
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Dog Name:</label>
                            <input
                                type="text"
                                value={dogName}
                                onChange={(e) => setDogName(e.target.value)}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring focus:ring-green-500"
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Size:</label>
                            <select
                                value={size}
                                onChange={(e) => setSize(e.target.value)}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring focus:ring-green-500"
                            >
                                <option value="small">Small</option>
                                <option value="medium">Medium</option>
                                <option value="large">Large</option>
                            </select>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Image (optional):</label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none"
                            />
                        </div>

                        {error && <p className="text-red-500 mb-4">{error}</p>}
                        {success && <p className="text-green-500 mb-4">{success}</p>}  {/* Success message */}

                        <div className="flex justify-center">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full px-4 py-2 bg-green-500 text-white font-medium rounded-md hover:bg-green-600 transition"
                            >
                                {loading ? 'Adding...' : 'Add Dog'}
                            </button>
                        </div>
                    </form>
                )}
            </div>

            {/* Container for the list of user's dogs */}
            <div className="border p-6 rounded-lg shadow-lg bg-gray-100 w-[400px]">  {/* Fixed width */}
                <h2 className="text-xl font-bold text-gray-800 mb-4">Your Dogs</h2>
                {error && <p className="text-red-500">{error}</p>} {/* Display error message if any */}
                <ul>
                    {dogs.map(dog => (
                        <li key={dog._id} className="flex justify-between items-center mb-2">
                            <span>{dog.dogName}</span> {/* Adjust according to your dog model */}
                            <button
                                onClick={() => handleDeleteDog(dog._id)}
                                className="ml-2 bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 transition"
                            >
                                Delete
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default DogForm;
