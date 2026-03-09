import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '@/api/base44Client';
import { toast } from 'sonner';
import { API_BASE_URL } from '../config/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('accessToken'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            const storedToken = localStorage.getItem('accessToken');
            if (storedToken) {
                try {
                    const response = await api.get(`/api/auth/me`);
                    if (response.data && response.data.data) {
                        setUser(response.data.data);
                        setToken(storedToken);
                    }
                } catch (error) {
                    console.error("Auth init failed:", error);
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('user');
                    setToken(null);
                    setUser(null);
                }
            } else {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('user');
                setUser(null);
            }
            setLoading(false);
        };

        const timer = setTimeout(() => {
            initAuth();
        }, 0);

        return () => clearTimeout(timer);
    }, []);

    const login = (userData, accessToken) => {
        console.log("[AUTH_TOKEN_SAVED]", accessToken);
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("user", JSON.stringify(userData));
        setUser(userData);
        setToken(accessToken);
    };

    const logout = async () => {
        try {
            await api.post(`/api/auth/logout`);
            toast.success('Logged out successfully');
        } catch (err) {
            console.error('Logout failed', err);
            toast.error('Logout failed');
        } finally {
            setUser(null);
            setToken(null);
            localStorage.removeItem('accessToken');
            localStorage.removeItem('user');
        }
    };

    return (
        <AuthContext.Provider value={{ user, token, setToken, login, logout, loading, setLoading, setUser }}>
            {children}
        </AuthContext.Provider>
    );
};
