import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import getUserInfo from '../../utilities/decodeJwt';
import DogForm from '../ui/dogForm';
import apiClient from '../../utilities/apiClient';
import DogList from '../ui/dogList';
import ConfirmationModal from '../ui/confirmationModal';
import Alert from '../ui/alert';
import FriendsModal from '../ui/friendList';
import EventsModal from '../ui/eventList';
import { motion, AnimatePresence } from 'framer-motion';
import Spinner from '../ui/spinner';
import { ClipLoader } from 'react-spinners';
import { io } from 'socket.io-client';
import Chat from '../chat/chat';


const Profile = () => {
    const navigate = useNavigate();
    const { _id } = useParams(); // Get user _id from URL params
    const [user, setUser] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [isCurrentUser, setIsCurrentUser] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // State variables for profile picture upload
    const [selectedImage, setSelectedImage] = useState(null);
    const [uploading, setUploading] = useState(false);

    // Existing state variables
    const [isFriend, setIsFriend] = useState(false);
    const [isFriendRequestPending, setIsFriendRequestPending] = useState(false);
    const [hasReceivedFriendRequest, setHasReceivedFriendRequest] = useState(false);
    const [feedbackMessage, setFeedbackMessage] = useState('');
    const [feedbackType, setFeedbackType] = useState(''); // 'success' or 'error'
    const [isHovering, setIsHovering] = useState(false);
    const [isNewImageLoaded, setIsNewImageLoaded] = useState(false);

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState({
        title: '',
        message: '',
        onConfirm: null,
    });
    const [isFriendsModalOpen, setIsFriendsModalOpen] = useState(false);
    const [isEventsModalOpen, setIsEventsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    // State variables for messaging
    const [targetChatUser, setTargetChatUser] = useState(null);


    const fetchUserData = async () => {
        setLoading(true);

        const userInfo = getUserInfo();

        if (!userInfo) {
            console.error('No access token found, redirecting to login.');
            navigate('/login');
            return;
        }

        const currentUserId = userInfo._id;
        const userId = _id || currentUserId;

        try {
            const [userResponse, currentUserResponse] = await Promise.all([
                apiClient.get(`/users/${userId}`),
                apiClient.get(`/users/${currentUserId}`),
            ]);

            setUser(userResponse.data);
            setCurrentUser(currentUserResponse.data);
            setIsCurrentUser(userId === currentUserId);

            // Determine friendship and request statuses
            const friendRequestPending = userResponse.data.friendRequests?.some(
                (request) => request._id === currentUserId
            );

            const receivedFriendRequest = currentUserResponse.data.friendRequests?.some(
                (request) => request._id === userId
            );

            setIsFriend(
                userResponse.data.friends?.some((friend) => friend._id === currentUserId)
            );

            setIsFriendRequestPending(friendRequestPending);
            setHasReceivedFriendRequest(receivedFriendRequest);

            setError(null);
        } catch (error) {
            console.error('Error fetching user data:', error);
            setError('Failed to load user data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUserData();
    }, [_id, navigate]);

    const updateUser = (updatedData) => {
        setUser({ ...user, ...updatedData });
    };


    const sendFriendRequest = async () => {
        try {
            await apiClient.post(`/users/${user._id}/send-friend-request`);
            setIsFriendRequestPending(true);
            setFeedbackMessage('Friend request sent');
            setFeedbackType('success');
        } catch (error) {
            console.error('Error sending friend request:', error);

            // Handle specific error messages
            if (error.response && error.response.data && error.response.data.error) {
                const errorMessage = error.response.data.error;
                setFeedbackMessage(errorMessage);
                setFeedbackType('error');
            } else {
                setFeedbackMessage('Error sending friend request');
                setFeedbackType('error');
            }
        }
    };

    const acceptFriendRequest = async () => {
        try {
            await apiClient.post(`/users/${user._id}/accept-friend-request`);
            setIsFriend(true);
            setHasReceivedFriendRequest(false);
            setIsFriendRequestPending(false);
            setFeedbackMessage('Friend request accepted');
            setFeedbackType('success');
        } catch (error) {
            console.error('Error accepting friend request:', error);
            setFeedbackMessage('Error accepting friend request');
            setFeedbackType('error');
        }
    };

    const removeFriend = () => {
        setModalContent({
            title: 'Remove Friend',
            message: `Are you sure you want to remove ${user.username} from your friends?`,
            onConfirm: handleConfirmRemoveFriend,
        });
        setIsModalOpen(true);
    };

    const handleConfirmRemoveFriend = async () => {
        setIsModalOpen(false);

        try {
            await apiClient.post(`/users/${user._id}/remove-friend`);
            setIsFriend(false);
            setFeedbackMessage('Friend removed successfully');
            setFeedbackType('success');
        } catch (error) {
            console.error('Error removing friend:', error);
            setFeedbackMessage('Error removing friend');
            setFeedbackType('error');
        }
    };

    const openCancelFriendRequestModal = () => {
        setModalContent({
            title: 'Cancel Friend Request',
            message: `Are you sure you want to cancel the friend request to ${user.username}?`,
            onConfirm: handleConfirmCancelFriendRequest,
        });
        setIsModalOpen(true);
    };

    const handleConfirmCancelFriendRequest = async () => {
        setIsModalOpen(false);

        try {
            await apiClient.post(`/users/${user._id}/cancel-friend-request`);
            setIsFriendRequestPending(false);
            setFeedbackMessage('Friend request cancelled');
            setFeedbackType('success');
        } catch (error) {
            console.error('Error cancelling friend request:', error);
            setFeedbackMessage('Error cancelling friend request');
            setFeedbackType('error');
        }
    };

    const handleImageChange = (event) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            setSelectedImage(file);
            handleImageUpload(file);
        }
    };

    const handleImageUpload = async (file) => {
        if (!file) {
            return;
        }
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('image', file);

            // Upload the image to the server
            const response = await apiClient.post('/users/uploadProfilePicture', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            // Get the new image URL from the response
            const newImageUrl = response.data.imageUrl;

            // Preload the new image
            const img = new Image();
            img.src = newImageUrl;

            img.onload = () => {
                // Update the user state with the new image after it has fully loaded
                setUser((prevUser) => ({
                    ...prevUser,
                    image: newImageUrl,
                }));

                setSelectedImage(null);
                setFeedbackMessage('Profile picture updated successfully');
                setFeedbackType('success');
                setUploading(false);
                // Set flag to trigger fade-in effect
                setIsNewImageLoaded(true);

                // Reset the flag after the fade-in effect completes
                setTimeout(() => setIsNewImageLoaded(false), 500); // 500ms matches the transition duration
            };

            img.onerror = () => {
                // Handle image loading error
                console.error('Error loading the new profile picture.');
                setFeedbackMessage('Error loading the new profile picture');
                setFeedbackType('error');
                setUploading(false);
            };
        } catch (error) {
            console.error('Error uploading profile picture:', error);
            setFeedbackMessage('Error uploading profile picture');
            setFeedbackType('error');
            setUploading(false);
        }
    };


    // Function to handle the deletion of the profile picture
    const handleDeleteProfilePicture = async () => {
        setIsDeleteModalOpen(false);
        try {
            await apiClient.delete('/users/deleteProfilePicture');
            // Update the user's profile image in the state
            setUser((prevUser) => ({
                ...prevUser,
                image: undefined,
                imageKey: undefined,
            }));
            setFeedbackMessage('Profile picture deleted successfully');
            setFeedbackType('success');
        } catch (error) {
            console.error('Error deleting profile picture:', error);
            setFeedbackMessage('Error deleting profile picture');
            setFeedbackType('error');
        }
    };


    // Function to open the delete confirmation modal
    const openDeleteModal = () => {
        setIsDeleteModalOpen(true);
    };

    // Function to open the Friends modal
    const openFriendsModal = () => {
        setIsFriendsModalOpen(true);
    };

    // Function to open the Events modal
    const openEventsModal = () => {
        setIsEventsModalOpen(true);
    };

    // Function to close modals
    const closeFriendsModal = () => {
        setIsFriendsModalOpen(false);
    };

    const closeEventsModal = () => {
        setIsEventsModalOpen(false);
    };

    const handleMouseEnter = () => {
        setIsHovering(true);
    };

    const handleMouseLeave = () => {
        setIsHovering(false);
    };

    const handleMessageBtnClick = () => {
        setTargetChatUser(user);
    };


    if (loading || !user || !currentUser) {
        return <div className="text-center text-lg text-gray-600">Loading...</div>;
    }

    if (error) {
        return <div className="text-center text-lg text-red-500">{error}</div>;
    }

    return (
        <div className="flex flex-col items-start justify-start relative overflow-visible pt-0">
            {/* Background */}
            <div className="w-full from-gray-200 via-gray-300 to-gray-200 -mb-32 h-72 bg-right bg-profile-bg">
                <div className="text-center py-10"></div>
            </div>

            {/* Profile content */}
            <div className="">
                {/* Profile image and username in a row */}
                <div className="flex items-center relative -mb-20 ml-56 ">
                    {/* Profile Image */}
                    <div
                        className="flex-shrink-0 relative mt-4 -mb-4 qhd:mt-4 z-10 rounded-full bg-gray-300 shadow-lg"
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                    >
                        <div className="relative rounded-full">
                            {user.image ? (
                                <motion.img
                                    src={user.image}
                                    alt={`${user.username}'s profile`}
                                    className="w-48 h-48 qhd:w-52 qhd:h-52 rounded-full object-cover"
                                    animate={{
                                        filter: isHovering && isCurrentUser ? 'blur(4px)' : 'blur(0px)',
                                        opacity: isNewImageLoaded ? [0, 1] : 1,
                                    }}
                                    transition={{ duration: isNewImageLoaded ? 0.5 : 0.3 }}
                                />
                            ) : (
                                <motion.div
                                    className="w-48 h-48 qhd:w-52 qhd:h-52 rounded-full flex items-center justify-center"
                                    animate={
                                        isHovering && isCurrentUser
                                            ? { filter: 'blur(4px)', opacity: 1 }
                                            : { filter: 'blur(0px)', opacity: 1 }
                                    }
                                    transition={{ duration: 0.3 }}
                                >
                                    <span className="text-gray-500 text-xl">No Image</span>
                                </motion.div>
                            )}

                            {/* Loading Spinner */}
                            {uploading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-full">
                                    {/* Use Spinner component or ClipLoader */}
                                    {/* If using custom Spinner */}
                                    {/* <Spinner /> */}

                                    {/* If using react-spinners ClipLoader */}
                                    <ClipLoader color="#000" size={40} />
                                </div>
                            )}

                            {/* Overlay Options */}
                            <AnimatePresence>
                                {isCurrentUser && isHovering && (
                                    <motion.div
                                        className="absolute inset-0 flex flex-col items-center justify-center bg-white rounded-full bg-opacity-80"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: .5 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <motion.button
                                            className="bg-opacity-20 hover:bg-opacity-100 text-gray-800 font-semibold py-2 px-4 rounded mb-2"
                                            whileHover={{ scale: 1.05 }}
                                            onClick={() =>
                                                document.getElementById('profileImageInput').click()
                                            }
                                        >
                                            Replace Image
                                        </motion.button>
                                        {user.image && (
                                            <motion.button
                                                className="bg-opacity-80 hover:bg-opacity-100 text-gray-800 font-semibold py-2 px-4 rounded"
                                                whileHover={{ scale: 1.05 }}
                                                onClick={openDeleteModal}
                                            >
                                                Delete Image
                                            </motion.button>
                                        )}
                                        <input
                                            type="file"
                                            id="profileImageInput"
                                            accept="image/*"
                                            style={{ display: 'none' }}
                                            onChange={handleImageChange}
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* User's name */}
                    <div>
                        <h1 className="pl-16 mt-36 -ml-12 text-2xl qhd:text-4xl font-bold text-gray-800">
                            {user.username}
                        </h1>
                        <p className="pl-16 -ml-12 text-gray-600 mt-2 text-sm">
                            Member since: {new Date(user.createdAt).toLocaleDateString()}
                        </p>
                    </div>

                    {/* Friend Actions */}
                    {!isCurrentUser && (
                        <div className="ml-auto mt-20">
                            {isFriend ? (
                                <>
                                    <button
                                        onClick={removeFriend}
                                        className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 mt-14 ml-10 px-4 rounded"
                                    >
                                        Remove Friend
                                    </button>
                                    <button
                                        onClick={handleMessageBtnClick}
                                        className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 ml-4 mt-14 px-4 rounded"
                                    >
                                        Message
                                    </button>
                                </>
                            ) : isFriendRequestPending ? (
                                <button
                                    onClick={openCancelFriendRequestModal}
                                    className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 mt-14 ml-10 px-4 rounded"
                                >
                                    Cancel Friend Request
                                </button>
                            ) : hasReceivedFriendRequest ? (
                                <button
                                    onClick={acceptFriendRequest}
                                    className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 mt-14 ml-10 px-4 rounded"
                                >
                                    Accept Friend Request
                                </button>
                            ) : (
                                <button
                                    onClick={sendFriendRequest}
                                    className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 mt-14 ml-10 px-4 rounded"
                                >
                                    Add Friend
                                </button>
                            )}
                        </div>
                    )}

                    {/* Buttons for current user's profile */}
                    {isCurrentUser && (
                        <div className="flex space-x-4 ml-auto mt-20">
                            <button
                                onClick={openFriendsModal}
                                className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 mt-14 ml-10 rounded"
                            >
                                Friends
                            </button>
                            <button
                                onClick={openEventsModal}
                                className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 mt-14 ml-10 rounded"
                            >
                                Your Events
                            </button>
                        </div>
                    )}
                </div>

                {/* Dog Form or User's Dogs */}
                <div className="mt-14 px-4 ml-56">
                    {isCurrentUser ? (
                        <DogForm updateUser={updateUser} />
                    ) : (
                        <DogList user={user} />
                    )}
                </div>
            </div>

            {/* Modals */}
            <FriendsModal isOpen={isFriendsModalOpen} onClose={closeFriendsModal} />
            <EventsModal isOpen={isEventsModalOpen} onClose={closeEventsModal} />

            {/* Confirmation Modals */}
            <ConfirmationModal
                isOpen={isModalOpen}
                title={modalContent.title}
                message={modalContent.message}
                onConfirm={modalContent.onConfirm}
                onCancel={() => setIsModalOpen(false)}
            />

            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                title="Delete Profile Picture"
                message="Are you sure you want to delete your profile picture?"
                onConfirm={handleDeleteProfilePicture}
                onCancel={() => setIsDeleteModalOpen(false)}
            />

            <Chat
                targetChatUser={targetChatUser}
                setTargetChatUser={setTargetChatUser}
            />
        </div>
    );
};

export default Profile;