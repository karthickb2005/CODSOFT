import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, lazy, Suspense } from "react";
import { BackendModeProvider } from "./context/BackendModeContext";
import { QueryProvider } from "./providers/QueryProvider";
import { AuthProvider } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import { NotificationProvider, useNotifications } from "./context/NotificationContext";
import { useSocket } from "./hooks/useSocket";
import { Toaster } from "sonner";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Layout from "./Layout";
import ErrorBoundary from "./components/common/ErrorBoundary";

// Lazy Loaded Pages
const Dashboard = lazy(() => import("./Pages/Dashboard"));
const Projects = lazy(() => import("./Pages/Projects"));
const Tasks = lazy(() => import("./Pages/Tasks"));
const Team = lazy(() => import("./Pages/Team"));
const Analytics = lazy(() => import("./Pages/Analytics"));
const Activity = lazy(() => import("./Pages/Activity"));
const AIInsights = lazy(() => import("./Pages/AIInsights"));
const AICommandCenter = lazy(() => import("./Pages/AICommandCenter"));
const Workspaces = lazy(() => import("./Pages/Workspaces"));
const Settings = lazy(() => import("./Pages/Settings"));
const Login = lazy(() => import("./Pages/Login"));
const Signup = lazy(() => import("./Pages/Signup"));
const InviteAccept = lazy(() => import("./Pages/InviteAccept"));
const Unauthorized = lazy(() => import("./Pages/Unauthorized"));

const SuspenseLoader = () => (
  <div className="flex h-screen items-center justify-center bg-background">
    <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
  </div>
);

function SocketEvents() {
  const { socket } = useSocket();
  const queryClient = useQueryClient();
  const { addNotification } = useNotifications();

  useEffect(() => {
    if (!socket) return;

    const handleTaskUpdateEvent = () => {
      console.log('Real-time task update received, invalidating cache...');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    };

    const handleNotificationEvent = (data) => {
      console.log('Notification received:', data);
      addNotification(data);
    };

    // Data sync events
    socket.on('taskCreated', handleTaskUpdateEvent);
    socket.on('taskUpdated', handleTaskUpdateEvent);
    socket.on('taskDeleted', handleTaskUpdateEvent);

    // Notification events
    socket.on('taskAssigned', handleNotificationEvent);
    socket.on('taskStatusChanged', handleNotificationEvent);
    socket.on('taskOverdue', handleNotificationEvent);

    return () => {
      socket.off('taskCreated', handleTaskUpdateEvent);
      socket.off('taskUpdated', handleTaskUpdateEvent);
      socket.off('taskDeleted', handleTaskUpdateEvent);
      socket.off('taskAssigned', handleNotificationEvent);
      socket.off('taskStatusChanged', handleNotificationEvent);
      socket.off('taskOverdue', handleNotificationEvent);
    };
  }, [socket, queryClient, addNotification]);

  return null;
}

export default function App() {
  return (
    <ErrorBoundary>
      <BackendModeProvider>
        <QueryProvider>
          <AuthProvider>
            <NotificationProvider>
              <SocketProvider>
                <SocketEvents />
                <Toaster position="top-right" richColors />
                <BrowserRouter>
                  <Suspense fallback={<SuspenseLoader />}>
                    <Routes>
                      {/* Public Routes */}
                      <Route path="/login" element={<Login />} />
                      <Route path="/signup" element={<Signup />} />
                      <Route path="/invite/:token" element={<InviteAccept />} />
                      <Route path="/activity" element={<ProtectedRoute><Activity /></ProtectedRoute>} />
                      <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
                      <Route path="/ai-center" element={<ProtectedRoute><AICommandCenter /></ProtectedRoute>} />
                      <Route path="/unauthorized" element={<Unauthorized />} />

                      {/* Protected Routes */}
                      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/projects" element={<Projects />} />
                        <Route path="/tasks" element={<Tasks />} />
                        <Route path="/team" element={<Team />} />
                        <Route path="/analytics" element={<Analytics />} />
                        <Route path="/activity" element={<Activity />} />
                        <Route path="/insights" element={<AIInsights />} />
                        <Route path="/workspaces" element={<Workspaces />} />
                        <Route path="/settings" element={<Settings />} />
                      </Route>

                      {/* Catch-all */}
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </Suspense>
                </BrowserRouter>
              </SocketProvider>
            </NotificationProvider>
          </AuthProvider>
        </QueryProvider>
      </BackendModeProvider>
    </ErrorBoundary>
  );
}
