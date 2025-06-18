import React, { createContext, useContext, useEffect, useState } from "react";
import {
  updateProfile,
  getFavourites,
  addFavourite,
  removeFavourite,
  Place,
} from "../utils/userService";
import { useAuth } from "../context/auth-context";

type UserContextType = {
  username: string;
  setUsername: (name: string) => Promise<void>;
  profilePic: string;
  setProfilePic: (url: string) => Promise<void>;
  interests: string[];
  setInterests: (interests: string[]) => Promise<void>;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  favourites: Place[];
  addToFavourites: (place: Place) => Promise<void>;
  removeFromFavourites: (place_id: string) => Promise<void>;
};

const DEFAULT_USER: UserContextType = {
  username: "",
  setUsername: async () => {},
  profilePic: "",
  setProfilePic: async () => {},
  interests: [],
  setInterests: async () => {},
  darkMode: false,
  setDarkMode: () => {},
  favourites: [],
  addToFavourites: async () => {},
  removeFromFavourites: async () => {},
};

const UserContext = createContext<UserContextType>(DEFAULT_USER);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [username, setUsernameState] = useState<string>(DEFAULT_USER.username);
  const [profilePic, setProfilePicState] = useState<string>(
    DEFAULT_USER.profilePic
  );
  const [interests, setInterestsState] = useState<string[]>([]);
  const [darkMode, setDarkModeState] = useState<boolean>(DEFAULT_USER.darkMode);
  const [favourites, setFavourites] = useState<Place[]>([]);

  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      setUsernameState(user.username || "");
      setProfilePicState(user.profilePic || "");
      setInterestsState(user.preferences || []);
      // Always refetch favourites from backend on (re)login
      (async () => {
        try {
          const favs = await getFavourites();
          setFavourites(favs);
        } catch {
          setFavourites([]);
        }
      })();
    } else {
      setUsernameState("");
      setProfilePicState("");
      setInterestsState([]);
      setFavourites([]);
    }
  }, [user]);

  // --- UPDATED: Async, backend-first, revert on error ---
  const setUsername = async (name: string) => {
    const prev = username;
    setUsernameState(name); // Optimistic update
    try {
      await updateProfile({ username: name });
    } catch (err) {
      setUsernameState(prev); // Revert on error
      console.error("Failed to update username:", err);
      throw err;
    }
  };

  const setProfilePic = async (url: string) => {
    const prev = profilePic;
    setProfilePicState(url); // Optimistic update
    try {
      await updateProfile({ profilePic: url });
    } catch (err) {
      setProfilePicState(prev); // Revert on error
      console.error("Failed to update profile pic:", err);
      throw err;
    }
  };

  const setInterests = async (ints: string[]) => {
    const prev = interests;
    setInterestsState(ints); // Optimistic update
    try {
      await updateProfile({ interests: ints });
    } catch (err) {
      setInterestsState(prev); // Revert on error
      console.error("Failed to update interests:", err);
      throw err;
    }
  };

  const setDarkMode = (val: boolean) => {
    setDarkModeState(val);
  };

  const addToFavourites = async (place: Place) => {
    await addFavourite(place);
    setFavourites((prev) =>
      prev.find((fav) => fav.place_id === place.place_id)
        ? prev
        : [...prev, place]
    );
  };

  const removeFromFavourites = async (place_id: string) => {
    await removeFavourite(place_id);
    setFavourites((prev) => prev.filter((fav) => fav.place_id !== place_id));
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
        favourites,
        addToFavourites,
        removeFromFavourites,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
