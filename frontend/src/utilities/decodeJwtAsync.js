import jwtDecode from 'jwt-decode';

const backendRefreshTokenURL = `${process.env.REACT_APP_BACKEND_URI}/auth/refresh-token`;

const refreshAccessToken = async () => {
  try {
    const response = await fetch(backendRefreshTokenURL, {
      method: 'POST',
      credentials: 'include', // Include cookies in the request
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage = errorData.message || 'Failed to refresh access token';
      throw new Error(errorMessage);
    }

    const data = await response.json();
    const newAccessToken = data.accessToken;

    if (!newAccessToken) {
      throw new Error('No access token returned from the server');
    }

    localStorage.setItem('accessToken', newAccessToken);

    return newAccessToken;
  } catch (error) {
    console.error('Error refreshing access token:', error);
    // Optionally, handle logout or redirection here or in the calling function
    throw error;
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