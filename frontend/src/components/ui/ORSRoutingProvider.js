import axios from 'axios';
import L from 'leaflet';

/**
 * Custom Routing Provider for OpenRouteService
 * Implements the required interface for Leaflet Routing Machine
 */
class ORSRoutingProvider {
    constructor(options) {
        this.options = options;
        this.apiKey = options.apiKey;
        this.profile = options.profile || 'driving-car'; // default profile
    }

    /**
     * Route method required by Leaflet Routing Machine
     * @param {Array} waypoints - Array of waypoints with latLng
     * @param {Function} callback - Callback to pass routes to LRM
     * @param {Object} context - Context for the callback
     * @param {Object} options - Additional options
     */
    async route(waypoints, callback, context, options) {
        if (!this.apiKey) {
            console.error('OpenRouteService API key is required.');
            callback.call(context, []);
            return;
        }

        if (waypoints.length < 2) {
            console.error('At least two waypoints are required.');
            callback.call(context, []);
            return;
        }

        const start = waypoints[0].latLng;
        const end = waypoints[waypoints.length - 1].latLng;

        try {
            const response = await axios.get(`https://api.openrouteservice.org/v2/directions/${this.profile}/geojson`, {
                params: {
                    start: `${start.lng},${start.lat}`,
                    end: `${end.lng},${end.lat}`,
                },
                headers: {
                    'Authorization': this.apiKey,
                    'Accept': 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8',
                },
            });

            const geojson = response.data;

            if (!geojson.features || geojson.features.length === 0) {
                throw new Error('No routes found');
            }

            // Process each route
            const routes = geojson.features.map(feature => {
                const coords = feature.geometry.coordinates.map(coord => L.latLng(coord[1], coord[0])); // [lat, lng]
                return {
                    name: 'ORS Route',
                    coordinates: coords,
                    summary: feature.properties.summary,
                    instructions: [], // Parsing instructions requires additional implementation
                    distance: feature.properties.summary.distance,
                    time: feature.properties.summary.duration,
                };
            });

            callback.call(context, routes);
        } catch (error) {
            console.error('Error fetching ORS directions:', error.response ? error.response.data : error.message);
            callback.call(context, []); // Return empty array on failure
        }
    }
}

export default ORSRoutingProvider;
