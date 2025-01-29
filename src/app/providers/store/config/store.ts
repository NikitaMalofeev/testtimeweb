// store.ts
import { configureStore } from '@reduxjs/toolkit';
// Импортируем редьюсеры, если есть (пример: userReducer)
// import userReducer from 'entities/User';

export const store = configureStore({
    reducer: {
        // user: userReducer,
        // добавляйте свои редьюсеры
    },
});

// Генерируем типы для корневого стейта и dispatch
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
