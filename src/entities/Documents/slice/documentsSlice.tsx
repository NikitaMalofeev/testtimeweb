// documentsSlice.ts

import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "app/providers/store/config/store";
import { AvailabilityPersonalAccountMenuItems, ConfirmCustomDocsPayload, ConfirmDocsPayload, FilledRiskProfileChapters, SetHtmlsPayload } from "../types/documentsTypes";
import { confirmBrokerDocsRequest, confirmCustomDocsRequest, confirmDocsRequest, confirmTariffDocs, getAllBrokers, getBrokerDocumentsSigned, getCustomDocumentsNotSigned, getCustomDocumentsSigned, getDocumentNotSigned, getDocumentsInfo, getDocumentsNotSigned, getDocumentsSigned, getDocumentsState, postConfirmationCodeCustom } from "../api/documentsApi";
import { setCurrentConfirmingDoc } from "entities/RiskProfile/slice/riskProfileSlice";
import { setConfirmationDocsSuccess } from "entities/ui/Ui/slice/uiSlice";
import { setError } from "entities/Error/slice/errorSlice";
import { SendCodeCustomDocsConfirmPayload, SendCodeDocsConfirmPayload } from "entities/RiskProfile/model/types";
import { postBrokerConfirmationDocsCode, postConfirmationCodeLegal, postConfirmationDocsCode } from "entities/RiskProfile/api/riskProfileApi";

