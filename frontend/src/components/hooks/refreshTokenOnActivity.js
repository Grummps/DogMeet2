import { useEffect, useContext, useCallback } from "react";
import { refreshAccessToken } from "../../utilities/decodeJwtAsync";
import jwt_decode from "jwt-decode";
import { UserContext } from "../contexts/userContext";
import { useLocation } from "react-router-dom";
import { TokenRefreshContext } from "../contexts/tokenRefreshContext";
import throttle from "lodash/throttle";

const TOKEN_REFRESH_INTERVAL = 4 * 1000; // 45 minutes

const useRefreshTokenOnActivity = () => {
    const location = useLocation();
    const { user, setUser } = useContext(UserContext);
    const { lastRefreshTime, setLastRefreshTime } = useContext(TokenRefreshContext);

    const handleTokenRefresh = useCallback(async () => {
        if (!user) {
            console.log("No user available. Skipping token refresh.");
            return;
        }

        const now = Date.now();
        if (now - lastRefreshTime >= TOKEN_REFRESH_INTERVAL) {
            console.log("TOKEN_REFRESH_INTERVAL elapsed. Refreshing token.");
            try {
                const newAccessToken = await refreshAccessToken();
                if (newAccessToken) {
                    localStorage.setItem("accessToken", newAccessToken);
                    const decodedAccessToken = jwt_decode(newAccessToken);

                    setLastRefreshTime(now); // Update using TokenRefreshContext
                    if (setUser) {
                        setUser(decodedAccessToken);
                    }
                    console.log("Token refreshed at", new Date(now).toLocaleTimeString());
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

        console.log("Event listeners for user activity added.");

        return () => {
            document.removeEventListener("click", throttledHandleTokenRefresh);
            document.removeEventListener("scroll", throttledHandleTokenRefresh);
            document.removeEventListener("mousemove", throttledHandleTokenRefresh);

            throttledHandleTokenRefresh.cancel();
            console.log("Event listeners for user activity removed.");
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
