import { RootState } from 'app/providers/store/config/store';
import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { useCheckRehydrated } from 'shared/hooks/useCheckRehydrate';

interface RequireAuthRouteProps {
    children: React.ReactNode;
}

const RequireAuthRoute: React.FC<RequireAuthRouteProps> = ({ children }) => {
    const token = useSelector((state: RootState) => state.user.token);
    const APP_PREFIX = import.meta.env.VITE_RANKS_APP_PREFIX as string || 'ranks_autopilot_';
    const tokenLS = localStorage.getItem(`${APP_PREFIX}savedToken`);
    const rehydrated = useCheckRehydrated();

    // if (!rehydrated) {
    //     return null;
    // }

    if (!token && !tokenLS) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
};

export default RequireAuthRoute;
