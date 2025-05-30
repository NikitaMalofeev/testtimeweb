import { Dispatch, Middleware } from "@reduxjs/toolkit";
import { AnyAction } from "redux-deep-persist/lib/types";
import { FLUSH, PAUSE, PERSIST, PURGE, REGISTER, REHYDRATE } from "redux-persist";

// --- BroadcastChannel-based cross-tab synchronization ---
const CHANNEL_NAME = 'redux_broadcast_channel';
const bc = new BroadcastChannel(CHANNEL_NAME);
// Список типов действий, которые не нужно синхронизировать
const IGNORE_ACTIONS = [
    FLUSH,
    REHYDRATE,
    PAUSE,
    PERSIST,
    PURGE,
    REGISTER,
];

export const broadcastSyncMiddleware: Middleware = storeAPI => next => (action: any) => {
    const result = next(action);
    // фильтруем исходящие действия
    if (
        !action.meta?.__fromBroadcast &&
        typeof action.type === 'string' &&
        !IGNORE_ACTIONS.includes(action.type as any)
    ) {
        // готовим к отправке только клонируемые поля
        const { type, payload, meta } = action;
        const msg: AnyAction = {
            type,
            ...(payload !== undefined ? { payload } : {}),
            meta: { ...meta, __fromBroadcast: true },
        };
        try {
            bc.postMessage(msg);
        } catch (err) {
            // если не удалось клонировать (например, функции) — пропускаем
        }
    }
    return result;
};

export function initBroadcastListener(dispatch: Dispatch<AnyAction>) {
    bc.onmessage = (msg: MessageEvent) => {
        const action = msg.data as AnyAction;
        if (action.meta?.__fromBroadcast) {
            dispatch({ ...action, meta: { ...action.meta, __fromBroadcast: true } });
        }
    };
}