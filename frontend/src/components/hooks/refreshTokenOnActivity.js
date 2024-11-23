import { useEffect, useContext, useCallback } from "react";
import { refreshAccessToken } from "../../utilities/decodeJwtAsync";
import jwt_decode from "jwt-decode";
import { UserContext } from "../contexts/userContext";
import { useLocation } from "react-router-dom";
import { TokenRefreshContext } from "../contexts/tokenRefreshContext";
import throttle from "lodash/throttle";

const TOKEN_REFRESH_INTERVAL = 45 * 60 * 1000; // 45 minutes

const useRefreshTokenOnActivity = () => {
    const location = useLocation();
    const { user, setUser } = useContext(UserContext);
    const { lastRefreshTime, setLastRefreshTime } = useContext(TokenRefreshContext);

    const handleTokenRefresh = useCallback(async () => {
        if (!user) {
            return;
        }

        const now = Date.now();
        if (now - lastRefreshTime >= TOKEN_REFRESH_INTERVAL) {
            try {
                const newAccessToken = await refreshAccessToken();
                if (newAccessToken) {
                    localStorage.setItem("accessToken", newAccessToken);
                    const decodedAccessToken = jwt_decode(newAccessToken);

                    setLastRefreshTime(now); // Update using TokenRefreshContext
                    if (setUser) {
                        setUser(decodedAccessToken);
                    }
                } else {
                    throw new Error("Invalid token response");
                }
            } catch (error) {
                console.error("Token refresh failed:", error);
                setUser(null);
                localStorage.removeItem("accessToken");
                window.location.href = "/login";
            }
        } 
    }, [user, lastRefreshTime, setLastRefreshTime, setUser]);

    // Throttle the token refresh handler to once every THROTTLE_DELAY milliseconds
    const throttledHandleTokenRefresh = useCallback(
        throttle(() => {
            handleTokenRefresh();
        }, 1000), // 1 second throttle delay
        [handleTokenRefresh]
    );

    useEffect(() => {
        document.addEventListener("click", throttledHandleTokenRefresh);
        document.addEventListener("scroll", throttledHandleTokenRefresh);
        document.addEventListener("mousemove", throttledHandleTokenRefresh);

        return () => {
            document.removeEventListener("click", throttledHandleTokenRefresh);
            document.removeEventListener("scroll", throttledHandleTokenRefresh);
            document.removeEventListener("mousemove", throttledHandleTokenRefresh);

            throttledHandleTokenRefresh.cancel();
        };
    }, [throttledHandleTokenRefresh]);

    useEffect(() => {
        throttledHandleTokenRefresh();
    }, [location.pathname, throttledHandleTokenRefresh]);

    useEffect(() => {
        if (user) {
            handleTokenRefresh();
        }
    }, [user, handleTokenRefresh]);
};

export default useRefreshTokenOnActivity;
