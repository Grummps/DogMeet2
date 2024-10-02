import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const ParksList = () => {
    const [parks, setParks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchParks = async () => {
            try {
                const response = await axios.get(`${process.env.REACT_APP_BACKEND_URI}/parks/all`);
                setParks(response.data);
            } catch (err) {
                console.error('Error fetching parks:', err);
                setError('Failed to load parks.');
            } finally {
                setLoading(false);
            }
        };

        fetchParks();
    }, []);

    if (loading) return <div>Loading parks...</div>;
    if (error) return <div className="text-red-500">{error}</div>;

    return (
        <div className="ml-40 p-6">
            <h1 className="text-3xl font-bold mb-4">All Parks</h1>
            <ul className="space-y-4">
                {parks.map(park => (
                    <li key={park._id} className="p-4 border rounded-md shadow-sm">
                        <Link to={`/parks/${park._id}`}>
                            <h2 className="text-xl font-semibold">{park.parkName}</h2>
                            <p className="text-gray-600">{park.location.coordinates[1]}, {park.location.coordinates[0]}</p>
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default ParksList;
