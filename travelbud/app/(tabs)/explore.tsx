import React from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePlaces } from "../../context/places-context";
import { useUser } from "../../context/user-context"; // <-- Make sure this path is correct!

const CATEGORIES = [
  { label: "Gyms", emoji: "🏋️", type: "gym" },
  { label: "Cafes", emoji: "☕", type: "cafe" },
  { label: "Coworking", emoji: "💻", type: "coworking_space" },
  { label: "Parks", emoji: "🌳", type: "park" },
  { label: "Stores", emoji: "🛒", type: "store" },
];

const FALLBACK_IMAGE =
  "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/No_image_available.svg/480px-No_image_available.svg.png";

const getPhotoUrl = (photoReference: string, maxwidth = 400) =>
  `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxwidth}&photoreference=${photoReference}&key=${process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY}`;

export default function ExploreScreen() {
  const [search, setSearch] = React.useState("");
  const insets = useSafeAreaInsets();
  const {
    places,
    loading,
    error,
    selectedType,
    setSelectedType,
    setManualLocation,
    manualLocation,
    coords,
  } = usePlaces();

  // --- Modal state for details ---
  const [detailsModal, setDetailsModal] = React.useState(false);
  const [detailsLoading, setDetailsLoading] = React.useState(false);
  const [details, setDetails] = React.useState<any | null>(null);

  // --- Favourites context ---
  const { favourites, addToFavourites, removeFromFavourites } = useUser();

  // --- Filter places by search ---
  const filteredPlaces = places.filter((place) =>
    place.name.toLowerCase().includes(search.toLowerCase())
  );

  // --- Fetch details on place click ---
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
        "place_id",
      ].join(",");
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${apiKey}`;
      const response = await fetch(url);
      const data = await response.json();
      setDetails(data.result);
    } catch (err) {
      setDetails(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeDetails = () => {
    setDetailsModal(false);
    setDetails(null);
  };

  // --- Render each place ---
  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      onPress={() => openDetails(item.place_id)}
      activeOpacity={0.86}
      className="flex-row items-center bg-white rounded-2xl shadow p-4 mb-4 mx-6"
    >
      <Image
        source={{
          uri:
            item.photos && item.photos.length > 0
              ? getPhotoUrl(item.photos[0].photo_reference)
              : FALLBACK_IMAGE,
        }}
        className="w-16 h-16 rounded-xl mr-3"
        resizeMode="cover"
      />
      <View className="flex-1">
        <Text className="font-bold text-lg text-gray-900">{item.name}</Text>
        <Text className="text-xs text-gray-500 mb-1">{item.vicinity}</Text>
        <Text className="text-xs text-gray-400 mb-1">
          {item.types?.[0]?.replace(/_/g, " ")}
          {item.opening_hours
            ? item.opening_hours.open_now
              ? " • Open"
              : " • Closed"
            : ""}
        </Text>
        <View className="flex-row items-center mt-1">
          <Text className="text-yellow-500 font-bold mr-1">★</Text>
          <Text className="text-xs text-gray-700">{item.rating ?? "N/A"}</Text>
          <Text className="ml-2 text-xs text-gray-400">
            ({item.user_ratings_total ?? 0})
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <>
      <FlatList
        style={{ flex: 1, backgroundColor: "#fff", paddingTop: insets.top }}
        data={loading || error ? [] : filteredPlaces}
        keyExtractor={(item) => item.place_id}
        ListHeaderComponent={
          <>
            {/* Header */}
            <View className="px-6 pt-4 pb-2">
              <Text className="text-3xl font-bold text-blue-900 mb-1">
                Explore
              </Text>
              <Text className="text-gray-500 text-base mb-2">
                Find the best places near you by category.
              </Text>
            </View>

            {/* Search Bar */}
            <View className="flex-row items-center px-6 py-2">
              <TextInput
                className="flex-1 bg-gray-100 rounded-xl px-4 py-3 text-base"
                placeholder="Search places..."
                placeholderTextColor="#94a3b8"
                value={search}
                onChangeText={setSearch}
              />
            </View>

            {/* Categories */}
            <FlatList
              data={CATEGORIES}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: 16,
                paddingVertical: 0,
                alignItems: "center",
              }}
              style={{ marginBottom: 0, paddingTop: 0, paddingBottom: 0 }}
              keyExtractor={(item) => item.label}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={{
                    height: 44,
                    minWidth: 90,
                    borderRadius: 22,
                    borderWidth: 2,
                    borderColor:
                      selectedType === item.type ? "#2563eb" : "#e5e7eb",
                    backgroundColor:
                      selectedType === item.type ? "#2563eb" : "#fff",
                    justifyContent: "center",
                    alignItems: "center",
                    marginRight: 12,
                    paddingHorizontal: 12,
                  }}
                  onPress={() => setSelectedType(item.type)}
                  activeOpacity={0.85}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text style={{ fontSize: 18, marginRight: 6 }}>
                      {item.emoji}
                    </Text>
                    <Text
                      style={{
                        fontWeight: "bold",
                        color: selectedType === item.type ? "#fff" : "#222",
                        fontSize: 16,
                      }}
                    >
                      {item.label}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            />

            {/* Loading/Error/Empty States */}
            {loading ? (
              <View className="items-center justify-center py-10">
                <ActivityIndicator size="large" color="#2563eb" />
                <Text className="mt-4 text-blue-900 text-lg">
                  Loading places...
                </Text>
              </View>
            ) : error ? (
              <Text className="text-red-500 text-center mt-10">{error}</Text>
            ) : filteredPlaces.length === 0 ? (
              <Text className="text-gray-400 text-center mt-10">
                No places found.
              </Text>
            ) : null}
          </>
        }
        renderItem={renderItem}
        ListEmptyComponent={null}
        contentContainerStyle={{
          paddingBottom: 24,
        }}
      />

      {/* --- Details Modal --- */}
      <Modal
        visible={detailsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={closeDetails}
      >
        <View className="flex-1 justify-center items-center bg-black/60">
          <View className="bg-white rounded-xl p-4 w-11/12 max-h-[80%]">
            {detailsLoading ? (
              <ActivityIndicator size="large" color="#000" />
            ) : !details ? (
              <Text>Place not found.</Text>
            ) : (
              <ScrollView>
                {/* Photo */}
                {(details.photos && details.photos.length > 0
                  ? details.photos.slice(0, 1)
                  : [{ photo_reference: null }]
                ).map((photo: any, idx: number) => (
                  <Image
                    key={idx}
                    source={{
                      uri: photo.photo_reference
                        ? getPhotoUrl(photo.photo_reference)
                        : FALLBACK_IMAGE,
                    }}
                    className="w-full h-40 rounded-lg mb-2"
                    resizeMode="cover"
                  />
                ))}
                <Text className="font-bold text-lg mb-1">{details.name}</Text>
                <Text className="text-gray-700 mb-1">
                  {details.formatted_address}
                </Text>
                {details.formatted_phone_number && (
                  <Text className="mb-1">
                    📞 {details.formatted_phone_number}
                  </Text>
                )}
                <Text className="mb-1">
                  {details.types
                    ?.map((t: string) => t.replace(/_/g, " "))
                    .join(", ")}
                </Text>
                <Text className="mb-1">
                  ⭐ {details.rating ?? "N/A"} (
                  {details.user_ratings_total ?? 0} ratings)
                </Text>
                {details.opening_hours && (
                  <Text className="mb-1">
                    {details.opening_hours.open_now ? "Open Now" : "Closed"}
                  </Text>
                )}
                {details.price_level && (
                  <Text className="mb-1">
                    {"$".repeat(details.price_level)}
                  </Text>
                )}

                {/* Add to Favourites Button */}
                <TouchableOpacity
                  onPress={() => {
                    const isFav = favourites.some(
                      (fav) => fav.place_id === details.place_id
                    );
                    isFav
                      ? removeFromFavourites(details.place_id)
                      : addToFavourites(details);
                  }}
                  className={`rounded-lg p-3 mt-2 mb-2 items-center ${
                    favourites.some((fav) => fav.place_id === details.place_id)
                      ? "bg-red-600"
                      : "bg-blue-600"
                  }`}
                >
                  <Text className="text-white font-bold">
                    {favourites.some((fav) => fav.place_id === details.place_id)
                      ? "Remove from Favourites"
                      : "Add to Favourites"}
                  </Text>
                </TouchableOpacity>

                {/* Website and Directions */}
                {details.website && (
                  <TouchableOpacity
                    onPress={() => Linking.openURL(details.website)}
                    className="bg-gray-200 rounded-lg p-2 mb-2 items-center"
                  >
                    <Text className="text-blue-700">Website</Text>
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
                  className="bg-green-600 rounded-lg p-2 mb-2 items-center"
                >
                  <Text className="text-white">Get Directions</Text>
                </TouchableOpacity>

                {/* Reviews */}
                {details.reviews && (
                  <>
                    <Text className="font-bold mt-2 mb-1">Reviews</Text>
                    {details.reviews
                      .slice(0, 5)
                      .map((review: any, idx: number) => (
                        <View key={idx} className="mb-2">
                          <Text className="font-semibold">
                            {review.author_name}
                          </Text>
                          <Text>{"★".repeat(Math.round(review.rating))}</Text>
                          <Text>{review.text}</Text>
                        </View>
                      ))}
                  </>
                )}

                {/* Close Button */}
                <TouchableOpacity
                  onPress={closeDetails}
                  className="bg-gray-300 rounded-lg p-2 mt-2 items-center"
                >
                  <Text className="text-black">Close</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}
