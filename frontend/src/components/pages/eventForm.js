import React, { useState, useEffect } from 'react';
import axios from 'axios';
import getUserInfo from '../../utilities/decodeJwt';
import apiClient from '../../utilities/apiClient';

const CreateEventForm = ({ parkId }) => {
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');
  const [dogs, setDogs] = useState([]);
  const [selectedDogs, setSelectedDogs] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const userInfo = getUserInfo();
  const userId = userInfo.id;

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
    setSuccess('');

    if (selectedDogs.length === 0) {
      setError('Please select at least one dog.');
      return;
    }

    try {
      const response = await apiClient.post(`/events/create`, {
        userId,
        parkId,
        dogs: selectedDogs,
        time,
        date,
      });

      if (response.status === 201) {
        setSuccess('Event created successfully!');
        // Reset form fields
        setTime('');
        setDate('');
        setSelectedDogs([]);
      }
    } catch (error) {
      console.error(error);
      setError('Failed to create event. Please try again.');
    }
  };

  return (
    <div className="create-event-form">
      <h2>Create an Event</h2>
      {error && <p className="text-red-500">{error}</p>}
      {success && <p className="text-green-500">{success}</p>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Time:</label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            required
            className="border rounded px-2 py-1"
          />
        </div>
        <div className="form-group">
          <label>Date:</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="border rounded px-2 py-1"
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
                {dog.dogName} {dog.size}
              </label>
            </div>
          ))}
        </div>
        <button type="submit" className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">
          Create Event
        </button>
      </form>
    </div>
  );
};

export default CreateEventForm;
