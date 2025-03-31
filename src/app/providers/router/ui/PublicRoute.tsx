import { RootState } from 'app/providers/store/config/store';
import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

interface PublicRouteProps {
    children: React.ReactNode;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
    const token = useSelector((state: RootState) => state.user.token);
    const tokenLS = localStorage.getItem('savedToken');

    if (token) {
        return <Navigate to="/lk" replace />;
    }

    return <>{children}</>;
};

export default PublicRoute;
