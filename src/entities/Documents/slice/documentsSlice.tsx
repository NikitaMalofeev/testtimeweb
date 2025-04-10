// documentsSlice.ts

import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "app/providers/store/config/store";
import { ConfirmDocsPayload, FilledRiskProfileChapters } from "../types/documentsTypes";
import { confirmBrokerDocsRequest, confirmDocsRequest, getAllBrokers, getBrokerDocumentsSigned, getDocumentNotSigned, getDocumentsInfo, getDocumentsNotSigned, getDocumentsSigned, getDocumentsState } from "../api/documentsApi";
import { setCurrentConfirmingDoc } from "entities/RiskProfile/slice/riskProfileSlice";
import { setConfirmationDocsSuccess } from "entities/ui/Ui/slice/uiSlice";
import { setError } from "entities/Error/slice/errorSlice";
import { SendCodeDocsConfirmPayload } from "entities/RiskProfile/model/types";
import { postBrokerConfirmationDocsCode, postConfirmationDocsCode } from "entities/RiskProfile/api/riskProfileApi";

// Новый тип, соответствующий элементам из "confirmed_documents"
export interface DocumentConfirmationInfo {
    key: string;
    date_last_confirmed: string | null; // null, если документ не подписан
}

export interface UserPassportData {
    birth_place: string;
    passport_series: string;
    passport_number: string;
    department_code: string;
    issue_date: string;    // лучше хранить в формате ISO-строки
    issue_whom: string;
    inn: string;
}

// Массив с последовательностью типов документов,
// которые необходимо подписать по порядку (меняется редко).
export const docTypes = [
    "type_doc_passport",
    "type_doc_EDS_agreement",
    "type_doc_RP_questionnairy",
    "type_doc_agreement_investment_advisor",
    "type_doc_risk_declarations",
    "type_doc_agreement_personal_data_policy",
    "type_doc_investment_profile_certificate",
    "type_doc_agreement_account_maintenance",
    "type_doc_broker_api_token"
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
    type_doc_agreement_account_maintenance: 'Договор об обслуживании аккаунта',
    type_doc_broker_api_token: 'Согласие на передачу API ключа к брокерскому счету'
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
    currentSugnedDocument: {
        document: Uint8Array | null;
        type: string;
    };
    brokerIds: string[];
    filledRiskProfileChapters: FilledRiskProfileChapters;
    userPassportData: UserPassportData | null;

}

const initialState: DocumentsState = {
    loading: false,
    error: null,
    success: false,
    currentConfirmableDoc: docTypes[1],
    confirmationMethod: 'EMAIL',
    timeoutBetweenConfirmation: 0,
    allNotSignedDocumentsHtml: null,
    currentSugnedDocument: {
        document: null,
        type: ''
    },
    userDocuments: [],
    filledRiskProfileChapters: {
        is_risk_profile_complete: false,
        is_risk_profile_complete_final: false,
        is_complete_passport: false,
        is_exist_scan_passport: false,
    },
    brokerIds: [],
    userPassportData: null
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
            const currentConfirmableDoc = getState().documents.currentConfirmableDoc
            const currentBrokerId = getState().documents.brokerIds[0]
            if (!token) {
                return rejectWithValue("Отсутствует токен авторизации");
            }
            if (currentConfirmableDoc === 'type_doc_broker_api_token') {
                const responseDocs = await confirmBrokerDocsRequest(
                    { type_message, is_agree, broker_id: currentBrokerId },
                    token
                );
                dispatch(setTimeoutBetweenConfirmation(responseDocs.timeinterval_sms))
                onSuccess?.();
                return responseDocs;
            } else if (currentConfirmableDoc !== 'type_doc_broker_api_token' && type_document && type_message) {
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
                error.response?.data?.errorText
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
            const currentConfirmableDoc = getState().documents.currentConfirmableDoc
            const broker_id = getState().documents.brokerIds[0]
            if (!token) {
                return rejectWithValue("Отсутствует токен авторизации");
            }
            if (codeFirst && currentConfirmableDoc === 'type_doc_broker_api_token') {
                const responseDocs = await postBrokerConfirmationDocsCode(
                    { code: codeFirst, broker_id: broker_id },
                    token
                );
                dispatch(getUserDocumentsStateThunk());
                onSuccess?.(responseDocs);
                dispatch(setCurrentConfirmableDoc(responseDocs.next_document));
            } else if (codeFirst) {
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
                error.response?.data?.errorText
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
            const { is_risk_profile_complete, is_risk_profile_complete_final, is_exist_scan_passport, is_complete_passport } = response

            dispatch(setIsRiksProfileComplete({ is_risk_profile_complete, is_risk_profile_complete_final, is_complete_passport, is_exist_scan_passport }))
            // См. пример структуры: { confirmed_documents: DocumentConfirmationInfo[] }
            const confirmedDocuments = response.confirmed_documents;

            // Сохраняем весь массив в state.userDocuments
            dispatch(setUserDocuments(confirmedDocuments));
        } catch (error: any) {
            console.log(error);
            const msg =
                error.response?.data?.errorText
            dispatch(setError(msg));
        }
    }
);

