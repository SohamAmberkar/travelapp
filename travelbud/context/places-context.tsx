import axios from "axios";
import * as Location from "expo-location";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

export type Place = {
  place_id: string;
  name: string;
  vicinity: string;
  geometry: { location: { lat: number; lng: number } };
  photos?: { photo_reference: string }[];
  rating?: number;
  user_ratings_total?: number;
  opening_hours?: { open_now?: boolean };
  types?: string[];
};

type PlacesContextType = {
  places: Place[];
  loading: boolean;
  error: string | null;
  selectedType: string;
  setSelectedType: (type: string) => void;
  refresh: () => void;
};

const DEFAULT_TYPE = "gym";

const PlacesContext = createContext<PlacesContextType | undefined>(undefined);

export function PlacesProvider({ children }: { children: ReactNode }) {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string>(DEFAULT_TYPE);

  const fetchPlaces = async (type: string = selectedType) => {
    setLoading(true);
    setError(null);
    try {
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        setError("Location services are disabled.");
        setLoading(false);
        return;
      }
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setError("Location permission denied");
        setLoading(false);
        return;
      }
      const location = await Location.getCurrentPositionAsync({});
      const latitude = location.coords.latitude;
      const longitude = location.coords.longitude;
      const radius = 1500;
      const apiKey = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY as string;
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&type=${type}&key=${apiKey}`;
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
  };

  useEffect(() => {
    fetchPlaces(selectedType);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedType]);

  return (
    <PlacesContext.Provider
      value={{
        places,
        loading,
        error,
        selectedType,
        setSelectedType,
        refresh: () => fetchPlaces(selectedType),
      }}
    >
      {children}
    </PlacesContext.Provider>
  );
}

export function usePlaces() {
  const context = useContext(PlacesContext);
  if (!context)
    throw new Error("usePlaces must be used within a PlacesProvider");
  return context;
}
