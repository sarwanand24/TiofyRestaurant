import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import "core-js/stable/atob";

// Function to check if the token is expired
export const isTokenExpired = (token) => {
  if (!token) return true;
  const decoded = jwtDecode(token);
  console.log('decoded', decoded);
  const { exp } = decoded;
  return Date.now() >= exp * 1000;
};

// Function to refresh the token
export const refreshToken = async () => {
  try {
    const StringRestrodata = await AsyncStorage.getItem("Restrodata");
    const Restrodata = JSON.parse(StringRestrodata);
    
    const response = await axios.post('https://trioserver.onrender.com/api/v1/restaurants/refresh-token', {
       restro: Restrodata._id,
    });
    await AsyncStorage.setItem('token', response.data.data.refreshToken);
    return response.data.data.refreshToken;
  } catch (error) {
    console.error('Failed to refresh token', error);
    // Handle error (e.g., redirect to login)
  }
};

// Function to get the access token
export const getAccessToken = async () => {
  let token = await AsyncStorage.getItem('token');
  console.log('token 23', token);
  if (isTokenExpired(token)) {
    token = await refreshToken();
  }
  return token;
};
