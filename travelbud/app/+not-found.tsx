import { Text, View } from "react-native";

export default function NotFoundScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-xl text-red-500 font-bold">404 - Not Found</Text>
      <Text className="mt-2 text-gray-600">
        The page you are looking for does not exist.
      </Text>
    </View>
  );
}
