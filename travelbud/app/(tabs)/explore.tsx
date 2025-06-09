import React from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePlaces } from "../../context/places-context";

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
  const { places, loading, error, selectedType, setSelectedType } = usePlaces();

  const filteredPlaces = places.filter((place) =>
    place.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
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
      renderItem={({ item }) => (
        <View className="flex-row items-center bg-white rounded-2xl shadow p-4 mb-4 mx-6">
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
              <Text className="text-xs text-gray-700">
                {item.rating ?? "N/A"}
              </Text>
              <Text className="ml-2 text-xs text-gray-400">
                ({item.user_ratings_total ?? 0})
              </Text>
            </View>
          </View>
        </View>
      )}
      ListEmptyComponent={null}
      contentContainerStyle={{
        paddingBottom: 24,
      }}
    />
  );
}
