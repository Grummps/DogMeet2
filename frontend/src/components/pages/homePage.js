import React, { useEffect, useState } from 'react';
import axios from 'axios';
import MapWithDirections from '../ui/mapWithDirections';
import { Link } from 'react-router-dom';

const HomePage = () => {
    const [userLocation, setUserLocation] = useState(null);
    const [nearbyParks, setNearbyParks] = useState([]);
    const [error, setError] = useState('');
    const [routes, setRoutes] = useState({}); // Store routes per parkId
    const [clickCount, setClickCount] = useState(0); // Track total clicks

    const MAX_CLICKS = 5;

    useEffect(() => {
        // Initialize click count from localStorage
        const storedClicks = parseInt(localStorage.getItem('showDirectionsClicks') || '0', 10);
        setClickCount(storedClicks);
    }, []);

    useEffect(() => {
        // Check if geolocation is available
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                position => {
                    const { latitude, longitude } = position.coords;
                    setUserLocation({ latitude, longitude });
                },
                err => {
                    console.error('Error obtaining location:', err);
                    setError('Unable to retrieve your location.');
                }
            );
        } else {
            setError('Geolocation is not supported by your browser.');
        }
    }, []);

    // Fetch nearby parks when userLocation is available
    useEffect(() => {
        if (userLocation) {
            fetchNearbyParks(userLocation);
        }
    }, [userLocation]);

    const fetchNearbyParks = async ({ latitude, longitude }) => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_BACKEND_URI}/parks/nearby`, {
                params: {
                    latitude,
                    longitude,
                },
            });
            setNearbyParks(response.data);
        } catch (err) {
            console.error('Error fetching nearby parks:', err);
            setError('Failed to load nearby parks.');
        }
    };

    const handleShowDirections = async (parkId, parkLat, parkLng) => {
        // Check if user has remaining clicks
        if (clickCount >= MAX_CLICKS) {
            alert('You have reached the maximum number of direction requests.');
            return;
        }

        // Check if directions are already shown for this park
        if (routes[parkId]) {
            alert('Directions already shown for this park.');
            return;
        }

        try {
            const response = await axios.post(`${process.env.REACT_APP_BACKEND_URI}/directions`, {
                startLat: userLocation.latitude,
                startLng: userLocation.longitude,
                endLat: parkLat,
                endLng: parkLng,
            });

            const geojson = response.data;

            if (!geojson.features || geojson.features.length === 0) {
                throw new Error('No routes found');
            }

            // Extract coordinates
            const coords = geojson.features[0].geometry.coordinates.map(coord => [coord[1], coord[0]]); // [lat, lng]

            // Update routes state
            setRoutes(prevRoutes => ({
                ...prevRoutes,
                [parkId]: coords,
            }));

            // Increment click count
            const newClickCount = clickCount + 1;
            setClickCount(newClickCount);
            localStorage.setItem('showDirectionsClicks', newClickCount.toString());

            if (newClickCount >= MAX_CLICKS) {
                alert('You have reached the maximum number of direction requests.');
            }
        } catch (error) {
            console.error('Error fetching directions:', error);
            alert('Failed to load directions.');
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-4 ml-40">Parks Near You</h1>
            {error && <div className="text-red-500">{error}</div>}
            {!error && nearbyParks.length === 0 && <p>Loading nearby parks...</p>}
            {!error && nearbyParks.length > 0 && (
                <ul>
                    {nearbyParks.map(park => (
                        <li key={park._id} className="mb-8">
                            <div className="ml-48">
                                <h2 className="text-2xl font-semibold">{park.parkName}</h2>
                                <p>Distance: {(park.distance / 1000).toFixed(2)} km</p>
                                <p>
                                    <strong>Location:</strong> Latitude: {park.location.coordinates[1]}, Longitude: {park.location.coordinates[0]}
                                </p>
                                {/* Directions Map */}
                                <div className="mt-4">
                                    <MapWithDirections
                                        parkName={park.parkName}
                                        parkLocation={{
                                            latitude: park.location.coordinates[1],
                                            longitude: park.location.coordinates[0]
                                        }}
                                        userLocation={userLocation}
                                        route={routes[park._id]} // Pass route if available
                                    />
                                </div>
                                {/* Show Directions Button */}
                                <div className="mt-2">
                                    <button
                                        onClick={() => handleShowDirections(park._id, park.location.coordinates[1], park.location.coordinates[0])}
                                        disabled={routes[park._id] || clickCount >= MAX_CLICKS}
                                        className={`px-4 py-2 rounded ${routes[park._id] || clickCount >= MAX_CLICKS
                                            ? 'bg-gray-400 cursor-not-allowed'
                                            : 'bg-blue-500 hover:bg-blue-700 text-white'
                                            }`}
                                    >
                                        {routes[park._id] ? 'Directions Shown' : 'Show Directions'}
                                    </button>
                                </div>
                                {/* Additional Park Details or Actions */}
                                <div className="mt-2">
                                    <Link to={`/parks/${park._id}`} className="text-blue-500 underline">
                                        View Park Details
                                    </Link>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default HomePage;
