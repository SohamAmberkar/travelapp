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
  SafeAreaView,
} from "react-native";
import { Ionicons, FontAwesome } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePlaces } from "../../context/places-context";
import { useUser } from "../../context/user-context"; // Adjust path as needed
import { PlacesProvider } from "../../context/places-context";

const FALLBACK_IMAGE =
  "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/No_image_available.svg/480px-No_image_available.svg.png";

const getPhotoUrl = (photoReference: string, maxwidth = 400) =>
  `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxwidth}&photoreference=${photoReference}&key=${process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY}`;

export default function HomeScreen() {
  const [favsCollapsed, setFavsCollapsed] = React.useState(false);

  const insets = useSafeAreaInsets();
  const { places: allPlaces, loading, error, setManualLocation } = usePlaces();
  const { favourites, addToFavourites, removeFromFavourites, username } =
    useUser();

  // Details modal state
  const [detailsModal, setDetailsModal] = React.useState(false);
  const [detailsLoading, setDetailsLoading] = React.useState(false);
  const [details, setDetails] = React.useState<any | null>(null);

  // Manual location modal state
  const [locationModalVisible, setLocationModalVisible] = React.useState(false);
  const [manualLocation, setManualLocationInput] = React.useState("");

  // Search state
  const [search, setSearch] = React.useState("");
  const filteredPlaces = allPlaces.filter((place) =>
    place.name.toLowerCase().includes(search.toLowerCase())
  );

  // Main list of places (excluding favourites)
  const nonFavPlaces = filteredPlaces.filter(
    (item) => !favourites.some((fav) => fav.place_id === item.place_id)
  );

  // Handler to open details modal and fetch details
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

  // Render Favourites Card (now opens details modal)
  const renderFavCard = ({ item }: { item: any }) => (
    <TouchableOpacity onPress={() => openDetails(item.place_id)}>
      <View className="mr-4">
        <Image
          source={{
            uri:
              item.photos && item.photos.length > 0
                ? getPhotoUrl(item.photos[0].photo_reference)
                : FALLBACK_IMAGE,
          }}
          className="w-24 h-24 rounded-xl mb-2"
          resizeMode="cover"
        />
        <Text className="font-semibold text-xs w-24" numberOfLines={1}>
          {item.name}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-white pt-6">
      <View className="flex-row items-center mt-6 mx-5 mb-0">
        <Text className="text-2xl font-bold flex-1">Hello, {username}</Text>
        <TouchableOpacity onPress={() => setLocationModalVisible(true)}>
          <Ionicons name="location" size={26} color="#4285F4" />
        </TouchableOpacity>
      </View>

      {/* Manual Location Modal */}
      <Modal
        visible={locationModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setLocationModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/60">
          <View className="bg-white rounded-xl p-6 w-11/12">
            <Text className="font-bold text-lg mb-2">Enter your location</Text>
            <TextInput
              className="border border-gray-300 rounded-lg p-3 mb-4"
              placeholder="Type your city or address"
              value={manualLocation}
              onChangeText={setManualLocationInput}
            />
            <View className="flex-row justify-between">
              <TouchableOpacity
                className="bg-gray-300 rounded-lg p-3 flex-1 mr-2 items-center"
                onPress={() => setLocationModalVisible(false)}
              >
                <Text className="text-black">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="bg-blue-600 rounded-lg p-3 flex-1 ml-2 items-center"
                onPress={() => {
                  setManualLocation(manualLocation); // update context
                  setLocationModalVisible(false);
                }}
              >
                <Text className="text-white font-bold">Set Location</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Favourites Horizontal Scroll */}
      {favourites.length > 0 && (
        <View className="mx-4 mt-6 mb-3 rounded-2xl border border-blue-200 bg-blue-50 shadow-sm overflow-hidden">
          <TouchableOpacity
            onPress={() => setFavsCollapsed((prev) => !prev)}
            activeOpacity={0.85}
            className="flex-row items-center px-5 py-3 bg-blue-100"
          >
            <Text className="font-bold text-base flex-1 text-blue-900">
              Your Favourites
            </Text>
            <FontAwesome
              name={favsCollapsed ? "angle-down" : "angle-up"}
              size={22}
              color="#2563eb"
            />
          </TouchableOpacity>
          {!favsCollapsed && (
            <View className="py-3">
              <FlatList
                data={favourites}
                keyExtractor={(item) => item.place_id}
                renderItem={renderFavCard}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                  paddingLeft: 12,
                  paddingBottom: 2,
                  paddingRight: 12,
                }}
                className="min-h-[120px]"
              />
            </View>
          )}
        </View>
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
        transparent={true}
      >
        <View className="flex-1 justify-center items-center bg-black/60">
          <View className="bg-white rounded-xl p-4 w-11/12 max-h-[80%]">
            {detailsLoading ? (
              <ActivityIndicator size="large" color="#000" />
            ) : !details ? (
              <Text>Place not found.</Text>
            ) : (
              <ScrollView>
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
    </SafeAreaView>
  );
}
