import axios from "axios";
import { ProblemsRequestData, ResetPasswordConfirm, UserLogin } from "../types/userTypes";


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


export const getAllUserInfo = async (token: string) => {
    const response = await axios.get(`${apiUrl}create_doc_user/get_user_info/`, {
        headers: {
            "Accept-Language": "ru",
            "Authorization": `Token ${token}`
        },
    });
    return response.data;
};
export const getUserPersonalAccountInfo = async (token: string) => {
    const response = await axios.get(`${apiUrl}create_doc_user/get_user_mini_info/`, {
        headers: {
            "Accept-Language": "ru",
            "Authorization": `Token ${token}`
        },
    });
    return response.data;
};

export const userLogin = async (data: UserLogin) => {
    const response = await axios.post(`${apiUrl}create_doc_user/login/`, data, {
        headers: {
            "Accept-Language": "ru",
            "Content-Type": "application/json",
        },
    });
    return response.data;
};

export const setPersonType = async (type_person: string) => {
    const response = await axios.post(`${apiUrl}create_doc_user/set_type_person/`, { type_person }, {
        headers: {
            "Accept-Language": "ru",
            "Content-Type": "application/json",
        },
    });
    return response.data;
};



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

export const sendProblemsRequestNotAuth = async (data: ProblemsRequestData) => {
    const response = await axios.post(`${apiUrl}create_doc_user/need_help_not_auth/`, data, {
        headers: {
            "Accept-Language": "ru",
            "Content-Type": "application/json",
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

export const getUserId = async (data: { phone?: string; email?: string, whatsapp?: string }) => {
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


//для тестирования
export const deleteUserTariffs = async (token: string) => {
    const response = await axios.post(
        `${apiUrl}dev/reset_payments_user/`, {},
        {
            headers: {
                "Accept-Language": "ru",
                "Content-Type": "application/json",
                "Authorization": `Token ${token}`

            },

        }
    );
    return response.data;
};