import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../../utilities/apiClient';
import ConfirmationModal from './confirmationModal';
import Alert from './alert';

const FriendsModal = ({ isOpen, onClose }) => {
    const [friends, setFriends] = useState([]);
    const [error, setError] = useState(null);
    const [modalContent, setModalContent] = useState({
        title: '',
        message: '',
        onConfirm: null,
    });
    const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
    const [feedbackMessage, setFeedbackMessage] = useState('');
    const [feedbackType, setFeedbackType] = useState('');
    const navigate = useNavigate(); // Initialize navigate function


    useEffect(() => {
        if (isOpen) {
            fetchFriends();
        }
    }, [isOpen]);

    const fetchFriends = async () => {
        try {
            const response = await apiClient.get('/users/friends');
            setFriends(response.data.friends);
        } catch (error) {
            console.error('Error fetching friends:', error);
            setError('Failed to fetch friends.');
        }
    };

    const openRemoveFriendModal = (friend) => {
        setModalContent({
            title: 'Remove Friend',
            message: `Are you sure you want to remove ${friend.username} from your friends?`,
            onConfirm: () => handleRemoveFriend(friend._id),
        });
        setIsConfirmationModalOpen(true);
    };

    const handleRemoveFriend = async (friendId) => {
        setIsConfirmationModalOpen(false);
        try {
            await apiClient.post(`/users/${friendId}/remove-friend`);
            setFriends(friends.filter((friend) => friend._id !== friendId));
            setFeedbackMessage('Friend removed successfully');
            setFeedbackType('success');
        } catch (error) {
            console.error('Error removing friend:', error);
            setFeedbackMessage('Error removing friend');
            setFeedbackType('error');
        }
    };

    const handleFriendClick = (friendId) => {
        onClose(); // Close the modal
        navigate(`/profile/${friendId}`); // Navigate to friend's profile
    };


    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-lg max-h-screen overflow-y-auto">
                <div className="p-4 border-b flex justify-between items-center">
                    <h2 className="text-lg font-semibold">Your Friends</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">
                        &times;
                    </button>
                </div>
                <div className="p-4">
                    {error && <p className="text-red-500 mb-4">{error}</p>}
                    {feedbackMessage && (
                        <Alert
                            type={feedbackType}
                            message={feedbackMessage}
                            onClose={() => setFeedbackMessage('')}
                        />
                    )}
                    {friends.length > 0 ? (
                        <ul className="space-y-4">
                            {friends.map((friend) => (
                                <li key={friend._id} className="flex justify-between items-center">
                                    {/* Update Link to use handleFriendClick */}
                                    <button
                                        onClick={() => handleFriendClick(friend._id)}
                                        className="text-blue-500 hover:underline"
                                    >
                                        {friend.username}
                                    </button>
                                    <button
                                        onClick={() => openRemoveFriendModal(friend)}
                                        className="bg-red-500 hover:bg-red-600 text-white font-semibold py-1 px-3 rounded"
                                    >
                                        Remove Friend
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-gray-700">You have no friends.</p>
                    )}
                </div>
            </div>

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={isConfirmationModalOpen}
                title={modalContent.title}
                message={modalContent.message}
                onConfirm={modalContent.onConfirm}
                onCancel={() => setIsConfirmationModalOpen(false)}
            />
        </div>
    );
};

export default FriendsModal;
