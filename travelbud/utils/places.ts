import axios from 'axios';

const API_KEY = 'YOUR_GOOGLE_PLACES_API_KEY'; // Get from Google Cloud Console

export const fetchNearbyPlaces = async (lat: number, lng: number, type: string) => {
  const response = await axios.get(
    `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=1500&type=${type}&key=${API_KEY}`
  );
  return response.data.results;
};
