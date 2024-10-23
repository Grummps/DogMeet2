import jwtDecode from 'jwt-decode';

const backendRefreshTokenURL = `${process.env.REACT_APP_BACKEND_URI}/auth/refresh-token`;

const refreshAccessToken = async () => {
    try {
      // Since refresh token is in an HTTP-only cookie, no need to send it manually
      const response = await fetch(backendRefreshTokenURL, {
        method: 'POST',
        credentials: 'include', // Important to include cookies in the request
      });
  
      if (!response.ok) {
        throw new Error('Failed to refresh access token');
      }
  
      const data = await response.json();
      const newAccessToken = data.accessToken;
  
      localStorage.setItem('accessToken', newAccessToken);
  
      return newAccessToken;
    } catch (error) {
      console.error('Error refreshing access token:', error);
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