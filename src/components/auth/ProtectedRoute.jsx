import React, { useMemo } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children, roles }) => {
    const { user, loading } = useAuth();
    const token = localStorage.getItem("accessToken");
    const location = useLocation();

    // Memoize the redirect component to prevent unnecessary re-renders
    const redirect = useMemo(() => {
        if (!token) {
            return <Navigate to="/login" state={{ from: location }} replace />;
        }
        if (roles && !roles.includes(user?.role)) {
            return <Navigate to="/unauthorized" replace />;
        }
        return null;
    }, [token, roles, user?.role, location]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-900">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-400 font-medium">Authenticating...</p>
                </div>
            </div>
        );
    }

    if (redirect) return redirect;

    return children;
};

export default ProtectedRoute;
