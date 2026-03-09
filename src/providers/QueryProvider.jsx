import React, { useState, useRef } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AlertTriangle } from 'lucide-react';
import { useBackendMode } from '../context/BackendModeContext';

const GlobalApiStatus = ({ isDegraded }) => {
    if (!isDegraded) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-500 px-4 py-3 rounded-lg flex items-center gap-3 backdrop-blur-md shadow-lg">
                <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                <div className="flex flex-col">
                    <span className="text-sm font-semibold">Backend Degraded</span>
                    <span className="text-xs opacity-90">API-ONLY mode active. Some features may be unavailable.</span>
                </div>
            </div>
        </div>
    );
};

export function QueryProvider({ children }) {
    const { backendMode, setBackendMode } = useBackendMode();

    // Keep a stable ref to avoid recreating QueryClient which would nuke the cache
    const backendModeRef = useRef(backendMode);
    backendModeRef.current = backendMode;

    const setBackendModeRef = useRef(setBackendMode);
    setBackendModeRef.current = setBackendMode;

    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                retry: 1,
                refetchOnWindowFocus: false,
                staleTime: 30000,
                enabled: (query) => {
                    const key = query.queryKey?.[0];

                    // Essential queries must always run
                    const essential = ["authUser", "session", "health", "currentUser"];

                    if (backendModeRef.current === "DEGRADED" && !essential.includes(key)) {
                        return false; // pause heavy queries
                    }
                    return true;
                },
                onError: (error) => {
                    console.warn("Global Query Error:", error?.message);
                    const status = error?.response?.status;
                    const isNetworkError = error?.message === 'Network Error' || !error?.response;
                    if (isNetworkError || status === 500 || status === 503) {
                        setBackendModeRef.current("DEGRADED");
                        console.warn("⚠ Backend degraded — Smart Pause Activated.");
                    }
                }
            },
            mutations: {
                onError: (error) => {
                    console.warn("Global Mutation Error:", error?.message);
                    const status = error?.response?.status;
                    const isNetworkError = error?.message === 'Network Error' || !error?.response;
                    if (isNetworkError || status === 500 || status === 503) {
                        setBackendModeRef.current("DEGRADED");
                        console.warn("⚠ Backend degraded — Smart Pause Activated.");
                    }
                }
            }
        }
    }));

    return (
        <QueryClientProvider client={queryClient}>
            {children}
            <GlobalApiStatus isDegraded={backendMode === "DEGRADED"} />
        </QueryClientProvider>
    );
}
