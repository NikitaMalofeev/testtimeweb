import axios from "axios";
import { ConfirmDocsPayload } from "../types/documentsTypes";

const apiUrl = import.meta.env.VITE_RANKS_TEST_API_URL;

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