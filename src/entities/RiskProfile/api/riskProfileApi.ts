import axios from "axios";
import { IdentificationProfileData, ConfirmationCodeData, NeedHelpData, TrustedPersonInfo, SecondRiskProfilePayload, PasportFormData, ConfirmationDocsData, BrokerSetTokenPayload, OtherBrokerPayload, LegalFormData, LegalDataFormRequest } from "entities/RiskProfile/model/types";
import { PasportScanData } from "features/RiskProfile/PassportScanForm/PassportScanForm";


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


export const postIdentificationData = async (data: IdentificationProfileData) => {
    const response = await axios.post(`${apiUrl}create_doc_user/first_primary_data/`, data, {
        headers: {
            "Accept-Language": "ru",
            "Content-Type": "application/json",
        },
    });
    return response.data;
};

export const postConfirmationCodeWithoutId = async (data: ConfirmationCodeData) => {
    const response = await axios.post(`${apiUrl}create_doc_user/check_confirmation_code/`, data, {
        headers: {
            "Accept-Language": "ru",
            "Content-Type": "application/json",
        },
    });
    return response.data;
};

export const postConfirmationCode = async (data: ConfirmationCodeData) => {
    const response = await axios.post(`${apiUrl}create_doc_user/check_confirmation_code_id/`, data, {
        headers: {
            "Accept-Language": "ru",
            "Content-Type": "application/json",
        },
    });
    return response.data;
};

export const postConfirmationDocsCode = async (data: ConfirmationDocsData, token: string) => {
    const response = await axios.post(`${apiUrl}create_doc_user/check_confirmation_code/`, data, {
        headers: {
            "Accept-Language": "ru",
            "Content-Type": "application/json",
            "Authorization": `Token ${token}`,
        },
    });
    return response.data;
};

export const postConfirmationCodeLegal = async (data: ConfirmationDocsData, token: string) => {
    const response = await axios.post(`${apiUrl}create_doc_user/check_confirmation_code_legal/`, data, {
        headers: {
            "Accept-Language": "ru",
            "Content-Type": "application/json",
            "Authorization": `Token ${token}`,
        },
    });
    return response.data;
};

export const postBrokerConfirmationDocsCode = async (data: ConfirmationDocsData, token: string) => {
    const response = await axios.post(`${apiUrl}create_doc_user/check_broker_confirmation_code/`, data, {
        headers: {
            "Accept-Language": "ru",
            "Content-Type": "application/json",
            "Authorization": `Token ${token}`,
        },
    });
    return response.data;
};

export const postPasportData = async (data: PasportFormData, token: string) => {
    const response = await axios.post(`${apiUrl}create_doc_user/fourth_passport/`, data, {
        headers: {
            "Accept-Language": "ru",
            "Content-Type": "application/json",
            "Authorization": `Token ${token}`,
        },
    });
    return response.data;
};

export const postPasportScanData = async (data: FormData, token: string) => {
    const response = await axios.post(`${apiUrl}create_doc_user/fifth_passport_scan/`, data, {
        headers: {
            "Accept-Language": "ru",
            "Authorization": `Token ${token}`,
        },
    });
    return response.data;
};

