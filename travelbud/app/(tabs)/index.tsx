import { useUser } from "@/context/user-context";
import {
  FontAwesome5,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import axios from "axios";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Linking,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const CATEGORIES = [
  {
    label: "Gyms",
    icon: <MaterialCommunityIcons name="dumbbell" size={18} color="#2563eb" />,
    type: "gym",
  },
  {
    label: "Cafes",
    icon: <FontAwesome5 name="coffee" size={16} color="#2563eb" />,
    type: "cafe",
  },
  {
    label: "Coworking",
    icon: (
      <MaterialCommunityIcons
        name="office-building"
        size={18}
        color="#2563eb"
      />
    ),
    type: "coworking_space",
  },
  {
    label: "Parks",
    icon: <MaterialCommunityIcons name="tree" size={18} color="#2563eb" />,
    type: "park",
  },
  {
    label: "Stores",
    icon: <MaterialCommunityIcons name="store" size={18} color="#2563eb" />,
    type: "store",
  },
];

const FALLBACK_IMAGE =
  "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/No_image_available.svg/480px-No_image_available.svg.png";

const getPhotoUrl = (photoReference: string, maxwidth = 400) =>
  `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxwidth}&photoreference=${photoReference}&key=${process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY}`;

type Place = {
  place_id: string;
  name: string;
  vicinity: string;
  geometry: { location: { lat: number; lng: number } };
  photos?: { photo_reference: string }[];
  rating?: number;
  user_ratings_total?: number;
  opening_hours?: { open_now?: boolean };
  types?: string[];
  categoryLabel?: string;
  categoryIcon?: React.ReactNode;
};

export default function HomeScreen() {
  const { username, interests } = useUser();
  const [allPlaces, setAllPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [manualLocation, setManualLocation] = useState<{
    latitude: string;
    longitude: string;
  }>({ latitude: "", longitude: "" });
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [currentCoords, setCurrentCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // For details modal
  const [detailsModal, setDetailsModal] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [details, setDetails] = useState<any>(null);

  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    async function fetchAllCategories() {
      setLoading(true);
      setError(null);
      try {
        let latitude: number, longitude: number;
        if (currentCoords) {
          latitude = currentCoords.latitude;
          longitude = currentCoords.longitude;
        } else {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== "granted") {
            setError("Location permission denied");
            setLoading(false);
            return;
          }
          const location = await Location.getCurrentPositionAsync({});
          latitude = location.coords.latitude;
          longitude = location.coords.longitude;
        }
        const radius = 1500;
        const apiKey = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY as string;
        let all: Place[] = [];
        const selectedCats =
          !interests || interests.length === 0
            ? CATEGORIES
            : CATEGORIES.filter((cat) => interests.includes(cat.type));
        for (const cat of selectedCats) {
          const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&type=${cat.type}&key=${apiKey}`;
          const response = await axios.get(url);
          if (
            response.data.status === "OK" &&
            response.data.results.length > 0
          ) {
            const places: Place[] = response.data.results
              .filter((item: any) => item.types && item.types[0] === cat.type)
              .slice(0, 3)
              .map((item: any) => ({
                ...item,
                categoryLabel: cat.label,
                categoryIcon: cat.icon,
              }));
            all = all.concat(places);
          }
        }
        if (!cancelled) {
          setAllPlaces(all);
        }
      } catch (err: any) {
        if (!cancelled) setError("Failed to fetch places");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchAllCategories();
    return () => {
      cancelled = true;
    };
  }, [interests, currentCoords]);

  const openLocationModal = () => setShowLocationModal(true);
  const closeLocationModal = () => setShowLocationModal(false);

  const setLocation = () => {
    const lat = parseFloat(manualLocation.latitude);
    const lng = parseFloat(manualLocation.longitude);
    if (!isNaN(lat) && !isNaN(lng)) {
      setCurrentCoords({ latitude: lat, longitude: lng });
      closeLocationModal();
    }
  };

  // --- Details Modal Logic ---
  const openDetails = async (placeId: string) => {
    setDetailsLoading(true);
    setDetailsModal(true);
    try {
      const apiKey = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY as string;
      const fields = [
        "name",
        "formatted_address",
        "geometry",
        "photos",
        "rating",
        "user_ratings_total",
        "types",
        "reviews",
        "website",
        "formatted_phone_number",
        "opening_hours",
        "price_level",
      ].join(",");
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${apiKey}`;
      const response = await axios.get(url);
      setDetails(response.data.result);
    } catch {
      setDetails(null);
    }
    setDetailsLoading(false);
  };

  const closeDetails = () => {
    setDetailsModal(false);
    setDetails(null);
  };

  const openDirections = (lat: number, lng: number, name: string) => {
    let url = "";
    if (Platform.OS === "ios") {
      url = `maps://app?daddr=${lat},${lng}&dirflg=d`;
    } else {
      url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
    }
    Linking.openURL(url);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Top Bar */}
      <View className="flex-row items-center justify-between px-6 pt-6 mb-2">
        <View>
          <Text className="text-lg text-gray-400">Hello,</Text>
          <Text className="text-xl font-bold text-blue-900">{username}</Text>
        </View>
        <TouchableOpacity
          className="flex-row items-center bg-blue-50 px-3 py-2 rounded-xl"
          onPress={openLocationModal}
        >
          <Ionicons name="location-outline" size={18} color="#2563eb" />
          <Text className="ml-2 text-blue-900 font-semibold">Set Location</Text>
        </TouchableOpacity>
      </View>

      {/* Manual Location Modal */}
      <Modal
        visible={showLocationModal}
        transparent
        animationType="slide"
        onRequestClose={closeLocationModal}
      >
        <View className="flex-1 justify-center items-center bg-black/40">
          <View className="bg-white rounded-xl p-6 w-80">
            <Text className="text-lg font-bold text-blue-900 mb-2">
              Set Location Manually
            </Text>
            <TextInput
              placeholder="Latitude"
              keyboardType="numeric"
              value={manualLocation.latitude}
              onChangeText={(t: string) =>
                setManualLocation({ ...manualLocation, latitude: t })
              }
              className="border border-gray-300 rounded-lg px-3 py-2 mb-3"
            />
            <TextInput
              placeholder="Longitude"
              keyboardType="numeric"
              value={manualLocation.longitude}
              onChangeText={(t: string) =>
                setManualLocation({ ...manualLocation, longitude: t })
              }
              className="border border-gray-300 rounded-lg px-3 py-2 mb-3"
            />
            <View className="flex-row justify-end">
              <TouchableOpacity onPress={closeLocationModal} className="mr-4">
                <Text className="text-gray-400 font-semibold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={setLocation}>
                <Text className="text-blue-700 font-semibold">Set</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Search Bar */}
      <TouchableOpacity
        className="mx-6 mt-3 mb-4 flex-row items-center bg-gray-100 rounded-xl px-4 py-3"
        activeOpacity={0.85}
        onPress={() => router.push("/explore")}
      >
        <Ionicons name="search" size={20} color="#94a3b8" />
        <Text className="ml-2 text-base text-gray-500 flex-1">
          Search places, categories...
        </Text>
      </TouchableOpacity>

      <Text className="text-2xl font-bold mb-4 text-blue-900 px-6">
        Top Picks For You
      </Text>
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : error ? (
        <Text className="text-red-500 text-center mt-8">{error}</Text>
      ) : allPlaces.length === 0 ? (
        <Text className="text-gray-400 text-center mt-10">
          No places found for your interests.
        </Text>
      ) : (
        <FlatList
          data={allPlaces}
          keyExtractor={(item) => item.place_id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          renderItem={({ item }) => {
            let imageUrl = FALLBACK_IMAGE;
            if (item.photos && item.photos.length > 0) {
              imageUrl = getPhotoUrl(item.photos[0].photo_reference);
            }
            return (
              <TouchableOpacity
                className="flex-row items-center bg-white rounded-2xl shadow-lg mb-5 p-2"
                activeOpacity={0.93}
                onPress={() => openDetails(item.place_id)}
              >
                <Image
                  source={{ uri: imageUrl }}
                  className="w-20 h-20 rounded-xl mr-3"
                  resizeMode="cover"
                />
                <View className="flex-1">
                  <View className="flex-row items-center mb-1">
                    {item.categoryIcon}
                    <Text className="ml-2 font-bold text-blue-900">
                      {item.categoryLabel}
                    </Text>
                  </View>
                  <Text className="font-bold text-lg text-gray-900">
                    {item.name}
                  </Text>
                  <Text className="text-xs text-gray-500 mb-1">
                    {item.vicinity}
                  </Text>
                  <View className="flex-row items-center mt-1">
                    <Text className="text-yellow-500 font-bold mr-1">★</Text>
                    <Text className="text-xs text-gray-700">
                      {item.rating ?? "N/A"}
                    </Text>
                    <Text className="ml-2 text-xs text-gray-400">
                      ({item.user_ratings_total ?? 0})
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* Details Modal */}
      <Modal
        visible={detailsModal}
        animationType="slide"
        onRequestClose={closeDetails}
      >
        {detailsLoading ? (
          <View className="flex-1 items-center justify-center bg-white">
            <ActivityIndicator size="large" color="#2563eb" />
          </View>
        ) : !details ? (
          <View className="flex-1 items-center justify-center bg-white">
            <Text className="text-lg text-gray-600">Place not found.</Text>
            <TouchableOpacity
              className="mt-4 px-4 py-2 bg-blue-600 rounded-lg"
              onPress={closeDetails}
            >
              <Text className="text-white font-semibold">Close</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView className="flex-1 bg-white">
            {/* Photos Gallery */}
            <ScrollView horizontal className="w-full h-64">
              {(details.photos && details.photos.length > 0
                ? details.photos
                : [{ photo_reference: null }]
              ).map((photo: any, idx: number) => (
                <Image
                  key={idx}
                  source={{
                    uri: photo.photo_reference
                      ? getPhotoUrl(photo.photo_reference)
                      : FALLBACK_IMAGE,
                  }}
                  className="w-80 h-64 mr-2 rounded-xl"
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
            <View className="p-6">
              <Text className="text-2xl font-bold text-blue-900 mb-2">
                {details.name}
              </Text>
              <Text className="text-gray-600 mb-2">
                {details.formatted_address}
              </Text>
              {details.formatted_phone_number && (
                <Text className="text-blue-800 mb-1">
                  📞 {details.formatted_phone_number}
                </Text>
              )}
              <Text className="text-gray-500 mb-2">
                {details.types
                  ?.map((t: string) => t.replace(/_/g, " "))
                  .join(", ")}
              </Text>
              <Text className="text-yellow-500 mb-2">
                ⭐ {details.rating ?? "N/A"} ({details.user_ratings_total ?? 0}{" "}
                reviews)
              </Text>
              {details.opening_hours && (
                <Text className="text-green-700 mb-2">
                  {details.opening_hours.open_now ? "Open Now" : "Closed"}
                </Text>
              )}
              {details.price_level && (
                <Text className="text-gray-700 mb-2">
                  {"$".repeat(details.price_level)}
                </Text>
              )}
              {details.website && (
                <TouchableOpacity
                  className="mb-3"
                  onPress={() => Linking.openURL(details.website)}
                >
                  <Text className="text-blue-600 underline">Website</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={() =>
                  openDirections(
                    details.geometry.location.lat,
                    details.geometry.location.lng,
                    details.name
                  )
                }
                className="bg-blue-600 rounded-lg py-3 items-center mt-4"
              >
                <Text className="text-white font-semibold text-lg">
                  Get Directions
                </Text>
              </TouchableOpacity>
              {details.reviews && (
                <View className="mt-6">
                  <Text className="text-lg font-bold text-blue-900 mb-2">
                    Reviews
                  </Text>
                  {details.reviews
                    .slice(0, 5)
                    .map((review: any, idx: number) => (
                      <View key={idx} className="mb-4">
                        <Text className="font-semibold text-gray-800">
                          {review.author_name}
                        </Text>
                        <Text className="text-yellow-500">
                          {"★".repeat(Math.round(review.rating))}
                        </Text>
                        <Text className="text-gray-600">{review.text}</Text>
                      </View>
                    ))}
                </View>
              )}
              <TouchableOpacity
                className="mt-8 px-4 py-2 bg-blue-600 rounded-lg"
                onPress={closeDetails}
              >
                <Text className="text-white font-semibold text-center">
                  Close
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
      </Modal>
    </SafeAreaView>
  );
}
