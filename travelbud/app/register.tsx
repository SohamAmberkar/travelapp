import React, { useState } from "react";
import {
  View,
  TextInput,
  Button,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { register as registerUser } from "../utils/authService";

export default function RegisterScreen() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setMessage("");
    if (!username || !email || !password) {
      setMessage("Please fill all fields.");
      return;
    }
    setLoading(true);
    try {
      await registerUser(username, email, password);
      setMessage("Registration successful! You can now log in.");
      setTimeout(() => {
        router.replace("/login");
      }, 1000);
    } catch (err) {
      let errorMessage = "An error occurred";
      if (typeof err === "string") errorMessage = err;
      else if (err instanceof Error) errorMessage = err.message;
      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Register</Text>
      <TextInput
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        style={styles.input}
      />
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        style={styles.input}
        keyboardType="email-address"
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />
      <Button title="Register" onPress={handleRegister} disabled={loading} />
      {loading && <ActivityIndicator style={{ marginTop: 10 }} />}
      {message ? <Text style={styles.message}>{message}</Text> : null}
      <Text style={styles.link} onPress={() => router.push("/login")}>
        Already have an account? Login
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  input: { borderWidth: 1, marginBottom: 10, padding: 8, borderRadius: 5 },
  message: { marginTop: 10, color: "red" },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  link: { color: "blue", marginTop: 20, textAlign: "center" },
});
