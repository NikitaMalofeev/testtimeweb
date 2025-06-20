import axios from 'axios';
import {
    GetIirsUserResponse,
    GetIirHtmlPayload,
    RejectIirPayload,
    GetSignedIirPayload,
} from '../model/recomendationsTypes';

const envEnviroment = import.meta.env.VITE_ENVIROMENT;

let apiDocumentsUrl: string;

/* --- выбираем базовый URL в зависимости от окружения --- */
switch (envEnviroment) {
    case 'PROD':
        apiDocumentsUrl = import.meta.env.VITE_RANKS_PROD_API_DOC_URL;
        break;
    case 'LOCAL':
        apiDocumentsUrl = import.meta.env.VITE_RANKS_TEST_API_DOC_URL_LOCAL;
        break;
    case 'TEST':
    default:
        apiDocumentsUrl = import.meta.env.VITE_RANKS_TEST_API_DOC_URL;
        break;
}

/* ------------------------------------------------------------------ */
/* API-методы */
/* ------------------------------------------------------------------ */

// 1. Список всех IIR пользователя
export const getUserIirs = async (token: string) => {
    const { data } = await axios.get<GetIirsUserResponse>(
        `${apiDocumentsUrl}iir/get_iirs_user/`,
        {
            headers: {
                'Accept-Language': 'ru',
                Authorization: `Token ${token}`,
            },
        },
    );
    return data;
};

// 2. HTML неподписанного IIR
export const getUserNotSignedIirHtml = async (
    payload: GetIirHtmlPayload,
    token: string,
) => {
    const { data } = await axios.post(
        `${apiDocumentsUrl}iir/get_user_not_signed_iir_html/`,
        payload,
        {
            headers: {
                'Accept-Language': 'ru',
                'Content-Type': 'application/json',
                Authorization: `Token ${token}`,
            },
        },
    );
    return data;
};

// 3. Отклонить документ
export const rejectIirDocument = async (
    payload: RejectIirPayload,
    token: string,
) => {
    const { data } = await axios.post(
        `${apiDocumentsUrl}iir/reject_document/`,
        payload,
        {
            headers: {
                'Accept-Language': 'ru',
                'Content-Type': 'application/json',
                Authorization: `Token ${token}`,
            },
        },
    );
    return data;
};

// 4. Получить подписанный PDF
export const getSignedIirDocument = async (
    payload: GetSignedIirPayload,
    token: string,
) => {
    const { data } = await axios.post<ArrayBuffer>(
        `${apiDocumentsUrl}iir/get_signed_iir_document/`,
        payload,
        {
            headers: {
                'Accept-Language': 'ru',
                'Content-Type': 'application/json',
                Authorization: `Token ${token}`,
            },
            responseType: 'arraybuffer',
        },
    );
    return data;
};
