import AuthorizationPage from 'pages/AuthorizationPage/AuthorizationPage.async';
import DocumentsPage from 'pages/DocumentsPage/DocumentsPage.async';
import PersonalAccountPage from 'pages/PersonalAccountPage/PersonalAccountPage.async'
import SupportChatPage from 'pages/SupportChatPage/SupportChatPage.async';
import { memo, Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import PublicRoute from './PublicRoute';
import RequireAuthRoute from './RequireAuth';
import { NotFoundPage } from 'pages/NotFoundPage/NotFoundPage';
import OpenInformationPage from 'pages/OpenInformationPage/OpenInformationPage.async';
import FAQPage from 'pages/FAQPage/FAQPage.async';
import PaymentsPage from 'pages/PaymentsPage/PaymentsPage.async';
import ConfirmCustomDocsPage from 'pages/ConfirmCustomDocsPage/ConfirmCustomDocsPage.async';
import LandingPage from 'pages/LandingPage/LandingPage.async';
import RecomendationsPage from 'pages/RecomendationsPage/RecomendationsPage';
import NotificationsPage from 'pages/NotificationsPage/NotificationsPage';
import BalancePage from 'pages/BalancePage/BalancePage';


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
                path="/*"
                element={
                    <Suspense fallback={<PageLoader />}>
                        <NotFoundPage />
                    </Suspense>
                }
            />
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
                path="/recomendations"
                element={
                    <RequireAuthRoute>
                        <Suspense fallback={<PageLoader />}>
                            <RecomendationsPage />
                        </Suspense>
                    </RequireAuthRoute>

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
            <Route
                path="/information"
                element={
                    <Suspense fallback={<PageLoader />}>
                        <OpenInformationPage />
                    </Suspense>

                }
            />
            <Route
                path="/information"
                element={
                    <Suspense fallback={<PageLoader />}>
                        <BalancePage />
                    </Suspense>

                }
            />
            <Route
                path="/balance"
                element={
                    <RequireAuthRoute>
                        <Suspense fallback={<PageLoader />}>
                            <BalancePage />
                        </Suspense>
                    </RequireAuthRoute>

                }
            />
            <Route
                path="/notifications"
                element={
                    <RequireAuthRoute>
                        <Suspense fallback={<PageLoader />}>
                            <NotificationsPage />
                        </Suspense>
                    </RequireAuthRoute>

                }
            />
            <Route
                path="/payments/:status?/:uuid?"
                element={
                    <RequireAuthRoute>
                        <Suspense fallback={<PageLoader />}>
                            <PaymentsPage />
                        </Suspense>
                    </RequireAuthRoute>
                }
            />
            <Route
                path="/faq"
                element={
                    <Suspense fallback={<PageLoader />}>
                        <FAQPage />
                    </Suspense>

                }
            />
            <Route
                path="/custom_document/:id"
                element={
                    <Suspense fallback={<PageLoader />}>
                        <ConfirmCustomDocsPage />
                    </Suspense>

                }
            />
        </Routes >
    );
}

export default memo(AppRouter);
