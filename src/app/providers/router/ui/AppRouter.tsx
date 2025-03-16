import AuthorizationPage from 'pages/AuthorizationPage/AuthorizationPage';
import DocumentsPage from 'pages/DocumentsPage/DocumentsPage';
import PersonalAccountPage from 'pages/PersonalAccountPage/PersonalAccountPage';
import { StartPage } from 'pages/StartPage';
import SupportChatPage from 'pages/SupportChatPage/SupportChatPage';
import { memo, Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router-dom';

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
                    <Suspense fallback={<PageLoader />}>
                        <AuthorizationPage />
                    </Suspense>
                }
            />
            <Route
                path="/lk"
                element={
                    <Suspense fallback={<PageLoader />}>
                        <PersonalAccountPage />
                    </Suspense>
                }
            />
            <Route
                path="/documents"
                element={
                    <Suspense fallback={<PageLoader />}>
                        <DocumentsPage />
                    </Suspense>
                }
            />
            <Route
                path="/support"
                element={
                    <Suspense fallback={<PageLoader />}>
                        <SupportChatPage />
                    </Suspense>
                }
            />
        </Routes>
    );
}

export default memo(AppRouter);
