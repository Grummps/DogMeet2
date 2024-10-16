import React, { useEffect, useState } from 'react';
import apiClient from '../utilities/apiClient';
import getUserInfo from '../utilities/decodeJwt';

const EventList = ({ updateUser }) => {
  const [events, setEvents] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const userInfo = getUserInfo();

    const fetchEvents = async () => {
      try {
        const response = await apiClient.get(`events/user/${userInfo.id}`);
        setEvents(response.data);
      } catch (error) {
        console.error('Error fetching events: ', error);
        setError('Failed to fetch events.');
      }
    };

    if (userInfo.id) {
      fetchEvents();
    }
  }, [updateUser]);

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-semibold text-gray-800 ">Your Events</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {events.length > 0 ? (
        <ul className="space-y-4">
          {events.map(event => (
            <li
              key={event._id}
              className="bg-white shadow-md rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              <h3 className="text-xl font-bold text-gray-700 mb-2">
                {event.eventName}
              </h3>
              <p className="text-gray-600 mb-1">
                <span className="font-medium">Date:</span>{' '}
                {new Date(event.date).toLocaleDateString()}
              </p>
              <p className="text-gray-600 mb-1">
                <span className="font-medium">Time:</span> {event.time}
              </p>
              <p className="text-gray-600">
                <span className="font-medium">Park:</span>{' '}
                {event.parkId.parkName}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-700">No events found</p>
      )}
    </div>
  );
};

export default EventList;
