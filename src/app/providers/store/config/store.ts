import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { persistReducer, persistStore } from 'redux-persist';
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
    whitelist: ['ui.additionalMenu.currentStep', 'ui.isPushNotificationActive.purpose', 'modal', 'user.user', 'documents', 'riskProfile.currentConfirmingDoc'],
    rootReducer, // обязательно передаём корневой редьюсер
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
    reducer: persistedReducer,
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
