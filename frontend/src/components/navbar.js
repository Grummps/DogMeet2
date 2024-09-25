import React, { useEffect, useState } from "react";
import getUserInfo from '../utilities/decodeJwt';

// Here, we display our Tailwind-only Navbar
export default function Navbar() {
  const [user, setUser] = useState({});

  useEffect(() => {
    setUser(getUserInfo());
  }, []);

  return (
    <div className="fixed top-0 left-0 h-screen w-48 bg-gray-900 text-white flex flex-col p-4 z-10">
      {/* Nav links arranged vertically */}
      <a href="/" className="text-white py-2 px-4 hover:bg-gray-700 rounded mb-2">Start</a>
      <a href="/home" className="text-white py-2 px-4 hover:bg-gray-700 rounded mb-2">Home</a>
      <a href="/profile" className="text-white py-2 px-4 hover:bg-gray-700 rounded mb-2">Profile</a>
    </div>
  );
}
