// documentsSlice.ts

import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "app/providers/store/config/store";
import { ConfirmDocsPayload } from "../types/documentsTypes";
import { confirmDocsRequest, getDocumentsNotSigned, getDocumentsSigned, getDocumentsState } from "../api/documentsApi";
import { setCurrentConfirmingDoc } from "entities/RiskProfile/slice/riskProfileSlice";
import { setConfirmationDocsSuccess } from "entities/ui/Ui/slice/uiSlice";
import { setError } from "entities/Error/slice/errorSlice";
import { SendCodeDocsConfirmPayload } from "entities/RiskProfile/model/types";
import { postConfirmationDocsCode } from "shared/api/RiskProfileApi/riskProfileApi";

// Новый тип, соответствующий элементам из "confirmed_documents"
export interface DocumentConfirmationInfo {
    key: string;
    date_last_confirmed: string | null; // null, если документ не подписан
}

// Массив с последовательностью типов документов,
// которые необходимо подписать по порядку (меняется редко).
export const docTypes = [
    "type_doc_RP_questionnairy",
    "type_doc_passport",
    "type_doc_EDS_agreement",
    "type_doc_agreement_investment_advisor",
    "type_doc_risk_declarations",
    "type_doc_agreement_personal_data_policy",
    "type_doc_investment_profile_certificate"
];

// Лейблы для UI.
export const docTypeLabels: Record<string, string> = {
    type_doc_passport: "Паспорт",
    type_doc_EDS_agreement: "Соглашение об ЭДО",
    type_doc_RP_questionnairy: "Анкета РП",
    type_doc_agreement_investment_advisor: "Договор ИС",
    type_doc_risk_declarations: "Декларация о рисках",
    type_doc_agreement_personal_data_policy: "Политика перс. данных",
    type_doc_investment_profile_certificate: "Справка ИП",
};

interface DocumentsState {
    loading: boolean;
    error: string | null;
    success: boolean;
    currentConfirmableDoc: string;  // Текущий документ на подписании
    confirmationMethod: string;
    // Заменяем notConfirmedDocuments (string[]) на хранение всего массива:
    userDocuments: DocumentConfirmationInfo[];
    timeoutBetweenConfirmation: number;
    allNotSignedDocumentsHtml: Record<string, string> | null;
    allSignedDocuments: Record<string, string> | null;
}

const initialState: DocumentsState = {
    loading: false,
    error: null,
    success: false,
    currentConfirmableDoc: docTypes[0],
    confirmationMethod: 'EMAIL',
    timeoutBetweenConfirmation: 0,
    allNotSignedDocumentsHtml: null,
    allSignedDocuments: null,
    userDocuments: [] // теперь тут храним объекты
};

export const confirmDocsRequestThunk = createAsyncThunk<
    void,
    { data: ConfirmDocsPayload; onSuccess: () => void },
    { rejectValue: string; state: RootState }
>(
    "documents/confirmDocsRequestThunk",
    async (
        { data: { type_message, type_document, is_agree }, onSuccess },
        { getState, dispatch, rejectWithValue }
    ) => {
        try {
            const token = getState().user.token;
            if (!token) {
                return rejectWithValue("Отсутствует токен авторизации");
            }
            if (type_document && type_message) {
                const responseDocs = await confirmDocsRequest(
                    { type_message, type_document, is_agree },
                    token
                );
                dispatch(setTimeoutBetweenConfirmation(responseDocs.timeinterval_sms))
                onSuccess?.();
                return responseDocs;
            }
        } catch (error: any) {
            dispatch(setConfirmationDocsSuccess("не пройдено"));
            console.log(error);
            const msg =
                error.response?.data?.errorText ||
                "Ошибка при отправке кода (непредвиденная)";
            dispatch(setError(msg));
        }
    }
);

export const sendDocsConfirmationCode = createAsyncThunk<
    void,
    SendCodeDocsConfirmPayload,
    { rejectValue: string; state: RootState }
>(
    "documents/sendDocsConfirmationCode",
    async ({ codeFirst, docs, onSuccess }, { getState, dispatch, rejectWithValue }) => {
        try {
            const token = getState().user.token;
            if (!token) {
                return rejectWithValue("Отсутствует токен авторизации");
            }
            if (codeFirst) {
                const responseDocs = await postConfirmationDocsCode(
                    { code: codeFirst, type_document: docs },
                    token
                );
                onSuccess?.(responseDocs);
                dispatch(setCurrentConfirmableDoc(responseDocs.next_document));

            }
        } catch (error: any) {
            dispatch(setConfirmationDocsSuccess("не пройдено"));
            console.log(error);
            const msg =
                error.response?.data?.errorText ||
                "Ошибка при отправке кода (непредвиденная)";
            dispatch(setError(msg));
        }
    }
);

