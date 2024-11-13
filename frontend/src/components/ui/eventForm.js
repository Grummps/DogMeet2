import React, { useState, useEffect } from 'react';
import axios from 'axios';
import getUserInfo from '../../utilities/decodeJwt';
import apiClient from '../../utilities/apiClient';

const CreateEventForm = ({ parkId, onSuccess, isCheckedIn, currentCheckInEvent }) => {
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');
  const [dogs, setDogs] = useState([]);
  const [selectedDogs, setSelectedDogs] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [duration, setDuration] = useState(60); // Default duration to 60 minutes
  const [isSubmitting, setIsSubmitting] = useState(false); // Optional: Manage submission state

  const userInfo = getUserInfo();
  const userId = userInfo ? userInfo._id : null;

  useEffect(() => {
    // Fetch the user's dogs
    const fetchDogs = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_BACKEND_URI}/users/${userId}`);
        setDogs(response.data.dogId); // Assuming `dogId` already contains the correct `_id` format
      } catch (err) {
        console.error('Error fetching dogs:', err);
        setError('Failed to fetch your dogs.');
      }
    };

    if (userId) {
      fetchDogs();
    }
  }, [userId]);

  const handleDogSelection = (e) => {
    const dogId = e.target.value;
    if (e.target.checked) {
      setSelectedDogs([...selectedDogs, dogId]);
    } else {
      setSelectedDogs(selectedDogs.filter((_id) => _id !== dogId));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true); // Optional: Start submission

    // Removed the check that prevents form submission if the user is checked in
    // Allow form submission and rely on backend validations

    if (selectedDogs.length === 0) {
      setError('Please select at least one dog.');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await apiClient.post(`/events/create`, {
        userId,
        parkId,
        dogs: selectedDogs,
        time,
        date,
        duration,
      });

      if (response.status === 201) {
        setSuccess('Event created successfully!');
        // Reset form fields
        setTime('');
        setDate('');
        setSelectedDogs([]);
        setDuration(60);
        onSuccess();
      }
    } catch (error) {
      console.error(error);
      setError(error.response?.data?.message || 'Failed to create event. Please try again.');
    } finally {
      setIsSubmitting(false); // Optional: End submission
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      <h2 className="text-2xl font-semibold mb-6 text-center">Create an Event</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {success && <p className="text-green-500 mb-4">{success}</p>}

      <div className="form-group">
        <label className="block text-gray-700">Time:</label>
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          required
          className="w-full border rounded px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="form-group">
        <label className="block text-gray-700">Date:</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
          className="w-full border rounded px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="form-group">
        <label className="block text-gray-700">Duration in minutes (defaults to 60):</label>
        <input
          type="number"
          min="1"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          required
          className="w-full border rounded px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="form-group">
        <label className="block text-gray-700 mb-2">Select Dogs:</label>
        <div className="space-y-2">
          {dogs.length === 0 ? (
            <p className="text-gray-500">You have no dogs to select.</p>
          ) : (
            dogs.map((dog) => (
              <div key={dog._id} className="flex items-center">
                <input
                  type="checkbox"
                  value={dog._id}
                  onChange={handleDogSelection}
                  checked={selectedDogs.includes(dog._id)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  id={`dog-${dog._id}`}
                />
                <label htmlFor={`dog-${dog._id}`} className="ml-2 text-gray-700">
                  {dog.dogName} ({dog.size})
                </label>
              </div>
            ))
          )}
        </div>
      </div>
      <button
        type="submit"
        className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors duration-200"
        disabled={isSubmitting} // Optional: Disable button while submitting
      >
        {isSubmitting ? 'Creating Event...' : 'Create Event'}
      </button>

    </form>
  );

};

export default CreateEventForm;
