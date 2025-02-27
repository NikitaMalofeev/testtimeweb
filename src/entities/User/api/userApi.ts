import axios from "axios";
import { UserLogin } from "../types/userTypes";

const apiUrl = import.meta.env.VITE_RANKS_TEST_API_URL;

export const getAllUserInfo = async () => {
    const response = await axios.get(`${apiUrl}create_doc_user/get_user_info/`, {
        headers: {
            "Accept-Language": "ru",
            "Authorization": 'Token 8228931bbdf90910cbe8babf92dc937e2366e1bf'
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
