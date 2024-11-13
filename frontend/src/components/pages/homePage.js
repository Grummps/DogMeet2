import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import MapWithDirections from '../ui/mapWithDirections';
import { Link } from 'react-router-dom';
import debounce from 'lodash.debounce';
import { ClipLoader } from 'react-spinners';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Import utility functions
import { generateCacheKey } from '../../utilities/coordinateUtils';

const HomePage = () => {
    const [userLocation, setUserLocation] = useState(null);
    const [nearbyParks, setNearbyParks] = useState([]);
    const [error, setError] = useState('');
    const [routes, setRoutes] = useState({}); // Store routes per parkId
    const [isLoading, setIsLoading] = useState(false); // Loading state for spinner

    const CACHE_KEY = 'routeCache'; // Key for localStorage
    const MAX_CACHE_SIZE = 50; // Maximum number of cached routes

    // Initialize routeCache with cached routes
    useEffect(() => {
        const cachedRoutes = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
        setRoutes(cachedRoutes);
    }, []);

    useEffect(() => {
        // Check if geolocation is available
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                position => {
                    const { latitude, longitude } = position.coords;
                    console.log('User Location:', { latitude, longitude }); // For debugging
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

    // In-memory cache for routes
    const routeCache = React.useRef({}); // Using useRef to persist across renders

    // Initialize routeCache with cached routes
    useEffect(() => {
        const cachedRoutes = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
        routeCache.current = cachedRoutes;
    }, []);

    // Helper function to manage cache size
    const manageCacheSize = () => {
        const entries = Object.entries(routeCache.current);
        if (entries.length > MAX_CACHE_SIZE) {
            // Sort entries by lastAccessed timestamp
            entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
            // Remove the least recently used entries
            const excess = entries.length - MAX_CACHE_SIZE;
            for (let i = 0; i < excess; i++) {
                delete routeCache.current[entries[i][0]];
            }
            // Update localStorage
            try {
                localStorage.setItem(CACHE_KEY, JSON.stringify(routeCache.current));
            } catch (e) {
                if (e.name === 'QuotaExceededError') {
                    console.error('localStorage quota exceeded.');
                    toast.error('Cache size exceeded. Please clear some cached routes.');
                }
            }
        }
    };

    // Debounced handleShowDirections with caching and LRU management
    const debouncedHandleShowDirections = useCallback(
        debounce(async (parkId, parkLat, parkLng) => {
            // Check if directions are already shown for this park
            if (routes[parkId]) {
                toast.info('Directions already shown for this park.');
                return;
            }

            // Create a unique cache key based on start and end coordinates
            const cacheKey = generateCacheKey(
                userLocation.latitude,
                userLocation.longitude,
                parkLat,
                parkLng
            );

            // Check if route is in cache
            if (routeCache.current[cacheKey]) {
                console.log('Using cached route for:', cacheKey);
                // Update lastAccessed timestamp
                routeCache.current[cacheKey].lastAccessed = Date.now();
                setRoutes(prevRoutes => ({
                    ...prevRoutes,
                    [parkId]: routeCache.current[cacheKey].coords,
                }));
                // Update localStorage with new timestamp
                try {
                    localStorage.setItem(CACHE_KEY, JSON.stringify(routeCache.current));
                } catch (e) {
                    if (e.name === 'QuotaExceededError') {
                        console.error('localStorage quota exceeded.');
                        toast.error('Cache size exceeded. Please clear some cached routes.');
                    }
                }
                return;
            }

            setIsLoading(true); // Start loading spinner

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

                // Update cache with lastAccessed timestamp
                routeCache.current[cacheKey] = {
                    coords: coords,
                    lastAccessed: Date.now(),
                };

                // Update routes state
                setRoutes(prevRoutes => ({
                    ...prevRoutes,
                    [parkId]: coords,
                }));

                // Update localStorage
                try {
                    localStorage.setItem(CACHE_KEY, JSON.stringify(routeCache.current));
                } catch (e) {
                    if (e.name === 'QuotaExceededError') {
                        console.error('localStorage quota exceeded.');
                        toast.error('Cache size exceeded. Please clear some cached routes.');
                    }
                }

                // Manage cache size
                manageCacheSize();

                toast.success('Directions loaded successfully!');
            } catch (error) {
                console.error('Error fetching directions:', error);
                if (error.response && error.response.status === 429) {
                    toast.error('Too many requests. Please try again later.');
                } else {
                    toast.error('Failed to load directions.');
                }
            } finally {
                setIsLoading(false); // End loading spinner
            }
        }, 300), // 300ms debounce interval
        [routes, userLocation]
    );

    const handleShowDirections = (parkId, parkLat, parkLng) => {
        debouncedHandleShowDirections(parkId, parkLat, parkLng);
    };

    // Cleanup debounced function on unmount
    useEffect(() => {
        return () => {
            debouncedHandleShowDirections.cancel();
        };
    }, [debouncedHandleShowDirections]);

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
                                    {userLocation && park.location.coordinates && (
                                        <MapWithDirections
                                            parkName={park.parkName}
                                            parkLocation={{
                                                latitude: park.location.coordinates[1],
                                                longitude: park.location.coordinates[0]
                                            }}
                                            userLocation={userLocation}
                                            route={routes[park._id]} // Pass route if available
                                        />
                                    )}
                                </div>
                                {/* Show Directions Button */}
                                <div className="mt-2">
                                    <button
                                        onClick={() => handleShowDirections(park._id, park.location.coordinates[1], park.location.coordinates[0])}
                                        disabled={routes[park._id]}
                                        className={`px-4 py-2 rounded ${routes[park._id]
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
            {/* Loading Spinner */}
            {isLoading && (
                <div className="fixed top-0 left-0 right-0 bottom-0 flex items-center justify-center bg-gray-800 bg-opacity-50 z-50">
                    <ClipLoader color="#ffffff" size={50} />
                </div>
            )}
            {/* Toast Notifications */}
            <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} newestOnTop closeOnClick pauseOnFocusLoss draggable pauseOnHover />
        </div>
    );
};

export default HomePage;