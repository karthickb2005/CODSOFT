import React, { createContext, useContext, useState } from 'react';
import { useBackendHealth } from '../hooks/useBackendHealth';

const BackendModeContext = createContext();

export const useBackendMode = () => useContext(BackendModeContext);

export const BackendModeProvider = ({ children }) => {
    const [backendMode, setBackendMode] = useState("FULL");

    // Mounts the health polling loop to detect and resolve DEGRADED back to FULL
    useBackendHealth(backendMode, setBackendMode);

    return (
        <BackendModeContext.Provider value={{ backendMode, setBackendMode }}>
            {children}
        </BackendModeContext.Provider>
    );
};