export const getUserDocumentsStateThunk = createAsyncThunk<
    void,
    void,
    { rejectValue: string; state: RootState }
>(
    "documents/getUserDocumentsStateThunk",
    async (_, { getState, dispatch, rejectWithValue }) => {
        try {
            const token = getState().user.token;
            if (!token) {
                return rejectWithValue("Отсутствует токен авторизации");
            }
            const response = await getDocumentsState(token);
            // См. пример структуры: { confirmed_documents: DocumentConfirmationInfo[] }
            const confirmedDocuments = response.confirmed_documents;

            // Сохраняем весь массив в state.userDocuments
            dispatch(setUserDocuments(confirmedDocuments));
        } catch (error: any) {
            console.log(error);
            const msg =
                error.response?.data?.errorText ||
                "Ошибка при отправке кода (непредвиденная)";
            dispatch(setError(msg));
        }
    }
);

export const getUserDocumentsNotSignedThunk = createAsyncThunk<
    void,
    void,
    { rejectValue: string; state: RootState }
>(
    "documents/getUserDocumentsStateThunk",
    async (_, { getState, dispatch, rejectWithValue }) => {
        try {
            const token = getState().user.token;
            if (!token) {
                return rejectWithValue("Отсутствует токен авторизации");
            }
            const response = await getDocumentsNotSigned(token);

            const documents = response.not_signed_documents_htmls;
            console.log(response)
            dispatch(setNotSignedDocumentsHtmls(documents));
        } catch (error: any) {
            console.log(error);
            const msg =
                error.response?.data?.errorText ||
                "Ошибка при отправке кода (непредвиденная)";
            dispatch(setError(msg));
        }
    }
);

export const getUserDocumentsSignedThunk = createAsyncThunk<
    void,
    void,
    { rejectValue: string; state: RootState }
>(
    "documents/getUserDocumentsSignedThunk",
    async (_, { getState, dispatch, rejectWithValue }) => {
        try {
            const token = getState().user.token;
            if (!token) {
                return rejectWithValue("Отсутствует токен авторизации");
            }
            const response = await getDocumentsSigned(token);

            const documents = response.signed_documents;
            console.log(response)
            dispatch(setAllSignedDocuments(documents));
        } catch (error: any) {
            console.log(error);
            const msg =
                error.response?.data?.errorText ||
                "Ошибка при отправке кода (непредвиденная)";
            dispatch(setError(msg));
        }
    }
);

export const documentsSlice = createSlice({
    name: "documents",
    initialState,
    reducers: {
        setCurrentConfirmableDoc(state, action: PayloadAction<string>) {
            state.currentConfirmableDoc = action.payload;
        },
        setCurrentConfirmationMethod(state, action: PayloadAction<string>) {
            state.confirmationMethod = action.payload;
        },
        // Сохраняем массив объектов (документов) в стейт.
        setUserDocuments(state, action: PayloadAction<DocumentConfirmationInfo[]>) {
            state.userDocuments = action.payload;
        },
        setTimeoutBetweenConfirmation(state, action: PayloadAction<number>) {
            state.timeoutBetweenConfirmation = action.payload;
        },
        setNotSignedDocumentsHtmls(state, action: PayloadAction<Record<string, string>>) {
            state.allNotSignedDocumentsHtml = action.payload;
        },
        setAllSignedDocuments(state, action: PayloadAction<Record<string, string>>) {
            state.allSignedDocuments = action.payload;
        },

        nextDocType(state) {
            const currentIndex = docTypes.findIndex(
                (doc) => doc === state.currentConfirmableDoc
            );
            // Если мы не на последнем документе — переключаемся на следующий
            if (currentIndex < docTypes.length - 1) {
                state.currentConfirmableDoc = docTypes[currentIndex + 1];
            } else {
                console.log("Все документы подписаны!");
            }
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(getUserDocumentsStateThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.success = false;
            })
            .addCase(getUserDocumentsStateThunk.fulfilled, (state) => {
                state.loading = false;
                state.success = true;
            })
            .addCase(getUserDocumentsStateThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
        // Аналогично можно дописать pending/fulfilled для confirmDocsRequestThunk, если нужно
    },
});

export const {
    setCurrentConfirmableDoc,
    setCurrentConfirmationMethod,
    setUserDocuments,
    nextDocType,
    setTimeoutBetweenConfirmation,
    setNotSignedDocumentsHtmls,
    setAllSignedDocuments
} = documentsSlice.actions;

export default documentsSlice.reducer;
