import React, { useEffect, useState } from 'react';
import apiClient from '../../utilities/apiClient';
import getUserInfo from '../../utilities/decodeJwt';

const EventList = () => {
  const [events, setEvents] = useState([]);
  const [error, setError] = useState(null);
  const userInfo = getUserInfo();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        // Fetch events for the logged-in user and populate 'parkId'
        const response = await apiClient.get(`events/user/${userInfo.id}`);
        setEvents(response.data);
      } catch (error) {
        console.error('Error fetching events:', error);
        setError('Failed to fetch events.');
      }
    };

    if (userInfo.id) {
      fetchEvents();
    }
  }, [userInfo.id]);

  const deleteEvent = async (eventId) => {
    try {
      await apiClient.delete(`events/delete/${eventId}`);
      // Update the local state to remove the deleted event
      setEvents(events.filter(event => event._id !== eventId));
    } catch (error) {
      console.error('Error deleting event:', error);
      setError('Failed to delete event.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-semibold text-gray-800">Your Events</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {events.length > 0 ? (
        <ul className="space-y-4">
          {events.map(event => (
            <li
              key={event._id}
              className="bg-white shadow-md rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              <p className="text-gray-600 mb-1">
                <span className="font-medium">Date:</span>{' '}
                {new Date(event.date).toLocaleDateString()}
              </p>
              <p className="text-gray-600 mb-1">
                <span className="font-medium">Time:</span>{' '}
                {new Date(`1970-01-01T${event.time}:00`).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
              <p className="text-gray-600">
                <span className="font-medium">Park:</span>{' '}
                {event.parkId?.parkName || 'N/A'}
              </p>
              <button
                onClick={() => deleteEvent(event._id)}
                className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Delete Event
              </button>
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
