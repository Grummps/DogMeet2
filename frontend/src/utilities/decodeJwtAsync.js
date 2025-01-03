import jwtDecode from 'jwt-decode';
import apiClient from './apiClient';
import axios from 'axios';

const backendRefreshTokenURL = `${process.env.REACT_APP_BACKEND_URI}/auth/refresh-token`;

const refreshAccessToken = async () => {
  try {
    // Retrieve the refresh token from localStorage
    const refreshToken = localStorage.getItem("refreshToken");

    if (!refreshToken) {
      throw new Error("No refresh token found");
    }

    // Send the refresh token in the request body
    const response = await axios.post(backendRefreshTokenURL, { refreshToken });

    const { accessToken, refreshToken: newRefreshToken } = response.data;

    if (accessToken) {
      // Store the new access and refresh tokens in localStorage
      localStorage.setItem("accessToken", accessToken);
      if (newRefreshToken) {
        localStorage.setItem("refreshToken", newRefreshToken);
      }

      return accessToken; // Return the new access token
    }

    throw new Error("No access token returned");
  } catch (error) {
    console.error("Failed to refresh access token:", error);
    throw error; // Propagate error to handle in the calling function
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