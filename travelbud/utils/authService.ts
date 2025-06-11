// utils/authService.ts
import { Place } from "@/context/places-context";
import api from "./api";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type User = {
  username: string;
  email: string;
  preferences?: string[];           // <-- add this
  profilePic?: string;              // <-- add this
  favourites?: Place[]; 
};

// Axios error type for type guard
type AxiosError = {
  response?: {
    data?: {
      error?: string;
    };
  };
};

export const login = async (
  email: string,
  password: string
): Promise<User> => {
  try {
    const res = await api.post("/login", { email, password });
    await AsyncStorage.setItem("token", res.data.token);
    return res.data.user as User;
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "response" in err &&
      typeof (err as AxiosError).response?.data?.error === "string"
    ) {
      throw (err as AxiosError).response!.data!.error!;
    }
    if (err instanceof Error) throw err.message;
    throw "Login failed";
  }
};

export const getProfile = async (): Promise<User> => {
  try {
    const res = await api.get("/profile");
    return res.data as User;
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "response" in err &&
      typeof (err as AxiosError).response?.data?.error === "string"
    ) {
      throw (err as AxiosError).response!.data!.error!;
    }
    if (err instanceof Error) throw err.message;
    throw "Failed to fetch profile";
  }
};

export const register = async (
  username: string,
  email: string,
  password: string
): Promise<User> => {
  try {
    const res = await api.post("/register", { username, email, password });
    return res.data as User;
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "response" in err &&
      typeof (err as AxiosError).response?.data?.error === "string"
    ) {
      throw (err as AxiosError).response!.data!.error!;
    }
    if (err instanceof Error) throw err.message;
    throw "Registration failed";
  }
};

export const logout = async (): Promise<void> => {
  await AsyncStorage.removeItem("token");
};
