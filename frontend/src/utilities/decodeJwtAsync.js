import jwtDecode from 'jwt-decode';
import apiClient from './apiClient';
import axios from 'axios';

const backendRefreshTokenURL = `${process.env.REACT_APP_BACKEND_URI}/auth/refresh-token`;

const refreshAccessToken = async () => {
  try {
    const response = await axios.post(
      backendRefreshTokenURL, 
      {},
      { withCredentials: true }
    );

    const { accessToken } = response.data;
    if (accessToken) {
      localStorage.setItem("accessToken", accessToken); // Store the new access token
      return accessToken; // Return the new access token
    }
    throw new Error("No access token returned");
  } catch (error) {
    console.error("Failed to refresh access token:", error);
    throw error; // Propagate error to handle in calling function
  }
};


const getUserInfoAsync = async () => {
  const accessToken = localStorage.getItem('accessToken');
  if (!accessToken) return undefined; // Return undefined directly

  const decodedAccessToken = jwtDecode(accessToken);
  const { exp } = decodedAccessToken;

  // If token has expired
  if (exp < new Date().getTime() / 1000) {
    try {

      localStorage.removeItem('accessToken');

    } catch (error) {
      console.error('Token has expired', error);
      throw error;
    }
  }

  // Token is still valid
  return decodedAccessToken;
};

export { refreshAccessToken, getUserInfoAsync };