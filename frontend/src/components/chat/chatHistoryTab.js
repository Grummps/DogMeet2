import { useEffect, useState } from "react";
import axios from "axios";
import chatTimeFormat from "../../utilities/chatTimeFormat";
import apiClient from "../../utilities/apiClient";
import { TrashIcon } from "@heroicons/react/24/solid";

const ChatHistoryTab = ({
    user,
    chatRooms,
    lastMessages,
    unreadMessages,
    defaultProfileImageUrl,
    handleChatRoomClick,
}) => {
    const [chatRoomsWithUserInfo, setChatRoomsWithUserInfo] = useState([]);

    const fetchChatRoomWithUserInfo = async () => {
        try {
            const userIds = [
                ...new Set(
                    chatRooms.flatMap((room) => room.participants.map((p) => p.userId))
                ),
            ];

            if (userIds.length === 0) return;

            const response = await axios.post(
                `${process.env.REACT_APP_BACKEND_URI}/users/getUsersByIds`,
                { userIds }
            );

            const userMap = response.data.reduce((map, user) => {
                map[user._id] = user;
                return map;
            }, {});

            const newRoomsWIthUserInfo = chatRooms.map((room) => {
                const updatedParticipants = room.participants.map((participant) => ({
                    ...participant,
                    user: userMap[participant.userId] || null,
                }));
                return { ...room, participants: updatedParticipants };
            });

            setChatRoomsWithUserInfo(newRoomsWIthUserInfo);
        } catch (error) {
            console.error("Error fetching chat room users:", error);
        }
    };

    const handleHideChat = async (chatRoomId) => {
        try {
            await apiClient.post(`chatRooms/hide/${chatRoomId}`);
            // Update the state to remove the hidden chat room
            setChatRoomsWithUserInfo(prevChatRooms =>
                prevChatRooms.filter(room => room._id !== chatRoomId)
            );
        } catch (error) {
            console.error("Error hiding chat room:", error);
        }
    };

    useEffect(() => {
        fetchChatRoomWithUserInfo();
    }, [chatRooms]);

    const getLastMessage = (chatRoomId) => {
        const message = lastMessages.find(
            (message) => message.chatRoomId === chatRoomId
        );
        return message || { chatRoomId, content: null, timestamp: null };
    };

    const getUnreadMessageCount = (chatRoomId) => {
        return unreadMessages.filter((m) => m.chatRoomId === chatRoomId).length;
    };

    const getChatUser = (chatRoom) => {
        return chatRoom.participants.filter((p) => p.userId !== user._id)[0].user;
    };

    return (
        <div className="h-full">
            {chatRoomsWithUserInfo.length === 0 ? (
                <p className="text-center font-display mt-4 text-white">
                    No messages yet
                </p>
            ) : (
                <div className="w-full h-full overflow-y-auto overflow-x-hidden">
                    {chatRoomsWithUserInfo.map((chatRoom) => (
                        <div
                            key={chatRoom._id}
                            className="flex items-center p-2 mt-1 font-title group hover:bg-blue-600 bg-opacity-20 cursor-pointer hover:text-white"
                            onClick={() => handleChatRoomClick(chatRoom)}
                        >
                            {/* Profile Image */}
                            <div className="flex-shrink-0 flex items-center ml-2">
                                <img
                                    src={
                                        getChatUser(chatRoom).image || defaultProfileImageUrl
                                    }
                                    alt="Profile"
                                    className="h-9 w-9 rounded-full bg-white cursor-pointer"
                                />
                            </div>

                            {/* Middle Content */}
                            <div className="flex flex-col flex-grow mx-2 min-w-0">
                                {/* Username */}
                                <div className="font-title text-white font-bold mb-1 truncate">
                                    @{getChatUser(chatRoom).username}
                                </div>
                                {/* Last Message */}
                                <div className="flex items-center font-display text-xs text-gray-300 group-hover:text-white">
                                    <div className="truncate">
                                        {getLastMessage(chatRoom._id).content || ''}
                                    </div>
                                    {getLastMessage(chatRoom._id) &&
                                        getLastMessage(chatRoom._id).isRead && (
                                            <div className="ml-2 flex-shrink-0">✔</div>
                                        )}
                                </div>
                            </div>

                            {/* Right Side Content */}
                            <div className="flex flex-col items-end flex-shrink-0 ml-2" style={{ width: '60px' }}>
                                {/* Timestamp */}
                                <div
                                    className={`font-title text-xs truncate text-white ${getUnreadMessageCount(chatRoom._id) > 0
                                            ? 'font-bold text-orange-500 group-hover:text-white'
                                            : ''
                                        }`}
                                >
                                    {getLastMessage(chatRoom._id).timestamp
                                        ? chatTimeFormat(getLastMessage(chatRoom._id).timestamp)
                                        : ''}
                                </div>
                                {/* Unread Count and Delete Button */}
                                <div className="flex items-center font-display text-xs text-gray-300 group-hover:text-white">
                                    {getUnreadMessageCount(chatRoom._id) > 0 && (
                                        <span className="font-bold text-green-500 mr-2">
                                            {getUnreadMessageCount(chatRoom._id)}
                                        </span>
                                    )}
                                    {/* Delete Button */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation(); // Prevent triggering handleChatRoomClick
                                            handleHideChat(chatRoom._id);
                                        }}
                                        className="scale-0 group-hover:scale-100 transition-transform duration-200 text-gray-950 hover:text-red-700"
                                        title="Delete Chat Room"
                                    >
                                        <TrashIcon className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ChatHistoryTab;
