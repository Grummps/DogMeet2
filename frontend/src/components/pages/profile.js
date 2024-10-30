import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import getUserInfo from '../../utilities/decodeJwt';
import DogForm from '../ui/dogForm';
import apiClient from '../../utilities/apiClient';
import EventList from '../ui/userEvents';
import UserDogs from '../ui/userDogs';
import ConfirmationModal from '../ui/confirmationModal';
import Alert from '../ui/alert';

const Profile = () => {
    const navigate = useNavigate();
    const { id } = useParams(); // Get user ID from URL params
    const [user, setUser] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [isCurrentUser, setIsCurrentUser] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // New state variables
    const [isFriend, setIsFriend] = useState(false);
    const [isFriendRequestPending, setIsFriendRequestPending] = useState(false);
    const [hasReceivedFriendRequest, setHasReceivedFriendRequest] = useState(false);
    const [feedbackMessage, setFeedbackMessage] = useState('');
    const [feedbackType, setFeedbackType] = useState(''); // 'success' or 'error'

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState({
        title: '',
        message: '',
        onConfirm: null,
    });

    const fetchUserData = async () => {
        setLoading(true);

        const userInfo = getUserInfo();

        if (!userInfo) {
            console.error("No access token found, redirecting to login.");
            navigate('/login');
            return;
        }

        const currentUserId = userInfo.id || userInfo.sub;
        const userId = id || currentUserId;

        try {
            const [userResponse, currentUserResponse] = await Promise.all([
                apiClient.get(`/users/${userId}`),
                apiClient.get(`/users/${currentUserId}`)
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

            setIsFriend(userResponse.data.friends?.some(
                (friend) => friend._id === currentUserId
            ));

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
    }, [id, navigate]);

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
                <div className="flex items-center relative -mb-20 ml-56">
                    {/* Profile Image */}
                    <div className="flex-shrink-0 relative mt-4 z-10">
                        {user.profileImage ? (
                            <img
                                src={user.profileImage}
                                alt={`${user.username}'s profile`}
                                className="w-48 h-48 qhd:w-52 qhd:h-52 rounded-full object-cover border-4 border-white shadow-lg"
                            />
                        ) : (
                            <div className="w-48 h-48 qhd:w-52 qhd:h-52 bg-gray-300 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                                <span className="text-gray-500 text-xl">No Image</span>
                            </div>
                        )}
                    </div>

                    {/* User's name */}
                    <div>
                        <h1 className="pl-16 mt-36 -ml-12 text-2xl qhd:text-4xl font-bold text-gray-800 border-l-emerald-100">
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
                                <button onClick={removeFriend} className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded">
                                    Remove Friend
                                </button>
                            ) : isFriendRequestPending ? (
                                <button onClick={openCancelFriendRequestModal} className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 px-4 rounded">
                                    Cancel Friend Request
                                </button>
                            ) : hasReceivedFriendRequest ? (
                                <button onClick={acceptFriendRequest} className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded">
                                    Accept Friend Request
                                </button>
                            ) : (
                                <button onClick={sendFriendRequest} className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded">
                                    Add Friend
                                </button>
                            )}

                            {/* Feedback Message */}
                            {feedbackMessage && (
                                <div className="mt-4">
                                    <Alert
                                        type={feedbackType}
                                        message={feedbackMessage}
                                        onClose={() => setFeedbackMessage('')}
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {/* EventList for Current User */}
                    {isCurrentUser && (
                        <div className="ml-auto mt-20">
                            <EventList updateUser={updateUser} />
                        </div>
                    )}
                </div>

                {/* Dog Form or User's Dogs */}
                <div className="mt-10 px-4 ml-56">
                    {isCurrentUser ? (
                        <DogForm updateUser={updateUser} />
                    ) : (
                        <UserDogs user={user} />
                    )}
                </div>
            </div>

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={isModalOpen}
                title={modalContent.title}
                message={modalContent.message}
                onConfirm={modalContent.onConfirm}
                onCancel={() => setIsModalOpen(false)}
            />
        </div>
    );
};

export default Profile;
