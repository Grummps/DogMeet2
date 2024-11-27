import React, { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane as sendIcon } from "@fortawesome/free-solid-svg-icons";
import { faWandMagicSparkles as AIIcon } from "@fortawesome/free-solid-svg-icons";
import apiClient from "../../utilities/apiClient";
import chatTimeFormat from "../../utilities/chatTimeFormat";
import EmojiPicker from "../chat/emojiPickerButton";
import socket from "../../utilities/socket";

let scrollEffect = "smooth";

const ChatTab = ({
    chatRoom,
    chatRoomMessages,
    currentUser,
    chatUser,
    setMessages,
}) => {
    const [newMessage, setNewMessage] = useState("");
    const newMessageRef = useRef(null);
    const messagesEndRef = useRef(null);
    const messageDayRef = useRef(null);

    const maxCharacters = 2000; // Maximum character limit

    const scrollToBottom = (effect) => {
        messagesEndRef.current?.scrollIntoView({ behavior: effect });
    };

    useEffect(() => {
        scrollEffect = "instant";
    }, []);

    useEffect(() => {
        scrollToBottom(scrollEffect);
    }, [chatRoomMessages]);

    const saveMessage = async (message) => {
        const data = {
            chatRoomId: chatRoom._id,
            senderId: currentUser._id,
            receiverId: chatUser._id,
            content: message,
        };

        try {
            const response = await apiClient.post("/messages", data);
            return response.data;
        } catch (error) {
            console.error("Error saving message:", error);
            return null;
        }
    };

    const handleSendMessage = async () => {
        const message = newMessage.trim();
        setNewMessage("");

        if (message === "") return;

        const response = await saveMessage(message);
        const savedMessage = response.data;

        if (!savedMessage) {
            setNewMessage(message);
            return;
        }


        socket.emit("sendMessage", savedMessage);

        scrollEffect = "smooth";

        scrollToBottom(scrollEffect);
    };

    const getChatHistoryStr = () => {
        let chatHistory = "";
        const lastTenMessages = chatRoomMessages.slice(-10);

        lastTenMessages.forEach((message) => {
            const sender =
                message.senderId === currentUser._id ? "Me" : chatUser.username;
            const msg = message.content.replace("\n", " ").replace("\t", " ");

            chatHistory += `${sender}: ${msg}\n`;
        });

        return chatHistory;
    };

    const generateMessage = async (chatHistoryStr) => {
        try {
            const response = await apiClient.post("/messages/generate", {
                chatHistoryStr,
            });
            return response.data.message;
        } catch (error) {
            console.error("Error generating message:", error);
            return "";
        }
    };

    const handleAIButtonClick = async () => {
        const chatHistoryStr = getChatHistoryStr();
        const generatedMessage = await generateMessage(chatHistoryStr);

        if (generatedMessage) setNewMessage(generatedMessage);

        if (newMessageRef.current) newMessageRef.current.focus();
    };

    const getAndUpdateMessageDay = (date) => {
        const messageDay = chatTimeFormat(date);
        messageDayRef.current = messageDay;
        return messageDay;
    };

    const onEmojiSelect = (emoji) => {
        setNewMessage(newMessage + emoji);
    };

    const handleKeyDown = (event) => {
        if (
            (event.ctrlKey && event.key === "Enter") ||
            (event.shiftKey && event.key === "Enter")
        ) {
            event.preventDefault();
            setNewMessage(newMessage + "\n");
        } else if (event.key === "Enter") {
            event.preventDefault();
            handleSendMessage();
        }
        if (event.key === "Tab") {
            event.preventDefault();
            setNewMessage(newMessage + "\t");
        }
    };

    return (
        <div className="h-full flex flex-col">
            {/* Chat Window */}
            <div className="flex-1 overflow-y-auto p-3 bg-gray-900 space-y-2">
                {chatRoomMessages.map((message) => (
                    <React.Fragment key={message._id}>
                        {/* Date Separator */}
                        {chatTimeFormat(message.timestamp) !== messageDayRef.current && (
                            <div className="text-center text-sm text-white font-display my-3">
                                {getAndUpdateMessageDay(message.timestamp)}
                            </div>
                        )}
                        {/* Message Bubble */}
                        <div
                            className={`flex ${message.senderId === currentUser._id
                                ? 'justify-end'
                                : 'justify-start'
                                }`}
                        >
                            <div
                                className={`relative p-3 font-display text-sm rounded-xl break-words ${message.senderId === currentUser._id
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-300 text-gray-900'
                                    }`}
                                style={{
                                    maxWidth: '80%',
                                    minWidth: '20%',
                                    wordBreak: 'break-word',
                                }}
                            >
                                {/* Message Content */}
                                <div>
                                    {message.content.split('\n').map((line, lineIndex) => (
                                        <p key={lineIndex} className="mb-1">
                                            {line}
                                        </p>
                                    ))}
                                </div>
                                {/* Read Receipt */}
                                {message.isRead && message.senderId === currentUser._id && (
                                    <div className="absolute bottom-1 right-2 text-xs font-bold">
                                        ✔
                                    </div>
                                )}
                            </div>
                        </div>
                    </React.Fragment>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="px-2 pt-2 pb-2 flex flex-col bg-gray-900">
                {/* Character Counter */}
                <div className="text-right text-xs text-gray-400 mb-1">
                    {newMessage.length}/{maxCharacters} characters
                </div>
                <div className="flex items-center">
                    <textarea
                        type="text"
                        value={newMessage}
                        ref={newMessageRef}
                        onChange={(e) => {
                            if (e.target.value.length <= maxCharacters) {
                                setNewMessage(e.target.value);
                            }
                        }}
                        placeholder="Type a message..."
                        className="flex-1 p-2 border rounded-lg outline-none font-display text-white bg-gray-800 h-12 max-h-80 min-h-12 resize-none"
                        autoFocus={true}
                        onKeyDown={handleKeyDown}
                        maxLength={maxCharacters} // Add maxLength attribute
                    />
                    {/* AI button */}
                    <button
                        onClick={handleAIButtonClick}
                        className="ml-3 text-white rounded-full font-menu"
                    >
                        <FontAwesomeIcon
                            className="text-white text-lg hover:text-orange-500"
                            icon={AIIcon}
                        />
                    </button>
                    {/* Emoji Picker button */}
                    <div className="ml-2">
                        <EmojiPicker
                            onEmojiSelect={onEmojiSelect}
                            pickerPosition="-285px"
                            size="2xl"
                        />
                    </div>
                    {/* Send button */}
                    <button
                        onClick={handleSendMessage}
                        className="ml-2 p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-800 font-menu"
                    >
                        <FontAwesomeIcon className="text-white text-2xl" icon={sendIcon} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatTab;
