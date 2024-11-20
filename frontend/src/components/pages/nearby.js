import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import MapWithDirections from '../ui/mapWithDirections';
import { useNavigate } from 'react-router-dom';
import debounce from 'lodash.debounce';
import { ClipLoader } from 'react-spinners';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Import utility functions
import { generateCacheKey } from '../../utilities/coordinateUtils';
import { kmToMiles, milesToKm } from '../../utilities/distanceUtils';

const HomePage = () => {
    const navigate = useNavigate();
    const [userLocation, setUserLocation] = useState(null);
    const [nearbyParks, setNearbyParks] = useState([]);
    const [error, setError] = useState('');
    const [routes, setRoutes] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [unit, setUnit] = useState('');
    const [permissionStatus, setPermissionStatus] = useState(null); // New state for permission status

    const CACHE_KEY = 'routeCache';
    const MAX_CACHE_SIZE = 50;

    // Initialize routeCache with cached routes
    useEffect(() => {
        const cachedRoutes = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
        setRoutes(cachedRoutes);
    }, []);

    // Load preferred unit from localStorage on mount
    useEffect(() => {
        const storedUnit = localStorage.getItem('preferredUnit');
        if (storedUnit) {
            setUnit(storedUnit);
        }
    }, []);

    // Persist preferred unit to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('preferredUnit', unit);
    }, [unit]);

    // Function to request geolocation
    const requestGeolocation = () => {
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
    };

    // Check permission status on mount
    useEffect(() => {
        if (navigator.permissions) {
            navigator.permissions.query({ name: 'geolocation' }).then((status) => {
                setPermissionStatus(status.state);
                status.onchange = () => {
                    setPermissionStatus(status.state);
                };
            });
        } else {
            // Permissions API not supported
            setPermissionStatus('unknown');
        }
    }, []);

    // Request geolocation if permission is granted
    useEffect(() => {
        if (permissionStatus === 'granted') {
            requestGeolocation();
        }
    }, [permissionStatus]);

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
    const routeCache = React.useRef({});

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
                    toast.error('Cache size exceeded. Please try removing some directions.');
                }
            }
        }
    };

    // Helper function to convert distance based on selected unit
    const convertDistance = (distanceInKm) => {
        if (unit === 'km') {
            return distanceInKm.toFixed(2);
        } else if (unit === 'mi') {
            return kmToMiles(distanceInKm).toFixed(2);
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
                        toast.error('Cache size exceeded. Please try removing some directions.');
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
                        toast.error('Cache size exceeded. Please try removing some directions.');
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
        [routes, userLocation, unit]
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
            {/* Header with Title and Unit Toggle */}
            <div className="flex justify-between items-center mb-4 mr-40">
                <h1 className="text-3xl font-bold ml-40">Parks Near You</h1>
                {/* Unit Toggle Switch */}
                <label htmlFor="unit-toggle" className="flex items-center cursor-pointer">
                    {/* Toggle Label */}
                    <span className="mr-2 text-gray-700">Km</span>
                    {/* Toggle Switch */}
                    <div className="relative">
                        <input
                            type="checkbox"
                            id="unit-toggle"
                            className="sr-only"
                            checked={unit === 'mi'}
                            onChange={() => setUnit(unit === 'km' ? 'mi' : 'km')}
                        />
                        <div className="w-10 h-4 bg-gray-400 rounded-full shadow-inner"></div>
                        <div
                            className={`dot absolute w-6 h-6 bg-white rounded-full shadow -left-1 -top-1 transition ${unit === 'mi' ? 'transform translate-x-full bg-blue-500' : ''
                                }`}
                        ></div>
                    </div>
                    {/* Toggle Label */}
                    <span className="ml-2 text-gray-700">Mi</span>
                </label>
            </div>

            {/* Conditional Rendering Based on Permission Status */}
            {permissionStatus === 'denied' && (
                <div className="text-red-500 ml-40">
                    Location access has been denied. Please enable location access in your browser settings.
                </div>
            )}

            {(permissionStatus === 'prompt' || permissionStatus === 'unknown') && (
                <div>
                    <div className="text-gray-700">
                        We need your location to show nearby parks.
                    </div>
                    <button
                        onClick={requestGeolocation}
                        className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-700 text-white rounded"
                    >
                        Allow location access
                    </button>
                </div>
            )}

            {permissionStatus === 'granted' && !userLocation && (
                <div>Loading your location...</div>
            )}

            {userLocation && (
                <>
                    {error && <div className="text-red-500">{error}</div>}
                    {!error && nearbyParks.length === 0 && <p className='ml-56'>Loading nearby parks...</p>}
                    {!error && nearbyParks.length > 0 && (
                        <ul>
                            {nearbyParks.map(park => (
                                <li key={park._id} className="mb-8">
                                    <div className="ml-48">
                                        <h2 className="text-2xl font-semibold">{park.parkName}</h2>
                                        <p>Distance: {convertDistance(park.distance / 1000)} {unit}</p>

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
                                        {/* Show Directions Button and View Park Details Button */}
                                        <div className="mt-2 flex items-center">
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

                                            {/* View Park Details Button */}
                                            <button
                                                onClick={() => navigate(`/parks/${park._id}`)}
                                                className="ml-4 px-4 py-2 bg-green-500 hover:bg-green-700 text-white rounded"
                                            >
                                                View Park Details
                                            </button>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </>
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
