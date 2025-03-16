import axios from "axios";

const apiUrl = import.meta.env.VITE_RANKS_TEST_API_URL;


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