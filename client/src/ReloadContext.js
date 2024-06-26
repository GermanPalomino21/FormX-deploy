// ReloadContext.js
import React, { createContext, useContext, useState } from 'react';

const ReloadContext = createContext();

export const useReload = () => useContext(ReloadContext);

export const ReloadProvider = ({ children }) => {
    const [reload, setReload] = useState(false);

    const triggerReload = () => setReload(true);

    return (
        <ReloadContext.Provider value={{ reload, triggerReload }}>
            {children}
        </ReloadContext.Provider>
    );
};
