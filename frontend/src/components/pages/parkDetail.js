import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import jwt_decode from 'jwt-decode';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import CreateEventForm from './eventForm';

// Fix Leaflet's default icon paths if not already done
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const ParkDetail = () => {
  const { id } = useParams();
  const [park, setPark] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [upcomingEvents, setUpcomingEvents] = useState([]); // Store upcoming events
  const [checkedInUsers, setCheckedInUsers] = useState([]); // Store checked-in users

  useEffect(() => {
    const fetchParkDetails = async () => {
      try {
        const parkResponse = await axios.get(`${process.env.REACT_APP_BACKEND_URI}/parks/${id}`);
        setPark(parkResponse.data);

        // Fetch upcoming events for this park
        const eventsResponse = await axios.get(`${process.env.REACT_APP_BACKEND_URI}/parks/${id}/events/upcoming`);
        setUpcomingEvents(eventsResponse.data);

        // Fetch checked-in users for this park
        const usersResponse = await axios.get(`${process.env.REACT_APP_BACKEND_URI}/parks/${id}/checked-in-users`);
        setCheckedInUsers(usersResponse.data);

      } catch (err) {
        console.error('Error fetching park details:', err);
        setError('Failed to load park details.');
      } finally {
        setLoading(false);
      }
    };

    fetchParkDetails();

    // Decode the JWT token to get the user ID
    const token = localStorage.getItem('token');
    if (token) {
      const decoded = jwt_decode(token);
      setCurrentUserId(decoded.userId); // Assuming userId is stored in the token
    }
  }, [id]);

  if (loading) return <div>Loading park details...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!park) return <div>No park found.</div>;

  const { parkName, location } = park;
  const [longitude, latitude] = location.coordinates;

  return (
    <div className="p-6 ml-36">
      <h1 className="text-3xl font-bold mb-4">{parkName}</h1>
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Location:</h2>
        <p>{latitude}, {longitude}</p>
      </div>

      {/* Map displaying the park location */}
      <MapContainer center={[latitude, longitude]} zoom={15} style={{ height: "400px", width: "100%", zIndex: 10 }}>
        <TileLayer
          attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[latitude, longitude]}>
          <Popup>{parkName} is located here.</Popup>
        </Marker>
      </MapContainer>
      
      {/* Button to trigger the modal for creating an event */}
      <button
        className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-md"
        onClick={() => setShowModal(true)}
      >
        Create Event
      </button>

      {/* Upcoming Events Section */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Upcoming Events</h2>
        {upcomingEvents.length === 0 ? (
          <p>No upcoming events for this park.</p>
        ) : (
          <ul>
            {upcomingEvents.map(event => (
              <li key={event._id} className="mb-2">
                <p><strong>Event Name:</strong> {event.eventName}</p>
                <p><strong>Date:</strong> {new Date(event.date).toLocaleDateString()}</p>
                <p><strong>Time:</strong> {event.time}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Checked-in Users Section */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Checked-in Users</h2>
        {checkedInUsers.length === 0 ? (
          <p>No users are currently checked in to this park.</p>
        ) : (
          <ul>
            {checkedInUsers.map(user => (
              <li key={user._id} className="mb-2">
                <p><strong>Username:</strong> {user.username}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Modal for Event Creation */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-md w-full max-w-md relative">
            <button
              className="absolute top-2 right-2 text-gray-500"
              onClick={() => setShowModal(false)}
            >
              &times;
            </button>
            <h2 className="text-2xl font-semibold mb-4">Create Event for {parkName}</h2>
            <CreateEventForm
              userId={currentUserId}
              parkId={id}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ParkDetail;
