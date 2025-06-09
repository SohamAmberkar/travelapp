import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

type UserContextType = {
  username: string;
  setUsername: (name: string) => void;
  profilePic: string;
  setProfilePic: (url: string) => void;
  interests: string[];
  setInterests: (interests: string[]) => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
};

const DEFAULT_USER = {
  username: "John Doe",
  profilePic: "https://randomuser.me/api/portraits/men/32.jpg",
  interests: [],
  darkMode: false,
};

const UserContext = createContext<UserContextType>({
  ...DEFAULT_USER,
  setUsername: () => {},
  setProfilePic: () => {},
  setInterests: () => {},
  setDarkMode: () => {},
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [username, setUsernameState] = useState(DEFAULT_USER.username);
  const [profilePic, setProfilePicState] = useState(DEFAULT_USER.profilePic);
  const [interests, setInterestsState] = useState<string[]>([]);
  const [darkMode, setDarkModeState] = useState(DEFAULT_USER.darkMode);

  useEffect(() => {
    (async () => {
      const name = await AsyncStorage.getItem("username");
      const pic = await AsyncStorage.getItem("profilePic");
      const ints = await AsyncStorage.getItem("interests");
      const dark = await AsyncStorage.getItem("darkMode");
      if (name) setUsernameState(name);
      if (pic) setProfilePicState(pic);
      if (ints) setInterestsState(JSON.parse(ints));
      if (dark) setDarkModeState(dark === "true");
    })();
  }, []);

  const setUsername = (name: string) => {
    setUsernameState(name);
    AsyncStorage.setItem("username", name);
  };
  const setProfilePic = (url: string) => {
    setProfilePicState(url);
    AsyncStorage.setItem("profilePic", url);
  };
  const setInterests = (ints: string[]) => {
    setInterestsState(ints);
    AsyncStorage.setItem("interests", JSON.stringify(ints));
  };
  const setDarkMode = (val: boolean) => {
    setDarkModeState(val);
    AsyncStorage.setItem("darkMode", val ? "true" : "false");
  };

  return (
    <UserContext.Provider
      value={{
        username,
        setUsername,
        profilePic,
        setProfilePic,
        interests,
        setInterests,
        darkMode,
        setDarkMode,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
