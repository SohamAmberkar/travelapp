import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack, useRouter, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { PlacesProvider } from "../context/places-context";
import { UserProvider, useUser } from "../context/user-context";
import "./globals.css";
import { AuthProvider, useAuth } from "../context/auth-context";
import React from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";

function ThemedApp({ children }: { children: React.ReactNode }) {
  const { darkMode } = useUser();
  return (
    <ThemeProvider value={darkMode ? DarkTheme : DefaultTheme}>
      <StatusBar style={darkMode ? "light" : "dark"} />
      {children}
    </ThemeProvider>
  );
}

function AuthGate() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    // If not loading, not authenticated, and not already on login/register, redirect to login
    if (
      !loading &&
      !user &&
      pathname !== "/login" &&
      pathname !== "/register"
    ) {
      router.replace("/login");
    }
  }, [user, pathname, loading]);

  // Show nothing (or a splash) while loading auth state
  if (loading) return null;

  // If not logged in and not on login/register, render nothing (blocks home/tabs)
  if (!user && pathname !== "/login" && pathname !== "/register") return null;

  // If logged in or on login/register, allow rendering
  return null;
}

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  if (!loaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <UserProvider>
          <PlacesProvider>
            <ThemedApp>
              <Stack>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="+not-found" />
                <Stack.Screen name="login" options={{ headerShown: false }} />
                <Stack.Screen
                  name="register"
                  options={{ headerShown: false }}
                />
              </Stack>
              <AuthGate />
            </ThemedApp>
          </PlacesProvider>
        </UserProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
