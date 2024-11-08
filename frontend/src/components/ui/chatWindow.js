import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const ChatWindow = ({ receiverId, onClose }) => {
    const [socket, setSocket] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');

    useEffect(() => {
        // Initialize Socket.IO client
        const newSocket = io('http://localhost:8081', {
            auth: {
                token: localStorage.getItem('accessToken'),
            },
        });

        setSocket(newSocket);

        // Listen for incoming messages
        newSocket.on('receiveMessage', (message) => {
            if (message.senderId === receiverId) {
                setMessages((prevMessages) => [...prevMessages, message]);
            }
        });

        return () => {
            newSocket.disconnect();
        };
    }, [receiverId]);

    useEffect(() => {
        if (socket && conversationId) {
            socket.emit('joinConversation', { conversationId });

            return () => {
                socket.emit('leaveConversation', { conversationId });
            };
        }
    }, [socket, conversationId]);

    useEffect(() => {
        if (isChatOpen && messages.length > 0) {
            const unreadMessageIds = messages
                .filter((msg) => msg.receiverId === currentUser._id && !msg.readStatus)
                .map((msg) => msg._id);

            if (unreadMessageIds.length > 0 && socket) {
                socket.emit('markMessagesRead', unreadMessageIds);
            }
        }
    }, [isChatOpen, messages, currentUser, socket]);


    const sendMessage = () => {
        if (input.trim() && socket) {
            const messageData = {
                receiverId,
                content: input,
                conversationId: 'some_conversation_id', // You need to manage or create conversation IDs
            };

            socket.emit('sendMessage', messageData);

            // Optimistically update UI
            setMessages((prevMessages) => [
                ...prevMessages,
                { ...messageData, senderId: 'your_user_id', timestamp: new Date() },
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
                        className={`message ${msg.senderId === 'your_user_id' ? 'sent' : 'received'}`}
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
