import { RootState } from 'app/providers/store/config/store';
import { closeAllModals } from 'entities/ui/Modal/slice/modalSlice';
import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { useAppDispatch } from 'shared/hooks/useAppDispatch';

interface RequireAuthRouteProps {
    children: React.ReactNode;
}

const RequireAuthRoute: React.FC<RequireAuthRouteProps> = ({ children }) => {
    const token = useSelector((state: RootState) => state.user.token);
    const tokenLS = localStorage.getItem('savedToken');
    const dispatch = useAppDispatch()

    if (!token && !tokenLS) {
        dispatch(closeAllModals())
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
};

export default RequireAuthRoute;
