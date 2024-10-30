import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import getUserInfo from '../../utilities/decodeJwt';
import DogForm from './dogForm';
import apiClient from '../../utilities/apiClient';
import EventList from '../eventProfile';
import UserDogs from '../userDogs';

const Profile = () => {
    const navigate = useNavigate();
    const { id } = useParams(); // Get user ID from URL params
    const [user, setUser] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [isCurrentUser, setIsCurrentUser] = useState(false);
    const [friendRequestSent, setFriendRequestSent] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
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
                setError(null);
            } catch (error) {
                console.error('Error fetching user data:', error);
                setError('Failed to load user data');
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [id, navigate]);

    const updateUser = (updatedData) => {
        setUser({ ...user, ...updatedData });
    };

    const sendFriendRequest = async () => {
        try {
            await apiClient.post(`/users/${user._id}/send-friend-request`);
            setFriendRequestSent(true);
            alert('Friend request sent');
        } catch (error) {
            console.error('Error sending friend request:', error);
            alert('Error sending friend request');
        }
    };

    // Add null checks and ensure IDs are strings
    const isFriend =
        currentUser &&
        Array.isArray(currentUser.friends) &&
        currentUser.friends.some(
            (friend) =>
                friend &&
                friend._id &&
                user &&
                user._id &&
                friend._id.toString() === user._id.toString()
        );

    const friendRequestPending =
        user &&
        Array.isArray(user.friendRequests) &&
        user.friendRequests.some(
            (request) =>
                request &&
                request._id &&
                currentUser &&
                currentUser._id &&
                request._id.toString() === currentUser._id.toString()
        );


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

                    {/* Friend Request Button */}
                    {!isCurrentUser && (
                        <div className="ml-auto mt-20">
                            {isFriend ? (
                                <button disabled className="btn btn-disabled">Friends</button>
                            ) : friendRequestPending ? (
                                <button disabled className="btn btn-disabled">Friend Request Pending</button>
                            ) : (
                                <button onClick={sendFriendRequest} className="btn btn-primary">
                                    {friendRequestSent ? 'Friend Request Sent' : 'Add Friend'}
                                </button>
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
        </div>
    );
};

export default Profile;
