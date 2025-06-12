import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
  Platform,
  Linking,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE, Region } from "react-native-maps";
import { usePlaces } from "../../context/places-context";
import { Ionicons } from "@expo/vector-icons";

const screenHeight = Dimensions.get("window").height;

export default function MapScreen() {
  const { places, loading, error, coords } = usePlaces();
  const [region, setRegion] = useState<Region | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  // Animated value for the collapsible list height
  const animation = useRef(new Animated.Value(screenHeight * 0.3)).current;

  // Update region whenever coords changes
  useEffect(() => {
    if (coords) {
      setRegion({
        latitude: coords.lat,
        longitude: coords.lng,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      });
    }
  }, [coords]);

  // Animate the collapsible list
  const toggleCollapse = () => {
    Animated.timing(animation, {
      toValue: collapsed ? screenHeight * 0.3 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
    setCollapsed(!collapsed);
  };

  // Open directions in Google/Apple Maps
  const openDirections = (lat: number, lng: number, name: string) => {
    const label = encodeURIComponent(name);
    let url = "";
    if (Platform.OS === "ios") {
      url = `maps://app?daddr=${lat},${lng}&dirflg=d`;
    } else {
      url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
    }
    Linking.openURL(url);
  };

  if (loading || !region) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#2563eb" />
        <Text className="mt-4 text-blue-900 text-lg">Loading map...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <Text className="text-red-500 text-lg">{error}</Text>
      </View>
    );
  }

  return (
    <View className="flex-1">
      <MapView
        provider={PROVIDER_GOOGLE}
        style={{ flex: 1 }}
        region={region}
        showsUserLocation
        showsMyLocationButton
      >
        {places.map((place, idx) => (
          <Marker
            key={place.place_id}
            coordinate={{
              latitude: place.geometry.location.lat,
              longitude: place.geometry.location.lng,
            }}
            title={place.name}
            description={place.vicinity}
            onPress={() => setSelected(idx)}
          />
        ))}
      </MapView>

      {/* Floating Route Button */}
      {selected !== null && places[selected] && (
        <TouchableOpacity
          className={`absolute right-6 ${
            collapsed ? "bottom-20" : "bottom-4"
          } bg-blue-600 rounded-full pl-1 py-4   flex-row items-center shadow-xs z-10 max-h-13 max-w-14 min-w-13`}
          activeOpacity={0.85}
          onPress={() =>
            openDirections(
              places[selected].geometry.location.lat,
              places[selected].geometry.location.lng,
              places[selected].name
            )
          }
        >
          <Ionicons name="navigate" size={15} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Toggle Button for Collapsible List */}
      <View
        className={`absolute left-0 right-0 ${
          collapsed ? "bottom-4" : "bottom-44"
        } items-center z-10`}
      >
        <TouchableOpacity
          onPress={toggleCollapse}
          className="flex-row items-center bg-white rounded-xl py-2 px-5 shadow border border-slate-200"
          activeOpacity={0.9}
        >
          <Ionicons
            name={collapsed ? "chevron-up" : "chevron-down"}
            size={24}
            color="#2563eb"
          />
          <Text className="text-blue-700 font-semibold ml-2">
            {collapsed ? "Show Places List" : "Hide Places List"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Collapsible List of All Locations */}
      <Animated.View
        style={{
          height: animation,
          overflow: "hidden",
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
        }}
        className="bg-white rounded-t-3xl shadow-lg"
      >
        <ScrollView>
          {places.map((place, idx) => (
            <TouchableOpacity
              key={place.place_id}
              className={[
                "flex-row items-center mb-3 rounded-2xl px-4 py-3 mx-4",
                selected === idx
                  ? "bg-blue-100 border-2 border-blue-400"
                  : "bg-slate-50 border border-slate-200",
              ].join(" ")}
              onPress={() => {
                setSelected(idx);
                setRegion({
                  latitude: place.geometry.location.lat,
                  longitude: place.geometry.location.lng,
                  latitudeDelta: 0.02,
                  longitudeDelta: 0.02,
                });
              }}
              activeOpacity={0.9}
            >
              <View
                className={[
                  "w-10 h-10 rounded-full mr-3 items-center justify-center",
                  selected === idx ? "bg-blue-200" : "bg-slate-200",
                ].join(" ")}
              >
                <Text className="text-xl">📍</Text>
              </View>
              <View className="flex-1">
                <Text
                  className="font-bold text-base text-slate-900"
                  numberOfLines={1}
                >
                  {place.name}
                </Text>
                <Text
                  className="text-xs text-slate-500 mt-0.5"
                  numberOfLines={2}
                >
                  {place.vicinity}
                </Text>
              </View>
              <TouchableOpacity
                className="flex-row items-center bg-blue-600 rounded-xl px-3 py-2 ml-2 shadow"
                onPress={() =>
                  openDirections(
                    place.geometry.location.lat,
                    place.geometry.location.lng,
                    place.name
                  )
                }
                activeOpacity={0.85}
              >
                <Ionicons
                  name="navigate"
                  size={16}
                  color="#fff"
                  style={{ marginRight: 4 }}
                />
                <Text className="text-white font-semibold text-xs">Route</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>

      {/* Collapsible details for selected marker (as before) */}
      {selected !== null && places[selected] && (
        <View className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-lg p-4">
          <TouchableOpacity
            className="absolute top-2 right-4 z-10"
            onPress={() => setSelected(null)}
          >
            <Text className="text-blue-600 font-bold text-lg">Close</Text>
          </TouchableOpacity>
          <Text className="font-bold text-xl mb-2">
            {places[selected].name}
          </Text>
          <Text className="text-gray-700 mb-1">
            {places[selected].vicinity}
          </Text>
          <Text className="text-gray-500 mb-1">
            {places[selected].types
              ?.map((t: string) => t.replace(/_/g, " "))
              .join(", ")}
          </Text>
          <Text className="mb-1">
            ⭐ {places[selected].rating ?? "N/A"} (
            {places[selected].user_ratings_total ?? 0} ratings)
          </Text>
        </View>
      )}
    </View>
  );
}
