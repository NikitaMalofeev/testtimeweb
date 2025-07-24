import axios from "axios";
import { ConfirmAllDocsPayload, ConfirmCustomDocsPayload, ConfirmDocsPayload } from "../types/documentsTypes";
import { ConfirmationCodeData, ConfirmationCustomDocsData, ConfirmationDocsData } from "entities/RiskProfile/model/types";

const envEnviroment = import.meta.env.VITE_ENVIROMENT;

let apiUrl: string;
let apiDocUrl: string;

switch (envEnviroment) {
    case "PROD":
        apiUrl = import.meta.env.VITE_RANKS_PROD_API_URL;
        apiDocUrl = import.meta.env.VITE_RANKS_PROD_API_DOC_URL;
        break;

    case "LOCAL":
        apiUrl = import.meta.env.VITE_RANKS_TEST_API_URL_LOCAL;
        apiDocUrl = import.meta.env.VITE_RANKS_TEST_API_DOC_URL_LOCAL;
        break;

    case "TEST":
    default:
        apiUrl = import.meta.env.VITE_RANKS_TEST_API_URL;
        apiDocUrl = import.meta.env.VITE_RANKS_TEST_API_DOC_URL;
        break;
}

export const confirmDocsRequest = async (data: ConfirmDocsPayload, token: string) => {
    const response = await axios.post(`${apiUrl}create_doc_user/sixth_signing_documents/`, data, {
        headers: {
            "Accept-Language": "ru",
            "Content-Type": "application/json",
            "Authorization": `Token ${token}`,
        },
    });
    return response.data;
};

export const confirmAllDocsRequest = async (data: ConfirmAllDocsPayload, token: string) => {
    const response = await axios.post(`${apiUrl}create_doc_user/sixth_signing_all_documents/`, data, {
        headers: {
            "Accept-Language": "ru",
            "Content-Type": "application/json",
            "Authorization": `Token ${token}`,
        },
    });
    return response.data;
};

export const postConfirmationCodeAllDocuments = async (data: ConfirmationDocsData, token: string) => {
    const response = await axios.post(`${apiUrl}create_doc_user/check_confirmation_code_all_documents/`, data, {
        headers: {
            "Accept-Language": "ru",
            "Content-Type": "application/json",
            "Authorization": `Token ${token}`,
        },
    });
    return response.data;
};

export const confirmTariffDocs = async (data: ConfirmDocsPayload, token: string) => {
    const response = await axios.post(`${apiUrl}create_doc_user/signing_tariff/`, data, {
        headers: {
            "Accept-Language": "ru",
            "Content-Type": "application/json",
            "Authorization": `Token ${token}`,
        },
    });
    return response.data;
};

export const confirmBrokerDocsRequest = async (data: ConfirmDocsPayload, token: string) => {
    const response = await axios.post(`${apiUrl}create_doc_user/eighth_signing_broker/`, { ...data }, {
        headers: {
            "Accept-Language": "ru",
            "Content-Type": "application/json",
            "Authorization": `Token ${token}`,
        },
    });
    return response.data;
};

export const getDocumentsState = async (token: string) => {
    const response = await axios.get(`${apiUrl}create_doc_user/get_user_documents_confirmed/`, {
        headers: {
            "Accept-Language": "ru",
            "Authorization": `Token ${token}`
        },
    });
    return response.data;
};

export const getDocumentsNotSigned = async (token: string) => {
    const response = await axios.get(`${apiUrl}create_doc_user/get_user_not_signed_documents_htmls/`, {
        headers: {
            "Accept-Language": "ru",
            "Authorization": `Token ${token}`
        },
    });
    return response.data;
};

export const getCustomDocumentsNotSigned = async (token: string, id_sign: string, type_document: string) => {
    const response = await axios.post(`${apiDocUrl}custom_documents/get_user_not_signed_document_html/`, { id_sign, type_document }, {
        headers: {
            "Accept-Language": "ru",
        },
    });
    return response.data;
};

export const getDocumentNotSigned = async (token: string, type_document: string) => {
    const response = await axios.post(`${apiUrl}create_doc_user/get_user_not_signed_document_html/`, { type_document: type_document }, {
        headers: {
            "Accept-Language": "ru",
            "Authorization": `Token ${token}`
        },
    });
    return response.data;
};

export const getDocumentsInfo = async (token: string) => {
    const response = await axios.get(`${apiUrl}create_doc_user/get_user_documents/`, {
        headers: {
            "Accept-Language": "ru",
            "Authorization": `Token ${token}`
        },
    });
    return response.data;
};

// export const getAllBrokers = async (token: string, is_confirmed_type_doc_agreement_transfer_broker: boolean) => {
//     const response = await axios.post(`${apiUrl}user_lk/get_all_brokers/`, { is_confirmed_type_doc_agreement_transfer_broker: is_confirmed_type_doc_agreement_transfer_broker, broker: ["tinkoff_brokers"] }, {
//         headers: {
//             "Accept-Language": "ru",
//             "Authorization": `Token ${token}`
//         },
//     });
//     return response.data;
// };

export const getAllBrokers = async (token: string, is_confirmed_type_doc_agreement_transfer_broker: boolean) => {
    const response = await axios.post(`${apiUrl}user_lk/get_all_brokers/`, { is_confirmed_type_doc_agreement_transfer_broker: is_confirmed_type_doc_agreement_transfer_broker, broker: "tinkoff_brokers" }, {
        headers: {
            "Accept-Language": "ru",
            "Authorization": `Token ${token}`
        },
    });
    return response.data;
};

export const getDocumentsSigned = async (type_document: string, token: string) => {
    const response = await axios.post(`${apiUrl}create_doc_user/get_signed_document/`, { type_document }, {
        headers: {
            "Accept-Language": "ru",
            "Authorization": `Token ${token}`,
            "Content-Type": "application/json",
        },
        responseType: "arraybuffer",
    });
    return response.data;
};

export const getCustomDocumentsSigned = async (id_sign: string, type_document: string) => {
    const response = await axios.post(`${apiDocUrl}custom_documents/get_signed_custom_document/`, { type_document, id_sign }, {
        headers: {
            "Accept-Language": "ru",
            "Content-Type": "application/json",
        },
        responseType: "arraybuffer",
    });
    return response.data;
};

export const confirmCustomDocsRequest = async (data: ConfirmCustomDocsPayload) => {
    const response = await axios.post(`${apiDocUrl}custom_documents/signing_document/`, data, {
        headers: {
            "Accept-Language": "ru",
            "Content-Type": "application/json",
        },
    });
    return response.data;
};

export const postConfirmationCodeCustom = async (data: ConfirmationCustomDocsData) => {
    const response = await axios.post(`${apiDocUrl}custom_documents/check_confirmation_code/`, data, {
        headers: {
            "Accept-Language": "ru",
            "Content-Type": "application/json",
        },
    });
    return response.data;
};

export const getBrokerDocumentsSigned = async (broker_id: string, token: string) => {
    const response = await axios.post(`${apiUrl}create_doc_user/get_signed_broker/`, { broker_id }, {
        headers: {
            "Accept-Language": "ru",
            "Authorization": `Token ${token}`,
            "Content-Type": "application/json",
        },
        responseType: "arraybuffer",
    });
    return response.data;
};