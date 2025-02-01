import { configureStore } from '@reduxjs/toolkit';
import uiReducer from 'entities/ui/Ui/slice/uiSlice';
import riskProfileReducer from 'entities/RiskProfile/slice/riskProfileSlice'

export const store = configureStore({
    reducer: {
        ui: uiReducer,
        riskProfile: riskProfileReducer,
    },
});

// Генерируем типы для корневого стейта и dispatch
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
