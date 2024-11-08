import React, { useState, useEffect, useContext } from 'react';
import { SocketContext } from './SocketContext'; // Adjust the path accordingly

const ChatWindow = ({ receiverId, onClose, conversationId, otherUserId, currentUser }) => {
    const socket = useContext(SocketContext);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');

    useEffect(() => {
        if (!socket) return;

        // Listen for incoming messages
        socket.on('receiveMessage', (message) => {
            if (message.senderId === receiverId || message.receiverId === receiverId) {
                setMessages((prevMessages) => [...prevMessages, message]);
            }
        });

        return () => {
            socket.off('receiveMessage');
        };
    }, [socket, receiverId]);

    useEffect(() => {
        if (socket && conversationId && otherUserId) {
            socket.emit('joinConversation', { conversationId, otherUserId });

            return () => {
                socket.emit('leaveConversation', { conversationId });
            };
        }
    }, [socket, conversationId, otherUserId]);

    // Add the markMessagesRead useEffect here
    useEffect(() => {
        const isChatOpen = true; // Since this component represents the open chat

        if (isChatOpen && messages.length > 0 && socket) {
            const unreadMessageIds = messages
                .filter((msg) => msg.receiverId === currentUser._id && !msg.readStatus)
                .map((msg) => msg._id);

            if (unreadMessageIds.length > 0) {
                socket.emit('markMessagesRead', {
                    messageIds: unreadMessageIds,
                    senderId: otherUserId,
                });
            }
        }
    }, [messages, currentUser, socket, otherUserId]);


    const sendMessage = () => {
        if (input.trim() && socket) {
            const messageData = {
                receiverId,
                content: input,
                conversationId,
            };

            socket.emit('sendMessage', messageData);

            // Optimistically update UI
            setMessages((prevMessages) => [
                ...prevMessages,
                {
                    ...messageData,
                    senderId: currentUser._id,
                    timestamp: new Date(),
                },
            ]);

            setInput('');
        }
    };

    return (
        <div className="chat-window">
            <button onClick={onClose}>Close</button>
            <div className="messages">
                {messages.map((msg, index) => (
                    <div
                        key={index}
                        className={`message ${msg.senderId === currentUser._id ? 'sent' : 'received'
                            }`}
                    >
                        {msg.content}
                    </div>
                ))}
            </div>
            <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
            />
            <button onClick={sendMessage}>Send</button>
        </div>
    );
};

export default ChatWindow;
