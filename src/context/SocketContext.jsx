import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

export const SocketContext = createContext();
export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const { token } = useAuth();
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        if (token) {
            // Ensure we connect to the backend port (5001) not frontend (5173)
            const socketUrl = "http://localhost:5001";
            console.log('Connecting to socket server at:', socketUrl);

            const socketInstance = io(socketUrl, {
                auth: { token },
                transports: ['websocket'],
            });

            socketInstance.on('connect', () => {
                console.log('Connected to socket server');
                setIsConnected(true);
            });

            socketInstance.on('disconnect', () => {
                console.log('Disconnected from socket server');
                setIsConnected(false);
            });

            socketInstance.on('connect_error', (error) => {
                console.error('Socket connection error:', error.message);
            });

            setSocket(socketInstance);

            return () => {
                socketInstance.disconnect();
            };
        } else {
            if (socket) {
                socket.disconnect();
                setSocket(null);
                setIsConnected(false);
            }
        }
    }, [token]);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};
