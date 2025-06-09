import api from "./api";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const login = async (email: string, password: string) => {
  try {
    const res = await api.post("/login", { email, password });
    await AsyncStorage.setItem("token", res.data.token); // Store JWT
    return res.data.user;
  } catch (err: any) {
    // Extract error message
    if (err.response?.data?.error) throw err.response.data.error;
    throw "Login failed";
  }
};

export const getProfile = async () => {
  try {
    const res = await api.get("/profile"); // <-- Simplified, interceptor handles token
    return res.data;
  } catch (err: any) {
    throw err.response?.data?.error || "Failed to fetch profile";
  }
};


export const register = async (username: string, email: string, password: string) => {
  try {
    const res = await api.post("/register", { username, email, password });
    return res.data;
  } catch (err: any) {
    if (err.response?.data?.error) throw err.response.data.error;
    throw "Registration failed";
  }
};


export const logout = async () => {
  await AsyncStorage.removeItem("token");
};


