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
    const [showModal, setShowModal] = useState(false);  // State for toggling modal visibility

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

        const formData = new FormData();
        formData.append('dogName', dogName);
        formData.append('size', size);
        formData.append('userId', userInfo.id || userInfo._id);  // Append the user ID to the form data
        if (image) {
            formData.append('image', image);  // Append the image if it exists
        }

        try {
            const response = await axios.post(`${process.env.REACT_APP_BACKEND_URI}/dogs/create`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data',  // Keep multipart/form-data for file uploads
                },
            });

            const newDog = response.data.dog;  // Assuming the response contains the new dog's data
            setDogs(prevDogs => [...prevDogs, newDog]);  // Add the new dog to the state

            const dogId = response.data.dog._id;  // Assuming the response contains the new dog's ID
            await axios.put(`${process.env.REACT_APP_BACKEND_URI}/users/editUser/${userInfo.id}`, { dogId }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            updateUser({ dogId });

            // Reset form fields after success
            setDogName('');
            setSize('small');
            setImage(null);

            // Show success message
            setSuccess('Dog added successfully!');
            setShowModal(false);  // Close modal after successful form submission
        } catch (error) {
            console.error('Error adding dog:', error);
            setError('Failed to add the dog. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto p-6 flex space-x-10 relative">
            
            {/* Separate Container for the List of Dogs */}
            <div className="border p-6 rounded-lg shadow-md bg-white w-[400px] h-[400px] overflow-auto relative">  {/* Fixed height with scroll */}
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">Your Dogs</h2>
                {error && <p className="text-red-500">{error}</p>} {/* Display error message if any */}
                <ul className="space-y-3">
                    {dogs.map(dog => (
                        <li key={dog._id} className="flex justify-between items-center">
                            <span className="text-gray-700 font-medium">{dog.dogName}</span> {/* Adjust according to your dog model */}
                            <button
                                onClick={() => handleDeleteDog(dog._id)}
                                className="ml-2 bg-red-500 text-white px-4 py-2 rounded-full hover:bg-red-600 transition duration-300 shadow-md"
                            >
                                Delete
                            </button>
                        </li>
                    ))}
                </ul>

                {/* Add a Dog Button positioned absolutely in the top right corner */}
                <div className="absolute top-2 right-2 flex items-center space-x-2 cursor-pointer" onClick={() => setShowModal(true)}>
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white transition duration-300 shadow-md">
                        <span className="text-2xl font-bold leading-none mb-1.5">+</span>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-lg shadow-lg w-[400px]">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">Add Your Dog</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-700 text-lg">&times;</button>
                        </div>

                        <form onSubmit={handleSubmit} encType="multipart/form-data">
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Dog Name:</label>
                                <input
                                    type="text"
                                    value={dogName}
                                    onChange={(e) => setDogName(e.target.value)}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring focus:ring-green-500"
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Size:</label>
                                <select
                                    value={size}
                                    onChange={(e) => setSize(e.target.value)}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring focus:ring-green-500"
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
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none"
                                />
                            </div>

                            {error && <p className="text-red-500 mb-4">{error}</p>}
                            {success && <p className="text-green-500 mb-4">{success}</p>}

                            <div className="flex justify-center">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full px-4 py-2 bg-green-500 text-white font-medium rounded-lg hover:bg-green-600 transition duration-300"
                                >
                                    {loading ? 'Adding...' : 'Add Dog'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DogForm;
