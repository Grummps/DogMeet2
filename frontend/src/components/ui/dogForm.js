import React, { useEffect, useState } from 'react';
import axios from 'axios';
import getUserInfo from '../../utilities/decodeJwt';  // Import getUserInfo
import apiClient from '../../utilities/apiClient';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDog } from '@fortawesome/free-solid-svg-icons';

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
                const response = await axios.get(`${process.env.REACT_APP_BACKEND_URI}/users/${userInfo._id}`);
                const dogsWithId = response.data.dogId.map(dog => ({
                    ...dog,
                }));
                setDogs(dogsWithId);
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

            await axios.delete(`${process.env.REACT_APP_BACKEND_URI}/users/removeDog/${userInfo._id}/${dogId}`);
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
        formData.append('userId', userInfo._id);  // Append the user ID to the form data
        if (image) {
            formData.append('image', image);  // Append the image if it exists
        }

        try {
            const response = await apiClient.post(`/dogs/create`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',  // Keep multipart/form-data for file uploads
                },
            });

            const newDog = response.data.dog;  // Assuming the response contains the new dog's data
            setDogs(prevDogs => [...prevDogs, newDog]);  // Add the new dog to the state

            const dogId = response.data.dog._id;  // Assuming the response contains the new dog's ID
            await apiClient.put(`/users/editUser/${userInfo._id}`, { dogId });

            updateUser({ dogId });

            // Reset form fields after success
            setDogName('');
            setSize('small');
            setImage(null);

            // Show success message and close modal
            setSuccess('Dog added successfully!');
            setShowModal(false);  // Close modal after successful form submission
        } catch (error) {
            console.error('Error adding dog:', error);

            // Check if the error response exists
            if (error.response) {
                // Handle specific error messages
                if (error.response.status === 400 && error.response.data.message.includes('Dog limit reached')) {
                    setError(`You cannot have more than 8 dogs.`);
                } else if (error.response.data.message) {
                    setError(error.response.data.message);
                } else {
                    setError('Failed to add the dog. Please try again.');
                }
            } else {
                setError('Failed to add the dog. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="max-w-6xl mx-auto p-6 relative">

            {/* "Your Dogs" title and Add Button on the top left */}
            <div className="absolute top-10 left-6 z-10">
                <div className="flex items-center space-x-4">
                    <h2 className="text-lg mt-2 mb-3 font-semibold text-gray-900 qhd:text-2xl qhd:mt-0.5 qhd:mb-2.5">Your Dogs</h2>

                    {/* Display success message next to "Your Dogs" */}
                    {success && <p className="text-green-500 text-sm font-semibold mt-2.5 mb-3">{success}</p>}
                </div>

                <div
                    className="qhd:mt-3 mt-1 flex items-center space-x-2 "  // Add Button below "Your Dogs"
                    onClick={() => setShowModal(true)}
                >
                    <div className="flex items-center justify-center cursor-pointer w-8 h-8 qhd:w-10 qhd:h-10 rounded-full border-2 border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white transition duration-300 shadow-md">
                        <span className="text-2xl -mt-0.5 font-bold leading-none ">+</span>
                    </div>
                </div>
            </div>

            {/* Horizontal line under "Your Dogs" */}
            <div className="mb-1.5 mt-16 w-full qhd:mb-1.5 qhd:mt-16 border-t border-gray-300"></div>

            {/* Container for dogs, with min-height when no dogs are present */}
            <div className={`relative mt-20 ${dogs.length === 0 ? '' : ''}`}>
                {error && <p className="text-red-500">{error}</p>} {/* Display error message if any */}

                {dogs.length === 0 ? (
                    <div className="text-center text-gray-500 p-10">
                        <p>No dogs have been added yet.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto py-6 scrollbar-hide">
                        <div className="grid grid-flow-col qhd:grid-rows-2 gap-6">
                            {dogs.map(dog => (
                                <div key={dog._id} className="bg-white rounded-lg shadow-md p-4 w-64 qhd:w-[300px] mb-2">
                                    {/* Dog Image with nicer border */}
                                    {dog.image ? (
                                        <img
                                            src={dog.image}
                                            alt={dog.dogName}
                                            className="w-full h-40 rounded-lg object-cover mb-2 border-4 border-gray-200"
                                        />
                                    ) : (
                                        <div className="w-full h-40 bg-gray-300 rounded-lg flex items-center justify-center mb-2 border-4 border-gray-200">
                                            <FontAwesomeIcon icon={faDog} className="size-20" />
                                        </div>
                                    )}
                                    {/* Dog Info */}
                                    <div className="text-center mb-4">
                                        <h3 className="text-lg font-semibold break-words">{dog.dogName}</h3>
                                        <p className="text-sm text-gray-500">Size: {dog.size}</p>
                                    </div>
                                    {/* Delete Button */}
                                    <div className="text-center">
                                        <button
                                            onClick={() => handleDeleteDog(dog._id)}
                                            className="bg-red-400 text-white -mt-5 p-1 w-6 h-6 rounded-full flex items-center justify-center hover:bg-red-600 transition duration-300 shadow-md"
                                        >
                                            <span className="text-sm -mt-0.5 font-bold">&times;</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
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
                                    <option value="small">Small ( &lt; 20lbs )</option>
                                    <option value="medium">Medium ( &gt; 21lbs &lt; 55lbs )</option>
                                    <option value="large">Large ( &gt; 56lbs )</option>
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
                            {/* Remove success message from here */}

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
