import React, { useEffect, useState, useRef } from "react";
import {
  HomeIcon,
  UserIcon,
  PlayCircleIcon,
  MapPinIcon,
  ArrowLeftOnRectangleIcon,
  BellIcon, // Import BellIcon for notifications
} from "@heroicons/react/24/solid";
import getUserInfo from "../utilities/decodeJwt";
import { useNavigate, useLocation, Link } from "react-router-dom";
import apiClient from "../utilities/apiClient";

// Navbar with clickable icons and hover tooltips
export default function Navbar() {
  const [user, setUser] = useState({});
  const location = useLocation();
  const navigate = useNavigate();

  // State for friend requests
  const [friendRequests, setFriendRequests] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const handleClick = (e) => {
    e.preventDefault();
    localStorage.removeItem("accessToken");
    navigate("/");
  };

  useEffect(() => {
    setUser(getUserInfo());
  }, []);

  // Fetch friend requests when the component mounts
  useEffect(() => {
    const fetchFriendRequests = async () => {
      try {
        const response = await apiClient.get('/users/friend-requests');
        setFriendRequests(response.data.friendRequests);
      } catch (error) {
        console.error('Error fetching friend requests:', error);
      }
    };

    fetchFriendRequests();

    // Optional: Refresh friend requests periodically
    const intervalId = setInterval(fetchFriendRequests, 30000); // Refresh every 30 seconds

    return () => clearInterval(intervalId);
  }, []);

  // Handle clicks outside the dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Function to accept a friend request
  const acceptFriendRequest = async (friendId) => {
    try {
      await apiClient.post(`/users/${friendId}/accept-friend-request`);
      setFriendRequests(friendRequests.filter(req => req._id !== friendId));
      // Optionally, show a success message or notification
    } catch (error) {
      console.error('Error accepting friend request:', error);
      // Optionally, show an error message
    }
  };

  // Function to decline a friend request
  const declineFriendRequest = async (friendId) => {
    try {
      await apiClient.post(`/users/${friendId}/decline-friend-request`);
      setFriendRequests(friendRequests.filter(req => req._id !== friendId));
      // Optionally, show a success message or notification
    } catch (error) {
      console.error('Error declining friend request:', error);
      // Optionally, show an error message
    }
  };

  // Don't show Navbar on login or signup pages
  if (location.pathname === "/login" || location.pathname === "/signup") {
    return null;
  }

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

        {/* Notification Bell - Placed under Parks */}
        <div className="relative w-full" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center w-full focus:outline-none mt-6"
          >
            <BellIcon className="h-6 w-6 fill-white hover:fill-blue-500 cursor-pointer" />
            <span className="ml-4 text-white text-lg hover:fill-blue-500 cursor-pointer hidden md:inline">Inbox</span>
            {friendRequests.length > 0 && (
              <span className="absolute top-0 right-0 bg-red-500 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs">
                {friendRequests.length}
              </span>
            )}
          </button>

          {/* Dropdown Menu - Positioned on the right */}
          {showDropdown && (
            <div className="fixed mt-2 w-64 bg-white border rounded shadow-lg z-50">
              {friendRequests.length > 0 ? (
                <ul>
                  {friendRequests.map((request) => (
                    <li key={request._id} className="px-4 py-2 border-b">
                      <div className="flex items-center justify-between">
                        <Link to={`/profile/${request._id}`} className="text-blue-600">
                          {request.username}
                        </Link>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => acceptFriendRequest(request._id)}
                            className="text-green-500 hover:text-green-700"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => declineFriendRequest(request._id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="px-4 py-2">
                  No new friend requests.
                </div>
              )}
            </div>
          )}
        </div>
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
