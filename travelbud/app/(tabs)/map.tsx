import { usePlaces } from "@/context/places-context";
import {
  FontAwesome5,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import * as Location from "expo-location";
import { useRouter } from "expo-router"; // <-- ADD THIS
import React, { JSX, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Linking,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Callout, Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Map place types to icons
const TYPE_ICONS: Record<string, JSX.Element> = {
  gym: <MaterialCommunityIcons name="dumbbell" size={32} color="#2563eb" />,
  cafe: <FontAwesome5 name="coffee" size={28} color="#be185d" />,
  coworking_space: (
    <MaterialCommunityIcons name="office-building" size={32} color="#0284c7" />
  ),
  park: <MaterialCommunityIcons name="tree" size={32} color="#16a34a" />,
  store: <MaterialCommunityIcons name="store" size={32} color="#f59e42" />,
};

const screenHeight = Dimensions.get("window").height;

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const { places, loading, error } = usePlaces();
  const [selected, setSelected] = useState<number | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [region, setRegion] = useState(null);
  const router = useRouter(); // <-- ADD THIS

  // Animated value for height of the list container
  const animation = useRef(new Animated.Value(screenHeight * 0.4)).current;

  const toggleCollapse = () => {
    Animated.timing(animation, {
      toValue: collapsed ? screenHeight * 0.4 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
    setCollapsed(!collapsed);
  };

  const mapHeight = animation.interpolate({
    inputRange: [0, screenHeight * 0.4],
    outputRange: [
      screenHeight - insets.top - 60,
      screenHeight - insets.top - screenHeight * 0.4 - 60,
    ],
    extrapolate: "clamp",
  });

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

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;
        const location = await Location.getCurrentPositionAsync({});
        setRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        });
      } catch {
        setRegion({
          latitude: 19.076,
          longitude: 72.8777,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        });
      }
    })();
  }, []);

  // --- FLOATING ROUTE BUTTON ---
  const selectedPlace = selected !== null ? places[selected] : null;

  return (
    <View style={{ flex: 1, paddingTop: insets.top, backgroundColor: "white" }}>
      <Text
        style={{
          fontSize: 24,
          fontWeight: "bold",
          color: "#2563eb",
          paddingHorizontal: 24,
          paddingVertical: 12,
        }}
      >
        Map
      </Text>
      <View style={{ flex: 1 }}>
        <Animated.View style={{ height: mapHeight }}>
          {!region || loading ? (
            <View
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "white",
              }}
            >
              <ActivityIndicator size="large" color="#2563eb" />
              <Text style={{ marginTop: 16, color: "#2563eb", fontSize: 18 }}>
                Loading map and places...
              </Text>
            </View>
          ) : error ? (
            <View
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "white",
              }}
            >
              <Text style={{ color: "#dc2626" }}>{error}</Text>
            </View>
          ) : (
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
                  anchor={{ x: 0.5, y: 1 }}
                >
                  <Callout>
                    <View className="px-4 py-2 bg-white rounded-xl flex-1">
                      <Text className="font-bold text-blue-900 text-base">
                        {place.name}
                      </Text>
                    </View>
                  </Callout>
                </Marker>
              ))}
            </MapView>
          )}
        </Animated.View>

        {/* --- FLOATING ROUTE BUTTON --- */}
        {selectedPlace && (
          <TouchableOpacity
            onPress={() =>
              openDirections(
                selectedPlace.geometry.location.lat,
                selectedPlace.geometry.location.lng,
                selectedPlace.name
              )
            }
            style={{
              position: "absolute",
              right: 24,
              bottom: collapsed ? 80 : screenHeight * 0.4 + 80,
              backgroundColor: "#2563eb",
              borderRadius: 32,
              padding: 16,
              elevation: 8,
              zIndex: 20,
              flexDirection: "row",
              alignItems: "center",
            }}
            activeOpacity={0.85}
          >
            <Ionicons name="navigate" size={22} color="#fff" />
            <Text style={{ color: "#fff", fontWeight: "bold", marginLeft: 8 }}>
              Route
            </Text>
          </TouchableOpacity>
        )}

        {/* Always-visible floating toggle button */}
        <View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: collapsed ? 16 : screenHeight * 0.4 + 16,
            alignItems: "center",
            zIndex: 10,
          }}
        >
          <TouchableOpacity
            onPress={toggleCollapse}
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#fff",
              borderRadius: 20,
              paddingVertical: 8,
              paddingHorizontal: 20,
              shadowColor: "#000",
              shadowOpacity: 0.07,
              shadowRadius: 6,
              elevation: 4,
              borderWidth: 1,
              borderColor: "#e5e7eb",
            }}
            activeOpacity={0.9}
          >
            <Ionicons
              name={collapsed ? "chevron-up" : "chevron-down"}
              size={24}
              color="#2563eb"
            />
            <Text
              style={{ color: "#2563eb", fontWeight: "600", marginLeft: 8 }}
            >
              {collapsed ? "Show Places List" : "Hide Places List"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Sliding list */}
        <Animated.View
          style={{
            height: animation,
            overflow: "hidden",
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "white",
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            shadowColor: "#000",
            shadowOpacity: 0.07,
            shadowRadius: 6,
            elevation: 8,
          }}
        >
          <ScrollView>
            {places.map((place, idx) => (
              <TouchableOpacity
                key={place.place_id}
                className={[
                  "flex-row items-center mb-3 rounded-2xl px-4 py-3 mx-4 shadow",
                  selected === idx
                    ? "bg-blue-100 border-2 border-blue-400"
                    : "bg-slate-50 border border-slate-200",
                ].join(" ")}
                onPress={() => setSelected(idx)}
                activeOpacity={0.88}
              >
                <View
                  className={[
                    "w-11 h-11 rounded-full mr-3 items-center justify-center",
                    selected === idx ? "bg-blue-200" : "bg-slate-200",
                  ].join(" ")}
                >
                  <Text className="text-2xl">📍</Text>
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
                  className="flex-row items-center bg-blue-600 rounded-xl px-4 py-2 ml-2 shadow-sm"
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
                    size={18}
                    color="#fff"
                    style={{ marginRight: 4 }}
                  />
                  <Text className="text-white font-semibold text-xs">
                    Route
                  </Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>
      </View>
    </View>
  );
}
