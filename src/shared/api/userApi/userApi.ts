import axios from "axios";

export interface ProblemsRequestData {
    user_id?: string;
    screen: string;
    email: string;
    phone: string;
    is_phone_code_not_received: boolean;
    is_email_code_not_received: boolean;
    is_invalid_code_received: boolean;
    description: string;
}

const apiUrl = import.meta.env.VITE_RANKS_TEST_API_URL;

export const sendProblemsRequest = async (data: ProblemsRequestData) => {
    const response = await axios.post(`${apiUrl}create_doc_user/need_help/`, data, {
        headers: {
            "Accept-Language": "ru",
            "Content-Type": "application/json",
        },
    });
    return response.data;
};
