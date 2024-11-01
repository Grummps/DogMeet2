import React, { createContext, useState, useEffect } from "react";

export const TokenRefreshContext = createContext();

export const TokenRefreshProvider = ({ children }) => {
    const [lastRefreshTime, setLastRefreshTime] = useState(() => {
        const savedTime = localStorage.getItem("lastRefreshTime");
        return savedTime ? parseInt(savedTime, 10) : Date.now();
    });

    // Only update `localStorage` when the refresh token actually occurs
    const updateLastRefreshTime = (time) => {
        setLastRefreshTime(time);
        localStorage.setItem("lastRefreshTime", time.toString());
    };

    return (
        <TokenRefreshContext.Provider value={{ lastRefreshTime, setLastRefreshTime: updateLastRefreshTime }}>
            {children}
        </TokenRefreshContext.Provider>
    );
};
