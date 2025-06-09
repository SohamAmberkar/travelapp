import axios from "axios";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const FALLBACK_IMAGE =
  "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/No_image_available.svg/480px-No_image_available.svg.png";

const getPhotoUrl = (photoReference: string, maxwidth = 400) =>
  `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxwidth}&photoreference=${photoReference}&key=${process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY}`;

export default function PlaceDetailsScreen() {
  const { placeId } = useLocalSearchParams<{ placeId: string }>();
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDetails() {
      setLoading(true);
      try {
        const apiKey = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY as string;
        // You can add more fields as needed
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
      setLoading(false);
    }
    fetchDetails();
  }, [placeId]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!details) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-lg text-gray-600">Place not found.</Text>
      </View>
    );
  }

  const openDirections = () => {
    const lat = details.geometry.location.lat;
    const lng = details.geometry.location.lng;
    let url = "";
    if (Platform.OS === "ios") {
      url = `maps://app?daddr=${lat},${lng}&dirflg=d`;
    } else {
      url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
    }
    Linking.openURL(url);
  };

  return (
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
        <Text className="text-gray-600 mb-2">{details.formatted_address}</Text>
        {details.formatted_phone_number && (
          <Text className="text-blue-800 mb-1">
            📞 {details.formatted_phone_number}
          </Text>
        )}
        <Text className="text-gray-500 mb-2">
          {details.types?.map((t: string) => t.replace(/_/g, " ")).join(", ")}
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
          onPress={openDirections}
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
            {details.reviews.slice(0, 5).map((review: any, idx: number) => (
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
      </View>
    </ScrollView>
  );
}
