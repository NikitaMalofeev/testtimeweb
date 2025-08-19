import axios from 'axios';
import {
    ApiNotification,
    LkNotificationStatus,
    Notification,
    statusToColor,
} from '../types/types';

const envEnviroment = import.meta.env.VITE_ENVIROMENT;

let apiUrl: string;
switch (envEnviroment) {
    case 'PROD':
        apiUrl = import.meta.env.VITE_RANKS_PROD_API_URL;
        break;
    case 'LOCAL':
        apiUrl = import.meta.env.VITE_RANKS_TEST_API_URL_LOCAL;
        break;
    case 'TEST':
    default:
        apiUrl = import.meta.env.VITE_RANKS_TEST_API_URL;
        break;
}

/* ----------------------------- Запросы к API ------------------------------ */

/** Параметры из сваггера для POST body */
export interface GetAllNotificationsParams {
    status?: LkNotificationStatus; // notif_info | notif_warning | notif_error | notif_success
    is_active?: boolean;
    is_read?: boolean;
}

export interface UpdateAllNotificationsParams {
    edit_status?: LkNotificationStatus; // notif_info | notif_warning | notif_error | notif_success
    edit_is_active?: boolean;
    edit_is_read?: boolean;
}

/** Универсальный экстрактор массива из ответа (на случай разных обёрток) */
function extractArray<T = unknown>(data: any): T[] {
    if (Array.isArray(data)) return data as T[];
    if (Array.isArray(data?.results)) return data.results as T[];
    if (Array.isArray(data?.items)) return data.items as T[];
    if (Array.isArray(data?.data)) return data.data as T[];
    return [];
}

/** Нормализация api -> ui-модель для Redux */
export function normalizeNotifications(list: ApiNotification[]): any[] {
    return list.map((n) => ({
        id: n.id,
        title: n.title,
        description: n.description,
        status: n.status,
        isActive: !!n.is_active,
        isRead: !!n.is_read,
        created: n.created,
        route: n.route,
        color: statusToColor(n.status),
        shown: false,
    }));
}

/** Получить все уведомления (POST body как на скрине) */
export const getAllNotifications = async (
    token: string,
    params: GetAllNotificationsParams = {}
): Promise<Notification[]> => {
    const { data } = await axios.post(
        `${apiUrl}user_lk/get_all_notifications/`,
        {}, // <— body по сваггеру
        {
            headers: {
                'Accept-Language': 'ru',
                Authorization: `Token ${token}`,
            },
        }
    );

    const raw = extractArray<ApiNotification>(data);
    return normalizeNotifications(raw);
};

export const updateAllNotifications = async (
    token: string,
    params: UpdateAllNotificationsParams = {}
): Promise<Notification[]> => {
    const { data } = await axios.post(
        `${apiUrl}user_lk/update_all_notifications/`,
        { ...params },
        {
            headers: {
                'Accept-Language': 'ru',
                Authorization: `Token ${token}`,
            },
        }
    );

    const raw = extractArray<ApiNotification>(data);
    return normalizeNotifications(raw);
};
