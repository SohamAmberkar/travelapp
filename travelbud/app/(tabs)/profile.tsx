import { useUser } from "@/context/user-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/auth-context";

import React from "react";
import {
  Image,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const INTERESTS = [
  { label: "Gyms", type: "gym" },
  { label: "Cafes", type: "cafe" },
  { label: "Coworking", type: "coworking_space" },
  { label: "Parks", type: "park" },
  { label: "Stores", type: "store" },
];

export default function ProfileScreen() {
  const { username, profilePic, interests, setInterests } = useUser();
  const router = useRouter();
  const { logout } = useAuth();
  const toggleInterest = (type: string) => {
    const newInterests = interests.includes(type)
      ? interests.filter((i) => i !== type)
      : [...interests, type];
    setInterests(newInterests);
  };

  return (
    <ScrollView className="flex-1 bg-white">
      {/* Profile Header */}
      <View className="items-center pt-10 pb-6 bg-blue-50 mb-6">
        <Image
          source={{ uri: profilePic }}
          className="w-24 h-24 rounded-full mb-3"
        />
        <Text className="text-2xl font-bold text-blue-900">{username}</Text>
        <TouchableOpacity
          className="flex-row items-center mt-2 px-4 py-2 bg-blue-600 rounded-xl"
          onPress={() => router.push("/edit-profile")}
        >
          <Ionicons name="pencil" size={18} color="#fff" />
          <Text className="text-white font-semibold ml-2">Edit Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Preferences */}
      <View className="px-6 mb-8">
        <Text className="text-lg font-bold text-blue-900 mb-2">
          Your Interests
        </Text>
        <View className="rounded-xl bg-gray-50 p-2">
          {INTERESTS.map((interest) => (
            <View
              key={interest.type}
              className="flex-row items-center justify-between py-3 border-b border-gray-200 last:border-b-0"
            >
              <Text className="text-base">{interest.label}</Text>
              <Switch
                value={interests.includes(interest.type)}
                onValueChange={() => toggleInterest(interest.type)}
                trackColor={{ false: "#e5e7eb", true: "#3b82f6" }}
              />
            </View>
          ))}
        </View>
      </View>

      <View className="px-6 mb-8">
        <TouchableOpacity
          className="flex-row items-center justify-center mt-8 px-4 py-3 bg-red-500 rounded-xl"
          onPress={logout}
        >
          <Ionicons name="log-out-outline" size={20} color="#fff" />
          <Text className="text-white font-semibold ml-2">Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
