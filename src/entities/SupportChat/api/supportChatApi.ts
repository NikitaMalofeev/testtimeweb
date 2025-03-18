import axios from "axios";

const apiUrl = import.meta.env.VITE_RANKS_TEST_API_URL;

// Пример существующей функции
export const getGroupWs = async () => {
    const response = await axios.post(
        `${apiUrl}/main/create_doc_user/get_group_ws/`,
        { group_ws: "wsg_support_chat" },
        {
            headers: {
                Authorization: "Token 808fe060b46a34eeef760a0af6828b85d2cdc7f4",
                "Content-Type": "application/json",
            },
        }
    );
    return response.data;
};

// 1) POST-запрос на ручку /main/user_lk/ask_question/
export const askQuestion = async (data: any) => {
    // data — объект с данными вопроса (например, { text: 'Вопрос', ... })
    const response = await axios.post(
        `${apiUrl}/main/user_lk/ask_question/`,
        data,
        {
            headers: {
                Authorization: "Token 808fe060b46a34eeef760a0af6828b85d2cdc7f4",
                "Content-Type": "application/json",
            },
        }
    );
    return response.data;
};

// 2) GET-запрос на ручку /main/user_lk/get_all_question/
export const getAllQuestions = async () => {
    const response = await axios.get(
        `${apiUrl}/main/user_lk/get_all_question/`,
        {
            headers: {
                Authorization: "Token 808fe060b46a34eeef760a0af6828b85d2cdc7f4",
                "Content-Type": "application/json",
            },
        }
    );
    return response.data;
};
