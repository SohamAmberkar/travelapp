import React, { useState } from "react";
import {
  View,
  TextInput,
  Button,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { login } from "../utils/authService";
import { useRouter } from "expo-router";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setMessage("");
    if (!email || !password) {
      setMessage("Please enter both email and password.");
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      setMessage("Login successful!");
      router.replace("/"); // Go to home/tabs
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
      <Text style={styles.title}>Login</Text>
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
      <Button title="Login" onPress={handleLogin} disabled={loading} />
      {loading && <ActivityIndicator style={{ marginTop: 10 }} />}
      {message ? <Text style={styles.message}>{message}</Text> : null}

      <Text onPress={() => router.push("/register")}>
        Don't have an account? Register
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
});
