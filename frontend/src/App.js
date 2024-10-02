import React from "react";
// We use Route in order to define the different routes of our application
import { Route, Routes, Navigate } from "react-router-dom";

// We import all the components we need in our app
import Navbar from "./components/navbar";
import LandingPage from "./components/pages/landingPage";
import HomePage from "./components/pages/homePage";
import Login from "./components/pages/login";
import Signup from "./components/pages/register";
import Profile from "./components/pages/profile";
import { createContext, useState, useEffect } from "react";
import getUserInfo from "./utilities/decodeJwt";
import 'leaflet/dist/leaflet.css';
import AdminDashboard from "./components/pages/adminDashboard";
import Unauthorized from "./components/unauthorized";
import ProtectedRoute from "./components/protectedRoute";
import ParksList from "./components/pages/parkList";

import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix Leaflet's default icon paths
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});


export const UserContext = createContext();
//test change
//test again
const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Add loading state

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      const info = getUserInfo(token); // Pass the token to getUserInfo
      console.log('User info:', info); // Debugging
      setUser(info);
    } else {
      console.log('No access token found.');
    }
    setLoading(false);
  }, []);

  if (loading) {
    return <div>Loading...</div>; // Show a loading indicator while fetching user
  }

  return (
    <div className="bg-blue-50">
      <Navbar />
      <UserContext.Provider value={user}>
        <Routes>
          <Route exact path="/" element={<LandingPage />} />
          <Route exact path="/home" element={<HomePage />} />
          <Route exact path="/login" element={<Login />} />
          <Route exact path="/signup" element={<Signup />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/parks" element={<ParksList />} />

          {/* AddPark Route - Protected and Admin Only */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute isAdmin={user?.isAdmin}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Unauthorized Access Route */}
          <Route path="/unauthorized" element={<Unauthorized />} />

        </Routes>
      </UserContext.Provider>
    </div>
  );
};

export default App