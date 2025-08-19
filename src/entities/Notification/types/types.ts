/* -------------------------------------------------------------------------- */
/* TYPES: из backend + нормализация для UI                                    */
/* -------------------------------------------------------------------------- */

import { NotificationColor } from "features/Notifications/NotificationCard/NotificationCard";

/** Ровно как в сваггере: */
export type LkNotificationStatus =
    | 'notif_info'
    | 'notif_warning'
    | 'notif_error'
    | 'notif_success';

/** Что реально приходит от бэка (snake_case, флаги из БД) */
export interface ApiNotification {
    id: string;
    title?: string;
    description?: string;
    status: LkNotificationStatus;
    is_active: boolean;
    is_read: boolean;
    created?: string;   // сервер обычно шлёт строку
    route?: string;
}

/** Цвета для UI (производные от статуса) */
export type UiColor = 'blue' | 'yellow' | 'red' | 'green';

/** Нормализованный объект, который храним в Redux */
export interface Notification {
    id: string;
    title?: string;
    text?: string;
    status: LkNotificationStatus;
    isActive: boolean;
    isRead: boolean;
    created?: string;    // ISO string (как пришло)
    route?: string;
    color: NotificationColor;
}

/** Состояние редьюсера уведомлений */
export interface NotificationsState {
    notifications: Notification[];
    error: string | null;
    isLoading: boolean;
}

/** Маппинг статуса в цвет для UI */
export const statusToColor = (s: LkNotificationStatus): UiColor => {
    switch (s) {
        case 'notif_error':
            return 'red';
        case 'notif_success':
            return 'green';
        case 'notif_warning':
            return 'red';
        case 'notif_info':
            return 'blue';
        default:
            return 'blue';
    }
};
