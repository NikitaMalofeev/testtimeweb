import axios from "axios";

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

export default apiUrl;

// WebSocket URL configuration
const envEnvironment = import.meta.env.VITE_ENVIROMENT;
let wsUrl: string;

switch (envEnvironment) {
    case "PROD":
        wsUrl = import.meta.env.VITE_RANKS_PROD_WS_URL;
        break;

    case "LOCAL":
        wsUrl = import.meta.env.VITE_RANKS_TEST_WS_URL_LOCAL;
        break;

    case "TEST":
    default:
        wsUrl = import.meta.env.VITE_RANKS_TEST_WS_URL;
        break;
}

export const getWebSocketUrl = () => wsUrl;


// Пример существующей функции
export const getGroupWs = async (token: string) => {
    const response = await axios.post(
        `${apiUrl}create_doc_user/get_group_ws/`,
        { group_ws: "wsg_support_chat" },
        {
            headers: {
                Authorization: `Token ${token}`,
                "Content-Type": "application/json",
            },
        }
    );
    return response.data;
};

// 1) POST-запрос на ручку /main/user_lk/ask_question/
export const askQuestion = async (data: any, token: string) => {
    // data — объект с данными вопроса (например, { text: 'Вопрос', text_for_files: 'Текст с файлами', files: [...] })
    const response = await axios.post(
        `${apiUrl}user_lk/ask_question/`,
        data,
        {
            headers: {
                Authorization: `Token ${token}`,
                // Для multipart данных не устанавливаем Content-Type
                ...(data instanceof FormData ? {} : { "Content-Type": "application/json" }),
            },
        }
    );
    return response.data;
};

// 2) GET-запрос на ручку /main/user_lk/get_all_question/
export const getAllQuestions = async (token: string) => {
    const response = await axios.get(
        `${apiUrl}user_lk/get_all_question/`,
        {
            headers: {
                Authorization: `Token ${token}`,
                "Content-Type": "application/json",
            },
        }
    );
    return response.data;
};


export const postChatMessage = async (data: any, token: string) => {
    const response = await axios.post(
        `${apiUrl}user_lk/ask_question/`,
        data,
        {
            headers: {
                "Accept-Language": "ru",
                "Authorization": `Token ${token}`,
                // Для multipart данных не устанавливаем Content-Type
                ...(data instanceof FormData ? {} : { "Content-Type": "application/json" }),
            },
        }
    );
    return response.data;
};



export const getAllMessages = async (token: string) => {
    const response = await axios.get(`${apiUrl}user_lk/get_all_question/`, {
        headers: {
            "Accept-Language": "ru",
            "Authorization": `Token ${token}`,
        },
    });
    return response.data;
};

// Новая функция для получения файлов сообщения по ID и индексу
export const getFileByQuestionIdAndIndex = async (id: number, index: number, token: string) => {
    const response = await axios.get(
        `${apiUrl}user_lk/get_files_question/?id=${id}&index=${index}`,
        {
            headers: {
                "Accept-Language": "ru",
                "Authorization": `Token ${token}`,
            },
            responseType: 'blob', // Важно для получения файла как blob
        }
    );
    return response.data;
};

// Функция для получения настроек чата
export const getChatSettings = async (token: string) => {
    const response = await axios.get(
        `${apiUrl}user_lk/get_feedback_settings/`,
        {
            headers: {
                "Accept-Language": "ru",
                "Authorization": `Token ${token}`,
                "Content-Type": "application/json",
            },
        }
    );
    return response.data;
};

// Функция для получения уведомлений чата (непрочитанные ответы поддержки)
export const getChatNotifications = async (token: string) => {
    const response = await axios.get(
        `${apiUrl}user_lk/get_all_question/?is_answer=true&is_read=true`,
        {
            headers: {
                "Accept-Language": "ru",
                "Authorization": `Token ${token}`,
            },
        }
    );
    return response.data;
};