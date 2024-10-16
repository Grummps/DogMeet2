import React, { useState, useEffect } from 'react';
import axios from 'axios';
import getUserInfo from '../../utilities/decodeJwt';

const CreateEventForm = ({ userId, parkId }) => {
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const userInfo = getUserInfo();
    userId = userInfo.id;
    
    try {
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URI}/events/create`, {
        userId,
        parkId,
        time,
        date
      });

      if (response.status === 201) {
        setSuccess('Event created successfully!');
        setTime('');
        setDate('');
      }
    } catch (error) {
      console.error(error);
      setError('Failed to create event. Please try again.');
    }
  };

  return (
    <div className="create-event-form">
      <h2>Create an Event</h2>
      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="time">Time:</label>
          <input
            type="time"
            id="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="date">Date:</label>
          <input
            type="date"
            id="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
        <button type="submit">Create Event</button>
      </form>
    </div>
  );
};

export default CreateEventForm;
