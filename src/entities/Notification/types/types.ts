
/* -------------------------------------------------------------------------- */
/* TYPES */
/* -------------------------------------------------------------------------- */

export type NotificationStatus = 'unread' | 'read' | 'archived';

export interface Notification {
    id: string;
    title?: string;
    description?: string;
    status: NotificationStatus;
    color: 'red' | 'blue' | 'green';
    createdAt?: string | Date;
    shown?: boolean; // <-- добавили флаг "показано"
}


export interface NotificationsState {
    notifications: Notification[];   // массив уведомлений (как просили)
    error: string | null;
    isLoading: boolean;
}

