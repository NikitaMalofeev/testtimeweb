import axios from "axios";
import { IdentificationProfileData, ConfirmationCodeData, NeedHelpData, TrustedPersonInfo } from "entities/RiskProfile/model/types";
import { SecondRiskProfilePayload } from "entities/RiskProfile/slice/riskProfileSlice";

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

export const postResendConfirmationCode = async (data: any) => {
    const response = await axios.post(
        `${apiUrl}create_doc_user/update_confirmation_code_id/`,
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

export const postNeedHelpRequest = async (data: NeedHelpData) => {
    const response = await axios.post(`${apiUrl}create_doc_user/need_help/`, data, {
        headers: {
            "Accept-Language": "ru",
            "Content-Type": "application/json",
        },
    });
    return response.data;
};

export const postTrustedPersonInfoApi = async (data: TrustedPersonInfo, token: string) => {
    const response = await axios.post(
        `${apiUrl}create_doc_user/second_rpart_save_trusted_person/`,
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

export const postFirstRiskProfile = async (data: Record<string, string | boolean>, token: string) => {
    const response = await axios.post(
        `${apiUrl}create_doc_user/second_risk_profiling/`,
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

export const postSecondRiskProfile = async (data: SecondRiskProfilePayload, token: string) => {
    const response = await axios.post(
        `${apiUrl}create_doc_user/third_risk_profiling_add_more_info/`,
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


export const getAllSelects = async () => {
    const response = await axios.get(`${apiUrl}create_doc_user/get_all_selects/`, {
        headers: {
            "Accept-Language": "ru",
        },
    });
    return response.data;
};
