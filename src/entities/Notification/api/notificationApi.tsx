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

/* ----------------------------- Параметры API ------------------------------ */

export interface GetAllNotificationsParams {
    status?: LkNotificationStatus;
    is_active?: boolean; // серверное — но мы им не пользуемся в UI
    is_read?: boolean;
}

export interface UpdateAllNotificationsParams {
    // Фильтры и «что поменять» — как в сваггере
    status?: LkNotificationStatus;
    id?: string;
    is_read?: boolean;       // критерий (на что смотреть)
    edit_is_read?: boolean;  // что проставить
}

/* ----------------------------- Утилиты ------------------------------------ */

function extractArray<T = unknown>(data: any): T[] {
    if (Array.isArray(data)) return data as T[];
    if (Array.isArray(data?.results)) return data.results as T[];
    if (Array.isArray(data?.items)) return data.items as T[];
    if (Array.isArray(data?.data)) return data.data as T[];
    return [];
}

/** Нормализация api -> ui-модель (snake_case; локальный is_active = false) */
export function normalizeNotifications(list: ApiNotification[]): any[] {
    return list.map((n) => ({
        id: n.id,
        title: n.title ?? '',
        text: n.text ?? '',
        status: n.status,
        color: n.color ?? statusToColor(n.status),
        created: n.created,
        is_read: !!n.is_read,
        // ВАЖНО: флаг «круга» (попап) — чисто локальный.
        // Игнорируем все, что пришло с бэка:
        is_active: false,
    }));
}

/* ----------------------------- Запросы ------------------------------------ */

export const getAllNotifications = async (
    token: string,
    _params: GetAllNotificationsParams = {}
): Promise<Notification[]> => {
    const { data } = await axios.post(
        `${apiUrl}user_lk/get_all_notifications/`,
        {}, // по сваггеру — без тела/или с фильтрами, если понадобятся
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
