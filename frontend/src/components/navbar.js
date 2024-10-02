// src/components/Navbar.jsx

import React, { useEffect, useState } from "react";
import {
  HomeIcon,
  UserIcon,
  PlayCircleIcon,
  MapPinIcon, // Import MapPinIcon for Parks
  ArrowLeftOnRectangleIcon, // Import logout icon
} from "@heroicons/react/24/solid";
import getUserInfo from "../utilities/decodeJwt";
import { useNavigate } from "react-router-dom";

// Navbar with clickable icons and hover tooltips
export default function Navbar() {
  const [user, setUser] = useState({});

  const navigate = useNavigate();

  const handleClick = (e) => {
    e.preventDefault();
    localStorage.removeItem("accessToken");
    navigate("/");
  };

  useEffect(() => {
    setUser(getUserInfo());
  }, []);

  return (
    <div className="fixed top-0 left-0 h-screen w-28 qhd:w-36 bg-gray-900 flex flex-col items-center py-4 z-50">
      {/* Icons Container */}
      <div className="flex flex-col mt-24 items-center space-y-6 flex-1">
        {/* Play Icon */}
        <a href="/" className="relative group flex items-center justify-center">
          <PlayCircleIcon className="h-12 w-12 fill-white hover:fill-blue-500 cursor-pointer" />
          <span className="absolute left-16 top-1/2 transform -translate-y-1/2 -mt-1 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
            Start
          </span>
        </a>

        {/* Home Icon */}
        <a href="/home" className="relative group flex items-center justify-center">
          <HomeIcon className="h-12 w-12 fill-white hover:fill-blue-500 cursor-pointer" />
          <span className="absolute left-16 top-1/2 transform -translate-y-1/2 -mt-1 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
            Home
          </span>
        </a>

        {/* Profile Icon */}
        <a href="/profile" className="relative group flex items-center justify-center">
          <UserIcon className="h-12 w-12 fill-white hover:fill-blue-500 cursor-pointer" />
          <span className="absolute left-16 top-1/2 transform -translate-y-1/2 -mt-1 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
            Profile
          </span>
        </a>

        {/* Parks Icon */}
        <a href="/parks" className="relative group flex items-center justify-center">
          <MapPinIcon className="h-12 w-12 fill-white hover:fill-blue-500 cursor-pointer" />
          <span className="absolute left-16 top-1/2 transform -translate-y-1/2 -mt-1 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
            Parks
          </span>
        </a>
      </div>

      {/* Logout Button */}
      <div className="mb-4">
        <button
          onClick={handleClick}
          className="relative group flex items-center justify-center"
        >
          <ArrowLeftOnRectangleIcon className="h-12 w-12 fill-white hover:fill-red-500 cursor-pointer" />
          <span className="absolute left-16 top-1/2 transform -translate-y-1/2 -mt-1 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
            Log Out
          </span>
        </button>
      </div>
    </div>
  );
}
