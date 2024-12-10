import React, { useState, useEffect } from 'react';
import apiClient from '../../utilities/apiClient';
import { ArrowRightIcon, ArrowLeftIcon } from '@heroicons/react/24/solid';

const AdminExpiredEvents = ({ parkId }) => {
    const [expiredEvents, setExpiredEvents] = useState([]);
    const [allEvents, setAllEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [view, setView] = useState('expired'); // 'expired' or 'all'

    // Fetch events when parkId or view changes
    useEffect(() => {
        if (parkId) {
            if (view === 'expired') {
                fetchExpiredEvents();
            } else {
                fetchAllEvents();
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [parkId, view]);

    // Function to fetch expired events
    const fetchExpiredEvents = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await apiClient.get(`/parks/${parkId}/events/expired`);
            setExpiredEvents(response.data);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Failed to fetch expired events.');
        } finally {
            setLoading(false);
        }
    };

    // Function to fetch all events
    const fetchAllEvents = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await apiClient.get(`/parks/${parkId}/events`);
            setAllEvents(response.data);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Failed to fetch all events.');
        } finally {
            setLoading(false);
        }
    };

    // Function to delete an individual event
    const deleteEvent = async (eventId) => {
        const confirmDelete = window.confirm('Are you sure you want to delete this event?');
        if (!confirmDelete) return;

        try {
            await apiClient.delete(`/events/delete/${eventId}`);
            // Update state by filtering out the deleted event
            if (view === 'expired') {
                setExpiredEvents((prevEvents) => prevEvents.filter((event) => event._id !== eventId));
            } else {
                setAllEvents((prevEvents) => prevEvents.filter((event) => event._id !== eventId));
            }
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || 'Failed to delete the event.');
        }
    };

    // Function to delete all expired events
    const deleteAllExpiredEvents = async () => {
        const confirmDeleteAll = window.confirm('Are you sure you want to delete all expired events?');
        if (!confirmDeleteAll) return;

        try {
            const response = await apiClient.delete(`/parks/${parkId}/events/expired`);
            alert(response.data.message || 'Expired events deleted successfully.');
            // Clear the expiredEvents state
            setExpiredEvents([]);
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || 'Failed to delete expired events.');
        }
    };

    // Function to delete the park
    const deletePark = async () => {
        const confirmDeletePark = window.confirm('Are you sure you want to delete this park? This action cannot be undone.');
        if (!confirmDeletePark) return;

        try {
            const response = await apiClient.delete(`/parks/delete/${parkId}`);
            alert(response.data.message || 'Park deleted successfully.');

            // After deletion, you might want to redirect, clear park data, or refresh a parent component.
            // For now, we just show an alert. You can add additional logic here as needed.
        } catch (err) {
            console.error('Error deleting park:', err);
            alert(err.response?.data?.message || 'Failed to delete the park.');
        }
    };

    // Toggle view between 'expired' and 'all'
    const toggleView = () => {
        setView((prevView) => (prevView === 'expired' ? 'all' : 'expired'));
    };

    // Determine the data to display based on the current view
    const eventsToDisplay = view === 'expired' ? expiredEvents : allEvents;
    const isExpiredView = view === 'expired';

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">
                    {isExpiredView ? 'Expired Events' : 'All Events'}
                </h2>
                <button
                    onClick={toggleView}
                    className="flex items-center text-blue-500 hover:text-blue-700 focus:outline-none"
                    title={isExpiredView ? 'View All Events' : 'View Expired Events'}
                >
                    {isExpiredView ? (
                        <>
                            <span className="mr-2">View All Events</span>
                            <ArrowRightIcon className="h-5 w-5" />
                        </>
                    ) : (
                        <>
                            <ArrowLeftIcon className="h-5 w-5 mr-2" />
                            <span>View Expired Events</span>
                        </>
                    )}
                </button>
            </div>

            {/* Error Messages */}
            {error && <div className="mb-4 text-red-500 text-center">{error}</div>}

            {/* Actions Section */}
            <div className="flex justify-end space-x-4 mb-4">
                {/* Delete Park button */}
                <button
                    onClick={deletePark}
                    className="px-4 py-2 bg-red-700 text-white rounded-md hover:bg-red-800 transition-colors duration-300"
                >
                    Delete Park
                </button>

                {/* Delete all expired events button (only visible in 'expired' view) */}
                {isExpiredView && (
                    <button
                        onClick={deleteAllExpiredEvents}
                        disabled={expiredEvents.length === 0}
                        className={`px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors duration-300 ${expiredEvents.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                    >
                        Delete All Expired Events
                    </button>
                )}
            </div>

            {/* Display loading, error, or events */}
            {loading ? (
                <p className="text-center">Loading {isExpiredView ? 'expired' : 'all'} events...</p>
            ) : eventsToDisplay.length === 0 ? (
                <p className="text-center text-gray-600">
                    {isExpiredView ? 'No expired events found.' : 'No events found.'}
                </p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border">
                        <thead>
                            <tr>
                                <th className="py-2 px-4 border-b bg-gray-200 text-left">Event ID</th>
                                <th className="py-2 px-4 border-b bg-gray-200 text-left">User</th>
                                <th className="py-2 px-4 border-b bg-gray-200 text-left">Dogs</th>
                                <th className="py-2 px-4 border-b bg-gray-200 text-left">Time</th>
                                <th className="py-2 px-4 border-b bg-gray-200 text-left">Date</th>
                                <th className="py-2 px-4 border-b bg-gray-200 text-left">Duration (mins)</th>
                                {isExpiredView && (
                                    <th className="py-2 px-4 border-b bg-gray-200 text-left">Expires At</th>
                                )}
                                <th className="py-2 px-4 border-b bg-gray-200 text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {eventsToDisplay.map((event) => (
                                <tr key={event._id} className="hover:bg-gray-100">
                                    <td className="py-2 px-4 border-b">{event._id}</td>
                                    <td className="py-2 px-4 border-b">{event.userId?.username || 'N/A'}</td>
                                    <td className="py-2 px-4 border-b">
                                        {event.dogs && event.dogs.length > 0
                                            ? event.dogs.map((dog) => dog.dogName).join(', ')
                                            : 'No Dogs'}
                                    </td>
                                    <td className="py-2 px-4 border-b">{event.time}</td>
                                    <td className="py-2 px-4 border-b">
                                        {new Date(event.date).toLocaleDateString()}
                                    </td>
                                    <td className="py-2 px-4 border-b">{event.duration}</td>
                                    {isExpiredView && (
                                        <td className="py-2 px-4 border-b">
                                            {new Date(event.expiresAt).toLocaleString()}
                                        </td>
                                    )}
                                    <td className="py-2 px-4 border-b">
                                        <button
                                            onClick={() => deleteEvent(event._id)}
                                            className="bg-red-500 text-white px-3 py-1 rounded-md hover:bg-red-600 transition-colors duration-300"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default AdminExpiredEvents;
