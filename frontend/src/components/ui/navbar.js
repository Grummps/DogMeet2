import React, { useEffect, useState, useRef, useContext } from "react";
import {
  HomeIcon,
  UserIcon,
  MapPinIcon,
  ArrowLeftOnRectangleIcon,
  BellIcon,
  TrashIcon,
  MagnifyingGlassIcon, // Import the search icon
} from "@heroicons/react/24/solid";
import { useNavigate, useLocation, Link } from "react-router-dom";
import apiClient from "../../utilities/apiClient";
import Alert from "./alert"; // Ensure this path is correct
import { UserContext } from "../contexts/userContext";
import socket from "../../utilities/socket"; // Import the socket directly

export default function Navbar() {
  const { user, setUser } = useContext(UserContext);
  const location = useLocation();
  const navigate = useNavigate();

  // State for Notifications
  const [notifications, setNotifications] = useState({});
  const [unreadCount, setUnreadCount] = useState(0);

  // State for Notifications Dropdown
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // State for Feedback Messages
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackType, setFeedbackType] = useState(""); // 'success' or 'error'

  // State for Active Tab in Notifications
  const [activeTab, setActiveTab] = useState("friend_requests");

  // States for Search Functionality
  const [searchInput, setSearchInput] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeout = useRef(null);

  // State to Control Search Bar Visibility
  const [showSearch, setShowSearch] = useState(false);
  const searchRef = useRef(null);
  const searchInputRef = useRef(null);

  // Handle Logout
  const handleLogout = (e) => {
    e.preventDefault();
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setUser(null);
    socket.disconnect(); // Disconnect the socket
    navigate("/login");
  };

  // Fetch Notifications When the Component Mounts
  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        console.warn("User is not authenticated. Skipping fetch.");
        return; // Exit if user is not logged in
      }

      try {
        // Fetch notifications
        const notifResponse = await apiClient.get("/users/notifications");

        const allNotifications = notifResponse.data.notifications || [];

        // Normalize notifications into an object with IDs as keys
        const notificationsById = {};
        allNotifications.forEach((notif) => {
          notificationsById[notif._id] = notif;
        });

        setNotifications(notificationsById);

        // Calculate unread notifications count
        const unread = allNotifications.filter((n) => !n.read).length;
        setUnreadCount(unread);
      } catch (error) {
        console.error("Error fetching notifications:", error);
        if (error.response && error.response.status === 401) {
          handleLogout();
        }
      }
    };

    fetchData();
  }, [user]);

  // Handle Clicks Outside the Dropdown and Search Bar to Close Them
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close Notifications Dropdown
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
      }

      // Close Search Bar Dropdown
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target) &&
        event.target.getAttribute("data-search-icon") !== "true"
      ) {
        setShowSearch(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus the Search Input When the Search Bar is Opened
  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

  // Listen for New Notifications via Socket
  useEffect(() => {
    if (!socket) return; // Wait until the socket is initialized

    const handleNewNotification = (notification) => {
      // Add the new notification to the state while preventing duplicates
      setNotifications((prev) => ({
        ...prev,
        [notification._id]: notification,
      }));
      setUnreadCount((prev) => prev + 1);
    };

    socket.on("newNotification", handleNewNotification);

    // Clean up the event listener when the component unmounts or socket changes
    return () => {
      socket.off("newNotification", handleNewNotification);
    };
  }, []);

  // Handle 'deleteNotification' Events
  useEffect(() => {
    if (!socket) return; // Ensure the socket is initialized

    const handleDeleteNotification = (notificationId) => {
      setNotifications((prev) => {
        const updatedNotifications = { ...prev };
        const notification = updatedNotifications[notificationId];

        if (notification) {
          // If the notification was unread, decrement the unread count
          if (!notification.read) {
            setUnreadCount((prevCount) => Math.max(prevCount - 1, 0));
          }
          // Remove the notification from the state
          delete updatedNotifications[notificationId];
        }

        return updatedNotifications;
      });
    };

    // Listen for the 'deleteNotification' event
    socket.on("deleteNotification", handleDeleteNotification);

    // Cleanup the listener on component unmount or socket change
    return () => {
      socket.off("deleteNotification", handleDeleteNotification);
    };
  }, []);

  // Function to Accept a Friend Request
  const acceptFriendRequest = async (friendId, notificationId) => {
    try {
      await apiClient.post(`/users/${friendId}/accept-friend-request`);

      // Update notifications state
      setNotifications((prev) => {
        const updated = { ...prev };
        delete updated[notificationId];
        return updated;
      });

      setUnreadCount((prev) => Math.max(prev - 1, 0));
      setFeedbackMessage("Friend request accepted.");
      setFeedbackType("success");
    } catch (error) {
      console.error("Error accepting friend request:", error);
      setFeedbackMessage("Failed to accept friend request.");
      setFeedbackType("error");
    }
  };

  // Function to Decline a Friend Request
  const declineFriendRequest = async (friendId, notificationId) => {
    try {
      await apiClient.post(`/users/${friendId}/decline-friend-request`);

      // Update notifications state
      setNotifications((prev) => {
        const updated = { ...prev };
        delete updated[notificationId];
        return updated;
      });

      setUnreadCount((prev) => Math.max(prev - 1, 0));
      setFeedbackMessage("Friend request declined.");
      setFeedbackType("success");
    } catch (error) {
      console.error("Error declining friend request:", error);
      setFeedbackMessage("Failed to decline friend request.");
      setFeedbackType("error");
    }
  };

  // Function to Mark All Notifications as Read
  const markAllAsRead = async () => {
    try {
      const unreadNotifications = Object.values(notifications).filter(
        (n) => !n.read
      );
      await Promise.all(
        unreadNotifications.map((n) =>
          apiClient.post(`/users/notifications/${n._id}/read`)
        )
      );
      // Update state to mark notifications as read
      setNotifications((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((key) => {
          updated[key] = { ...updated[key], read: true };
        });
        return updated;
      });
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking notifications as read:", error);
      setFeedbackMessage("Failed to mark notifications as read.");
      setFeedbackType("error");
    }
  };

  // Function to Mark a Single Notification as Read
  const markNotificationAsRead = async (notificationId) => {
    try {
      await apiClient.post(`/users/notifications/${notificationId}/read`);
      setNotifications((prev) => ({
        ...prev,
        [notificationId]: { ...prev[notificationId], read: true },
      }));
      setUnreadCount((prev) => Math.max(prev - 1, 0));
    } catch (error) {
      console.error("Error marking notification as read:", error);
      setFeedbackMessage("Failed to mark notification as read.");
      setFeedbackType("error");
    }
  };

  // Function to Delete a Notification
  const deleteNotification = async (notificationId) => {
    // Optimistically update the UI
    const originalNotifications = { ...notifications };

    setNotifications((prev) => {
      const updated = { ...prev };
      const notification = updated[notificationId];
      if (notification && !notification.read) {
        setUnreadCount((prevCount) => Math.max(prevCount - 1, 0));
      }
      delete updated[notificationId];
      return updated;
    });

    try {
      await apiClient.delete(`/users/notifications/${notificationId}`);
      setFeedbackMessage("Notification deleted successfully.");
      setFeedbackType("success");
    } catch (error) {
      console.error("Error deleting notification:", error);
      // Revert UI changes
      setNotifications(originalNotifications);
      // Recalculate unread count
      const unread = Object.values(originalNotifications).filter((n) => !n.read).length;
      setUnreadCount(unread);
      setFeedbackMessage("Failed to delete notification.");
      setFeedbackType("error");
    }
  };

  // Function to Search for Users with Debouncing
  const fetchSearchUsers = async () => {
    if (!searchInput.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    try {
      setIsSearching(true);
      const encodedInput = encodeURIComponent(searchInput.trim());
      const response = await apiClient.get(`/users/searchAll/${encodedInput}`);
      const users = response.data;

      // Exclude the current user from the search results
      const filteredUsers = users.filter(
        (u) => u._id !== user._id
      );

      setSearchResults(filteredUsers);
    } catch (error) {
      console.error("Error searching for users:", error);
      setFeedbackMessage("Failed to search users.");
      setFeedbackType("error");
    } finally {
      setIsSearching(false);
    }
  };

  // Handle Search Input Changes with Debouncing
  useEffect(() => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    if (searchInput.trim() === "") {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    searchTimeout.current = setTimeout(() => {
      fetchSearchUsers();
    }, 500); // 500ms debounce delay

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [searchInput]);

  // Don't Show Navbar on Login or Signup Pages
  if (location.pathname === "/login" || location.pathname === "/signup") {
    return null;
  }

  // Prepare Notifications for Rendering
  const notificationList = Object.values(notifications).sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  // Separate Notifications Based on Type for Rendering
  const friendRequestNotifications = notificationList.filter(
    (n) => n.type === "friend_request"
  );
  const eventNotifications = notificationList.filter(
    (n) => n.type === "event_created"
  );

  return (
    <>
      {/* Navbar */}
      <div className="fixed top-0 left-0 h-screen w-36 qhd:w-36 bg-gray-900 flex flex-col justify-between items-center py-4 z-50">
        {/* Icons Container */}
        <div className="flex flex-col mt-24 items-start space-y-6">
          {/* Search Icon */}
          <div className="relative">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="flex items-center no-underline focus:outline-none"
              data-search-icon="true" // To identify clicks on the search icon
              aria-label="Search"
            >
              <MagnifyingGlassIcon className="h-6 w-6 fill-white hover:fill-blue-500 cursor-pointer" />
              <span className="ml-4 text-white text-lg hidden md:inline">
                Search
              </span>
            </button>
          </div>

          {/* Profile Icon */}
          <Link to="/profile" className="flex items-center no-underline">
            <UserIcon className="h-6 w-6 fill-white hover:fill-blue-500 cursor-pointer" />
            <span className="ml-4 text-white text-lg hidden md:inline">
              Profile
            </span>
          </Link>

          {/* Home Icon */}
          <Link to="/nearby" className="flex items-center no-underline">
            <HomeIcon className="h-6 w-6 fill-white hover:fill-blue-500 cursor-pointer" />
            <span className="ml-4 text-white text-lg hidden md:inline">
              Nearby
            </span>
          </Link>

          {/* Parks Icon */}
          <Link to="/parks" className="flex items-center no-underline">
            <MapPinIcon className="h-6 w-6 fill-white hover:fill-blue-500 cursor-pointer" />
            <span className="ml-4 text-white text-lg hidden md:inline">
              Parks
            </span>
          </Link>

          {/* Inbox Icon */}
          <div className="relative w-full" ref={dropdownRef}>
            <button
              onClick={() => {
                setShowDropdown(!showDropdown);
                if (!showDropdown) markAllAsRead();
              }}
              className="flex items-center w-full focus:outline-none"
              aria-label="Inbox"
            >
              <BellIcon className="h-6 w-6 fill-white hover:fill-blue-500 cursor-pointer" />
              <span className="ml-4 text-white text-lg hidden md:inline">
                Inbox
              </span>
              {unreadCount > 0 && (
                <span className="absolute top-0 left-3 bg-red-500 text-white rounded-full h-4 w-4 flex items-center justify-center text-xs">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showDropdown && (
              <div className="absolute top-12 right-auto w-80 bg-white border rounded shadow-lg z-50 max-h-96 overflow-y-auto">
                {/* Feedback Message within Dropdown */}
                {feedbackMessage && (
                  <div className="p-4">
                    <Alert
                      type={feedbackType}
                      message={feedbackMessage}
                      onClose={() => setFeedbackMessage("")}
                    />
                  </div>
                )}

                {/* Tabs */}
                <div className="flex border-b">
                  <button
                    className={`flex-1 py-2 ${activeTab === "friend_requests"
                      ? "border-b-2 border-blue-500 text-blue-500"
                      : "text-gray-500"
                      }`}
                    onClick={() => setActiveTab("friend_requests")}
                  >
                    Friend Requests
                  </button>
                  <button
                    className={`flex-1 py-2 ${activeTab === "event_notifications"
                      ? "border-b-2 border-blue-500 text-blue-500"
                      : "text-gray-500"
                      }`}
                    onClick={() => setActiveTab("event_notifications")}
                  >
                    Events
                  </button>
                </div>

                {/* Tab Content */}
                <div className="p-4">
                  {activeTab === "friend_requests" ? (
                    <div>
                      {friendRequestNotifications.length > 0 ? (
                        <ul>
                          {friendRequestNotifications.map((notification) => (
                            <li
                              key={notification._id}
                              className="px-2 py-1 border-b"
                            >
                              <div className="flex items-center justify-between">
                                <Link
                                  to={`/profile/${notification.sender._id}`}
                                  className="text-blue-600 no-underline"
                                >
                                  {notification.sender.username} sent you a
                                  friend request.
                                </Link>
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() =>
                                      acceptFriendRequest(
                                        notification.sender._id,
                                        notification._id
                                      )
                                    }
                                    className="text-green-500 hover:text-green-700"
                                  >
                                    Accept
                                  </button>
                                  <button
                                    onClick={() =>
                                      declineFriendRequest(
                                        notification.sender._id,
                                        notification._id
                                      )
                                    }
                                    className="text-red-500 hover:text-red-700"
                                  >
                                    Decline
                                  </button>
                                  {/* Delete Button */}
                                  <button
                                    onClick={() =>
                                      deleteNotification(notification._id)
                                    }
                                    className="text-gray-500 hover:text-gray-700"
                                    title="Delete Notification"
                                  >
                                    <TrashIcon className="h-5 w-5" />
                                  </button>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="text-gray-500">
                          No new friend requests.
                        </div>
                      )}
                    </div>
                  ) : activeTab === "event_notifications" ? (
                    <div>
                      {eventNotifications.length > 0 ? (
                        <ul>
                          {eventNotifications.map((notification) => (
                            <li
                              key={notification._id}
                              className="px-2 py-1 border-b"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <Link
                                    to={
                                      notification.event
                                        ? `/profile/${notification.sender._id}`
                                        : "#"
                                    }
                                    className="text-blue-600 no-underline"
                                    onClick={() =>
                                      notification.event &&
                                      markNotificationAsRead(notification._id)
                                    }
                                  >
                                    {notification.sender.username}
                                  </Link>{" "}
                                  created a new event at{" "}
                                  {notification.event ? (
                                    <Link
                                      to={`/parks/${notification.event.parkId._id}`}
                                      className="text-blue-600 no-underline"
                                      onClick={() =>
                                        markNotificationAsRead(notification._id)
                                      }
                                    >
                                      {notification.event.parkId?.parkName ||
                                        "a park"}
                                    </Link>
                                  ) : (
                                    <span className="text-gray-500">
                                      a park
                                    </span>
                                  )}
                                  .
                                </div>
                                {/* Delete Button */}
                                <button
                                  onClick={() =>
                                    deleteNotification(notification._id)
                                  }
                                  className="text-gray-500 hover:text-gray-700"
                                  title="Delete Notification"
                                >
                                  <TrashIcon className="h-5 w-5" />
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="text-gray-500">
                          No new event notifications.
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>

                {/* Optional: Button to Mark All as Read */}
                <div className="px-4 py-2">
                  <button
                    onClick={markAllAsRead}
                    className="text-blue-500 hover:underline"
                  >
                    Mark all as read
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Logout Button Positioned at the Bottom */}
        <div className="mb-4">
          <button
            onClick={handleLogout}
            className="flex items-center no-underline"
            aria-label="Logout"
          >
            <ArrowLeftOnRectangleIcon className="h-6 w-6 fill-white hover:fill-red-500 cursor-pointer" />
            <span className="ml-4 text-white text-lg hidden md:inline">
              Logout
            </span>
          </button>
        </div>
      </div>

      {/* Search Bar Overlay and Blurred Background */}
      {showSearch && (
        <>
          {/* Blurred Background Overlay */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-40"
            onClick={() => setShowSearch(false)}
          ></div>

          {/* Search Bar Overlay */}
          <div
            ref={searchRef}
            className="fixed top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-800 p-6 rounded shadow-lg z-50 w-96"
          >
            <input
              ref={searchInputRef}
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search users..."
              className="w-full px-3 py-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Search users"
            />
            {isSearching && (
              <div className="mt-2 bg-gray-700 rounded p-2 flex items-center">
                {/* Loading Spinner */}
                <svg
                  className="animate-spin h-5 w-5 text-gray-300 mr-2"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  ></path>
                </svg>
                <p className="text-gray-300">Searching...</p>
              </div>
            )}
            {searchResults.length > 0 && (
              <div className="mt-2 bg-gray-700 rounded p-2 max-h-60 overflow-y-auto">
                <ul>
                  {searchResults.map((user) => (
                    <li
                      key={user._id}
                      className="px-4 py-2 hover:bg-gray-600 text-white cursor-pointer"
                      onClick={() => {
                        navigate(`/profile/${user._id}`);
                        setShowSearch(false);
                        setSearchInput("");
                        setSearchResults([]);
                      }}
                    >
                      {user.username}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {searchInput && searchResults.length === 0 && !isSearching && (
              <div className="mt-2 bg-gray-700 rounded p-2">
                <p className="text-gray-300">No users found.</p>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}