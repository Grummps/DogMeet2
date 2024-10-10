import jwtDecode from 'jwt-decode';

const getUserInfo = () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return null;

    let decodedToken;

    try {
        decodedToken = jwtDecode(token);
    } catch (error) {
        console.error('Error decoding JWT:', error);
        localStorage.removeItem('accessToken'); // Remove invalid token
        return null;
    }

    const { exp, id, email, username, isAdmin } = decodedToken;

    // Check if token has expired
    if (exp * 1000 < Date.now()) {
        console.warn('Token has expired');
        localStorage.removeItem('accessToken');
        return null;
    }

    return {
        id,
        email,
        username,
        isAdmin,
    };
};

export default getUserInfo;
