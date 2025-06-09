import * as Location from 'expo-location';

export const getCurrentLocation = async () => {
  let { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') throw new Error('Permission denied');

  let location = await Location.getCurrentPositionAsync({});
  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
  };
};
