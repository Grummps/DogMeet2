import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

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

    useEffect(() => {
        const fetchPark = async () => {
            try {
                const response = await axios.get(`${process.env.REACT_APP_BACKEND_URI}/parks/${id}`);
                setPark(response.data);
            } catch (err) {
                console.error('Error fetching park:', err);
                setError('Failed to load park details.');
            } finally {
                setLoading(false);
            }
        };

        fetchPark();
    }, [id]);

    if (loading) return <div>Loading park details...</div>;
    if (error) return <div className="text-red-500">{error}</div>;
    if (!park) return <div>No park found.</div>;

    const { parkName, location } = park;
    const [longitude, latitude] = location.coordinates;

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-4">{parkName}</h1>
            <div className="mb-6">
                <h2 className="text-xl font-semibold">Location:</h2>
                <p>{latitude}, {longitude}</p>
            </div>
            {/* Add other park details here */}

            <MapContainer center={[latitude, longitude]} zoom={15} style={{ height: "400px", width: "100%" }}>
                <TileLayer
                    attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[latitude, longitude]}>
                    <Popup>
                        {parkName} is located here.
                    </Popup>
                </Marker>
            </MapContainer>
        </div>
    );
};

export default ParkDetail;
