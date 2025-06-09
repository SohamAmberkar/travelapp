import { useUser } from "@/context/user-context";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Image, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function EditProfileScreen() {
  const { username, setUsername, profilePic, setProfilePic } = useUser();
  const [name, setName] = useState(username);
  const [pic, setPic] = useState(profilePic);
  const router = useRouter();

  const save = () => {
    setUsername(name);
    setProfilePic(pic);
    router.back();
  };

  return (
    <View className="flex-1 bg-white dark:bg-gray-900 p-6">
      <Text className="text-2xl font-bold text-blue-900 dark:text-white mb-6">
        Edit Profile
      </Text>
      <Text className="text-base text-gray-700 dark:text-gray-200 mb-2">
        Name
      </Text>
      <TextInput
        className="border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 mb-6 text-lg dark:text-white"
        value={name}
        onChangeText={setName}
      />
      <Text className="text-base text-gray-700 dark:text-gray-200 mb-2">
        Profile Picture URL
      </Text>
      <TextInput
        className="border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 mb-4 text-lg dark:text-white"
        value={pic}
        onChangeText={setPic}
      />
      <Image source={{ uri: pic }} className="w-20 h-20 rounded-full mb-6" />
      <TouchableOpacity
        className="bg-blue-600 rounded-xl py-3 items-center"
        onPress={save}
      >
        <Text className="text-white font-semibold text-lg">Save</Text>
      </TouchableOpacity>
    </View>
  );
}
