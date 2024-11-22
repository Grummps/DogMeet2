// src/components/chat/ChatTab.js

import React, { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane as sendIcon } from "@fortawesome/free-solid-svg-icons";
import { faWandMagicSparkles as AIIcon } from "@fortawesome/free-solid-svg-icons";
import apiClient from "../../utilities/apiClient";
import chatTimeFormat from "../../utilities/chatTimeFormat";
import EmojiPicker from "../chat/emojiPickerButton"; // Ensure correct import path
import socket from "../../utilities/socket"; // Import socket instance

let scrollEffect = "smooth";

const ChatTab = ({
    chatRoom,
    chatRoomMessages,
    currentUser,
    chatUser,
    setMessages, // Receive setMessages as a prop
}) => {
    const [newMessage, setNewMessage] = useState("");
    const newMessageRef = useRef(null);
    const messagesEndRef = useRef(null);
    const messageDayRef = useRef(null);

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

        console.log("Sent message via socket:", message);

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
            <div className="flex-1 overflow-y-auto p-3 bg-lightBackground bg-gray-900 space-y-2">
                {chatRoomMessages.map((message) => (
                    <React.Fragment key={message._id}>
                        <div className="text-center text-sm text-white font-display my-3">
                            {chatTimeFormat(message.timestamp) !== messageDayRef.current &&
                                getAndUpdateMessageDay(message.timestamp)}
                        </div>
                        <div
                            className={`flex p-2 font-display text-sm rounded-lg break-words ${message.senderId === currentUser._id
                                ? "bg-blue-500 text-white self-end ml-40"
                                : "bg-gray-300 text-gray-900 self-start mr-40"
                                }`}
                        >
                            <div className="w-40">
                                {message.content.split("\n").map((line, lineIndex) => (
                                    <span key={lineIndex}>
                                        {line.split("\t").map((tabbedText, tabIndex) => (
                                            <span key={tabIndex}>
                                                {tabbedText}
                                                {tabIndex < line.split("\t").length - 1 && (
                                                    <span
                                                        className="inline-block"
                                                        style={{ width: "2ch" }}
                                                    />
                                                )}
                                            </span>
                                        ))}
                                        <br />
                                    </span>
                                ))}
                            </div>
                            <div className="flex justify-end items-end w-3">
                                {message.isRead && (
                                    <div className="text-xs font-bold">{"✔"}</div>
                                )}
                            </div>
                        </div>
                    </React.Fragment>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="px-2 pt-2 flex items-center">
                <textarea
                    type="text"
                    value={newMessage}
                    ref={newMessageRef}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 p-2 border rounded-lg outline-none font-display w-30 text-white bg-transparent h-12 max-h-80 min-h-12"
                    autoFocus={true}
                    onKeyDown={handleKeyDown}
                />
                {/* AI button */}
                <button
                    onClick={handleAIButtonClick}
                    className="ml-3 text-white rounded-full font-menu"
                >
                    <FontAwesomeIcon
                        className="text-white-500 text-lg hover:text-orange-500"
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
                    <FontAwesomeIcon
                        className="text-white-500 text-2xl"
                        icon={sendIcon}
                    />
                </button>
            </div>
        </div>
    );

};

export default ChatTab;