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
                    <RequireAuthRoute>
                        <Suspense fallback={<PageLoader />}>
                            <SupportChatPage />
                        </Suspense>
                    </RequireAuthRoute>

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
                path="/robokassa"
                element={
                    <Suspense fallback={<PageLoader />}>
                        <LandingPage />
                    </Suspense>
                }
            />
            <Route
                path="/payments/:status?/:orderId?"
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
