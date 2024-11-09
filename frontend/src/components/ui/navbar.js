import React, { useEffect, useState, useRef, useContext } from "react";
import {
  HomeIcon,
  UserIcon,
  PlayCircleIcon,
  MapPinIcon,
  ArrowLeftOnRectangleIcon,
  BellIcon,
  TrashIcon,
} from "@heroicons/react/24/solid";
import { useNavigate, useLocation, Link } from "react-router-dom";
import apiClient from "../../utilities/apiClient";
import Alert from "./alert"; // Ensure this path is correct
import { UserContext } from "../contexts/userContext";
import { SocketContext } from "../contexts/socketContext";

export default function Navbar() {
  const { user, setUser } = useContext(UserContext);
  const socket = useContext(SocketContext);

  const location = useLocation();
  const navigate = useNavigate();

  // Updated State for Notifications
  const [notifications, setNotifications] = useState({});
  const [unreadCount, setUnreadCount] = useState(0);

  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // State for feedback messages
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackType, setFeedbackType] = useState(""); // 'success' or 'error'

  // State for active tab
  const [activeTab, setActiveTab] = useState("friend_requests"); // 'friend_requests', 'event_notifications', 'message_notifications'

  const handleLogout = (e) => {
    e.preventDefault();
    localStorage.removeItem("accessToken");
    setUser(null);
    navigate("/");
  };

  // Fetch notifications when the component mounts
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
        console.error("Error fetching data:", error);
        if (error.response && error.response.status === 401) {
          handleLogout();
        }
      }
    };

    fetchData();
  }, [user]);

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

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Listen for new notifications via socket
  useEffect(() => {
    if (!socket) return; // Wait until the socket is initialized

    socket.on("newNotification", (notification) => {
      // Add the new notification to the state while preventing duplicates
      setNotifications((prev) => ({
        ...prev,
        [notification._id]: notification,
      }));
      setUnreadCount((prev) => prev + 1);
    });

    // Clean up the event listener when the component unmounts or socket changes
    return () => {
      socket.off("newNotification");
    };
  }, [socket]);

  // Handle 'deleteNotification' events
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
  }, [socket]);

  // Function to accept a friend request
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

  // Function to decline a friend request
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

  // Function to mark all notifications as read
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

  // Function to mark a notification as read
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

  // Function to delete a notification
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

  // Don't show Navbar on login or signup pages
  if (location.pathname === "/login" || location.pathname === "/signup") {
    return null;
  }

  // Prepare Notifications for Rendering
  const notificationList = Object.values(notifications).sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  // Separate notifications based on type for rendering
  const friendRequestNotifications = notificationList.filter(
    (n) => n.type === "friend_request"
  );
  const eventNotifications = notificationList.filter(
    (n) => n.type === "event_created"
  );
  const messageNotifications = notificationList.filter(
    (n) => n.type === "message_received"
  );

  return (
    <div className="fixed top-0 left-0 h-screen w-36 qhd:w-36 bg-gray-900 flex flex-col items-center py-4 z-50">
      {/* Icons Container */}
      <div className="flex flex-col mt-24 items-start space-y-6 flex-1">
        {/* Play Icon */}
        <Link to="/" className="flex items-center no-underline">
          <PlayCircleIcon className="h-6 w-6 fill-white hover:fill-blue-500 cursor-pointer" />
          <span className="ml-4 text-white text-lg hidden md:inline">
            Start
          </span>
        </Link>

        {/* Home Icon */}
        <Link to="/home" className="flex items-center no-underline">
          <HomeIcon className="h-6 w-6 fill-white hover:fill-blue-500 cursor-pointer" />
          <span className="ml-4 text-white text-lg hidden md:inline">
            Home
          </span>
        </Link>

        {/* Profile Icon */}
        <Link to="/profile" className="flex items-center no-underline">
          <UserIcon className="h-6 w-6 fill-white hover:fill-blue-500 cursor-pointer" />
          <span className="ml-4 text-white text-lg hidden md:inline">
            Profile
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

          {/* Dropdown Menu */}
          {showDropdown && (
            <div className="absolute top-12 right-auto w-80 bg-white border rounded shadow-lg z-50 max-h-96 overflow-y-auto">
              {/* Feedback Message */}
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
                <button
                  className={`flex-1 py-2 ${activeTab === "message_notifications"
                      ? "border-b-2 border-blue-500 text-blue-500"
                      : "text-gray-500"
                    }`}
                  onClick={() => setActiveTab("message_notifications")}
                >
                  Messages
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
                ) : (
                  // Message Notifications Tab
                  <div>
                    {messageNotifications.length > 0 ? (
                      <ul>
                        {messageNotifications.map((notification) => (
                          <li
                            key={notification._id}
                            className="px-2 py-1 border-b"
                          >
                            <div className="flex items-center justify-between">
                              <Link
                                to={`/profile/${notification.sender._id}`}
                                className="text-blue-600 no-underline"
                                onClick={() =>
                                  markNotificationAsRead(notification._id)
                                }
                              >
                                {notification.sender.username} sent you a
                                message.
                              </Link>
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
                      <div className="text-gray-500">No new messages.</div>
                    )}
                  </div>
                )}
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

      {/* Logout Button */}
      <div className="mb-4">
        <button
          onClick={handleLogout}
          className="flex items-center no-underline"
        >
          <ArrowLeftOnRectangleIcon className="h-6 w-6 fill-white hover:fill-red-500 cursor-pointer" />
          <span className="ml-4 text-white text-lg hidden md:inline">
            Logout
          </span>
        </button>
      </div>
    </div>
  );
}
