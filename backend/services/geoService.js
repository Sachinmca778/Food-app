/**
 * Geo Service
 * Calculates distance between two coordinates (Haversine formula)
 * Used to check if customer is within delivery radius
 */

/**
 * Calculate distance between two lat/lng points in meters
 * Uses Haversine formula
 */
function calculateDistanceMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000; // Earth radius in meters
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Check if a delivery address is within restaurant's delivery radius
 * @returns {{ withinRadius: boolean, distanceMeters: number }}
 */
function checkDeliveryRadius(restaurant, customerLat, customerLng) {
  const distanceMeters = calculateDistanceMeters(
    parseFloat(restaurant.latitude),
    parseFloat(restaurant.longitude),
    parseFloat(customerLat),
    parseFloat(customerLng)
  );

  return {
    withinRadius: distanceMeters <= restaurant.delivery_radius_m,
    distanceMeters
  };
}

module.exports = { calculateDistanceMeters, checkDeliveryRadius };
