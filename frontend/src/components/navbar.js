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
    <div className="fixed top-0 left-0 h-screen w-36 qhd:w-36 bg-gray-900 flex flex-col items-center py-4 z-50">
      {/* Icons Container */}
      <div className="flex flex-col mt-24 items-start space-y-6 flex-1">
        {/* Play Icon */}
        <a href="/" className="flex items-center">
          <PlayCircleIcon className="h-6 w-6 fill-white hover:fill-blue-500 cursor-pointer" />
          <span className="ml-4 text-white text-lg hover:fill-blue-500 cursor-pointer hidden md:inline">Start</span>
        </a>

        {/* Home Icon */}
        <a href="/home" className="flex items-center">
          <HomeIcon className="h-6 w-6 fill-white hover:fill-blue-500 cursor-pointer" />
          <span className="ml-4 text-white text-lg hover:fill-blue-500 cursor-pointer hidden md:inline">Home</span>
        </a>

        {/* Profile Icon */}
        <a href="/profile" className="flex items-center">
          <UserIcon className="h-6 w-6 fill-white hover:fill-blue-500 cursor-pointer" />
          <span className="ml-4 text-white text-lg hover:fill-blue-500 cursor-pointer hidden md:inline">Profile</span>
        </a>

        {/* Parks Icon */}
        <a href="/parks" className="flex items-center">
          <MapPinIcon className="h-6 w-6 fill-white hover:fill-blue-500 cursor-pointer" />
          <span className="ml-4 text-white text-lg hover:fill-blue-500 cursor-pointer hidden md:inline">Parks</span>
        </a>
      </div>

      {/* Logout Button */}
      <div className="mb-4">
        <button
          onClick={handleClick}
          className="flex items-center"
        >
          <ArrowLeftOnRectangleIcon className="h-6 w-6 fill-white hover:fill-red-500 cursor-pointer" />
        
        </button>
      </div>
    </div>
  );
}
