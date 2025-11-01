import { userAxiosInstance, apiUrl } from "shared/api/axiosConfig";
import { ProblemsRequestData, ResetPasswordConfirm, UserLogin } from "../types/userTypes";

export default apiUrl;

export const getAllUserInfo = async (token: string) => {
    const response = await userAxiosInstance.get(`create_doc_user/get_user_info/`, {
        headers: {
            "Authorization": `Token ${token}`
        }
    });
    return response.data;
};

export const getUserPersonalAccountInfo = async (token: string) => {
    const response = await userAxiosInstance.get(`create_doc_user/get_user_mini_info/`, {
        headers: {
            "Authorization": `Token ${token}`
        }
    });
    return response.data;
};

export const userLogin = async (data: UserLogin) => {
    const response = await userAxiosInstance.post(`create_doc_user/login/`, data);
    return response.data;
};

export const setPersonType = async (type_person: string) => {
    const response = await userAxiosInstance.post(`create_doc_user/set_type_person/`, { type_person });
    return response.data;
};



export const sendProblemsRequest = async (data: ProblemsRequestData, token: string) => {
    const response = await userAxiosInstance.post(`create_doc_user/need_help/`, data, {
        headers: {
            "Authorization": `Token ${token}`
        }
    });
    return response.data;
};

export const sendProblemsRequestNotAuth = async (data: ProblemsRequestData) => {
    const response = await userAxiosInstance.post(`create_doc_user/need_help_not_auth/`, data);
    return response.data;
};

export const resetPassword = async (data: ResetPasswordConfirm) => {
    const response = await userAxiosInstance.post(`create_doc_user/confirm_reset_password/`, data);
    return response.data;
};

export const getUserId = async (data: { phone?: string; email?: string, whatsapp?: string }) => {
    const response = await userAxiosInstance.post(`create_doc_user/get_user_id/`, data);
    return response.data;
};

//для тестирования
export const deleteUserTariffs = async (token: string) => {
    const response = await userAxiosInstance.post(`dev/reset_payments_user/`, {}, {
        headers: {
            "Authorization": `Token ${token}`
        }
    });
    return response.data;
};

export const getAllCountryCodes = async () => {
    const response = await userAxiosInstance.get(`create_doc_user/get_all_codes_countres/`);
    return response.data;
};