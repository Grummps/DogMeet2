const express = require('express');
const router = express.Router();
const axios = require('axios');

// POST /directions
router.post('/', async (req, res) => {
    const { startLat, startLng, endLat, endLng } = req.body;

    // Validate required parameters
    if (!startLat || !startLng || !endLat || !endLng) {
        return res.status(400).json({ message: 'Missing required parameters: startLat, startLng, endLat, endLng.' });
    }

    console.log('Received directions request with params:', req.body);
    console.log('Using ORS API Key:', process.env.OPENROUTESERVICE_API_KEY ? 'Provided' : 'Missing');

    try {
        // Prepare the request payload as per ORS API requirements
        const payload = {
            coordinates: [
                [parseFloat(startLng), parseFloat(startLat)], // [lng, lat]
                [parseFloat(endLng), parseFloat(endLat)],
            ],
        };

        // Fetch directions from OpenRouteService using POST
        const response = await axios.post(`https://api.openrouteservice.org/v2/directions/driving-car/geojson`, payload, {
            headers: {
                'Authorization': process.env.OPENROUTESERVICE_API_KEY,
                'Content-Type': 'application/json',
            },
        });

        // Return the GeoJSON data to the frontend
        res.status(200).json(response.data);
    } catch (error) {
        console.error('Error fetching directions from ORS:', error.response ? error.response.data : error.message);
        res.status(500).json({ message: 'Error fetching directions from OpenRouteService.' });
    }
});

module.exports = router;

