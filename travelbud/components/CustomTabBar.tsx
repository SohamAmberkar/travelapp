import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import React from "react";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

const TABS = [
  { name: "Home", emoji: "🏠" },
  { name: "Explore", emoji: "🔍" },
  { name: "Map", emoji: "🗺️" },
  { name: "Favorites", emoji: "⭐" },
  { name: "Profile", emoji: "👤" },
];

const { width } = Dimensions.get("window");
const TAB_WIDTH = width / TABS.length;

export default function CustomTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  // Animated pill style
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: withTiming(state.index * TAB_WIDTH, { duration: 250 }) },
    ],
  }));

  return (
    <View style={styles.tabBar}>
      {/* Sliding pill */}
      <Animated.View
        style={[styles.pill, { width: TAB_WIDTH - 16 }, animatedStyle]}
      />
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;
        const isFocused = state.index === index;
        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };
        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            onPress={onPress}
            style={styles.tab}
            activeOpacity={0.8}
          >
            <Text style={[styles.emoji, isFocused && styles.emojiFocused]}>
              {TABS[index].emoji}
            </Text>
            <Text style={[styles.label, isFocused && styles.labelFocused]}>
              {typeof label === "function"
                ? label({
                    focused: isFocused,
                    color: isFocused ? "#2563eb" : "#888",
                    position: "below-icon",
                    children: "",
                  })
                : label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    height: 68,
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: -2 },
    position: "relative",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 0,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: 68,
    zIndex: 2,
  },
  emoji: {
    fontSize: 22,
    marginBottom: 2,
    color: "#888",
  },
  emojiFocused: {
    color: "#2563eb",
  },
  label: {
    fontSize: 12,
    color: "#888",
    fontWeight: "500",
  },
  labelFocused: {
    color: "#2563eb",
    fontWeight: "bold",
  },
  pill: {
    position: "absolute",
    height: 40,
    top: 14,
    left: 8,
    backgroundColor: "#e0edff",
    borderRadius: 20,
    zIndex: 1,
  },
});
