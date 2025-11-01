import axios, { AxiosError, AxiosInstance } from 'axios';
import { store } from 'app/providers/store/config/store';
import { logoutUser } from 'entities/User/slice/userSlice';
import { closeAllModals } from 'entities/ui/Modal/slice/modalSlice';

const envEnviroment = import.meta.env.VITE_ENVIROMENT;
let apiUrl: string;

switch (envEnviroment) {
    case "PROD":
        apiUrl = import.meta.env.VITE_RANKS_PROD_API_URL;
        break;

    case "LOCAL":
        apiUrl = import.meta.env.VITE_RANKS_TEST_API_URL_LOCAL;
        break;

    case "TEST":
    default:
        apiUrl = import.meta.env.VITE_RANKS_TEST_API_URL;
        break;
}

export { apiUrl };

// Эндпоинты, где 401 ошибка является нормальной (login, registration и т.д.)
const PUBLIC_ENDPOINTS = [
    '/create_doc_user/login/',
    '/create_doc_user/registration/',
    '/create_doc_user/get_user_id/',
    '/create_doc_user/confirm_reset_password/',
    '/create_doc_user/need_help_not_auth/',
];

// Проверяем, является ли эндпоинт публичным
const isPublicEndpoint = (url: string): boolean => {
    return PUBLIC_ENDPOINTS.some(endpoint => url.includes(endpoint));
};

/**
 * Создаем отдельный экземпляр axios для User API с автологаутом при 401
 */
export const createUserAxiosInstance = (): AxiosInstance => {
    const instance = axios.create({
        baseURL: apiUrl,
        headers: {
            'Accept-Language': 'ru',
            'Content-Type': 'application/json',
        },
    });

    // Response interceptor - обрабатываем ответы и ошибки
    instance.interceptors.response.use(
        (response) => response,
        async (error: AxiosError) => {
            const originalRequest = error.config;

            if (!originalRequest) {
                return Promise.reject(error);
            }

            // Проверяем, является ли эндпоинт публичным
            const isPublic = isPublicEndpoint(originalRequest.url || '');

            // Если получили 401 ошибку на защищенном эндпоинте
            if (error.response?.status === 401 && !isPublic) {
                const token = store.getState().user.token;

                // Дополнительная проверка: если у нас есть токен в store,
                // но сервер вернул 401, значит токен недействителен
                if (token) {
                    console.warn('[User API] Токен недействителен (401), выполняется автоматический logout');

                    // Выполняем logout
                    await store.dispatch(logoutUser() as any);
                    await store.dispatch(closeAllModals());

                    // Перенаправляем на главную страницу
                    if (typeof window !== 'undefined' && window.location.pathname !== '/') {
                        window.location.href = '/';
                    }
                }
            }

            return Promise.reject(error);
        }
    );

    return instance;
};

// Экземпляр axios для User API
export const userAxiosInstance = createUserAxiosInstance();
