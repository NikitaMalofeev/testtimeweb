// store.ts
import { configureStore } from '@reduxjs/toolkit';
import uiReducer from 'entities/ui/Ui/slice/uiSlice';
// Импортируем редьюсеры, если есть (пример: userReducer)
// import userReducer from 'entities/User';

export const store = configureStore({
    reducer: {
        ui: uiReducer,
    },
});

// Генерируем типы для корневого стейта и dispatch
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
