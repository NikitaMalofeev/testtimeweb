import { configureStore } from '@reduxjs/toolkit';
import uiReducer from 'entities/ui/Ui/slice/uiSlice';
import modalReducer from 'entities/ui/Modal/slice/modalSlice';
import userReducer from 'entities/User/slice/userSlice';
import errorReducer from 'entities/Error/slice/errorSlice';
import documentsReducer from 'entities/Documents/slice/documentsSlice';
import riskProfileReducer from 'entities/RiskProfile/slice/riskProfileSlice'
import personalAccountReducer from 'entities/PersonalAccount/slice/personalAccountSlice'
export const store = configureStore({
    reducer: {
        ui: uiReducer,
        user: userReducer,
        modal: modalReducer,
        riskProfile: riskProfileReducer,
        error: errorReducer,
        documents: documentsReducer,
        personalAccount: personalAccountReducer,
    },
});

// Генерируем типы для корневого стейта и dispatch
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