export const getUserDocumentsInfoThunk = createAsyncThunk<
    void,
    void,
    { rejectValue: string; state: RootState }
>(
    "documents/getUserDocumentsInfoThunk",
    async (_, { getState, dispatch, rejectWithValue }) => {
        try {
            const token = getState().user.token;
            if (!token) {
                return rejectWithValue("Отсутствует токен авторизации");
            }
            const response = await getDocumentsInfo(token);
            dispatch(setUserPasportData(response))
        } catch (error: any) {
            console.log(error);
            const msg =
                error.response?.data?.errorText
            dispatch(setError(msg));
        }
    }
);

export const getUserDocumentsNotSignedThunk = createAsyncThunk<
    void,
    void,
    { rejectValue: string; state: RootState }
>(
    "documents/getUserDocumentsNotSignedThunk",
    async (_, { getState, dispatch, rejectWithValue }) => {
        try {
            const token = getState().user.token;
            if (!token) {
                return rejectWithValue("Отсутствует токен авторизации");
            }
            const response = await getDocumentsNotSigned(token);

            const documents = response.not_signed_documents_htmls;
            console.log(documents)
            dispatch(setNotSignedDocumentsHtmls(documents));
        } catch (error: any) {
            console.log(error);
            const msg =
                error.response?.data?.errorText
            dispatch(setError(msg));
        }
    }
);

export const getUserDocumentNotSignedThunk = createAsyncThunk<
    void,
    void,
    { rejectValue: string; state: RootState }
>(
    "documents/getUserDocumentsNotSignedThunk",
    async (_, { getState, dispatch, rejectWithValue }) => {
        try {
            const token = getState().user.token;
            if (!token) {
                return rejectWithValue("Отсутствует токен авторизации");
            }
            const currentConfirmableDoc = getState().documents.currentConfirmableDoc
            const response = await getDocumentNotSigned(token, currentConfirmableDoc);

            console.log(response.not_signed_document_html + 'документ')
            dispatch(setNotSignedDocumentsHtmls(response.not_signed_document_html));
        } catch (error: any) {
            console.log(error);
            const msg =
                error.response?.data?.errorText
            dispatch(setError(msg));
        }
    }
);

export const getUserDocumentsSignedThunk = createAsyncThunk<
    Uint8Array, // изменили с void на Uint8Array
    { type_document: string; purpose: string; onSuccess: () => void },
    { rejectValue: string; state: RootState }
>(
    "documents/getUserDocumentsSignedThunk",
    async ({ type_document, purpose, onSuccess }, { getState, dispatch, rejectWithValue }) => {
        try {
            const token = getState().user.token;
            if (!token) {
                return rejectWithValue("Отсутствует токен авторизации");
            }
            // Запрашиваем PDF как бинарный ArrayBuffer
            const arrayBuffer = await getDocumentsSigned(type_document, token);
            // Превращаем ArrayBuffer в Uint8Array
            const pdfBytes = new Uint8Array(arrayBuffer);

            dispatch(setCurrentSignedDocuments({
                type: type_document,
                document: pdfBytes,
            }));

            if (purpose === 'download') {
                onSuccess();
            }

            // Возвращаем pdfBytes для дальнейшего использования (например, создания Blob)
            return pdfBytes;
        } catch (error: any) {
            const msg =
                error.response?.data?.errorText ||
                "Ошибка при получении подписанного документа";
            return rejectWithValue(msg);
        }
    }
);

export const getBrokerDocumentsSignedThunk = createAsyncThunk<
    void,
    { purpose: string; onSuccess: () => void },
    { rejectValue: string; state: RootState }
