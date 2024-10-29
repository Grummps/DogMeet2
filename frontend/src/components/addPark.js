import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import getUserInfo from '../utilities/decodeJwt'; // Adjust the path as necessary

// Fix Leaflet's default icon paths
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Component to handle map clicks and set coordinates
const LocationSelector = ({ setCoordinates }) => {
  useMapEvents({
    click(e) {
      setCoordinates([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
};

// Component to fly to a new position
const FlyToLocation = ({ position }) => {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, 13, {
        duration: 2,
      });
    }
  }, [position, map]);
  return null;
};

const AddPark = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [coordinates, setCoordinates] = useState(null); // [latitude, longitude]
  const [address, setAddress] = useState('');
  const [formData, setFormData] = useState({
    parkName: '',
  });
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const mapRef = useRef();

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      const decodedUser = getUserInfo(token);
      setUser(decodedUser);
      if (!decodedUser || !decodedUser.isAdmin) {
        // Redirect non-admin users
        navigate('/unauthorized', { replace: true });
      }
    } else {
      // Redirect unauthenticated users
      navigate('/unauthorized', { replace: true });
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleAddressChange = (e) => {
    setAddress(e.target.value);
  };

  const handleAddressSearch = async (e) => {
    e.preventDefault();

    if (!address) {
      setError('Please enter an address to search.');
      return;
    }

    setSearchLoading(true);
    setError('');
    try {
      // Geocoding using Nominatim
      const response = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: {
          q: address,
          format: 'json',
          addressdetails: 1,
          limit: 1,
        },
      });

      // debug
      console.log('Geocoding response:', response.data);


      if (response.data && response.data.length > 0) {
        const { lat, lon } = response.data[0];
        setCoordinates([parseFloat(lat), parseFloat(lon)]);
        setAddress('');
      } else {
        setError('Address not found. Please try a different query.');
      }
    } catch (err) {
      console.error('Geocoding error:', err);
      setError('An error occurred while searching for the address.');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Validation
    if (!formData.parkName) {
      setError('Park Name is required.');
      setLoading(false);
      return;
    }
    if (!coordinates) {
      setError('Please select a location on the map or search for an address.');
      setLoading(false);
      return;
    }

    try {
      const [latitude, longitude] = coordinates;

      const payload = {
        parkName: formData.parkName,
        location: {
          type: 'Point',
          coordinates: [longitude, latitude], // [lng, lat]
        },
        // occupants and eventId will be handled automatically or later
      };

      const token = localStorage.getItem('accessToken');

      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URI}/parks/create`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSuccess('Park added successfully!');
      setFormData({
        parkName: '',
      });
      setCoordinates(null);

      // Navigate to parks list after a delay
      setTimeout(() => {
        navigate('/parks');
      }, 2000);
    } catch (err) {
      console.error('Error adding park:', err);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('An error occurred while adding the park.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-lg bg-white p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Add New Park</h2>

        {error && <div className="mb-4 text-red-500">{error}</div>}
        {success && <div className="mb-4 text-green-500">{success}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="parkName" className="block text-gray-700 font-semibold mb-2">
              Park Name<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="parkName"
              name="parkName"
              value={formData.parkName}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300"
              required
            />
          </div>

          {/* Address Search */}
          <div>
            <label htmlFor="address" className="block text-gray-700 font-semibold mb-2">
              Search Address (street name, city, state, country)
            </label>
            <form onSubmit={handleAddressSearch} className="flex space-x-2">
              <input
                type="text"
                id="address"
                name="address"
                value={address}
                onChange={handleAddressChange}
                placeholder="Enter address"
                className="flex-grow px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300"
              />
              <button
                type="submit"
                disabled={searchLoading}
                className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-300 ${
                  searchLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {searchLoading ? 'Searching...' : 'Search'}
              </button>
            </form>
          </div>

          {/* Leaflet Map for Location Selection */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Select Location<span className="text-red-500">*</span>
            </label>
            <MapContainer
              center={[42.3601, -71.0589]} // Default center Boston
              zoom={10}
              style={{ height: '300px', width: '100%' }}
              whenCreated={(mapInstance) => {
                mapRef.current = mapInstance;
              }}
            >
              <TileLayer
                attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <LocationSelector setCoordinates={setCoordinates} />
              <FlyToLocation position={coordinates ? [coordinates[0], coordinates[1]] : null} />
              {coordinates && (
                <Marker position={[coordinates[0], coordinates[1]]}></Marker>
              )}
            </MapContainer>
            <p className="mt-2 text-sm text-gray-600">
              Click on the map to select the park's location.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 px-4 bg-pink-600 text-white font-semibold rounded-md hover:bg-pink-700 transition-colors duration-300 ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {loading ? 'Adding Park...' : 'Add Park'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddPark;
