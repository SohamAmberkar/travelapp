import api from "./api";

export type Place = {
  place_id: string;
  name: string;
  vicinity?: string;
  geometry?: { location: { lat: number; lng: number } };
  [key: string]: any;
};

// PATCH preferences only via /preferences endpoint
export async function updateProfile({
  username,
  interests,
  profilePic,
}: {
  username?: string;
  interests?: string[];
  profilePic?: string;
}) {
  if (interests) await api.patch("/preferences", { preferences: interests });
  if (username || profilePic) await api.patch("/profile", { username, profilePic });
}

// Always get latest favourites from /favourites
export async function getFavourites(): Promise<Place[]> {
  const res = await api.get("/favourites");
  return res.data;
}

export async function addFavourite(place: Place): Promise<void> {
  await api.post("/favorites", { place });
}

export async function removeFavourite(place_id: string): Promise<void> {
  await api.delete(`/favorites/${place_id}`);
}
