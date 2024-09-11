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
        <div style={styles.formContainer}>
            <h2 style={styles.heading}>Add a Dog</h2>
            <form onSubmit={handleSubmit} encType="multipart/form-data" style={styles.form}>
                <div style={styles.formGroup}>
                    <label style={styles.label}>Dog Name:</label>
                    <input
                        type="text"
                        value={dogName}
                        onChange={(e) => setDogName(e.target.value)}
                        required
                        style={styles.input}
                    />
                </div>

                <div style={styles.formGroup}>
                    <label style={styles.label}>Size:</label>
                    <select
                        value={size}
                        onChange={(e) => setSize(e.target.value)}
                        required
                        style={styles.select}
                    >
                        <option value="small">Small</option>
                        <option value="medium">Medium</option>
                        <option value="large">Large</option>
                    </select>
                </div>

                <div style={styles.formGroup}>
                    <label style={styles.label}>Image (optional):</label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        style={styles.inputFile}
                    />
                </div>

                {error && <p style={styles.error}>{error}</p>}
                {success && <p style={styles.success}>{success}</p>}  {/* Success message */}

                <button type="submit" disabled={loading} style={styles.button}>
                    {loading ? 'Adding...' : 'Add Dog'}
                </button>
            </form>
        </div>
    );
};

export default DogForm;

// Styling using CSS-in-JS
const styles = {
    formContainer: {
        maxWidth: '500px',
        margin: '0 auto',
        padding: '20px',
        border: '1px solid #ccc',
        borderRadius: '8px',
        boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
        backgroundColor: '#f9f9f9',
    },
    heading: {
        textAlign: 'center',
        color: '#333',
        marginBottom: '20px',
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
    },
    formGroup: {
        marginBottom: '15px',
    },
    label: {
        fontWeight: 'bold',
        marginBottom: '5px',
        display: 'block',
    },
    input: {
        width: '100%',
        padding: '10px',
        borderRadius: '4px',
        border: '1px solid #ccc',
        fontSize: '16px',
        boxSizing: 'border-box',
    },
    select: {
        width: '100%',
        padding: '10px',
        borderRadius: '4px',
        border: '1px solid #ccc',
        fontSize: '16px',
        boxSizing: 'border-box',
    },
    inputFile: {
        fontSize: '16px',
    },
    button: {
        padding: '10px 15px',
        backgroundColor: '#4CAF50',
        color: '#fff',
        border: 'none',
        borderRadius: '4px',
        fontSize: '16px',
        cursor: 'pointer',
        marginTop: '10px',
    },
    buttonHover: {
        backgroundColor: '#45a049',
    },
    error: {
        color: 'red',
        fontSize: '14px',
        marginTop: '10px',
    },
    success: {
        color: 'green',
        fontSize: '14px',
        marginTop: '10px',
    },
};
