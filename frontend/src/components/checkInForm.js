import React, { useState, useEffect } from 'react';
import axios from 'axios';
import apiClient from '../utilities/apiClient';

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
        setDogs(response.data.dogId); // Assuming user's dogs are in dogId array
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
      setSelectedDogs(selectedDogs.filter((id) => id !== dogId));
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
      onSuccess();
    } catch (error) {
      console.error(error);
      setError('Failed to check in. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <p className="text-red-500">{error}</p>}
      <div className="form-group mt-4">
        <label className="font-semibold">Durationb in minutes (defaults to 60):</label>
        <input
          type="number"
          min="1"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          className="border rounded px-2 py-1 w-full"
          required
        />
      </div>
      <div className="form-group">
        <label>Select Dogs:</label>
        {dogs.map((dog) => (
          <div key={dog._id}>
            <input
              type="checkbox"
              value={dog._id}
              onChange={handleDogSelection}
              checked={selectedDogs.includes(dog._id)}
            />
            <label className="ml-2">
              {dog.dogName} ({dog.size})
            </label>
          </div>
        ))}
      </div>
      <button type="submit" className="mt-4 px-4 py-2 bg-green-500 text-white rounded">
        Check-in
      </button>
    </form>
  );
};

export default CheckInForm;
