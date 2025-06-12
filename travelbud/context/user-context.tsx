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
  setUsername: (name: string) => void;
  profilePic: string;
  setProfilePic: (url: string) => void;
  interests: string[];
  setInterests: (interests: string[]) => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  favourites: Place[];
  addToFavourites: (place: Place) => void;
  removeFromFavourites: (place_id: string) => void;
};

const DEFAULT_USER: UserContextType = {
  username: "",
  setUsername: () => {},
  profilePic: "",
  setProfilePic: () => {},
  interests: [],
  setInterests: () => {},
  darkMode: false,
  setDarkMode: () => {},
  favourites: [],
  addToFavourites: () => {},
  removeFromFavourites: () => {},
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

  const setUsername = (name: string) => {
    setUsernameState(name);
    updateProfile({ username: name });
  };

  const setProfilePic = (url: string) => {
    setProfilePicState(url);
    updateProfile({ profilePic: url });
  };

  const setInterests = (ints: string[]) => {
    setInterestsState(ints);
    updateProfile({ interests: ints });
  };

  const setDarkMode = (val: boolean) => {
    setDarkModeState(val);
  };

  const addToFavourites = async (place: Place) => {
    //console.log(place);
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