>(
    "documents/getBrokerDocumentsSignedThunk",
    async ({ purpose, onSuccess }, { getState, dispatch, rejectWithValue }) => {
        try {
            const token = getState().user.token;
            const broker_id = getState().documents.brokerIds[0];
            console.log('token in thunk:', token);
            if (!token) {
                return rejectWithValue("Отсутствует токен авторизации");
            }
            console.log('thunk broker')
            // Запрашиваем PDF как бинарь (ArrayBuffer)
            const arrayBuffer = await getBrokerDocumentsSigned(broker_id, token);
            // Превращаем ArrayBuffer в Uint8Array
            const pdfBytes = new Uint8Array(arrayBuffer);

            dispatch(setCurrentSignedDocuments({
                type: 'type_doc_broker_api_token',
                document: pdfBytes,
            }));

            if (purpose === 'download') {
                onSuccess()
            }
        } catch (error: any) {
            const msg =
                error.response?.data?.errorText ||
                "Ошибка при получении подписанного документа";
            return rejectWithValue(msg);
        }
    }
);

export const getAllBrokersThunk = createAsyncThunk<
    void,
    { is_confirmed_type_doc_agreement_transfer_broker: boolean, onSuccess: () => void },
    { rejectValue: string; state: RootState }
>(
    "documents/getUserDocumentsSignedThunk",
    async ({ is_confirmed_type_doc_agreement_transfer_broker, onSuccess }, { getState, dispatch, rejectWithValue }) => {
        try {
            const token = getState().user.token;
            if (!token) {
                return rejectWithValue("Отсутствует токен авторизации");
            }
            const response = await getAllBrokers(token, is_confirmed_type_doc_agreement_transfer_broker);
            dispatch(setBrokerIds({ brokerId: response.data[0].id }))
            console.log(response)
        } catch (error: any) {
            const msg =
                error.response?.data?.errorText ||
                "Ошибка при получении подписанного документа";
            return rejectWithValue(msg);
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
        setUserPasportData(state, action: PayloadAction<UserPassportData>) {
            state.userPassportData = action.payload;
        },
        setBrokerSuccessResponseInfo(
            state,
            action: PayloadAction<{ brokerId: string; notSignedDocBroker: string }>
        ) {
            state.brokerIds.push(action.payload.brokerId);

            if (!state.allNotSignedDocumentsHtml) {
                state.allNotSignedDocumentsHtml = {};
            }
            state.allNotSignedDocumentsHtml["type_doc_broker_api_token"] =
                action.payload.notSignedDocBroker;
        },
        setBrokerIds(
            state,
            action: PayloadAction<{ brokerId: string; }>
        ) {
            state.brokerIds.push(action.payload.brokerId);
        },
        setTimeoutBetweenConfirmation(state, action: PayloadAction<number>) {
            state.timeoutBetweenConfirmation = action.payload;
        },
        setNotSignedDocumentsHtmls(state, action: PayloadAction<Record<string, string>>) {
            if (state.allNotSignedDocumentsHtml === null) {
                state.allNotSignedDocumentsHtml = {};
            }
            const currentDocs = state.allNotSignedDocumentsHtml;
            Object.entries(action.payload).forEach(([key, value]) => {
                currentDocs[key] = value;
            });

        },


        setCurrentSignedDocuments(
            state,
            action: PayloadAction<{ document: Uint8Array | null; type: string }>
        ) {
            state.currentSugnedDocument = action.payload;
        },
        setIsRiksProfileComplete(
            state,
            action: PayloadAction<FilledRiskProfileChapters>
        ) {
            state.filledRiskProfileChapters = action.payload;
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
            .addCase(getUserDocumentsNotSignedThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.success = false;
            })
            .addCase(getUserDocumentsNotSignedThunk.fulfilled, (state) => {
                state.loading = false;
                state.success = true;
            })
            .addCase(getUserDocumentsNotSignedThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(getUserDocumentsSignedThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.success = false;
            })
            .addCase(getUserDocumentsSignedThunk.fulfilled, (state) => {
                state.loading = false;
                state.success = true;
            })
            .addCase(getUserDocumentsSignedThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(getBrokerDocumentsSignedThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.success = false;
            })
            .addCase(getBrokerDocumentsSignedThunk.fulfilled, (state) => {
                state.loading = false;
                state.success = true;
            })
            .addCase(getBrokerDocumentsSignedThunk.rejected, (state, action) => {
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
    setCurrentSignedDocuments,
    setIsRiksProfileComplete,
    setUserPasportData,
    setBrokerSuccessResponseInfo,
    setBrokerIds
} = documentsSlice.actions;

export default documentsSlice.reducer;
