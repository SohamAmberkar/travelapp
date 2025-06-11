import {
  FontAwesome5,
  Ionicons,
  MaterialCommunityIcons,
  FontAwesome,
} from "@expo/vector-icons";
import axios from "axios";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useEffect, useState, useCallback } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Linking,
  Modal,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  SafeAreaView,
  Dimensions,
  ScrollView,
} from "react-native";
import { useUser } from "@/context/user-context";

const windowWidth = Dimensions.get("window").width;

const CATEGORIES = [
  {
    label: "Gyms",
    icon: <MaterialCommunityIcons name="dumbbell" size={22} color="#007f6d" />,
    type: "gym",
  },
  {
    label: "Cafes",
    icon: <FontAwesome5 name="coffee" size={20} color="#865d36" />,
    type: "cafe",
  },
  {
    label: "Coworking",
    icon: <FontAwesome5 name="laptop-code" size={20} color="#20509e" />,
    type: "coworking_space",
  },
  {
    label: "Parks",
    icon: <Ionicons name="leaf" size={22} color="#24994e" />,
    type: "park",
  },
  {
    label: "Stores",
    icon: (
      <MaterialCommunityIcons name="storefront" size={22} color="#0063a6" />
    ),
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
  const {
    username,
    interests,
    favourites,
    addToFavourites,
    removeFromFavourites,
  } = useUser();

  const [allPlaces, setAllPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [manualLocation, setManualLocation] = useState({
    latitude: "",
    longitude: "",
  });
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [currentCoords, setCurrentCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // Details modal
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
                place_id: item.place_id,
                name: item.name,
                vicinity: item.vicinity ?? "",
                geometry: item.geometry,
                photos: item.photos,
                rating: item.rating,
                user_ratings_total: item.user_ratings_total,
                opening_hours: item.opening_hours,
                types: item.types,
                categoryLabel: cat.label,
                categoryIcon: cat.icon,
              }));
            all = all.concat(places);
          }
        }
        if (!cancelled) {
          setAllPlaces(all);
        }
      } catch (err) {
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

  // Location modal handlers
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

  // Details modal logic
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
    } finally {
      setDetailsLoading(false);
    }
  };
  const closeDetails = () => {
    setDetailsModal(false);
    setDetails(null);
  };

  // Horizontal Favourites Card UI — ALL STYLES replaced by Tailwind/NativeWind
  const renderFavCard = useCallback(
    ({ item }: { item: Place }) => {
      let imageUrl = FALLBACK_IMAGE;
      if (item.photos && item.photos.length > 0) {
        imageUrl = getPhotoUrl(item.photos[0].photo_reference, 300);
      }
      return (
        <TouchableOpacity
          className="w-[150px] h-[112px] mr-3 rounded-lg bg-white shadow"
          activeOpacity={0.85}
          onPress={() => openDetails(item.place_id)}
        >
          <Image
            source={{ uri: imageUrl }}
            className="w-[150px] h-[64px] rounded-t-lg bg-gray-200"
            resizeMode="cover"
          />
          <View className="absolute right-2 top-2 z-10">
            <TouchableOpacity
              onPress={() => removeFromFavourites(item.place_id)}
              className="bg-black/50 rounded-full p-1.5"
            >
              <FontAwesome name="star" size={20} color="#FFD700" />
            </TouchableOpacity>
          </View>
          <Text className="text-xs font-semibold mt-1 ml-2" numberOfLines={1}>
            {item.name}
          </Text>
          <Text className="text-xs text-gray-600 ml-2" numberOfLines={1}>
            {item.vicinity}
          </Text>
        </TouchableOpacity>
      );
    },
    [favourites]
  );

  // Main list of places (excluding favourites)
  const nonFavPlaces = allPlaces.filter(
    (item) => !favourites.some((fav) => fav.place_id === item.place_id)
  );

  return (
    <SafeAreaView className="flex-1 bg-white pt-6">
      <View className="flex-row items-center mt-6 mx-5 mb-0">
        <Text className="text-2xl font-bold flex-1">Hello, {username}</Text>
        <TouchableOpacity onPress={openLocationModal}>
          <Ionicons name="location" size={26} color="#4285F4" />
        </TouchableOpacity>
      </View>
      {/* Set Location Modal */}
      <Modal visible={showLocationModal} animationType="slide" transparent>
        <View className="flex-1 bg-black/25 justify-center items-center">
          <View className="bg-white rounded-2xl px-6 py-7 w-80">
            <Text className="font-bold text-lg mb-3">
              Set Location Manually
            </Text>
            <TextInput
              placeholder="Latitude"
              keyboardType="numeric"
              value={manualLocation.latitude}
              onChangeText={(t) =>
                setManualLocation({ ...manualLocation, latitude: t })
              }
              className="border border-gray-200 rounded-lg px-4 py-2 mb-2 text-base"
            />
            <TextInput
              placeholder="Longitude"
              keyboardType="numeric"
              value={manualLocation.longitude}
              onChangeText={(t) =>
                setManualLocation({ ...manualLocation, longitude: t })
              }
              className="border border-gray-200 rounded-lg px-4 py-2 mb-4 text-base"
            />
            <View className="flex-row">
              <TouchableOpacity
                onPress={closeLocationModal}
                className="flex-1 items-center bg-gray-200 py-3 rounded-lg mr-2"
              >
                <Text className="text-gray-800 font-semibold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={setLocation}
                className="flex-1 items-center bg-blue-500 py-3 rounded-lg ml-2"
              >
                <Text className="text-white font-semibold">Set</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* Search Bar */}
      <TouchableOpacity
        onPress={() => router.push("/explore")}
        activeOpacity={0.8}
        className="flex-row items-center bg-gray-100 rounded-lg mx-5 py-3 px-4 mt-3 mb-1"
      >
        <FontAwesome name="search" size={18} color="#999" className="mr-2" />
        <Text className="text-gray-500">Search places, categories...</Text>
      </TouchableOpacity>
      {/* Favourites Horizontal Scroll */}
      {favourites.length > 0 && (
        <>
          <Text className="mx-5 mt-4 mb-2 font-bold text-base">
            Your Favourites
          </Text>
          <FlatList
            data={favourites as Place[]}
            keyExtractor={(item) => item.place_id}
            renderItem={renderFavCard}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingLeft: 16,
              paddingBottom: 0,
              paddingRight: 8,
            }}
            className="max-h-[150px]"
          />
        </>
      )}
      {/* Main List of Places */}
      <View className="flex-1">
        {loading ? (
          <ActivityIndicator size="large" className="mt-14" />
        ) : error ? (
          <Text className="text-center mt-16 text-red-600">{error}</Text>
        ) : nonFavPlaces.length === 0 ? (
          <Text className="text-center mt-20 text-gray-500">
            No places found for your interests.
          </Text>
        ) : (
          <FlatList
            data={nonFavPlaces}
            keyExtractor={(item) => item.place_id}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 18 }}
            renderItem={({ item }) => {
              let imageUrl = FALLBACK_IMAGE;
              if (item.photos && item.photos.length > 0) {
                imageUrl = getPhotoUrl(item.photos[0].photo_reference, 400);
              }
              const isFav = favourites.some(
                (fav) => fav.place_id === item.place_id
              );
              return (
                <TouchableOpacity
                  onPress={() => openDetails(item.place_id)}
                  activeOpacity={0.86}
                  className="bg-white rounded-xl mb-3 shadow"
                >
                  <Image
                    source={{ uri: imageUrl }}
                    className="w-full h-36 rounded-t-xl bg-gray-200"
                    resizeMode="cover"
                  />
                  <View className="absolute right-4 top-3 z-10">
                    <TouchableOpacity
                      onPress={() =>
                        isFav
                          ? removeFromFavourites(item.place_id)
                          : addToFavourites(item)
                      }
                      className="bg-white/80 rounded-full p-1"
                    >
                      <FontAwesome
                        name={isFav ? "star" : "star-o"}
                        size={20}
                        color="#FFD700"
                      />
                    </TouchableOpacity>
                  </View>
                  <View className="px-4 py-2">
                    <View className="flex-row items-center mb-1">
                      {item.categoryIcon}
                      <Text className="text-xs ml-2 text-gray-700">
                        {item.categoryLabel}
                      </Text>
                    </View>
                    <Text className="font-bold text-base mb-1">
                      {item.name}
                    </Text>
                    <Text className="text-xs text-gray-500 mb-1">
                      {item.vicinity}
                    </Text>
                    <View className="flex-row items-center mt-1">
                      <FontAwesome name="star" size={12} color="#FBC02D" />
                      <Text className="ml-2 text-xs">
                        {item.rating ?? "N/A"} ({item.user_ratings_total ?? 0})
                      </Text>
                      {item.opening_hours?.open_now !== undefined && (
                        <Text
                          className={`ml-4 text-xs ${
                            item.opening_hours.open_now
                              ? "text-green-700"
                              : "text-red-700"
                          }`}
                        >
                          {item.opening_hours.open_now ? "Open Now" : "Closed"}
                        </Text>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>
      {/* Details Modal */}
      <Modal
        visible={detailsModal}
        animationType="slide"
        onRequestClose={closeDetails}
      >
        <SafeAreaView className="flex-1 bg-white">
          {detailsLoading ? (
            <ActivityIndicator size="large" className="mt-10" />
          ) : !details ? (
            <Text className="text-center mt-16">Place not found.</Text>
          ) : (
            <ScrollView>
              {/* Photos Gallery */}
              <ScrollView horizontal className="h-[220px]">
                {(details.photos && details.photos.length > 0
                  ? details.photos
                  : [{ photo_reference: null }]
                ).map((photo: any, idx: number) => (
                  <Image
                    key={idx}
                    source={{
                      uri: photo.photo_reference
                        ? getPhotoUrl(photo.photo_reference, 600)
                        : FALLBACK_IMAGE,
                    }}
                    style={{
                      width: windowWidth,
                      height: 220,
                      marginRight: 6,
                    }}
                  />
                ))}
              </ScrollView>
              <View className="p-5">
                <Text className="font-bold text-2xl mb-2">{details.name}</Text>
                <Text className="text-gray-600 mb-1">
                  {details.formatted_address}
                </Text>
                {details.formatted_phone_number && (
                  <Text className="text-gray-800 mb-2">
                    📞 {details.formatted_phone_number}
                  </Text>
                )}
                <Text className="text-gray-500 mb-1">
                  {details.types
                    ?.map((t: string) => t.replace(/_/g, " "))
                    .join(", ")}
                </Text>
                <Text className="font-bold text-base mb-1">
                  ⭐ {details.rating ?? "N/A"} (
                  {details.user_ratings_total ?? 0} ratings)
                </Text>
                {details.opening_hours && (
                  <Text
                    className={`mb-2 ${
                      details.opening_hours.open_now
                        ? "text-green-700"
                        : "text-red-700"
                    }`}
                  >
                    {details.opening_hours.open_now ? "Open Now" : "Closed"}
                  </Text>
                )}
                {details.price_level && (
                  <Text className="text-gray-500 mb-1">
                    {"$".repeat(details.price_level)}
                  </Text>
                )}
                {details.website && (
                  <TouchableOpacity
                    onPress={() => Linking.openURL(details.website)}
                  >
                    <Text className="text-blue-700 mb-1 underline">
                      Website
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={() => {
                    const lat = details.geometry.location.lat;
                    const lng = details.geometry.location.lng;
                    const url =
                      Platform.OS === "ios"
                        ? `maps://app?daddr=${lat},${lng}&dirflg=d`
                        : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
                    Linking.openURL(url);
                  }}
                  className="bg-blue-600 rounded-lg p-3 mt-6 mb-3 items-center"
                >
                  <Text className="text-white font-semibold">
                    Get Directions
                  </Text>
                </TouchableOpacity>
                {details.reviews && (
                  <>
                    <Text className="font-bold mt-6">Reviews</Text>
                    {details.reviews
                      .slice(0, 5)
                      .map((review: any, idx: number) => (
                        <View
                          key={idx}
                          className="border-b border-gray-100 mb-3"
                        >
                          <Text className="font-bold mt-2">
                            {review.author_name}
                          </Text>
                          <Text>{"★".repeat(Math.round(review.rating))}</Text>
                          <Text className="text-gray-700">{review.text}</Text>
                        </View>
                      ))}
                  </>
                )}
                <TouchableOpacity
                  onPress={closeDetails}
                  className="mt-4 bg-gray-900 rounded-lg p-3 items-center"
                >
                  <Text className="text-white">Close</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
