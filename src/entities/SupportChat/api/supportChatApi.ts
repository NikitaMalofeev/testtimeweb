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
    // data — объект с данными вопроса (например, { text: 'Вопрос', ... })
    const response = await axios.post(
        `${apiUrl}user_lk/ask_question/`,
        data,
        {
            headers: {
                Authorization: `Token ${token}`,
                "Content-Type": "application/json",
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
                "Content-Type": "application/json",
                "Authorization": `Token ${token}`,
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