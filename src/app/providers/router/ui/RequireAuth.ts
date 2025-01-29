import { Navigate, useLocation } from 'react-router-dom';
// import { getRouteLogin } from 'shared/const/router';
// import { USER_JWT_LOCALSTORAGE_KEY } from 'shared/const/localstorage';

// eslint-disable-next-line no-undef
export function RequireAuth({ children }: { children: JSX.Element }) {
    // const userAuthToken = localStorage.getItem(USER_JWT_LOCALSTORAGE_KEY);
    // const location = useLocation();

    // if (!userAuthToken) {
    //     return <Navigate to={getRouteLogin()} state={{ from: location }} replace />;
    // }

    return children;
}
