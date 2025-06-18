import React from "react";
import {
  Image,
  Switch,
  Text,
  TouchableOpacity,
  View,
  FlatList,
  TextInput,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useUser } from "@/context/user-context";
import { useAuth } from "@/context/auth-context";

const INTERESTS = [
  { label: "Gyms", type: "gym" },
  { label: "Cafes", type: "cafe" },
  { label: "Coworking", type: "coworking_space" },
  { label: "Parks", type: "park" },
  { label: "Stores", type: "store" },
];

export default function ProfileScreen() {
  const {
    username,
    setUsername,
    profilePic,
    interests,
    setInterests,
    favourites,
    removeFromFavourites,
    darkMode,
    setDarkMode,
  } = useUser();
  const { logout } = useAuth();

  const [editName, setEditName] = React.useState(false);
  const [nameInput, setNameInput] = React.useState(username);

  React.useEffect(() => {
    setNameInput(username);
  }, [username]);

  const handleSaveName = () => {
    setUsername(nameInput);
    setEditName(false);
  };

  const toggleInterest = (type: string) => {
    const newInterests = interests.includes(type)
      ? interests.filter((i) => i !== type)
      : [...interests, type];
    setInterests(newInterests);
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: darkMode ? "#222" : "#fff" }}
    >
      <FlatList
        data={favourites}
        keyExtractor={(item) => item.place_id}
        contentContainerStyle={{ padding: 20 }}
        ListHeaderComponent={
          <>
            <View style={{ alignItems: "center", marginBottom: 16 }}>
              <Image
                source={{ uri: profilePic }}
                style={{ width: 80, height: 80, borderRadius: 40 }}
              />
              {!editName ? (
                <TouchableOpacity onPress={() => setEditName(true)}>
                  <Text
                    style={{
                      fontSize: 20,
                      color: darkMode ? "#fff" : "#000",
                      marginTop: 8,
                    }}
                  >
                    {username}
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <TextInput
                    value={nameInput}
                    onChangeText={setNameInput}
                    style={{
                      fontSize: 20,
                      borderBottomWidth: 1,
                      borderColor: "#aaa",
                      marginRight: 8,
                      color: darkMode ? "#fff" : "#000",
                      minWidth: 100,
                    }}
                    autoFocus
                  />
                  <TouchableOpacity onPress={handleSaveName}>
                    <Ionicons name="checkmark" size={24} color="green" />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <Text
              style={[
                styles.heading,
                { color: darkMode ? "#ddd" : "#333", marginBottom: 12 },
              ]}
            >
              Your Interests
            </Text>
            <View>
              {INTERESTS.map((interest) => (
                <View
                  key={interest.type}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginVertical: 6,
                    marginHorizontal: 12,
                  }}
                >
                  <Text style={{ flex: 1, color: darkMode ? "#ccc" : "#222" }}>
                    {interest.label}
                  </Text>
                  <Switch
                    value={interests.includes(interest.type)}
                    onValueChange={() => toggleInterest(interest.type)}
                  />
                </View>
              ))}
            </View>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginVertical: 18,
                marginHorizontal: 12,
              }}
            ></View>

            <Text
              style={[
                styles.heading,
                {
                  color: darkMode ? "#ddd" : "#333",
                  marginBottom: 8,
                  marginLeft: 12,
                },
              ]}
            >
              Your Favourites
            </Text>
          </>
        }
        renderItem={({ item }) => (
          <View
            style={[
              styles.favRow,
              { backgroundColor: darkMode ? "#333" : "#f3f3f3" },
            ]}
          >
            <Text style={{ flex: 1, color: darkMode ? "#eee" : "#111" }}>
              {item.name}
            </Text>
            <TouchableOpacity
              onPress={() => removeFromFavourites(item.place_id)}
            >
              <Ionicons name="trash" size={20} color="red" />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <Text
            style={{
              color: "#888",
              marginTop: 12,
              textAlign: "center",
              fontSize: 16,
            }}
          >
            No favourites yet.
          </Text>
        }
        ListFooterComponent={
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={async () => {
              await logout();
              // AuthGate will redirect user automatically on logout
            }}
          >
            <Text style={{ color: "white", fontWeight: "bold" }}>Logout</Text>
          </TouchableOpacity>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  heading: {
    fontWeight: "bold",
    fontSize: 17,
    marginBottom: 8,
    color: "#333",
  },
  favRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    padding: 12,
    borderRadius: 8,
  },
  logoutBtn: {
    marginTop: 24,
    backgroundColor: "#cc0000",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 12,
  },
});
