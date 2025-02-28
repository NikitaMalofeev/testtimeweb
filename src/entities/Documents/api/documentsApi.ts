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

export const getDocumentsState = async (token: string) => {
    const response = await axios.get(`${apiUrl}create_doc_user/get_user_documents_confirmed/`, {
        headers: {
            "Accept-Language": "ru",
            "Authorization": `Token ${token}`
        },
    });
    return response.data;
};
