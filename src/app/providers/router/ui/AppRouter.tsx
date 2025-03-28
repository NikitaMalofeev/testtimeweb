import AuthorizationPage from 'pages/AuthorizationPage/AuthorizationPage';
import DocumentsPage from 'pages/DocumentsPage/DocumentsPage';
import PersonalAccountPage from 'pages/PersonalAccountPage/PersonalAccountPage';
import { StartPage } from 'pages/StartPage';
import SupportChatPage from 'pages/SupportChatPage/SupportChatPage';
import { memo, Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import PublicRoute from './PublicRoute';
import RequireAuthRoute from './RequireAuth';

// const PageLoader = () => <div>Loading...</div>;
const PageLoader = () => <div></div>;


function AppRouter() {
    return (
        <Routes>
            {/* <Route
                path="/"
                element={
                    <Suspense fallback={<PageLoader />}>
                        <StartPage />
                    </Suspense>
                }
            /> */}
            <Route
                path="/"
                element={
                    <PublicRoute>
                        <Suspense fallback={<PageLoader />}>
                            <AuthorizationPage />
                        </Suspense>
                    </PublicRoute>
                }
            />
            <Route
                path="/lk"
                element={
                    <RequireAuthRoute>
                        <Suspense fallback={<PageLoader />}>
                            <PersonalAccountPage />
                        </Suspense>
                    </RequireAuthRoute>

                }
            />
            <Route
                path="/documents"
                element={
                    <RequireAuthRoute>
                        <Suspense fallback={<PageLoader />}>
                            <DocumentsPage />
                        </Suspense>
                    </RequireAuthRoute>

                }
            />
            <Route
                path="/support"
                element={
                    <RequireAuthRoute>
                        <Suspense fallback={<PageLoader />}>
                            <SupportChatPage />
                        </Suspense>
                    </RequireAuthRoute>

                }
            />
        </Routes>
    );
}

export default memo(AppRouter);
