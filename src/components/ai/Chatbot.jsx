import React, { useState } from 'react';
import { api } from '@/api/base44Client';
import { toast } from 'sonner';

const Chatbot = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMessage = { text: input, sender: 'user' };
        setMessages((prev) => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);
        setError(null);

        try {
            const response = await api.post(`/api/ai/chat`, { message: input });
            const data = response.data?.data || response.data;

            const aiMessage = { text: data.reply || 'No response', sender: 'ai' };
            setMessages((prev) => [...prev, aiMessage]);
        } catch (err) {
            console.error('Chat error:', err);
            toast.error(err.response?.data?.message || 'Error communicating with AI');
            const errorMessage = { text: 'Error: Could not get response', sender: 'ai', isError: true };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-96 w-full max-w-md bg-white rounded-lg shadow-md border overflow-hidden">
            <div className="bg-blue-600 text-white p-4 font-bold flex justify-between items-center">
                <span>TaskPilot AI Assistant</span>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {messages.length === 0 && (
                    <div className="text-gray-500 text-center mt-10">
                        Hello! How can I help you today?
                    </div>
                )}
                {messages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-3 rounded-lg ${msg.sender === 'user' ? 'bg-blue-500 text-white rounded-br-none' : msg.isError ? 'bg-red-100 text-red-700 rounded-bl-none' : 'bg-gray-100 text-gray-800 rounded-bl-none'}`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-gray-100 text-gray-800 p-3 rounded-lg rounded-bl-none">
                            <span className="animate-pulse">Thinking...</span>
                        </div>
                    </div>
                )}
                {error && (
                    <div className="text-red-500 text-sm text-center mt-2 font-medium">
                        {error}
                    </div>
                )}
            </div>

            <form onSubmit={handleSend} className="border-t p-3 flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-500"
                    disabled={isLoading}
                />
                <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-300 transition-colors font-medium flex-shrink-0"
                    disabled={isLoading || !input.trim()}
                >
                    Send
                </button>
            </form>
        </div>
    );
};

export default Chatbot;
