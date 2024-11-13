/**
 * Rounds a number to the specified number of decimal places.
 * @param {number} num - The number to round.
 * @param {number} decimals - Number of decimal places.
 * @returns {number} - Rounded number.
 */
export const roundCoord = (num, decimals = 4) => {
    return parseFloat(num.toFixed(decimals));
};

/**
 * Generates a standardized cache key by rounding coordinates.
 * @param {number} startLat - Starting latitude.
 * @param {number} startLng - Starting longitude.
 * @param {number} endLat - Ending latitude.
 * @param {number} endLng - Ending longitude.
 * @returns {string} - Cache key.
 */
export const generateCacheKey = (startLat, startLng, endLat, endLng) => {
    const roundedStartLat = roundCoord(startLat);
    const roundedStartLng = roundCoord(startLng);
    const roundedEndLat = roundCoord(endLat);
    const roundedEndLng = roundCoord(endLng);
    return `${roundedStartLat},${roundedStartLng}-${roundedEndLat},${roundedEndLng}`;
};
