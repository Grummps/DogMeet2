import React, { useEffect, useState } from "react";
import { HomeIcon, UserIcon, PlayCircleIcon } from "@heroicons/react/24/solid"; 
import getUserInfo from '../utilities/decodeJwt';

// Navbar with clickable icons and hover tooltips
export default function Navbar() {
  const [user, setUser] = useState({});

  useEffect(() => {
    setUser(getUserInfo());
  }, []);

  return (
    <div className="fixed top-0 left-0 h-screen w-48 bg-gray-900 text-white flex flex-col items-center py-4 z-10 space-y-6">
      
      {/* Icon Button with Hover Tooltip */}
      <a href="/" className="relative group flex items-center justify-center">
        <PlayCircleIcon className="h-12 w-12 text-white hover:text-blue-500 cursor-pointer" />
        <span className="absolute left-16 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          Start
        </span>
      </a>

      <a href="/home" className="relative group flex items-center justify-center">
        <HomeIcon className="h-12 w-12 text-white hover:text-blue-500 cursor-pointer" />
        <span className="absolute left-16 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          Home
        </span>
      </a>

      <a href="/profile" className="relative group flex items-center justify-center">
        <UserIcon className="h-12 w-12 text-white hover:text-blue-500 cursor-pointer" />
        <span className="absolute left-16 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          Profile
        </span>
      </a>
    </div>
  );
}
