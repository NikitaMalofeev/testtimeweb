import axios from "axios";

export interface ProblemsRequestData {
    user_id?: string;
    screen: string;
    email?: string;
    phone?: string;
    is_phone_code_not_received?: boolean;
    is_email_code_not_received?: boolean;
    is_invalid_code_received?: boolean;
    description: string;
}

export interface ResetPasswordConfirm {
    user_id: string; // ID пользователя (обязательный)
    code: string; // Код подтверждения (обязательный)
    type?: string; // Способ подтверждения (необязательный, может быть только "phone" или "email")
    password: string; // Новый пароль (обязательный)
    password2: string; // Подтверждение пароля (обязательный)
}


const apiUrl = import.meta.env.VITE_RANKS_TEST_API_URL;

export const sendProblemsRequest = async (data: ProblemsRequestData, token: string) => {
    const response = await axios.post(`${apiUrl}create_doc_user/need_help/`, data, {
        headers: {
            "Accept-Language": "ru",
            "Content-Type": "application/json",
            "Authorization": `Token ${token}`
        },
    });
    return response.data;
};

export const resetPassword = async (data: ResetPasswordConfirm) => {
    const response = await axios.post(
        `${apiUrl}create_doc_user/confirm_reset_password/`,
        data,
        {
            headers: {
                "Accept-Language": "ru",
                "Content-Type": "application/json",
            },
        }
    );
    return response.data;
};

export const getUserId = async (data: { phone?: string; email?: string }) => {
    const response = await axios.post(
        `${apiUrl}create_doc_user/get_user_id/`,
        data,
        {
            headers: {
                "Accept-Language": "ru",
                "Content-Type": "application/json",
            },
        }
    );
    return response.data;
};
