import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { persistReducer, persistStore } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { getPersistConfig } from 'redux-deep-persist';

import uiReducer from 'entities/ui/Ui/slice/uiSlice';
import modalReducer from 'entities/ui/Modal/slice/modalSlice';
import userReducer from 'entities/User/slice/userSlice';
import errorReducer from 'entities/Error/slice/errorSlice';
import documentsReducer, { setCurrentSignedDocuments } from 'entities/Documents/slice/documentsSlice';
import riskProfileReducer from 'entities/RiskProfile/slice/riskProfileSlice';
import personalAccountReducer from 'entities/PersonalAccount/slice/personalAccountSlice';
import supportChatReducer from 'entities/SupportChat/slice/supportChatSlice';
import createTransform from 'redux-persist/es/createTransform';
import { ModalState, ModalType } from 'entities/ui/Modal/model/modalTypes';

const rootReducer = combineReducers({
    ui: uiReducer,
    user: userReducer,
    modal: modalReducer,
    riskProfile: riskProfileReducer,
    error: errorReducer,
    documents: documentsReducer,
    personalAccount: personalAccountReducer,
    supportChat: supportChatReducer,
});

// Получаем конфигурацию с помощью redux-deep-persist
const persistConfig = getPersistConfig({
    key: 'root',
    storage, // используем localStorage
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
        'modal.info',
        'modal.success',
        'modal.modalStack',
        'modal.confirmationMethod',
        'modal.selectedCountry',
        'modal.currentProblemScreen',

        'user.user',
        'user.token',

        'documents.userDocuments',
        'documents.allNotSignedDocumentsHtml',
        'documents.confirmationMethod',
        'documents.currentConfirmableDoc',
        'documents.currentSugnedDocument',
        'documents.filledRiskProfileChapters',
        'documents.userPassportData',

        'riskProfile.currentConfirmingDoc',
        'riskProfile.passportFormData'],
    // blacklist: ['modal.documentsPreview', 'modal.documentsPreviewSigned'],
    rootReducer, // обязательно передаём корневой редьюсер
    // blacklist: ['modal.documentsPreview', 'modal.documentsPreviewSigned']
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            //отключил сериализацию для бинарных pdf файлов
            serializableCheck: {
                ignoredActions: ['modal/openModal', 'documents/setCurrentSignedDocuments'],
                ignoredPaths: ['documents.currentSugnedDocument.document'],
            },
        }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
