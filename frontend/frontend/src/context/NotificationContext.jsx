import React, { createContext, useContext, useState, useCallback } from 'react';
import { toast } from 'sonner';

const NotificationContext = createContext();

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const addNotification = useCallback((notification) => {
        setNotifications((prev) => [
            { ...notification, id: Date.now(), read: false },
            ...prev
        ].slice(0, 20)); // Keep only last 20

        setUnreadCount((prev) => prev + 1);

        // Show toast
        let message = '';
        switch (notification.eventType) {
            case 'taskAssigned':
                message = `New task assigned: ${notification.taskTitle}`;
                break;
            case 'taskStatusChanged':
                message = `Task "${notification.taskTitle}" status changed to ${notification.newStatus}`;
                break;
            case 'taskOverdue':
                message = `CRITICAL: Task "${notification.taskTitle}" is overdue!`;
                break;
            default:
                message = `Notification received for ${notification.taskTitle}`;
        }

        toast(message, {
            description: `By ${notification.triggeringUser}`,
            action: {
                label: 'View',
                onClick: () => console.log('Viewing task', notification.taskId)
            }
        });
    }, []);

    const markAsRead = useCallback(() => {
        setNotifications((prev) => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
    }, []);

    const clearNotifications = useCallback(() => {
        setNotifications([]);
        setUnreadCount(0);
    }, []);

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, addNotification, markAsRead, clearNotifications }}>
            {children}
        </NotificationContext.Provider>
    );
};