export const postINNScanData = async (data: FormData, token: string) => {
    const response = await axios.post(`${apiUrl}create_doc_user/fifth_person_legal_scan/`, data, {
        headers: {
            "Accept-Language": "ru",
            "Authorization": `Token ${token}`,
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

export const postResendConfirmationCodeLegal = async (data: any) => {
    const response = await axios.post(
        `${apiUrl}create_doc_user/update_confirmation_code_legal_person/`,
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

export const postNeedHelpRequest = async (data: NeedHelpData, token: string) => {
    const response = await axios.post(`${apiUrl}create_doc_user/need_help/`, data, {
        headers: {
            "Accept-Language": "ru",
            "Content-Type": "application/json",
            "Authorization": `Token ${token}`
        },
    });
    return response.data;
};

export const postTrustedPersonInfoApi = async (data: TrustedPersonInfo, token: string) => {
    const response = await axios.post(
        `${apiUrl}create_doc_user/second_part_save_trusted_person/`,
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

export const postFirstRiskProfileLegal = async (data: Record<string, string | boolean>, token: string) => {
    const response = await axios.post(
        `${apiUrl}create_doc_user/second_risk_profiling_person_legal/`,
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


export const postLegalInfoForm = async (data: LegalDataFormRequest, token: string) => {
    const response = await axios.post(`${apiUrl}create_doc_user/fourth_person_legal/`, data, {
        headers: { Authorization: `Token ${token}` },
    });
    return response.data; // { group_name_upload_scans_progress?: string, ... }
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

export const postSecondRiskProfileFinal = async (data: SecondRiskProfilePayload, token: string) => {
    const response = await axios.post(
        `${apiUrl}create_doc_user/third_risk_profiling_add_more_info_final/`,
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

export const postBrokerApiToken = async (data: BrokerSetTokenPayload | OtherBrokerPayload, token: string, isOther?: boolean) => {
    // Используем разные эндпоинты в зависимости от типа брокера
    const endpoint = isOther
        ? `${apiUrl}create_doc_user/seventh_set_broker_token/`  // Для других брокеров (без токена)
        : `${apiUrl}create_doc_user/seventh_set_broker_token/`;  // Для Тинькофф (с токеном)

    const response = await axios.post(
        endpoint,
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
}

// export const getGroupWsForScan = async (token: string) => {
//     const response = await axios.post(
//         `${apiUrl}create_doc_user/get_group_ws/`,
//         { group_ws: "wsg_upload_scans_progress" },
//         {
//             headers: {
//                 Authorization: `Token ${token}`,
//                 "Content-Type": "application/json",
//             },
//         }
//     );
//     return response.data;
// };

export const getStepScrollAmount = async (token: string) => {
    const response = await axios.get(`${apiUrl}create_doc_user/get_step_scroll_amount/`, {
        headers: {
            "Accept-Language": "ru",
            "Authorization": `Token ${token}`,
        },
    });
    return response.data;
};

export const getSymbolsCurrencies = async (token: string) => {
    const response = await axios.get(`${apiUrl}create_doc_user/get_symbols_currencies`, {
        headers: {
            "Accept-Language": "ru",
            "Authorization": `Token ${token}`,
        },
    });
    return response.data;
};

export const getActiveCurrencies = async (token: string) => {
    const response = await axios.get(`${apiUrl}create_doc_user/get_active_currencies`, {
        headers: {
            "Accept-Language": "ru",
            "Authorization": `Token ${token}`,
        },
    });
    return response.data;
};

// ==============================================
// BROKER API FUNCTIONS
// ==============================================

export const firstSelectBroker = async (data: { broker: string }, token: string) => {
    const response = await axios.post(`${apiUrl}brokers_user/first_select_broker/`, data, {
        headers: {
            "Accept-Language": "ru",
            "Content-Type": "application/json",
            "Authorization": `Token ${token}`,
        },
    });
    return response.data;
};

export const getNotSignedBrokerGetDoc = async (data: { broker_id: string; type_document: string }, token: string) => {
    const response = await axios.post(`${apiUrl}brokers_user/get_not_signed_broker_get_doc/`, data, {
        headers: {
            "Accept-Language": "ru",
            "Content-Type": "application/json",
            "Authorization": `Token ${token}`,
        },
    });
    return response.data;
};

export const secondSigningDocuments = async (data: { broker_id: string; is_agree: boolean; type_document: string }, token: string) => {
    const response = await axios.post(`${apiUrl}brokers_user/second_signing_documents/`, data, {
        headers: {
            "Accept-Language": "ru",
            "Content-Type": "application/json",
            "Authorization": `Token ${token}`,
        },
    });
    return response.data;
};

export const checkBrokerConfirmationCode = async (data: { broker_id: string; type_document: string; code: string }, token: string) => {
    const response = await axios.post(`${apiUrl}brokers_user/check_broker_confirmation_code/`, data, {
        headers: {
            "Accept-Language": "ru",
            "Content-Type": "application/json",
            "Authorization": `Token ${token}`,
        },
    });
    return response.data;
};

export const thirdSetBrokerToken = async (data: { broker_id: string; token: string }, token: string) => {
    const response = await axios.post(`${apiUrl}brokers_user/third_set_broker_token/`, data, {
        headers: {
            "Accept-Language": "ru",
            "Content-Type": "application/json",
            "Authorization": `Token ${token}`,
        },
    });
    return response.data;
};

export const getSignedBrokerGetDoc = async (data: { broker_id: string; type_document: string }, token: string) => {
    const response = await axios.post(`${apiUrl}brokers_user/get_signed_broker_get_doc/`, data, {
        headers: {
            "Accept-Language": "ru",
            "Content-Type": "application/json",
            "Authorization": `Token ${token}`,
        },
        responseType: 'arraybuffer',
    });
    return response.data;
};

