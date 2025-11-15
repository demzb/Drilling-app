import React, { useState, useEffect, useRef } from 'react';
import { Session } from '@supabase/supabase-js';
import { Message } from '../types';

interface ChatProps {
    session: Session;
    messages: Message[];
    onSendMessage: (content: string) => Promise<void>;
}

const Chat: React.FC<ChatProps> = ({ session, messages, onSendMessage }) => {
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<null | HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim()) {
            onSendMessage(newMessage);
            setNewMessage('');
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="flex flex-col h-full bg-white rounded-lg shadow-md">
            <div className="flex-grow p-6 overflow-y-auto">
                <div className="space-y-4">
                    {messages.map(msg => (
                        <div
                            key={msg.id}
                            className={`flex items-end gap-2 ${msg.user_id === session.user.id ? 'justify-end' : 'justify-start'}`}
                        >
                            {msg.user_id !== session.user.id && (
                                <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-sm font-bold text-gray-600 flex-shrink-0">
                                    {msg.user_email.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <div
                                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg shadow-sm ${
                                    msg.user_id === session.user.id
                                        ? 'bg-blue-500 text-white rounded-br-none'
                                        : 'bg-gray-200 text-gray-800 rounded-bl-none'
                                }`}
                            >
                                {msg.user_id !== session.user.id && (
                                    <p className="text-xs font-bold text-gray-500 mb-1">{msg.user_email}</p>
                                )}
                                <p className="text-sm">{msg.content}</p>
                                <p className={`text-xs mt-1 ${
                                    msg.user_id === session.user.id ? 'text-blue-200' : 'text-gray-500'
                                } text-right`}>
                                    {formatDate(msg.created_at)}
                                </p>
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
            </div>
            <div className="p-4 bg-gray-50 border-t">
                <form onSubmit={handleSubmit} className="flex gap-4">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-grow px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoComplete="off"
                    />
                    <button
                        type="submit"
                        className="bg-blue-500 text-white font-bold py-2 px-6 rounded-full hover:bg-blue-600 transition-colors disabled:bg-blue-300"
                        disabled={!newMessage.trim()}
                    >
                        Send
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Chat;
