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
    <div className="fixed top-0 left-0 h-screen w-28 qhd:w-36 bg-gray-900 text-white flex flex-col items-center py-4 z-10">

  {/* Icons Container with Adjusted Margin */}
  <div className="mt-6 flex flex-col items-center space-y-6">

    {/* Start Icon */}
    <a href="/" className="relative group flex items-center justify-center">
      <div className="flex items-center justify-center">
        <PlayCircleIcon className="h-12 w-12 text-white hover:text-blue-500 cursor-pointer" />
      </div>
      <span className="absolute left-16 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
        Start
      </span>
    </a>

    {/* Home Icon */}
    <a href="/home" className="relative group flex items-center justify-center">
      <div className="flex items-center justify-center">
        <HomeIcon className="h-12 w-12 text-white hover:text-blue-500 cursor-pointer" />
      </div>
      <span className="absolute left-16 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
        Home
      </span>
    </a>

    {/* Profile Icon */}
    <a href="/profile" className="relative group flex items-center justify-center">
      <div className="flex items-center justify-center">
        <UserIcon className="h-12 w-12 text-white hover:text-blue-500 cursor-pointer" />
      </div>
      <span className="absolute left-16 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
        Profile
      </span>
    </a>

  </div>
</div>

  );
}
