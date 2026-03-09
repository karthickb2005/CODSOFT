import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Hash, Users, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { API_BASE_URL } from '@/config/api';
import { cn } from '@/lib/utils';
import { useSocket } from '@/context/SocketContext';
import { useAuth } from '@/context/AuthContext';

// Use a shared socket instance if possible, or create one with auth
let socket;

export default function ProjectChat({ projectId, user: propUser }) {
    const { socket, isConnected } = useSocket();
    const { token, user: authUser } = useAuth();
    const user = propUser || authUser;
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [input, setInput] = useState('');
    const bottomRef = useRef(null);

    // Debugging logs
    useEffect(() => {
        if (socket) {
            console.log("--- ProjectChat Debug ---");
            console.log("Project ID:", projectId);
            console.log("User:", user?.email);
            console.log("Socket State:", isConnected ? "Connected" : "Disconnected");
            console.log("Socket ID:", socket.id);

            socket.on("connect", () => {
                console.log("Socket connected visually:", socket.id);
            });

            socket.on("connect_error", (err) => {
                console.log("Socket connection error (detailed):", err.message);
            });

            return () => {
                socket.off("connect");
                socket.off("connect_error");
            };
        }
    }, [projectId, user, isConnected, socket]);

    // Initialize socket connection and fetch history
    useEffect(() => {
        if (!projectId || projectId === 'undefined') {
            console.warn("⚠ ProjectChat: Invalid Project ID provided");
            return;
        }

        const fetchHistory = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/chat`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const result = await response.json();
                if (result.success) {
                    setMessages(result.data);
                }
            } catch (error) {
                console.error("Chat History Fetch Error:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();

        if (socket && isConnected) {
            console.log("Emitting joinProject for:", projectId);
            socket.emit('joinProject', { projectId });

            const handleReceiveMessage = (msg) => {
                console.log("📥 Received message in ProjectChat:", msg);
                if (msg.projectId === projectId || msg.projectId?._id === projectId) {
                    setMessages((prev) => {
                        // 1. If we already have the exact DB message, do nothing
                        if (prev.some(m => m._id === msg._id)) {
                            return prev;
                        }

                        // 2. Identify if this incoming message is from the current user
                        const isMe = msg.sender?._id === user?._id || msg.sender?._id === user?.id || msg.sender === user?._id;

                        // 3. Find if we have an optimistic temp message to replace
                        const tempIndex = prev.findIndex(m =>
                            m._id.toString().startsWith('temp-') &&
                            m.message === msg.message &&
                            isMe
                        );

                        if (tempIndex !== -1) {
                            // Replace temp message with real one
                            const newMessages = [...prev];
                            newMessages[tempIndex] = msg;
                            return newMessages;
                        }

                        // 4. Otherwise, it's a new message
                        return [...prev, msg];
                    });
                }
            };

            socket.on('receiveMessage', handleReceiveMessage);

            return () => {
                socket.off('receiveMessage', handleReceiveMessage);
            };
        }
    }, [projectId, socket, isConnected]);

    // Scroll to bottom on new messages
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const formatTime = (date) => {
        return new Date(date).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!input.trim() || !isConnected) return;

        const tempId = `temp-${Date.now()}`;
        const newMsg = {
            _id: tempId,
            message: input,
            sender: user,
            createdAt: new Date().toISOString(),
            projectId
        };

        // 1. Optimistic Update
        setMessages((prev) => [...prev, newMsg]);

        // 2. Emit to Backend
        socket.emit('sendMessage', {
            projectId,
            message: input,
        });

        setInput('');
    };

    return (
        <Card className="flex flex-col h-[500px] bg-slate-900/50 border-slate-800 shadow-xl overflow-hidden">
            <CardHeader className="py-3 px-4 border-b border-slate-800 bg-slate-900/80">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-md bg-emerald-500/10">
                            <Hash className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div>
                            <CardTitle className="text-sm font-semibold text-white">Project Chat</CardTitle>
                            <div className="flex items-center gap-1.5">
                                <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-slate-600'}`} />
                                <span className="text-[10px] text-slate-400 font-medium">
                                    {isConnected ? 'Connected' : 'Reconnecting...'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <Users className="w-4 h-4 text-slate-500" />
                </div>
            </CardHeader>

            <CardContent className="flex-1 p-0 flex flex-col min-h-0 bg-slate-950/30">
                <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-center opacity-50">
                                <div className="p-3 rounded-full bg-slate-800 mb-3">
                                    <Hash className="w-6 h-6 text-slate-400" />
                                </div>
                                <p className="text-sm text-slate-400 font-medium">No messages yet</p>
                                <p className="text-xs text-slate-500">Be the first to say hello!</p>
                            </div>
                        ) : null}
                        {!loading && messages.map((msg, i) => {
                            const isMe = msg.sender?._id === user?._id || msg.sender === user?._id;
                            const showAvatar = i === 0 || messages[i - 1].sender?._id !== msg.sender?._id;

                            return (
                                <div key={msg._id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                    <div className={`flex gap-2 max-w-[85%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                        {showAvatar && (
                                            <Avatar className="h-8 w-8 mt-1 border border-slate-700">
                                                <AvatarFallback className="bg-slate-800 text-[10px] text-white">
                                                    {(msg.sender?.name || msg.sender?.display_name || '?').charAt(0)}
                                                </AvatarFallback>
                                            </Avatar>
                                        )}
                                        {!showAvatar && <div className="w-8" />}

                                        <div className="flex flex-col">
                                            {showAvatar && (
                                                <span className={cn(
                                                    "text-[10px] font-semibold mb-1 ml-1 flex items-center gap-1.5",
                                                    isMe ? "text-slate-400 self-end mr-1" : "text-slate-400"
                                                )}>
                                                    {isMe ? (
                                                        <>
                                                            <span>{formatTime(msg.createdAt || Date.now())}</span>
                                                            <span className="text-[8px] opacity-40">•</span>
                                                            <span>{msg.sender?.name || msg.sender?.display_name || 'You'}</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span>{msg.sender?.name || msg.sender?.display_name || 'Member'}</span>
                                                            <span className="text-[8px] opacity-40">•</span>
                                                            <span>{formatTime(msg.createdAt || Date.now())}</span>
                                                        </>
                                                    )}
                                                </span>
                                            )}

                                            {msg.message.includes("meet.google.com") ? (
                                                <a
                                                    href={msg.message.match(/https?:\/\/meet\.google\.com\/[a-z-]+/)?.[0] || msg.message}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={cn(
                                                        "flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-medium transition-all shadow-lg active:scale-95 group/meet",
                                                        isMe
                                                            ? "bg-emerald-600 hover:bg-emerald-500 text-white rounded-tr-none"
                                                            : "bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-tl-none border border-emerald-500/30"
                                                    )}
                                                >
                                                    <div className="p-1 rounded-full bg-white/20">
                                                        <Send className="w-3 h-3 rotate-45" />
                                                    </div>
                                                    <span>Join Google Meet</span>
                                                </a>
                                            ) : (
                                                <div className={cn(
                                                    "px-3 py-2 rounded-2xl text-sm break-words shadow-sm",
                                                    isMe
                                                        ? "bg-violet-600/90 text-white rounded-tr-none"
                                                        : "bg-slate-800/80 text-slate-100 rounded-tl-none border border-slate-700/50"
                                                )}>
                                                    {msg.message}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={bottomRef} />
                    </div>
                </ScrollArea>

                <div className="p-3 bg-slate-900/50 border-t border-slate-800">
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type your message..."
                            className="bg-slate-800 border-slate-700 text-sm focus:ring-violet-500 focus:border-violet-500 transition-all placeholder:text-slate-500 h-10"
                            disabled={!isConnected}
                        />
                        <Button
                            type="submit"
                            size="icon"
                            disabled={!input.trim() || !isConnected}
                            className="bg-violet-600 hover:bg-violet-500 h-10 w-10 shrink-0 transition-all active:scale-95 shadow-lg shadow-violet-900/20"
                        >
                            <Send className="w-4 h-4" />
                        </Button>
                    </form>
                </div>
            </CardContent>
        </Card>
    );
}
