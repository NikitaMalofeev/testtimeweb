import { combineReducers, configureStore } from '@reduxjs/toolkit';
import type { Middleware, Dispatch, AnyAction } from 'redux';
import {
    persistReducer,
    persistStore,
    FLUSH,
    REHYDRATE,
    PAUSE,
    PERSIST,
    PURGE,
    REGISTER,
} from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { getPersistConfig } from 'redux-deep-persist';

import uiReducer from 'entities/ui/Ui/slice/uiSlice';
import modalReducer from 'entities/ui/Modal/slice/modalSlice';
import userReducer from 'entities/User/slice/userSlice';
import errorReducer from 'entities/Error/slice/errorSlice';
import documentsReducer from 'entities/Documents/slice/documentsSlice';
import riskProfileReducer from 'entities/RiskProfile/slice/riskProfileSlice';
import personalAccountReducer from 'entities/PersonalAccount/slice/personalAccountSlice';
import supportChatReducer from 'entities/SupportChat/slice/supportChatSlice';
import pushReducer from 'entities/ui/PushNotifications/slice/pushSlice';
import paymentsReducer from 'entities/Payments/slice/paymentsSlice';
import recomendationsReducer from 'entities/Recomendations/slice/recomendationsSlice';
import notificationsReducer from 'entities/Notification/slice/notificationSlice';
import { initBroadcastListener, broadcastSyncMiddleware } from 'shared/lib/middleware/broadcastChannelSyncMiddleware';
import { Recomendations } from 'widgets/Recomendations/Recomendations';

const rootReducer = combineReducers({
    ui: uiReducer,
    user: userReducer,
    modal: modalReducer,
    riskProfile: riskProfileReducer,
    error: errorReducer,
    documents: documentsReducer,
    personalAccount: personalAccountReducer,
    supportChat: supportChatReducer,
    push: pushReducer,
    payments: paymentsReducer,
    recomendations: recomendationsReducer,
    notifications: notificationsReducer
});

const persistConfig = getPersistConfig({
    key: 'root',
    storage,
    whitelist: [
        'ui.additionalMenu.currentStep',
        'ui.isPushNotificationActive.purpose',

        'modal.identificationModal',
        'modal.select',
        'modal.confirmCodeModal',
        'modal.confirmDocsModal',
        'modal.problemWithCodeModal',
        'modal.problem',
        'modal.preview',
        'modal.resetPassword',
        'modal.progress',
        'modal.success',
        'modal.confirmContacts',
        'modal.modalStack',
        'modal.confirmationMethod',
        'modal.selectedCountry',
        'modal.currentProblemScreen',
        'modal.confirmAllDocumentsOneCode',
        'modal.confirmAllDocuments',


        'user.user',
        'user.token',
        'user.personalAccountInfo',

        'documents.userDocuments',
        'documents.allNotSignedDocumentsHtml',
        'documents.confirmationMethod',
        'documents.currentConfirmableDoc',
        'documents.currentSugnedDocument',
        'documents.filledRiskProfileChapters',
        'documents.userPassportData',
        // 'documents.brokerIds',

        'riskProfile.currentConfirmingDoc',
        'riskProfile.passportFormData',
        'riskProfile.legalFormData',
        'riskProfile.legalConfirmData',

        // 'payments.tariffs',
        // 'payments.currentUserTariffIdForPayments',
        // 'payments.currentOrder',
        // 'payments.currentOrderStatus',
        // 'payments.payments_info',
        // 'payments.activeTariffs',
        // 'payments.paidTariffKeys'
        //проблема с paidTariffsKeys поэтому сохраняю полностью 
        'payments'
    ],
    rootReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
    reducer: persistedReducer,
    middleware: getDefaultMiddleware =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: [
                    'modal/openModal',
                    'documents/setCurrentSignedDocuments',
                    'recomendations/getSignedIirDocumentThunk/fulfilled',
                    'recomendations/getUserNotSignedIirHtmlThunk/fulfilled',
                    FLUSH,
                    REHYDRATE,
                    PAUSE,
                    PERSIST,
                    PURGE,
                    REGISTER,
                ],
                ignoredPaths: ['documents.currentSugnedDocument.document', "ui.warningPopup.action", "recomendations.signedDocs", 'recomendations.notSignedHtmls'],
            },
            immutableCheck: {
                // говорим middleware не ходить в этот путь
                ignoredPaths: ['recomendations.signedDocs', 'recomendations.notSignedHtmls'],
            },
        }).concat(broadcastSyncMiddleware),
});

initBroadcastListener(store.dispatch);

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;
