import axios from "axios";
import { IdentificationProfileData, ConfirmationCodeData, NeedHelpData } from "entities/RiskProfile/model/types";

const apiUrl = import.meta.env.VITE_RANKS_TEST_API_URL;

export const postIdentificationData = async (data: IdentificationProfileData) => {
    const response = await axios.post(`${apiUrl}create_doc_user/first_primary_data/`, data, {
        headers: {
            "Accept-Language": "ru",
            "Content-Type": "application/json",
        },
    });
    return response.data;
};

export const postConfirmationCode = async (data: ConfirmationCodeData) => {
    const response = await axios.post(`${apiUrl}create_doc_user/check_confirmation_code/`, data, {
        headers: {
            "Accept-Language": "ru",
            "Content-Type": "application/json",
        },
    });
    return response.data;
};

export const postNeedHelpRequest = async (data: NeedHelpData) => {
    const response = await axios.post(`${apiUrl}create_doc_user/need_help/`, data, {
        headers: {
            "Accept-Language": "ru",
            "Content-Type": "application/json",
        },
    });
    return response.data;
};
