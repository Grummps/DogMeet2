import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import getUserInfo from '../../utilities/decodeJwt';

const DogForm = ({ updateUser }) => {
    const [dogName, setDogName] = useState('');
    const [size, setSize] = useState('small');
    const [image, setImage] = useState(null);  // Keep image handling for future
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(null);  // For success message
    const navigate = useNavigate();

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

    return (
        <div>
            <h2>Add a Dog</h2>
            <form onSubmit={handleSubmit} encType="multipart/form-data">
                <div>
                    <label>Dog Name:</label>
                    <input
                        type="text"
                        value={dogName}
                        onChange={(e) => setDogName(e.target.value)}
                        required
                    />
                </div>

                <div>
                    <label>Size:</label>
                    <select value={size} onChange={(e) => setSize(e.target.value)} required>
                        <option value="small">Small</option>
                        <option value="medium">Medium</option>
                        <option value="large">Large</option>
                    </select>
                </div>

                <div>
                    <label>Image (optional):</label>
                    <input type="file" accept="image/*" onChange={handleFileChange} />
                </div>

                {error && <p style={{ color: 'red' }}>{error}</p>}
                {success && <p style={{ color: 'green' }}>{success}</p>}  {/* Success message */}

                <button type="submit" disabled={loading}>
                    {loading ? 'Adding...' : 'Add Dog'}
                </button>
            </form>
        </div>
    );
};

export default DogForm;
