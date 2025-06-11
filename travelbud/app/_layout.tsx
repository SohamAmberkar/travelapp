// layout.tsx
import React from "react";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack, useRouter, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { PlacesProvider } from "../context/places-context";
import { UserProvider, useUser } from "../context/user-context";
import { AuthProvider, useAuth } from "../context/auth-context";
import "./globals.css";

function ThemedApp({ children }: { children: React.ReactNode }) {
  const { darkMode } = useUser();
  return (
    <ThemeProvider value={darkMode ? DarkTheme : DefaultTheme}>
      <StatusBar style={darkMode ? "light" : "dark"} />
      {children}
    </ThemeProvider>
  );
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    if (
      !loading &&
      !user &&
      pathname !== "/login" &&
      pathname !== "/register"
    ) {
      router.replace("/login");
    }
    if (
      !loading &&
      user &&
      (pathname === "/login" || pathname === "/register")
    ) {
      router.replace("/");
    }
  }, [user, pathname, loading, router]);

  if (loading) return null;
  if (!user && pathname !== "/login" && pathname !== "/register") return null;
  return <>{children}</>;
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
              <AuthGate>
                <Stack>
                  <Stack.Screen
                    name="(tabs)"
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen name="+not-found" />
                  <Stack.Screen name="login" options={{ headerShown: false }} />
                  <Stack.Screen
                    name="register"
                    options={{ headerShown: false }}
                  />
                </Stack>
              </AuthGate>
            </ThemedApp>
          </PlacesProvider>
        </UserProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
