import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import CreateEventForm from '../ui/eventForm';
import CheckInForm from '../ui/checkInForm'; // Import the CheckInForm component
import getUserInfo from '../../utilities/decodeJwt';
import { Link } from 'react-router-dom';

// Fix Leaflet's default icon paths if not already done
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const ParkDetail = () => {
    const { _id: parkId } = useParams();
    const [park, setPark] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [showCheckInModal, setShowCheckInModal] = useState(false); // State for Check-in modal
    const [currentUserId, setCurrentUserId] = useState(null);
    const [upcomingEvents, setUpcomingEvents] = useState([]); // Store upcoming events
    const [checkedInDogs, setCheckedInDogs] = useState([]); // Store checked-in dogs
    const [dogsWithTimeLeft, setDogsWithTimeLeft] = useState([]);

    // Fetch data on component mount
    useEffect(() => {
        fetchParkDetails();
        fetchUpcomingEvents();
        fetchCheckedInDogs();

        const userInfo = getUserInfo();
        if (userInfo) {
            setCurrentUserId(userInfo._id);
        } else {
            console.error('User info not found');
        }
    }, []); // Runs once on mount

    // Update remaining time whenever `checkedInDogs` changes
    useEffect(() => {
        const updateDogsWithRemainingTime = () => {
            const updatedDogs = updateRemainingTime(checkedInDogs);
            setDogsWithTimeLeft(updatedDogs);
        };

        updateDogsWithRemainingTime();  // Initial call

        const intervalId = setInterval(updateDogsWithRemainingTime, 60000);  // Update every minute

        return () => clearInterval(intervalId);  // Cleanup interval on unmount
    }, [checkedInDogs]); // Dependency on `checkedInDogs`

    // Function to calculate remaining time
    const updateRemainingTime = (dogs) => {
        const now = new Date();
        const updatedDogs = dogs
            .map(dog => {
                const expiresAt = new Date(dog.expiresAt);
                const remainingTimeMs = expiresAt - now;
                if (remainingTimeMs <= 0) {
                    return null; // Dog's time has expired
                }
                const remainingTime = Math.ceil(remainingTimeMs / 60000); // in minutes
                return { ...dog, remainingTime };
            })
            .filter(dog => dog !== null); // Remove expired dogs
        return updatedDogs;
    };

    // Fetch park details
    const fetchParkDetails = async () => {
        try {
            const parkResponse = await axios.get(`${process.env.REACT_APP_BACKEND_URI}/parks/${parkId}`);
            setPark(parkResponse.data);
        } catch (err) {
            console.error('Error fetching park details:', err);
            setError('Failed to load park details.');
        } finally {
            setLoading(false);
        }
    };

    // Fetch upcoming events
    const fetchUpcomingEvents = async () => {
        try {
            const eventsResponse = await axios.get(`${process.env.REACT_APP_BACKEND_URI}/parks/${parkId}/events/upcoming`);
            setUpcomingEvents(eventsResponse.data);
        } catch (err) {
            console.error('Error fetching upcoming events:', err);
        }
    };

    // Fetch checked-in dogs (active events)
    const fetchCheckedInDogs = async () => {
        try {
            const eventsResponse = await axios.get(`${process.env.REACT_APP_BACKEND_URI}/parks/${parkId}/events/active`);
            const activeEvents = eventsResponse.data;

            // Extract dogs from active events
            const dogs = activeEvents.reduce((acc, event) => {
                return acc.concat(event.dogs.map(dog => ({
                    ...dog,
                    expiresAt: event.expiresAt,
                    duration: event.duration,
                })));
            }, []);

            setCheckedInDogs(dogs);
        } catch (err) {
            console.error('Error fetching checked-in dogs:', err);
        }
    };

    if (loading) return <div>Loading park details...</div>;
    if (error) return <div className="text-red-500">{error}</div>;
    if (!park) return <div>No park found.</div>;

    const { parkName, location } = park;
    const [longitude, latitude] = location.coordinates;

    return (
        <div className="p-6 ml-36">
            <h1 className="text-3xl font-bold mb-4">{parkName}</h1>
            <div className="mb-6">
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

            {/* Buttons to trigger the modals */}
            <div className="mt-4 flex space-x-4">
                <button
                    className="px-6 py-2 bg-blue-500 text-white rounded-md"
                    onClick={() => setShowModal(true)}
                >
                    Create Event
                </button>

                <button
                    className="px-6 py-2 bg-green-500 text-white rounded-md"
                    onClick={() => setShowCheckInModal(true)}
                >
                    Check-in
                </button>
            </div>

            {/* Main content area */}
            <div className="mt-8 flex">
                {/* Checked-in Dogs Section */}
                <div className="w-1/2">
                    <h2 className="text-2xl font-bold mb-4">Checked-in Dogs</h2>
                    {dogsWithTimeLeft.length === 0 ? (
                        <p>No dogs are currently checked in to this park.</p>
                    ) : (
                        <ul>
                            {dogsWithTimeLeft.map(dog => (
                                <li key={dog._id} className="mb-4 flex items-center">
                                    {dog.image ? (
                                        <img
                                            src={dog.image}
                                            alt={dog.dogName}
                                            className="w-20 h-20 rounded-full object-cover mr-4 border-2 border-gray-300"
                                        />
                                    ) : (
                                        <div className="w-20 h-20 bg-gray-300 rounded-full flex items-center justify-center mr-4 border-2 border-gray-300">
                                            <span className="text-gray-500 text-xs">No Image</span>
                                        </div>
                                    )}
                                    <div>
                                        <p><strong>Size:</strong> {dog.size} <strong>Name:</strong> {dog.dogName} <strong>Owner:</strong><Link to={`/profile/${dog.ownerId._id}`}>{dog.ownerId.username}</Link> </p>
                                        <p>Here for another: {dog.remainingTime} minute(s)</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Upcoming Events Section */}
                <div className="w-1/2 ml-4">
                    <h2 className="text-2xl font-bold mb-4">Upcoming Events</h2>
                    {upcomingEvents.length === 0 ? (
                        <p>No upcoming events for this park.</p>
                    ) : (
                        <ul>
                            {upcomingEvents.map(event => (
                                <li key={event._id} className="mb-4 border-b pb-2">
                                    <p><strong>Date:</strong> {new Date(event.date).toLocaleDateString()}</p>
                                    <p><strong>Time:</strong> {new Date(event.date).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</p>
                                    {event.dogs && event.dogs.length > 0 && (
                                        <div>
                                            <p><strong>Dogs Attending:</strong>
                                                <ul className="ml-4">
                                                    {event.dogs.map(dog => (
                                                        <li key={dog._id}>
                                                            {dog.dogName} ({dog.size})
                                                        </li>
                                                    ))}
                                                </ul>
                                            </p>
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
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
                            parkId={parkId}
                            onSuccess={() => {
                                setShowModal(false);
                                // Refresh the upcoming list
                                fetchUpcomingEvents();
                            }}
                        />
                    </div>
                </div>
            )}

            {/* Modal for Check-in */}
            {showCheckInModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white p-6 rounded-md w-full max-w-md relative">
                        <button
                            className="absolute top-2 right-2 text-gray-500"
                            onClick={() => setShowCheckInModal(false)}
                        >
                            &times;
                        </button>
                        <h2 className="text-2xl font-semibold mb-4">Check-in at {parkName}</h2>
                        <CheckInForm
                            userId={currentUserId}
                            parkId={parkId}
                            onSuccess={() => {
                                setShowCheckInModal(false);
                                // Refresh the checked-in dogs list
                                fetchCheckedInDogs();
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default ParkDetail;