// Новый тип, соответствующий элементам из "confirmed_documents"
export interface DocumentConfirmationInfo {
    key: string;
    date_last_confirmed: string | null; // null, если документ не подписан
    date_last_confirmed_type_doc_agreement_transfer_broker?: string | null;
    timeoutPending?: number;
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

interface UploadDocState {
    socketId: string;
    status: "pending" | "success";
}

export interface CustomDocData {
    email: string;
    is_confirmed_type_doc_EDS_agreement: boolean;
    is_confirmed_type_doc_custom: boolean;
    is_send_to_email: boolean;
    not_signed_document_html: string;
    phone: string;
    title: string;
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
    "type_doc_broker_api_token",
    "type_doc_agreement_investment_advisor_app_1",
    "type_doc_agreement_account_maintenance",
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
    type_doc_broker_api_token: 'Согласие на передачу API ключа к брокерскому счету',
    type_doc_agreement_investment_advisor_app_1: 'Договор ИС: Приложение 1',
    type_doc_agreement_account_maintenance: 'Доверенность на управление счетом',
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
    brokersCount: number;
    filledRiskProfileChapters: FilledRiskProfileChapters;
    userPassportData: UserPassportData | null;
    customDocumentsData: CustomDocData | null;
    uploadDocs: Record<string, UploadDocState>;
    availabilityPersonalAccountMenuItems: AvailabilityPersonalAccountMenuItems | null;
}

const initialState: DocumentsState = {
    loading: false,
    error: null,
    success: false,
    currentConfirmableDoc: docTypes[0],
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
    brokersCount: 0,
    userPassportData: null,
    customDocumentsData: null,
    uploadDocs: {},
    availabilityPersonalAccountMenuItems: null
};

export const openUploadDocWebsocketThunk = createAsyncThunk<
    void,
    { docId: string; socketId: string; onSuccess?: () => void },
    { state: RootState; rejectValue: string }
>(
    "documents/openUploadDocWebsocket",
    async ({ docId, socketId, onSuccess }, { dispatch, rejectWithValue }) => {
        try {
            // сразу кладём socketId в стор
            dispatch(setUploadDocSocket({ docId, socketId }));

            await new Promise((resolve, reject) => {
                const ws = new WebSocket(
                    `wss://test.webbroker.ranks.pro/ws/upload_docs_progress/${socketId}/`
                );

                ws.onopen = () => console.log("docs-WS open:", docId);

                ws.onmessage = evt => {
                    const msg = JSON.parse(evt.data);

                    const isSuccess =
                        msg?.data?.is_success ??
                        msg?.is_success;

                    if (isSuccess) {
                        dispatch(setUploadDocStatus({ docId, status: "success" }));
                        onSuccess?.();
                        ws.close();
                    }
                };

                ws.onerror = err => {
                    console.error("docs-WS error", err);
                    ws.close();
                    reject("WS error");
                };
            });
        } catch (e) {
            return rejectWithValue("Ошибка WebSocket upload_docs_progress");
        }
    }
);

export const confirmTariffRequestThunk = createAsyncThunk<
    void,
    { data: ConfirmDocsPayload; onSuccess: () => void },
    { rejectValue: string; state: RootState }
>(
    "documents/confirmTariffRequestThunk",
    async (
        { data: { type_message, type_document, is_agree }, onSuccess },
        { getState, dispatch, rejectWithValue }
    ) => {
        try {
            const token = getState().user.token;
            const currentConfirmableDoc = getState().documents.currentConfirmableDoc
            if (currentConfirmableDoc === 'type_doc_agreement_investment_advisor_app_1') {
                const responseDocs = await confirmTariffDocs(
                    { type_message, is_agree, type_document: currentConfirmableDoc },
                    token
                );
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
                if (responseDocs.group_ws) {
                    const socketId = responseDocs.group_ws;
                    dispatch(
                        openUploadDocWebsocketThunk({
                            docId: currentConfirmableDoc,
                            socketId
                        })
                    );
                }
                return responseDocs;
            } else if (currentConfirmableDoc !== 'type_doc_broker_api_token' && type_document && type_message) {
                const responseDocs = await confirmDocsRequest(
                    { type_message, type_document, is_agree },
                    token
                );
                if (responseDocs.group_ws) {
                    const socketId = responseDocs.group_ws;
                    dispatch(
                        openUploadDocWebsocketThunk({
                            docId: currentConfirmableDoc,
                            socketId
                        })
                    );
                }
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

export const confirmCustomDocsRequestThunk = createAsyncThunk<
    void,
    { data: ConfirmCustomDocsPayload; onSuccess: () => void },
    { rejectValue: string; state: RootState }
>(
    "documents/confirmCustomDocsRequestThunk",
    async (
        { data: { type_message, type_document, is_agree, id_sign }, onSuccess },
        { getState, dispatch, rejectWithValue }
    ) => {
        try {
            const responseDocs = await confirmCustomDocsRequest(
                { type_message, id_sign, type_document, is_agree },
            );
            onSuccess?.();
            return responseDocs;
        } catch (error: any) {
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
            const person_type = getState().user.user.type_person
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
                dispatch(getAllBrokersThunk({ is_confirmed_type_doc_agreement_transfer_broker: true, onSuccess: () => { } }));
                onSuccess?.(responseDocs);
                dispatch(setCurrentConfirmableDoc(responseDocs.next_document));
            } else if (codeFirst) {
                console.log('попытка отправить код легально' + person_type)
                const responseDocs = person_type !== 'type_doc_person_legal' ? await postConfirmationDocsCode(
                    { code: codeFirst, type_document: docs },
                    token
                ) : await postConfirmationCodeLegal(
                    { code: codeFirst, type_document: docs },
                    token
                )
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

export const sendCustomDocsConfirmationCode = createAsyncThunk<
    void,
    SendCodeCustomDocsConfirmPayload,
    { rejectValue: string; state: RootState }
>(
    "documents/sendCustomDocsConfirmationCode",
    async ({ codeFirst, docs, id_sign, onSuccess }, { getState, dispatch, rejectWithValue }) => {
        try {
            const responseDocs = await postConfirmationCodeCustom(
                { code: codeFirst, type_document: docs, id_sign: id_sign }
            );
            onSuccess?.(responseDocs);
        } catch (error: any) {
            dispatch(setConfirmationDocsSuccess("не пройдено"));
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
            const { is_risk_profile_complete, is_risk_profile_complete_final, is_exist_scan_passport, is_complete_passport } = response;
            dispatch(setAvailabilityPersonalAccountMenuItems(response.main_menu_clickable_items))
            dispatch(
                setIsRiksProfileComplete({
                    is_risk_profile_complete,
                    is_risk_profile_complete_final,
                    is_complete_passport,
                    is_exist_scan_passport,
                })
            );

            const confirmedDocuments = response.confirmed_documents;
            const currentDocs = getState().documents.userDocuments;
            const mergedDocs = confirmedDocuments.map((doc: DocumentConfirmationInfo) => {
                const localDoc = currentDocs.find(d => d.key === doc.key);
                return {
                    ...doc,
                    // сохраняем локальное значение таймера, если оно уже было установлено,
                    // иначе оставляем значение из данных сервера или 0
                    timeoutPending: localDoc?.timeoutPending ?? doc.timeoutPending ?? 0,
                };
            });

            dispatch(setUserDocuments(mergedDocs));
        } catch (error: any) {
            console.log(error);
            const msg = error.response?.data?.errorText;
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

// documents/getUserDocumentsNotSignedThunk
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
            const htmls = response.not_signed_documents_htmls;      // ← что пришло от API

            // ① Если API вернул строку, заворачиваем её в объект
            if (typeof htmls === "string") {
                const docId = getState().documents.currentConfirmableDoc;
                dispatch(setNotSignedDocumentsHtmls({ [docId]: htmls }));
            } else {
                // ② Если уже объект, просто прокидываем дальше
                dispatch(setNotSignedDocumentsHtmls(htmls));
            }
        } catch (error: any) {
            const msg = error.response?.data?.errorText ?? error.message;
            dispatch(setError(msg));
            return rejectWithValue(msg);
        }
    }
);

// documentsSlice.ts
export const getUserDocumentNotSignedThunk = createAsyncThunk<
    void,
    { custom?: boolean; customId?: string, type: string },
    { rejectValue: string; state: RootState }
>(
    "documents/getUserDocumentNotSigned",
    async ({ custom, customId, type }, { getState, dispatch, rejectWithValue }) => {
        try {
            const token = getState().user.token!;
            // выбираем какой id использовать
            const docId = custom && customId
                ? customId
                : getState().documents.currentConfirmableDoc;
            if (docId === 'type_doc_agreement_investment_advisor_app_1') {
                return
            }

            // вызываем нужный API
            const response = custom && customId && type
                ? await getCustomDocumentsNotSigned(token, customId, type)
                : await getDocumentNotSigned(token, docId);


            const htmlString = response.not_signed_document_html;
            custom && dispatch(setCustomDocumentData(response))
            dispatch(setNotSignedDocumentsHtmls({ [docId]: htmlString }));
        } catch (err: any) {
            const msg = err.response?.data?.errorText ?? err.message;
            dispatch(setError(msg));
            return rejectWithValue(msg);
        }
    }
);




export const getUserDocumentsSignedThunk = createAsyncThunk<
    Uint8Array,
    { type_document: string; purpose: string; onSuccess: () => void; id_sign?: string },
    { rejectValue: string; state: RootState }
>(
    "documents/getUserDocumentsSignedThunk",
    async ({ type_document, purpose, onSuccess, id_sign }, { getState, dispatch, rejectWithValue }) => {
        try {
            const token = getState().user.token;

            // Выбираем нужный сервис
            const arrayBuffer = id_sign
                ? await getCustomDocumentsSigned(id_sign, type_document)
                : await getDocumentsSigned(type_document, token);

            // Универсально превращаем в Uint8Array
            const pdfBytes = new Uint8Array(arrayBuffer);

            // Сохраняем в стор
            dispatch(setCurrentSignedDocuments({
                type: type_document,
                document: pdfBytes,
            }));

            // Только для обычного (не кастомного) документа и при необходимости загрузки
            if (!id_sign && purpose === 'download') {
                onSuccess();
            }

            // Возвращаем payload
            return pdfBytes;
        } catch (error: any) {
            const msg = error.response?.data?.errorText
                || "Ошибка при получении подписанного документа";
            return rejectWithValue(msg);
        }
    }
);


export const getBrokerDocumentsSignedThunk = createAsyncThunk<
    Uint8Array,
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
            return pdfBytes
        } catch (error: any) {
            const msg =
                error.response?.request?.errorText ||
                "Брокер не подтвержден. Обратитесь в поддержку";
            dispatch(setError(msg))
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
            dispatch(setBrokerIds({ brokerId: response.data[0].id, count: response.count }))
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
            action: PayloadAction<{ brokerId: string; count: number; }>
        ) {
            state.brokerIds.push(action.payload.brokerId);
            state.brokersCount = action.payload.count
        },
        setTimeoutBetweenConfirmation(state, action: PayloadAction<number>) {
            state.timeoutBetweenConfirmation = action.payload;
        },
        // documentsSlice.ts
        // вместо PayloadAction<SetHtmlsPayload> берём сразу Record<string,string>
        setNotSignedDocumentsHtmls(
            state,
            action: PayloadAction<Record<string, string>>
        ) {
            if (typeof action.payload === "string") {
                // строку игнорируем или логируем ошибку,
                // чтобы не развалить стейт
                console.warn("setNotSignedDocumentsHtmls: payload is string");
                return;
            }
            if (!state.allNotSignedDocumentsHtml) {
                state.allNotSignedDocumentsHtml = {};
            }
            // мержим все поля из action.payload
            Object.entries(action.payload).forEach(([id, html]) => {
                state.allNotSignedDocumentsHtml![id] = html;
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
        setDocumentTimeoutPending(
            state,
            action: PayloadAction<{ docKey: string; timeout: number }>
        ) {
            const { docKey, timeout } = action.payload;
            const doc = state.userDocuments.find(doc => doc.key === docKey);
            if (doc) {
                doc.timeoutPending = timeout;
            } else {
                // Если документа с таким ключом ещё нет, добавляем его с null датой подтверждения
                state.userDocuments.push({
                    key: docKey,
                    date_last_confirmed: null,
                    timeoutPending: timeout,
                });
            }
        },

        decrementDocumentTimeout(
            state,
            action: PayloadAction<{ docKey: string; decrement: number }>
        ) {
            const { docKey, decrement } = action.payload;
            const doc = state.userDocuments.find(doc => doc.key === docKey);
            if (doc && typeof doc.timeoutPending === "number" && doc.timeoutPending > 0) {
                doc.timeoutPending = Math.max(0, doc.timeoutPending - decrement);
            }
        },
        setCustomDocumentData(state, action: PayloadAction<CustomDocData>) {
            state.customDocumentsData = action.payload;
        },
        clearDocumentTimeout(state, action: PayloadAction<string>) {
            const docKey = action.payload;
            const doc = state.userDocuments.find(doc => doc.key === docKey);
            if (doc) {
                doc.timeoutPending = 0;
            }
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
        setUploadDocSocket(
            state,
            action: PayloadAction<{ docId: string; socketId: string }>
        ) {
            const { docId, socketId } = action.payload;
            state.uploadDocs[docId] = { socketId, status: "pending" };
        },
        setUploadDocStatus(
            state,
            action: PayloadAction<{ docId: string; status: "pending" | "success" }>
        ) {
            const { docId, status } = action.payload;
            if (state.uploadDocs[docId]) {
                state.uploadDocs[docId].status = status;
            }
            if (status === "success") {
                const doc = state.userDocuments.find(d => d.key === docId);
                if (doc) doc.timeoutPending = 0;
            }
        },
        setAvailabilityPersonalAccountMenuItems(
            state,
            action: PayloadAction<AvailabilityPersonalAccountMenuItems>
        ) {
            state.availabilityPersonalAccountMenuItems = action.payload;
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
    setBrokerIds,
    setDocumentTimeoutPending,
    decrementDocumentTimeout,
    clearDocumentTimeout,
    setCustomDocumentData,
    setUploadDocSocket,
    setUploadDocStatus,
    setAvailabilityPersonalAccountMenuItems
} = documentsSlice.actions;

export default documentsSlice.reducer;
