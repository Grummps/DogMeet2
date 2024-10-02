import jwtDecode from 'jwt-decode';

const getUserInfo = () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return null;

    try {
        const decoded = jwtDecode(token);
        return {
            id: decoded.id,
            email: decoded.email,
            username: decoded.username,
            isAdmin: decoded.isAdmin,
        };
    } catch (error) {
        console.error('Error decoding JWT:', error);
        return null;
    }
};

export default getUserInfo;
