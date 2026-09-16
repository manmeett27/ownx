/**
 * Real Device Geolocation and Reverse Geocoding Service
 * Uses browser navigator.geolocation API and OpenStreetMap Nominatim
 * NO mock, fake, or hardcoded coordinates.
 */

export async function getCurrentCoordinates() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      return reject(new Error('Geolocation is not supported by your browser or device.'));
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      (error) => {
        let message = 'Unable to access your location. Please allow location permission and try again.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Location permission was denied. Please allow location access in your browser settings and try again.';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Location information is unavailable on your current network or device.';
            break;
          case error.TIMEOUT:
            message = 'Location request timed out. Please check your GPS/network and try again.';
            break;
          default:
            message = error.message || 'An error occurred while retrieving location.';
            break;
        }
        const err = new Error(message);
        err.code = error.code;
        reject(err);
      },
      options
    );
  });
}

/**
 * Reverse geocodes latitude & longitude into a human-readable city/region string
 * Uses public OpenStreetMap Nominatim reverse geocoding API
 */
export async function reverseGeocode(latitude, longitude) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=14&addressdetails=1`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'OWNX-SocialNetwork-App/2.0'
      }
    });

    if (!response.ok) {
      throw new Error('Reverse geocoding service unavailable');
    }

    const data = await response.json();
    if (data && data.address) {
      const addr = data.address;
      const city = addr.city || addr.town || addr.village || addr.suburb || addr.municipality || addr.county || '';
      const state = addr.state || addr.region || '';
      const country = addr.country || '';

      const parts = [city, state, country].filter(Boolean);
      if (parts.length > 0) {
        return parts.join(', ');
      }
    }

    if (data && data.display_name) {
      // Return shortened first two segments
      const segments = data.display_name.split(',').map(s => s.trim());
      return segments.slice(0, 3).join(', ');
    }

    return `${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°`;
  } catch (err) {
    console.warn('Reverse geocoding notice:', err.message);
    // Fallback to formatted coordinates string if Nominatim is rate-limited or offline
    return `Location (${latitude.toFixed(3)}°, ${longitude.toFixed(3)}°)`;
  }
}

/**
 * Convenience method to get coordinates and reverse geocode in one call
 */
export async function getRealUserLocation() {
  const coords = await getCurrentCoordinates();
  const humanReadable = await reverseGeocode(coords.latitude, coords.longitude);
  return {
    latitude: coords.latitude,
    longitude: coords.longitude,
    location_str: humanReadable,
    accuracy: coords.accuracy
  };
}
