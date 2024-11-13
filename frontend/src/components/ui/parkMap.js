import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';

const MapComponent = ({ parks, userLocation }) => (
  <MapContainer center={[userLocation.latitude, userLocation.longitude]} zoom={15} style={{ height: '400px', width: '100%' }}>
    <TileLayer
      attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    />
    <Marker position={[userLocation.latitude, userLocation.longitude]}>
      <Popup>You are here</Popup>
    </Marker>
    {parks.map(park => {
      const [lng, lat] = park.location.coordinates;
      return (
        <Marker key={park._id} position={[lat, lng]}>
          <Popup>{park.parkName}</Popup>
        </Marker>
      );
    })}
  </MapContainer>
);

export default MapComponent;