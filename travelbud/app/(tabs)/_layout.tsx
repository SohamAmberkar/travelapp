import { Feather, FontAwesome, Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#2563eb",
        tabBarInactiveTintColor: "#888",
        tabBarStyle: {
          backgroundColor: "#c6c5fa",

          height: 70, // slightly reduced for better fit
          borderTopWidth: 0.5,
          marginBottom: 38,
          borderColor: "#e5e7eb",
        },
        tabBarLabelStyle: { fontWeight: "600", fontSize: 12, marginBottom: 0 },
        tabBarIconStyle: { marginTop: 2 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" color={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Explore",
          tabBarIcon: ({ color, size }) => (
            <Feather name="search" color={color} size={22} />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: "Map",
          tabBarIcon: ({ color, size }) => (
            <FontAwesome name="map-marker" color={color} size={22} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" color={color} size={22} />
          ),
        }}
      />
    </Tabs>
  );
}
