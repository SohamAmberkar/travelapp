import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from "react";
import * as Location from "expo-location";
import axios from "axios";

// Type definitions
type Place = {
  place_id: string;
  name: string;
  photos?: { photo_reference: string }[];
  vicinity?: string;
  rating?: number;
  user_ratings_total?: number;
  opening_hours?: { open_now: boolean };
  types?: string[];
  geometry?: { location: { lat: number; lng: number } };
  [key: string]: any;
};

type PlacesContextType = {
  places: Place[];
  loading: boolean;
  error: string | null;
  selectedType: string;
  setSelectedType: (type: string) => void;
  refresh: () => void;
  setManualLocation: (loc: string | null) => void;
  manualLocation: string | null;
  coords: { lat: number; lng: number } | null;
  homePlaces: Place[];
  fetchPlacesForTypes: (types: string[]) => Promise<void>;
};

const DEFAULT_TYPE = "cafe";

const PlacesContext = createContext<PlacesContextType | undefined>(undefined);

export function PlacesProvider({ children }: { children: ReactNode }) {
  const [places, setPlaces] = useState<Place[]>([]);
  const [homePlaces, setHomePlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState(DEFAULT_TYPE);
  const [manualLocation, setManualLocation] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null
  );

  // Fetch coordinates based on manualLocation or device
  const fetchCoords = useCallback(async () => {
    if (manualLocation) {
      const apiKey = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY as string;
      const geoUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        manualLocation
      )}&key=${apiKey}`;
      const geoResp = await axios.get(geoUrl);
      if (
        geoResp.data.status === "OK" &&
        geoResp.data.results &&
        geoResp.data.results[0]
      ) {
        const { lat, lng } = geoResp.data.results[0].geometry.location;
        setCoords({ lat, lng });
        return { lat, lng };
      } else {
        setError("Could not find location");
        setCoords(null);
        return null;
      }
    } else {
      try {
        const servicesEnabled = await Location.hasServicesEnabledAsync();
        if (!servicesEnabled) {
          setError("Location services are disabled.");
          setCoords(null);
          return null;
        }
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setError("Location permission denied");
          setCoords(null);
          return null;
        }
        const location = await Location.getCurrentPositionAsync({});
        setCoords({
          lat: location.coords.latitude,
          lng: location.coords.longitude,
        });
        return {
          lat: location.coords.latitude,
          lng: location.coords.longitude,
        };
      } catch (err: any) {
        setError("Could not get device location");
        setCoords(null);
        return null;
      }
    }
  }, [manualLocation]);

  // Fetch places for Explore (single type)
  const fetchPlaces = useCallback(
    async (type: string = selectedType) => {
      setLoading(true);
      setError(null);
      try {
        const coord = await fetchCoords();
        if (!coord) {
          setPlaces([]);
          setLoading(false);
          return;
        }
        const radius = 1500;
        const apiKey = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY as string;
        const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${coord.lat},${coord.lng}&radius=${radius}&type=${type}&key=${apiKey}`;
        const response = await axios.get(url);
        if (response.data.status !== "OK") {
          setError(`API error: ${response.data.status}`);
          setPlaces([]);
        } else {
          setPlaces(response.data.results);
        }
      } catch (err: any) {
        setError(err.message || "Failed to fetch places");
        setPlaces([]);
      } finally {
        setLoading(false);
      }
    },
    [fetchCoords, selectedType]
  );

  // --- Fetch places for multiple types (for Home) ---
  const fetchPlacesForTypes = useCallback(
    async (types: string[]) => {
      setLoading(true);
      setError(null);
      try {
        const coord = await fetchCoords();
        if (!coord) {
          setHomePlaces([]);
          setLoading(false);
          return;
        }
        const radius = 1500;
        const apiKey = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY as string;
        let allResults: Place[] = [];
        for (const type of types) {
          const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${coord.lat},${coord.lng}&radius=${radius}&type=${type}&key=${apiKey}`;
          const response = await axios.get(url);
          if (
            response.data.status === "OK" &&
            Array.isArray(response.data.results)
          ) {
            for (const place of response.data.results) {
              if (!allResults.some((p) => p.place_id === place.place_id)) {
                allResults.push(place);
              }
            }
          }
        }
        setHomePlaces(allResults);
      } catch (err: any) {
        setError(err.message || "Failed to fetch places for interests");
        setHomePlaces([]);
      } finally {
        setLoading(false);
      }
    },
    [fetchCoords]
  );

  // Fetch places when type or location changes (Explore)
  useEffect(() => {
    fetchPlaces(selectedType);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedType, manualLocation, fetchPlaces]);

  return (
    <PlacesContext.Provider
      value={{
        places,
        loading,
        error,
        selectedType,
        setSelectedType,
        refresh: () => fetchPlaces(selectedType),
        setManualLocation,
        manualLocation,
        coords,
        homePlaces,
        fetchPlacesForTypes,
      }}
    >
      {children}
    </PlacesContext.Provider>
  );
}

export function usePlaces() {
  const ctx = useContext(PlacesContext);
  if (!ctx) throw new Error("usePlaces must be used within a PlacesProvider");
  return ctx;
}
