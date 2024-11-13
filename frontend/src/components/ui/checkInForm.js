import React, { useState, useEffect } from 'react';
import axios from 'axios';
import apiClient from '../../utilities/apiClient';

const CheckInForm = ({ userId, parkId, onSuccess }) => {
  const [dogs, setDogs] = useState([]);
  const [selectedDogs, setSelectedDogs] = useState([]);
  const [error, setError] = useState('');
  const [duration, setDuration] = useState(60); // Default duration to 60 minutes

  useEffect(() => {
    // Fetch the user's dogs
    const fetchDogs = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_BACKEND_URI}/users/${userId}`);
        const dogsWithId = response.data.dogId.map(dog => ({ ...dog }));
        setDogs(dogsWithId); // Assuming user's dogs are in dogId array
      } catch (err) {
        console.error('Error fetching dogs:', err);
      }
    };

    fetchDogs();
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

    if (selectedDogs.length === 0) {
      setError('Please select at least one dog.');
      return;
    }

    try {
      await apiClient.post(`/parks/${parkId}/check-in`, {
        dogIds: selectedDogs,
        duration,
      });

      // Success
      onSuccess(duration);
    } catch (error) {
      console.error(error);
      // Check if the error response contains a message
      if (error.response && error.response.data && error.response.data.message) {
        setError(error.response.data.message);
      } else if (error.message) {
        // Fallback to error.message if available
        setError(error.message);
      } else {
        // Generic fallback message
        setError('Failed to check in. Please try again.');
      }
    }
  };


  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="form-group">
        <h2 className="text-2xl font-semibold mb-6 text-center">Check-In</h2>
        {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
        <label className="block text-gray-700 font-medium mb-2">
          How long you'll be here:
        </label>
        <div className="relative">
          <input
            type="number"
            min="1"
            max="300"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            required
            className="w-full border border-gray-300 rounded px-4 pr-16 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Enter duration"
          />
          <span className="absolute inset-y-0 right-11 flex items-center text-gray-500 pointer-events-none">
            minutes
          </span>
        </div>
      </div>
      <div className="form-group">
        <label className="block text-gray-700 font-medium mb-2">Select Dogs:</label>
        <div className="space-y-2">
          {dogs.map((dog) => (
            <div key={dog._id} className="flex items-center">
              <input
                type="checkbox"
                value={dog._id}
                onChange={handleDogSelection}
                checked={selectedDogs.includes(dog._id)}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                id={`dog-${dog._id}`}
              />
              <label htmlFor={`dog-${dog._id}`} className="ml-3 text-gray-700">
                {dog.dogName} ({dog.size})
              </label>
            </div>
          ))}
        </div>
      </div>
      <button
        type="submit"
        className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500"
      >
        Check-In

      </button >
    </form >
  );
};

export default CheckInForm;
