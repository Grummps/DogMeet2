import React, { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMessage as chatIcon } from "@fortawesome/free-regular-svg-icons";
import getUserInfo from "../../utilities/decodeJwt";
import ChatSearchTab from "./chatSearchTab";
import ChatHistoryTab from "./chatHistoryTab";
import ChatTitleBar from "./chatTitleBar";
import ChatTab from "./chatTab";
import axios from "axios";
import apiClient from "../../utilities/apiClient";
import socket from "../../utilities/socket";
import { connectSocket } from "../../utilities/socket";
const ChatNotificationSound = "/ChatNotificationSound.mp3";


const Chat = ({ targetChatUser, setTargetChatUser }) => {
    const defaultProfileImageUrl =
        "https://ssusocial.s3.amazonaws.com/profilepictures/ProfileIcon.png";
    const chatNotificationAudioRef = useRef(null);

    const TABS = { history: "history", search: "search", chat: "chat" };
    const [currentTab, setCurrentTab] = useState(TABS.history);
    const [chatOpen, setChatOpen] = useState(false);
    const [searchInput, setSearchInput] = useState("");
    const chatOpenRef = useRef(chatOpen);
    const currentTabRef = useRef(currentTab);

    useEffect(() => {
        chatOpenRef.current = chatOpen;
    }, [chatOpen]);

    useEffect(() => {
        currentTabRef.current = currentTab;
    }, [currentTab]);

    useEffect(() => {
        if (targetChatUser) {
            handleSearchChatUserClick(targetChatUser);
            setChatOpen(true);
        }
    }, [targetChatUser]);

    const [user, setUser] = useState(getUserInfo());
    const [chatUser, setChatUser] = useState({});
    const [chatRooms, setChatRooms] = useState([]);
    const [currentChatRoom, setCurrentChatRoom] = useState({});
    const currentChatRoomRef = useRef(currentChatRoom);
    const [messages, setMessages] = useState([]);

    useEffect(() => {
        currentChatRoomRef.current = currentChatRoom;
    }, [currentChatRoom]);

    const fetchUser = async () => {
        const tokenUser = getUserInfo();
        const username = tokenUser.username;

        try {
            const response = await axios.get(
                `${process.env.REACT_APP_BACKEND_URI}/users/getUserByUsername/${username}`
            );

            if (response.data) {
                setUser(response.data);
            } else {
                setUser(tokenUser);
            }
        } catch (error) {
            console.error("Error fetching User:", error);
            setUser(tokenUser);
        }
    };

    const fetchChatRooms = async () => {
        if (!user._id) {
            return;
        }

        try {
            const response = await apiClient.get(`/chatRooms/getByUserId/${user._id}`);
            const chatRooms = response.data.chatRooms;

            if (chatRooms) {
                setChatRooms(chatRooms);
            }
        } catch (error) {
            console.error("Error fetching chat rooms:", error);
        }
    };

    const fetchMessages = async () => {
        if (!user._id) {
            return;
        }

        try {
            const response = await apiClient.get(`/messages/getByUserId/${user._id}`);
            const messages = response.data.data;

            if (messages) {
                setMessages(messages);
            }
        } catch (error) {
            console.error("Error fetching unread message count:", error);
        }
    };

    const playChatNotificationSound = () => {
        if (chatNotificationAudioRef.current) {
            chatNotificationAudioRef.current.currentTime = 0;
            chatNotificationAudioRef.current
                .play()
                .catch((error) =>
                    console.error("Error playing notification sound:", error)
                );
        }
    };

    const chatRoomsRef = useRef(chatRooms);

    useEffect(() => {
        chatRoomsRef.current = chatRooms;
    }, [chatRooms]);

    useEffect(() => {
        const initializeChat = async () => {
            await fetchUser();
            await fetchChatRooms();
            await fetchMessages();

            const user = getUserInfo();
            connectSocket(user._id); // Connect socket after fetching user

            chatNotificationAudioRef.current = new Audio(ChatNotificationSound);
            chatNotificationAudioRef.current.preload = "auto";

            // Listen for new messages
            socket.on("newMessage", (data) => {
                console.log("Received newMessage:", data);
                const isUserReceivedMessage = data.receiverId === user._id;
                if (isUserReceivedMessage) {
                    const chatRoomExists = chatRooms.some(
                        (chatRoom) => chatRoom._id === data.chatRoomId
                    );

                    if (!chatRoomExists) {
                        fetchChatRooms();
                    }
                }

                const isUserSendOrReceivedMessage =
                    data.receiverId === user._id || data.senderId === user._id;
                if (isUserSendOrReceivedMessage) {
                    const newMessage = data;

                    const isUserReceivedMessageAndChatWindowOpenInChatTabWithSameChatRoomId =
                        data.receiverId === user._id &&
                        data.chatRoomId === currentChatRoomRef.current._id &&
                        chatOpenRef.current &&
                        currentTabRef.current === TABS.chat;

                    if (
                        isUserReceivedMessageAndChatWindowOpenInChatTabWithSameChatRoomId
                    ) {
                        newMessage.isRead = true;
                        markMessagesAsReadInDb([newMessage._id]);
                    }

                    const isUserReceivedMessage = data.receiverId === user._id;
                    if (isUserReceivedMessage) {
                        playChatNotificationSound();
                    }

                    setMessages((prevMessages) => [...prevMessages, newMessage]);
                }
            });

            // Listen for message read events
            socket.on("messageRead", (readMessageIds) => {
                console.log("Received messageRead:", readMessageIds);
                setMessages((prevMessages) =>
                    prevMessages.map((m) =>
                        readMessageIds.includes(m._id) ? { ...m, isRead: true } : m
                    )
                );
            });
        };

        initializeChat();

        return () => {
            socket.off("newMessage");
            socket.off("messageRead");
        };
    }, []);


    const toggleChat = () => {
        if (setTargetChatUser) setTargetChatUser(null);
        setChatOpen(!chatOpen);

        const isChatOpen = !chatOpenRef.current;
        const isChatTab = currentTabRef.current === TABS.chat;
        if (isChatOpen && isChatTab) {
            markMessagesAsReadByChatRoomId(currentChatRoom._id);
        }
    };

    const handleNewMessage = (data) => {
        const isUserReceivedMessage = data.receiverId === user._id;
        const isUserSentMessage = data.senderId === user._id;

        // Update messages state 
        //setMessages((prevMessages) => [...prevMessages, data]);

        if (isUserReceivedMessage) {
            playChatNotificationSound();
            // If the chat window is open and the correct chat room is active, mark the message as read
            if (
                chatOpenRef.current &&
                currentTabRef.current === TABS.chat &&
                data.chatRoomId === currentChatRoomRef.current._id
            ) {
                markMessagesAsReadInDb([data._id]);
            }
        }
    };


    const handleChatClick = () => {
        toggleChat();
    };

    const handleSearchUser = () => {
        setCurrentTab(TABS.search);
    };

    const handleSearchClose = () => {
        setCurrentTab(TABS.history);
    };

    const handleChatBackClick = () => {
        if (setTargetChatUser) setTargetChatUser(null);
        setCurrentTab(TABS.history);
        markMessagesAsReadByChatRoomId(currentChatRoom._id);
    };

    const markMessagesAsReadInDb = async (messageIds) => {
        try {
            await apiClient.put("/messages/markAsRead", {
                messageIds: messageIds,
            });

            socket.emit("messageRead", messageIds);
        } catch (error) {
            console.error("Error marking messages as read:", error);
        }
    };

    const markMessagesAsReadByChatRoomId = async (chatRoomId) => {
        const chatRoomUnreadMessageIds = messages
            .filter(
                (m) =>
                    m.receiverId === user._id &&
                    m.chatRoomId === chatRoomId &&
                    m.isRead === false
            )
            .map((m) => m._id);

        try {
            markMessagesAsReadInDb(chatRoomUnreadMessageIds);
        } catch (error) {
            console.error("Error marking messages as read:", error);
        }
    };

    const handleChatRoomClick = async (chatRoom) => {
        const chatUserId = chatRoom.participants.find(
            (p) => p.userId !== user._id
        ).userId;

        try {
            const response = await axios.get(
                `${process.env.REACT_APP_BACKEND_URI}/users/${chatUserId}`
            );
            const chatUser = response.data;

            setChatUser(chatUser);
            setCurrentChatRoom(chatRoom);
            setCurrentTab(TABS.chat);
            markMessagesAsReadByChatRoomId(chatRoom._id);

            // Emit 'joinChatRoom' event to subscribe to this room
            socket.emit('joinChatRoom', chatRoom._id);
            console.log(`Joined chat room: ${chatRoom._id}`);
        } catch (error) {
            console.error("Error fetching chat user:", error);
        }
    };


    const handleSearchChatUserClick = async (chatUser) => {
        const data = {
            participants: [{ userId: user._id }, { userId: chatUser._id }],
        };

        try {
            const response = await apiClient.post("/chatRooms", data);
            const chatRoom = response.data.chatRoom;

            const isChatRoomExists = chatRooms.some((chatRoom) =>
                chatRoom.participants.every((participant) =>
                    data.participants.some((p) => p.userId === participant.userId)
                )
            );
            if (!isChatRoomExists) {
                setChatRooms([chatRoom, ...chatRooms]);
            }

            handleChatRoomClick(chatRoom);
        } catch (error) {
            console.error("Error creating chat room:", error);
        }
    };

    const getUnreadMessages = () => {
        return messages.filter(
            (m) => m.receiverId === user._id && m.isRead === false
        );
    };

    const getLastMessages = () => {
        return chatRooms.map((chatRoom) => {
            const lastMessage = messages
                .filter((m) => m.chatRoomId === chatRoom._id)
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];

            return (
                lastMessage || { chatRoomId: chatRoom._id, content: null, timestamp: null }
            );
        });
    };

    const getChatRoomMessages = (chatRoomId) => {
        const chatRoomMessages = messages.filter(
            (m) => m.chatRoomId === chatRoomId
        );
        chatRoomMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        return chatRoomMessages;
    };

    return (
        <div className="fixed bottom-24 right-10">
            {/* Chat button */}
            <div
                onClick={handleChatClick}
                className="bg-blue-50 p-3 rounded-full flex justify-center cursor-pointer"
            >
                <FontAwesomeIcon className="z-10 h-7 text-gray-800" icon={chatIcon} />
                {/* Unread message count */}
                {getUnreadMessages().length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {getUnreadMessages().length}
                    </span>
                )}
            </div>

            {/* Chat pop up */}
            {chatOpen && (
                <div className="fixed bottom-44 right-10 w-96 h-[65vh] bg-gray-900 border-1 border-gray-400 rounded-lg shadow-xl">
                    {/* Titlebar */}
                    <ChatTitleBar
                        user={user}
                        chatUser={chatUser}
                        TABS={TABS}
                        currentTab={currentTab}
                        handleSearchClose={handleSearchClose}
                        handleSearchUser={handleSearchUser}
                        handleChatBackClick={handleChatBackClick}
                        setSearchInput={setSearchInput}
                        toggleChat={toggleChat}
                        defaultProfileImageUrl={defaultProfileImageUrl}
                    />
                    {/* Tab Body */}
                    <div className="h-full pb-20">
                        {/* Chat History Tab */}
                        {currentTab === TABS.history && (
                            <div className="h-full pb-1 overflow-y-auto">
                                <ChatHistoryTab
                                    user={user}
                                    chatRooms={chatRooms}
                                    lastMessages={getLastMessages()}
                                    unreadMessages={getUnreadMessages()}
                                    defaultProfileImageUrl={defaultProfileImageUrl}
                                    handleChatRoomClick={handleChatRoomClick}
                                />
                            </div>
                        )}

                        {/* Chat Tab */}
                        {currentTab === TABS.chat && (
                            <div className="h-full">
                                <ChatTab
                                    chatRoom={currentChatRoom}
                                    chatRoomMessages={getChatRoomMessages(currentChatRoom._id)}
                                    currentUser={user}
                                    chatUser={chatUser}
                                    setMessages={setMessages}
                                />
                            </div>
                        )}

                        {/* Search Tab */}
                        {currentTab === TABS.search && (
                            <div className="h-full pb-1">
                                <ChatSearchTab
                                    currentUser={user}
                                    searchInput={searchInput}
                                    defaultProfileImageUrl={defaultProfileImageUrl}
                                    handleSearchChatUserClick={handleSearchChatUserClick}
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Chat;
