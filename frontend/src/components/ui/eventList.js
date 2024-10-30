import React, { useEffect, useState } from 'react';
import apiClient from '../../utilities/apiClient';
import ConfirmationModal from './confirmationModal';
import Alert from './alert';

const EventsModal = ({ isOpen, onClose }) => {
  const [events, setEvents] = useState([]);
  const [error, setError] = useState(null);
  const [eventToDelete, setEventToDelete] = useState(null);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackType, setFeedbackType] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchEvents();
    }
  }, [isOpen]);

  const fetchEvents = async () => {
    try {
      const response = await apiClient.get('/events/user');
      setEvents(response.data);
    } catch (error) {
      console.error('Error fetching events:', error);
      setError('Failed to fetch events.');
    }
  };

  const openDeleteEventModal = (eventId) => {
    setEventToDelete(eventId);
    setIsConfirmationModalOpen(true);
  };

  const handleDeleteEvent = async () => {
    setIsConfirmationModalOpen(false);
    try {
      await apiClient.delete(`/events/delete/${eventToDelete}`);
      setEvents(events.filter((event) => event._id !== eventToDelete));
      setFeedbackMessage('Event deleted successfully');
      setFeedbackType('success');
    } catch (error) {
      console.error('Error deleting event:', error);
      setFeedbackMessage('Failed to delete event.');
      setFeedbackType('error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg max-h-screen overflow-y-auto">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">Your Events</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">
            &times;
          </button>
        </div>
        <div className="p-4">
          {error && <p className="text-red-500 mb-4">{error}</p>}
          {feedbackMessage && (
            <Alert
              type={feedbackType}
              message={feedbackMessage}
              onClose={() => setFeedbackMessage('')}
            />
          )}
          {events.length > 0 ? (
            <ul className="space-y-4">
              {events.map((event) => (
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
                    onClick={() => openDeleteEventModal(event._id)}
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
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={isConfirmationModalOpen}
        title="Delete Event"
        message="Are you sure you want to delete this event?"
        onConfirm={handleDeleteEvent}
        onCancel={() => setIsConfirmationModalOpen(false)}
      />
    </div>
  );
};

export default EventsModal;
