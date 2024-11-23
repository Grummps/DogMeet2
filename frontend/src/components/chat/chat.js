import React, { useState, useEffect, useRef, useContext } from "react";
import { Rnd } from "react-rnd";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMessage as chatIcon } from "@fortawesome/free-regular-svg-icons";
// Removed import of getUserInfo
import ChatSearchTab from "./chatSearchTab";
import ChatHistoryTab from "./chatHistoryTab";
import ChatTitleBar from "./chatTitleBar";
import ChatTab from "./chatTab";
import axios from "axios";
import apiClient from "../../utilities/apiClient";
import socket from "../../utilities/socket";
import { connectSocket } from "../../utilities/socket";
import { useLocation } from "react-router-dom";
import { UserContext } from "../contexts/userContext"; // Import UserContext

const Chat = ({ targetChatUser, setTargetChatUser }) => {
    const defaultProfileImageUrl =
        "https://ssusocial.s3.amazonaws.com/profilepictures/ProfileIcon.png";

    const TABS = { history: "history", search: "search", chat: "chat" };
    const [currentTab, setCurrentTab] = useState(TABS.history);
    const [chatOpen, setChatOpen] = useState(false);
    const [searchInput, setSearchInput] = useState("");
    // Use user from context
    const { user, setUser } = useContext(UserContext);
    const [chatUser, setChatUser] = useState({});
    const [chatRooms, setChatRooms] = useState([]);
    const [currentChatRoom, setCurrentChatRoom] = useState({});
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);

    // Refs
    const chatOpenRef = useRef(chatOpen);
    const currentTabRef = useRef(currentTab);
    const currentChatRoomRef = useRef(currentChatRoom);
    const handlerAttachedRef = useRef(false);
    const chatRoomsRef = useRef(chatRooms);

    const location = useLocation();

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

    useEffect(() => {
        currentChatRoomRef.current = currentChatRoom;
    }, [currentChatRoom]);

    useEffect(() => {
        chatRoomsRef.current = chatRooms;
    }, [chatRooms]);

    const fetchChatRooms = async () => {
        if (!user || !user._id) {
            return;
        }

        try {
            const response = await apiClient.get(`/chatRooms/getByUserId/${user._id}`);
            const fetchedChatRooms = response.data.chatRooms;

            if (fetchedChatRooms) {
                setChatRooms(fetchedChatRooms);
            }
        } catch (error) {
            console.error("Error fetching chat rooms:", error);
        }
    };

    const fetchMessages = async () => {
        if (!user || !user._id) {
            return;
        }

        try {
            const response = await apiClient.get(`/messages/getByUserId/${user._id}`);
            const fetchedMessages = response.data.data;

            if (fetchedMessages) {
                setMessages(fetchedMessages);
            }
        } catch (error) {
            console.error("Error fetching messages:", error);
        }
    };

    useEffect(() => {
        const initializeChat = async () => {
            if (!user) {
                // If user is not available yet, wait
                setLoading(true);
                return;
            }

            setLoading(true);

            try {
                await fetchChatRooms();
                await fetchMessages();
                connectSocket(user._id); // Connect socket after fetching user
            } catch (error) {
                console.error("Error initializing chat:", error);
            } finally {
                setLoading(false);
            }

            if (!handlerAttachedRef.current) {
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
                handlerAttachedRef.current = true;
            }
        };

        initializeChat();

        return () => {
            socket.off("newMessage");
            socket.off("messageRead");
            handlerAttachedRef.current = false;
        };
    }, [user]); // Dependency on user

    const toggleChat = () => {
        if (setTargetChatUser) setTargetChatUser(null);
        setChatOpen(!chatOpen);

        const isChatOpen = !chatOpenRef.current;
        const isChatTab = currentTabRef.current === TABS.chat;
        if (isChatOpen && isChatTab) {
            markMessagesAsReadByChatRoomId(currentChatRoom._id);
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
            const fetchedChatUser = response.data;

            setChatUser(fetchedChatUser);
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
            const createdChatRoom = response.data.chatRoom;

            const isChatRoomExists = chatRooms.some((existingChatRoom) =>
                existingChatRoom.participants.every((participant) =>
                    data.participants.some((p) => p.userId === participant.userId)
                )
            );
            if (!isChatRoomExists) {
                setChatRooms([createdChatRoom, ...chatRooms]);
            }

            handleChatRoomClick(createdChatRoom);
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

    // Define size and position states
    const [size, setSize] = useState({
        width: 384, // w-96 in Tailwind CSS (96 * 4px)
        height: window.innerHeight * 0.65, // h-[65vh]
    });

    const [position, setPosition] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const updatePositionOnResize = () => {
            // Adjust the position so the chat box remains within window boundaries
            setPosition((prevPosition) => {
                const maxX = window.innerWidth - size.width;
                const maxY = window.innerHeight - size.height;
                return {
                    x: Math.min(prevPosition.x, maxX),
                    y: Math.min(prevPosition.y, maxY),
                };
            });
        };

        window.addEventListener("resize", updatePositionOnResize);

        return () => {
            window.removeEventListener("resize", updatePositionOnResize);
        };
    }, [size.width, size.height]);

    useEffect(() => {
        // Set default position when the component mounts
        const popupWidth = size.width;
        const popupHeight = size.height;
        const marginRight = 70; // right-10 (10 * 4px)
        const marginBottom = 200; // bottom-44 (44 * 4px)

        setPosition({
            x: window.innerWidth - popupWidth - marginRight,
            y: window.innerHeight - popupHeight - marginBottom,
        });
    }, []); // Empty dependency array, runs once when the component mounts

    // Don't show Navbar on login or signup pages
    if (location.pathname === "/login" || location.pathname === "/signup") {
        return null;
    }


    return (
        <>
            {/* Fixed container for the chat button */}
            <div className="fixed bottom-24 right-12 z-50 transition-transform duration-300">
                <div
                    onClick={loading ? null : handleChatClick}
                    className={`bg-gray-900 ${loading ? "scale-0 opacity-50 cursor-default" : "scale-100 opacity-100 cursor-pointer hover:bg-blue-950"
                        } p-3 rounded-full flex justify-center relative transition-all duration-500`}
                >
                    <FontAwesomeIcon
                        className={`z-10 h-7 ${loading ? "animate-spin text-gray-400" : "text-blue-300"
                            } transition-colors duration-300`}
                        icon={chatIcon}
                    />
                    {/* Unread message count */}
                    {!loading && getUnreadMessages().length > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            {getUnreadMessages().length}
                        </span>
                    )}
                </div>
            </div>


            {/* Chat pop up */}
            {chatOpen && user && (
                <Rnd
                    size={{ width: size.width, height: size.height }}
                    position={{ x: position.x, y: position.y }}
                    onDragStop={(e, d) => {
                        setPosition({ x: d.x, y: d.y });
                    }}
                    onResizeStop={(e, direction, ref, delta, newPosition) => {
                        setSize({
                            width: parseInt(ref.style.width, 10),
                            height: parseInt(ref.style.height, 10),
                        });
                        setPosition(newPosition);
                    }}
                    minWidth={300}
                    minHeight={200}
                    bounds="window"
                    enableResizing={{
                        bottom: true,
                        bottomRight: true,
                        right: true,
                    }}
                    handle=".drag-handle"
                    cancel="button, a, input, p, textarea, .non-draggable"
                    className="z-50"
                >
                    <div className="w-full h-full bg-gray-900 border border-gray-400 rounded-lg shadow-xl flex flex-col">
                        {/* Titlebar */}
                        <div className="drag-handle">
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
                        </div>
                        {/* Tab Body */}
                        <div className="flex-1 pb-20 overflow-y-auto non-draggable cursor-auto">
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
                </Rnd>
            )}
        </>
    );
};

export default Chat;
