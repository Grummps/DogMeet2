import React from "react";
import { Route, Routes } from "react-router-dom";

// Importing all necessary components
import Navbar from "./components/ui/navbar";
import LandingPage from "./components/pages/landingPage";
import HomePage from "./components/pages/homePage";
import Login from "./components/pages/login";
import Signup from "./components/pages/register";
import Profile from "./components/pages/profile";
import 'leaflet/dist/leaflet.css';
import AdminDashboard from "./components/pages/adminDashboard";
import Unauthorized from "./components/ui/unauthorized";
import ProtectedRoute from "./components/ui/protectedRoute";
import ParksList from "./components/pages/parkList";
import ParkDetail from "./components/pages/parkDetail";
import useRefreshTokenOnActivity from "./components/hooks/refreshTokenOnActivity";
import { SocketProvider } from "./components/contexts/socketContext";

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

const App = () => {
  // Initialize the token refresh mechanism
  useRefreshTokenOnActivity();

  return (
    <div className="bg-blue-50">
      <SocketProvider>
        <Navbar />
        <Routes>
          <Route exact path="/" element={<LandingPage />} />
          <Route exact path="/home" element={<HomePage />} />
          <Route exact path="/login" element={<Login />} />
          <Route exact path="/signup" element={<Signup />} />
          <Route path="/profile/:_id?" element={<Profile />} />
          <Route path="/parks" element={<ParksList />} />
          <Route path="/parks/:_id" element={<ParkDetail />} />

          {/* Protected Admin Dashboard Route */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute isAdminOnly={true}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Unauthorized Access Route */}
          <Route path="/unauthorized" element={<Unauthorized />} />
        </Routes>
      </SocketProvider>
    </div>
  );
};

export default App;
