import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Import Leaflet's default icon images
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix Leaflet's default icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

/**
 * Component to set the map view to the user's location
 */
const SetMapView = ({ userLocation }) => {
    const map = useMap();

    useEffect(() => {
        if (userLocation) {
            const { latitude, longitude } = userLocation;
            map.setView([latitude, longitude], 13);
        }
    }, [userLocation, map]);

    return null;
};

const MapWithDirections = ({ parkName, parkLocation, userLocation, route }) => {
    const startIcon = new L.Icon({
        iconUrl: markerIcon,
        shadowUrl: markerShadow,
        iconSize: [25, 41],
        iconAnchor: [12, 41],
    });

    const endIcon = new L.Icon({
        iconUrl: markerIcon,
        shadowUrl: markerShadow,
        iconSize: [25, 41],
        iconAnchor: [12, 41],
    });

    return (
        <MapContainer center={[userLocation?.latitude || 0, userLocation?.longitude || 0]} zoom={13} style={{ height: "300px", width: "100%", zIndex: 10 }}>
            <SetMapView userLocation={userLocation} />
            <TileLayer
                attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {userLocation && (
                <Marker position={[userLocation.latitude, userLocation.longitude]} icon={startIcon}>
                    <Popup>Your Location</Popup>
                </Marker>
            )}
            {parkLocation && (
                <Marker position={[parkLocation.latitude, parkLocation.longitude]} icon={endIcon}>
                    <Popup>{parkName}</Popup>
                </Marker>
            )}
            {route && (
                <Polyline positions={route} color="blue" weight={4} />
            )}
        </MapContainer>
    );
};

export default MapWithDirections;
