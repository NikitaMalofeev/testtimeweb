import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "app/providers/store/config/store";
import {
    AvailabilityPersonalAccountMenuItems,
    ConfirmAllDocsPayload,
    ConfirmCustomDocsPayload,
    ConfirmDocsPayload,
    FilledRiskProfileChapters,
} from "../types/documentsTypes";
import {
    confirmAllDocsRequest,
    confirmBrokerDocsRequest,
    confirmCustomDocsRequest,
    confirmDocsRequest,
    confirmTariffDocs,
    getAllBrokers,
    getBrokerDocumentsSigned,
    getCustomDocumentsNotSigned,
    getCustomDocumentsSigned,
    getDocumentNotSigned,
    getDocumentsInfo,
    getDocumentsNotSigned,
    getDocumentsSigned,
    getDocumentsState,
    postConfirmationCodeAllDocuments,
    postConfirmationCodeCustom,
    getAllCustomDocumentUser,
    confirmCustomDocumentUser,
    checkConfirmationCodeUser,
    getSignedCustomDocumentUser,
    getUserNotSignedDocumentHtml,
} from "../api/documentsApi";
import { setCurrentConfirmingDoc } from "entities/RiskProfile/slice/riskProfileSlice";
import { setConfirmationDocsSuccess } from "entities/ui/Ui/slice/uiSlice";
import { setError } from "entities/Error/slice/errorSlice";
import { SendCodeCustomDocsConfirmPayload, SendCodeDocsConfirmPayload } from "entities/RiskProfile/model/types";
import {
    postBrokerConfirmationDocsCode,
    postConfirmationCodeLegal,
    postConfirmationDocsCode,
} from "entities/RiskProfile/api/riskProfileApi";
import { signingTariff } from "entities/Payments/api/paymentsApi";

/**
 * Таймауты по умолчанию для каждого документа (секунды).
 * Если бэкенд вернёт timeinterval_sms — он имеет приоритет.
 */
export const docTimeoutMap: Record<string, number> = {
    type_doc_passport: 7,
    type_doc_EDS_agreement: 8,
    type_doc_RP_questionnairy: 12,
    type_doc_agreement_investment_advisor: 7,
    type_doc_risk_declarations: 7,
    type_doc_agreement_personal_data_policy: 7,
    type_doc_investment_profile_certificate: 7,
    type_doc_agreement_account_maintenance: 12,
    type_doc_agreement_transfer_broker: 10,
    type_doc_agreement_investment_advisor_app_1: 7,
};


// Новый тип, соответствующий элементам из "confirmed_documents"
export interface DocumentConfirmationInfo {
    key: string;
    date_last_confirmed: string | null; // null, если документ не подписан
    date_last_confirmed_type_doc_agreement_transfer_broker?: string | null;
    timeoutPending?: number; // legacy
    is_confirmed_type_doc_agreement_transfer_broker?: boolean;
}

export interface UserPassportData {
    birth_place: string;
    passport_series: string;
    passport_number: string;
    department_code: string;
    issue_date: string;
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

export interface CustomDocUserData {
    id: string;
    title: string;
    is_confirmed_type_doc_custom_for_user: boolean;
    date_last_confirmed_type_doc_custom_for_user: string | null;
    created_at: string;
    modified_at: string | null;
}

export interface BrokerData {
    id: string;
    name_for_list: string;
    broker: string;
    date_last_confirmed_type_doc_agreement_transfer_broker: string | null;
    is_confirmed_type_doc_agreement_transfer_broker: boolean;
    date_last_confirmed_type_doc_agreement_account_maintenance: string | null;
    is_confirmed_type_doc_agreement_account_maintenance: boolean;
    is_waiting_manual_verification_broker: boolean;
    is_confirmed_and_with_key: boolean;
    is_exist_key: boolean;
    strategy_name: string | null;
    created: string;
    modified: string;
}

// Массив очередности документов
export const docTypes = [
    "type_doc_passport",
    "type_doc_EDS_agreement",
    "type_doc_RP_questionnairy",
    "type_doc_agreement_investment_advisor",
    "type_doc_risk_declarations",
    "type_doc_agreement_personal_data_policy",
    "type_doc_investment_profile_certificate",
    "type_doc_agreement_account_maintenance",
    "type_doc_agreement_transfer_broker",
    "type_doc_agreement_investment_advisor_app_1",
];

// Лейблы для UI
export const docTypeLabels: Record<string, string> = {
    type_doc_passport: "Паспорт",
    type_doc_EDS_agreement: "Соглашение об ЭЦП",
    type_doc_RP_questionnairy: "Анкета Риск Профиля",
    type_doc_agreement_investment_advisor: "Договор ИС",
    type_doc_risk_declarations: "Декларация о рисках",
    type_doc_agreement_personal_data_policy: "Политика персональных данных",
    type_doc_investment_profile_certificate: "Справка Инвестиционного профиля",
    type_doc_agreement_account_maintenance: "Доверенность на управление счетом",
    type_doc_agreement_transfer_broker: "Согласие на передачу API ключа к брокерскому счету",
    type_doc_agreement_investment_advisor_app_1: "Договор ИС: Приложение 1",
};

type TimerEntry = {
    startedAt: number | null; // ms epoch
    duration: number; // seconds
    active: boolean;
};

interface DocumentsState {
    loading: boolean;
    error: string | null;
    success: boolean;

    currentConfirmableDoc: string;
    confirmationMethod: string;

    userDocuments: DocumentConfirmationInfo[];


    allNotSignedDocumentsHtml: Record<string, string> | null;
    currentSugnedDocument: {
        document: Uint8Array | null;
        type: string;
    };

    brokerIds: string[];
    brokersCount: number;
    brokers: BrokerData[];

    filledRiskProfileChapters: FilledRiskProfileChapters;
    userPassportData: UserPassportData | null;
    customDocumentsData: CustomDocData | null;

    // Для авторизованных пользователей
    customDocumentsUser: CustomDocUserData[];
    currentCustomDocUser: CustomDocUserData | null;

    uploadDocs: Record<string, UploadDocState>;
    availabilityPersonalAccountMenuItems: AvailabilityPersonalAccountMenuItems | null;
    documentsChecked: boolean;

    is_waiting_manual_verification_broker: boolean;
    waiting_manual_document_verification: {
        type_doc_agreement_transfer_broker: string;
        type_doc_passport: string;
    };

    /** ⏱ Глобальные таймеры по документам */
    timersByDoc: Record<string, TimerEntry>;
    /** nowTs нужен, чтобы дёшево перерисовывать селекторы раз в секунду */
    nowTs: number;
}

const initialState: DocumentsState = {
    loading: false,
    error: null,
    success: false,

    currentConfirmableDoc: docTypes[0],
    confirmationMethod: "EMAIL",


    allNotSignedDocumentsHtml: null,
    currentSugnedDocument: {
        document: null,
        type: "",
    },
    userDocuments: [],
    filledRiskProfileChapters: {
        is_risk_profile_complete: false,
        is_risk_profile_complete_final: false,
        is_complete_passport: false,
        is_exist_scan_passport: false,
        is_complete_person_legal: false,
        is_exist_scan_person_legal: false,
    },

    brokerIds: [],
    brokersCount: 0,
    brokers: [],

    userPassportData: null,
    customDocumentsData: null,

    // Для авторизованных пользователей
    customDocumentsUser: [],
    currentCustomDocUser: null,

    uploadDocs: {},
    availabilityPersonalAccountMenuItems: null,
    documentsChecked: false,

    is_waiting_manual_verification_broker: false,
    waiting_manual_document_verification: {
        type_doc_agreement_transfer_broker: "",
        type_doc_passport: "",
    },

    timersByDoc: {},
    nowTs: Date.now(),
};

// ============ thunks ============

export const openUploadDocWebsocketThunk = createAsyncThunk<
    void,
    { docId: string; socketId: string; onSuccess?: () => void },
    { state: RootState; rejectValue: string }
>("documents/openUploadDocWebsocket", async ({ docId, socketId, onSuccess }, { dispatch, rejectWithValue }) => {
    try {
        dispatch(setUploadDocSocket({ docId, socketId }));

        await new Promise((resolve, reject) => {
            const ws = new WebSocket(`wss://test.webbroker.ranks.pro/ws/upload_docs_progress/${socketId}/`);

            ws.onmessage = (evt) => {
                const msg = JSON.parse(evt.data);
                const isSuccess = msg?.data?.is_success ?? msg?.is_success;
                if (isSuccess) {
                    dispatch(setUploadDocStatus({ docId, status: "success" }));
                    onSuccess?.();
                    ws.close();
                }
            };

            ws.onerror = (err) => {
                console.error("docs-WS error", err);
                ws.close();
                reject("WS error");
            };
        });
    } catch {
        return rejectWithValue("Ошибка WebSocket upload_docs_progress");
    }
});

export const confirmTariffRequestThunk = createAsyncThunk<
    void,
    { data: ConfirmDocsPayload; onSuccess: () => void },
    { rejectValue: string; state: RootState }
>(
    "documents/confirmTariffRequestThunk",
    async ({ data: { type_message, type_document, is_agree, tariff_id }, onSuccess }, { getState, dispatch, rejectWithValue }) => {
        try {
            const token = getState().user.token;
            const currentConfirmableDoc = getState().documents.currentConfirmableDoc;

            if (currentConfirmableDoc === "type_doc_agreement_investment_advisor_app_1" && tariff_id) {
                const responseDocs = await signingTariff(tariff_id, type_message, is_agree, token);
                // простой таймер из маппинга
                const duration = docTimeoutMap[currentConfirmableDoc] || 5;
                dispatch(startDocTimeout({ docKey: currentConfirmableDoc, duration }));
                onSuccess?.();
                return responseDocs as any;
            }
        } catch (error: any) {
            dispatch(setConfirmationDocsSuccess("не пройдено"));
            const msg = error.response?.data?.errorText;
            if (msg.length > 0) { dispatch(setError(msg)); }
        }
    }
);

export const confirmDocsRequestThunk = createAsyncThunk<
    void,
    { data: ConfirmDocsPayload; onSuccess: () => void },
    { rejectValue: string; state: RootState }
>(
    "documents/confirmDocsRequestThunk",
    async ({ data: { type_message, type_document, is_agree }, onSuccess }, { getState, dispatch, rejectWithValue }) => {
        try {
            const token = getState().user.token;
            const currentConfirmableDoc = getState().documents.currentConfirmableDoc;
            const currentBrokerId = getState().documents.brokerIds[0];
            if (!token) return rejectWithValue("Отсутствует токен авторизации");

            if (currentConfirmableDoc === "type_doc_agreement_transfer_broker") {
                const responseDocs = await confirmBrokerDocsRequest({ type_message, is_agree, broker_id: currentBrokerId }, token);
                const duration = docTimeoutMap[currentConfirmableDoc] || 5;
                dispatch(startDocTimeout({ docKey: currentConfirmableDoc, duration }));
                onSuccess?.();
                if ((responseDocs as any).group_ws) {
                    const socketId = (responseDocs as any).group_ws;
                    dispatch(openUploadDocWebsocketThunk({ docId: currentConfirmableDoc, socketId }));
                }
                return responseDocs as any;
            } else if (currentConfirmableDoc !== "type_doc_agreement_transfer_broker" && type_document && type_message) {
                const responseDocs = await confirmDocsRequest({ type_message, type_document, is_agree }, token);
                const duration = docTimeoutMap[currentConfirmableDoc] || 5;
                dispatch(startDocTimeout({ docKey: currentConfirmableDoc, duration }));
                if ((responseDocs as any).group_ws) {
                    const socketId = (responseDocs as any).group_ws;
                    dispatch(openUploadDocWebsocketThunk({ docId: currentConfirmableDoc, socketId }));
                }
                onSuccess?.();
                return responseDocs as any;
            }
        } catch (error: any) {
            dispatch(setConfirmationDocsSuccess("не пройдено"));
            const msg = error.response?.data?.errorText;
            if (msg.length > 0) { dispatch(setError(msg)); }
        }
    }
);

export const confirmAllDocsRequestThunk = createAsyncThunk<
    ReturnType<typeof confirmAllDocsRequest>,
    { data: ConfirmAllDocsPayload; onSuccess?: () => void },
    { state: RootState; rejectValue: string }
>("documents/confirmAllDocsRequest", async ({ data, onSuccess }, { getState, dispatch, rejectWithValue }) => {
    const token = getState().user.token;
    const currentConfirmableDoc = getState().documents.currentConfirmableDoc;
    if (!token) return rejectWithValue("Отсутствует токен авторизации");

    try {
        const response = await confirmAllDocsRequest(data, token);
        dispatch(setConfirmationDocsSuccess("пройдено"));

        // Стартуем таймер для текущего документа из маппинга
        const duration = docTimeoutMap[currentConfirmableDoc] || 5;
        dispatch(startDocTimeout({ docKey: currentConfirmableDoc, duration }));

        if ((response as any).group_ws) {
            dispatch(openUploadDocWebsocketThunk({ docId: currentConfirmableDoc, socketId: (response as any).group_ws }));
        }

        onSuccess?.();
        return response as any;
    } catch (err: any) {
        const errorMsg = err.response?.data?.errorText ?? "Ошибка при подписании документов";
        dispatch(setError(errorMsg));
        dispatch(setConfirmationDocsSuccess("не пройдено"));
        return rejectWithValue(errorMsg);
    }
});

export const confirmCustomDocsRequestThunk = createAsyncThunk<
    void,
    { data: ConfirmCustomDocsPayload; onSuccess: () => void },
    { rejectValue: string; state: RootState }
>(
    "documents/confirmCustomDocsRequestThunk",
    async ({ data: { type_message, type_document, is_agree, id_sign }, onSuccess }, { dispatch }) => {
        const responseDocs = await confirmCustomDocsRequest(
            { type_message, id_sign, type_document, is_agree },
        );

        // Стартуем таймаут ТОЛЬКО если doc указан
        if (type_document) {
            const duration = docTimeoutMap[type_document] || 5;
            dispatch(startDocTimeout({ docKey: type_document, duration }));
        }
        onSuccess?.();
        return responseDocs as any;
    }
);


export const sendDocsConfirmationCode = createAsyncThunk<
    void,
    SendCodeDocsConfirmPayload,
    { rejectValue: string; state: RootState }
>(
    "documents/sendDocsConfirmationCode",
    async ({ codeFirst, docs, onSuccess, onSuccessLegal }, { getState, dispatch, rejectWithValue }) => {
        try {
            const token = getState().user.token;
            const currentConfirmableDoc = getState().documents.currentConfirmableDoc;
            const currentStep = getState().ui.additionalMenu.currentStep;
            const isLegal = getState().user.userPersonalAccountInfo?.is_individual_entrepreneur;
            const broker_id = getState().documents.brokerIds[0];
            if (!token) return rejectWithValue("Отсутствует токен авторизации");

            if (codeFirst && currentConfirmableDoc === "type_doc_agreement_transfer_broker") {
                const responseDocs = await postBrokerConfirmationDocsCode({ code: codeFirst, broker_id }, token);
                dispatch(getUserDocumentsStateThunk());
                dispatch(getAllBrokersThunk({ is_confirmed_type_doc_agreement_transfer_broker: true, onSuccess: () => { } }));
                onSuccess?.(responseDocs);
                (responseDocs as any).next_document && dispatch(setCurrentConfirmableDoc((responseDocs as any).next_document));
            } else if (codeFirst) {
                let responseDocs: any;
                const legalDocTypes = ["phone", "email", "type_doc_person_legal"];
                if (!isLegal) {
                    responseDocs = await postConfirmationDocsCode({ code: codeFirst, type_document: docs }, token);
                } else if (legalDocTypes.includes(docs)) {
                    responseDocs = await postConfirmationCodeLegal({ code: codeFirst, type_document: docs }, token);
                } else {
                    responseDocs = await postConfirmationDocsCode({ code: codeFirst, type_document: docs }, token);
                }
                currentStep === 2 && isLegal && onSuccessLegal?.();
                onSuccess?.(responseDocs);
                responseDocs.next_document && dispatch(setCurrentConfirmableDoc(responseDocs.next_document));
            }
        } catch (error: any) {
            dispatch(setConfirmationDocsSuccess("не пройдено"));
            const msg = error.response?.data?.errorText;
            if (msg.length > 0) { dispatch(setError(msg)); }
        }
    }
);

export const sendDocsConfirmationAllDocuments = createAsyncThunk<
    void,
    { codeFirst: string; broker_id: string; onSuccess: () => void; onError: () => void },
    { rejectValue: string; state: RootState }
>(
    "documents/sendDocsConfirmationCodeAll",
    async ({ codeFirst, broker_id, onSuccess, onError }, { getState, dispatch, rejectWithValue }) => {
        try {
            const token = getState().user.token;
            if (!token) return rejectWithValue("Отсутствует токен авторизации");
            if (codeFirst) {
                const responseDocs = await postConfirmationCodeAllDocuments({ code: codeFirst, broker_id }, token);
                onSuccess?.();
                return responseDocs as any;
            }
        } catch (error: any) {
            dispatch(setConfirmationDocsSuccess("не пройдено"));
            onError();
            const msg = error.response?.data?.errorText;
            if (msg.length > 0) { dispatch(setError(msg)); }
        }
    }
);

export const sendDocsConfirmationCodeLegal = createAsyncThunk<
    void,
    SendCodeDocsConfirmPayload,
    { rejectValue: string; state: RootState }
>(
    "documents/sendDocsConfirmationCodeLegal",
    async ({ codeFirst, docs, onSuccess }, { getState, dispatch, rejectWithValue }) => {
        try {
            const token = getState().user.token;
            if (!token) return rejectWithValue("Отсутствует токен авторизации");
            if (codeFirst) {
                const responseDocs = await postConfirmationCodeLegal({ code: codeFirst, type_document: docs }, token);
                onSuccess?.(responseDocs as any);
            }
        } catch (error: any) {
            dispatch(setConfirmationDocsSuccess("не пройдено"));
            const msg = error.response?.data?.errorText;
            if (msg.length > 0) { dispatch(setError(msg)); }
        }
    }
);

export const sendCustomDocsConfirmationCode = createAsyncThunk<
    void,
    SendCodeCustomDocsConfirmPayload,
    { rejectValue: string; state: RootState }
>(
    "documents/sendCustomDocsConfirmationCode",
    async ({ codeFirst, docs, id_sign, onSuccess }, { dispatch }) => {
        try {
            const responseDocs = await postConfirmationCodeCustom({ code: codeFirst, type_document: docs, id_sign });
            onSuccess?.(responseDocs as any);
        } catch (error: any) {
            dispatch(setConfirmationDocsSuccess("не пройдено"));
            const msg = error.response?.data?.errorText;
            if (msg.length > 0) { dispatch(setError(msg)); }
        }
    }
);

export const getUserDocumentsStateThunk = createAsyncThunk<
    void,
    void,
    { rejectValue: string; state: RootState }
>("documents/getUserDocumentsStateThunk", async (_, { getState, dispatch, rejectWithValue }) => {
    try {
        const token = getState().user.token;
        if (!token) return
        const currentBrokerIds = getState().documents.brokerIds;
        const response = await getDocumentsState(token);
        const {
            is_risk_profile_complete,
            is_risk_profile_complete_final,
            is_exist_scan_passport,
            is_complete_passport,
            is_complete_person_legal,
            is_exist_scan_person_legal,
        } = response;

        const confirmedBrokers = response.confirmed_brokers ?? [];
        dispatch(setAvailabilityPersonalAccountMenuItems(response.main_menu_clickable_items));
        dispatch(
            setIsRiksProfileComplete({
                is_risk_profile_complete,
                is_risk_profile_complete_final,
                is_complete_passport,
                is_exist_scan_passport,
                is_complete_person_legal,
                is_exist_scan_person_legal,
            })
        );

        const confirmedDocuments = response.confirmed_documents;
        const currentDocs = getState().documents.userDocuments;

        const mergedDocs = confirmedDocuments.map((doc: DocumentConfirmationInfo) => {
            const localDoc = currentDocs.find((d) => d.key === doc.key);
            return {
                ...doc,
                timeoutPending: localDoc?.timeoutPending ?? doc.timeoutPending ?? 0,
            };
        });

        if (confirmedBrokers.length) {
            const broker = confirmedBrokers[0];
            mergedDocs.push({
                key: "type_doc_agreement_transfer_broker",
                date_last_confirmed_type_doc_agreement_transfer_broker: broker.modified ?? broker.modified,
                timeoutPending: 0,
            });
        }

        currentBrokerIds[0] &&
            dispatch(setBrokerIds({ brokerId: currentBrokerIds[0], count: response.confirmed_brokers_count }));
        dispatch(setUserDocuments(mergedDocs));
    } catch (error: any) {
        const msg = error.response?.data?.errorText;
        if (msg.length > 0) { dispatch(setError(msg)); }
    }
});

export const getUserDocumentsInfoThunk = createAsyncThunk<
    void,
    void,
    { rejectValue: string; state: RootState }
>("documents/getUserDocumentsInfoThunk", async (_, { getState, dispatch, rejectWithValue }) => {
    try {
        const token = getState().user.token;
        if (!token) return rejectWithValue("Отсутствует токен авторизации");
        const response = await getDocumentsInfo(token);
        dispatch(setUserPasportData(response));
    } catch (error: any) {
        const msg = error.response?.data?.errorText;
        if (msg.length > 0) { dispatch(setError(msg)); }
    }
});

// not-signed: все
export const getUserDocumentsNotSignedThunk = createAsyncThunk<
    void,
    void,
    { rejectValue: string; state: RootState }
>("documents/getUserDocumentsNotSignedThunk", async (_, { getState, dispatch, rejectWithValue }) => {
    try {
        const token = getState().user.token;
        if (!token) return rejectWithValue("Отсутствует токен авторизации");

        const response = await getDocumentsNotSigned(token);
        const htmls = response.not_signed_documents_htmls;

        if (typeof htmls === "string") {
            const docId = getState().documents.currentConfirmableDoc;
            dispatch(setNotSignedDocumentsHtmls({ [docId]: htmls }));
        } else {
            dispatch(setNotSignedDocumentsHtmls(htmls));
        }
    } catch (error: any) {
        const msg = error.response?.data?.errorText ?? error.message;
        if (msg.length > 0) { dispatch(setError(msg)); }
        return rejectWithValue(msg);
    }
});

// not-signed: конкретный
// not-signed: конкретный
export const getUserDocumentNotSignedThunk = createAsyncThunk<
    void,
    { custom?: boolean; customId?: string; type: string },
    { rejectValue: string; state: RootState }
>(
    "documents/getUserDocumentNotSigned",
    async ({ custom, customId, type }, { getState, dispatch, rejectWithValue }) => {
        try {
            const token = getState().user.token;
            const docId = custom && customId ? customId : getState().documents.currentConfirmableDoc;
            console.log({ docId, custom, customId, hasToken: Boolean(token) });

            if (docId === "type_doc_agreement_investment_advisor_app_1") return;

            let response;
            // console.log('1')
            if (custom && customId && type) {
                // кастомный документ — без токена тоже ок
                // console.log('2')
                response = await getCustomDocumentsNotSigned(token || "", customId, type);
            } else {
                // console.log('3')
                response = await getDocumentNotSigned(token || "", docId);
            }

            const htmlString = response.not_signed_document_html;
            custom && dispatch(setCustomDocumentData(response));
            // console.log(response)
            dispatch(setNotSignedDocumentsHtmls({ [docId]: htmlString }));
        } catch (err: any) {
            const msg = err.response?.data?.errorText ?? err.message;
            if (msg.length > 0) { dispatch(setError(msg)); }
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
            const arrayBuffer = id_sign
                ? await getCustomDocumentsSigned(id_sign, type_document)
                : await getDocumentsSigned(type_document, token);

            const pdfBytes = new Uint8Array(arrayBuffer);
            dispatch(setCurrentSignedDocuments({ type: type_document, document: pdfBytes }));

            if (!id_sign && purpose === "download") {
                onSuccess();
            }
            return pdfBytes;
        } catch (error: any) {
            const msg = error.response?.data?.errorText || "Ошибка при получении подписанного документа";
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
            if (!token) return rejectWithValue("Отсутствует токен авторизации");

            const arrayBuffer = await getBrokerDocumentsSigned(broker_id, token);
            const pdfBytes = new Uint8Array(arrayBuffer);

            dispatch(setCurrentSignedDocuments({ type: "type_doc_agreement_transfer_broker", document: pdfBytes }));
            if (purpose === "download") onSuccess();
            return pdfBytes;
        } catch (error: any) {
            const msg = error.response?.request?.errorText || "Брокер не подтвержден. Обратитесь в поддержку";
            if (msg.length > 0) { dispatch(setError(msg)); }
            return rejectWithValue(msg);
        }
    }
);

export const getAllBrokersThunk = createAsyncThunk<
    void,
    { is_confirmed_type_doc_agreement_transfer_broker: boolean; onSuccess: () => void },
    { rejectValue: string; state: RootState }
>(
    "documents/getAllBrokers",
    async ({ is_confirmed_type_doc_agreement_transfer_broker, onSuccess }, { getState, dispatch, rejectWithValue }) => {
        try {
            const token = getState().user.token;
            if (!token) return rejectWithValue("Отсутствует токен авторизации");
            const response = await getAllBrokers(token, is_confirmed_type_doc_agreement_transfer_broker);
            dispatch(setIsWaitingBrokerVerification(response.is_waiting_manual_verification_broker));
            dispatch(setBrokers(response.data));
            if (response.data.length > 0) {
                dispatch(setBrokerIds({ brokerId: response.data[0].id, count: response.count }));
            }
        } catch (error: any) {
            const msg = error.response?.data?.errorText || "Ошибка при получении подписанного документа";
            return rejectWithValue(msg);
        }
    }
);

// ============ Thunks для авторизованных пользователей (CustomDoc) ============

export const getAllCustomDocumentUserThunk = createAsyncThunk<
    void,
    void,
    { rejectValue: string; state: RootState }
>("documents/getAllCustomDocumentUser", async (_, { getState, dispatch, rejectWithValue }) => {
    try {
        const token = getState().user.token;
        if (!token) return rejectWithValue("Отсутствует токен авторизации");

        const response = await getAllCustomDocumentUser(token);
        dispatch(setCustomDocumentsUser(response.data || []));
    } catch (error: any) {
        const msg = error.response?.data?.errorText || "Ошибка при получении списка кастомных документов";
        if (msg.length > 0) { dispatch(setError(msg)); }
        return rejectWithValue(msg);
    }
});

export const confirmCustomDocumentUserThunk = createAsyncThunk<
    void,
    { data: { id: string; is_agree: boolean }; onSuccess: () => void },
    { rejectValue: string; state: RootState }
>(
    "documents/confirmCustomDocumentUser",
    async ({ data, onSuccess }, { getState, dispatch, rejectWithValue }) => {
        try {
            const token = getState().user.token;
            if (!token) return rejectWithValue("Отсутствует токен авторизации");

            const response = await confirmCustomDocumentUser(data, token);
            onSuccess();
            return response;
        } catch (error: any) {
            const msg = error.response?.data?.errorText || "Ошибка при подписании документа";
            if (msg.length > 0) { dispatch(setError(msg)); }
            return rejectWithValue(msg);
        }
    }
);

export const checkConfirmationCodeUserThunk = createAsyncThunk<
    void,
    { data: { id: string; code: string }; onSuccess: (response: any) => void },
    { rejectValue: string; state: RootState }
>(
    "documents/checkConfirmationCodeUser",
    async ({ data, onSuccess }, { getState, dispatch, rejectWithValue }) => {
        try {
            const token = getState().user.token;
            if (!token) return rejectWithValue("Отсутствует токен авторизации");

            const response = await checkConfirmationCodeUser(data, token);
            onSuccess(response);

            // Обновляем список документов после успешного подписания
            dispatch(getAllCustomDocumentUserThunk());

            return response;
        } catch (error: any) {
            const msg = error.response?.data?.errorText || "Ошибка при проверке кода подтверждения";
            if (msg.length > 0) { dispatch(setError(msg)); }
            return rejectWithValue(msg);
        }
    }
);

export const getSignedCustomDocumentUserThunk = createAsyncThunk<
    Uint8Array,
    { data: { id: string }; onSuccess?: () => void },
    { rejectValue: string; state: RootState }
>(
    "documents/getSignedCustomDocumentUser",
    async ({ data, onSuccess }, { getState, dispatch, rejectWithValue }) => {
        try {
            const token = getState().user.token;
            if (!token) return rejectWithValue("Отсутствует токен авторизации");

            const arrayBuffer = await getSignedCustomDocumentUser(data, token);
            const pdfBytes = new Uint8Array(arrayBuffer);

            dispatch(setCurrentSignedDocuments({ type: `custom_doc_user_${data.id}`, document: pdfBytes }));
            onSuccess?.();

            return pdfBytes;
        } catch (error: any) {
            const msg = error.response?.data?.errorText || "Ошибка при получении подписанного документа";
            if (msg.length > 0) { dispatch(setError(msg)); }
            return rejectWithValue(msg);
        }
    }
);

export const getUserNotSignedDocumentHtmlThunk = createAsyncThunk<
    void,
    { data: { id: string }; onSuccess?: (response: any) => void },
    { rejectValue: string; state: RootState }
>(
    "documents/getUserNotSignedDocumentHtml",
    async ({ data, onSuccess }, { getState, dispatch, rejectWithValue }) => {
        try {
            const token = getState().user.token;
            if (!token) return rejectWithValue("Отсутствует токен авторизации");

            const response = await getUserNotSignedDocumentHtml(data, token);

            // Сохраняем HTML документа для предварительного просмотра
            const docId = `custom_doc_user_${data.id}`;
            dispatch(setNotSignedDocumentsHtmls({ [docId]: response.not_signed_document_html }));

            onSuccess?.(response);
            return response;
        } catch (error: any) {
            const msg = error.response?.data?.errorText || "Ошибка при получении HTML документа";
            if (msg.length > 0) { dispatch(setError(msg)); }
            return rejectWithValue(msg);
        }
    }
);

// ============ slice ============
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
            if (!state.allNotSignedDocumentsHtml) state.allNotSignedDocumentsHtml = {};
            state.allNotSignedDocumentsHtml["type_doc_agreement_transfer_broker"] = action.payload.notSignedDocBroker;
        },
        setBrokerIds(state, action: PayloadAction<{ brokerId: string; count: number }>) {
            state.brokerIds = [action.payload.brokerId];
            state.brokersCount = action.payload.count;
        },
        setBrokers(state, action: PayloadAction<BrokerData[]>) {
            state.brokers = action.payload;
        },

        // HTML не подписанных документов
        setNotSignedDocumentsHtmls(state, action: PayloadAction<Record<string, string>>) {
            if (typeof action.payload === "string") {
                console.warn("setNotSignedDocumentsHtmls: payload is string");
                return;
            }
            if (!state.allNotSignedDocumentsHtml) state.allNotSignedDocumentsHtml = {};
            Object.entries(action.payload).forEach(([id, html]) => {
                state.allNotSignedDocumentsHtml![id] = html;
            });
        },

        setCurrentSignedDocuments(state, action: PayloadAction<{ document: Uint8Array | null; type: string }>) {
            state.currentSugnedDocument = action.payload;
        },
        setIsRiksProfileComplete(state, action: PayloadAction<FilledRiskProfileChapters>) {
            state.filledRiskProfileChapters = action.payload;
        },

        // ===== Новые редьюсеры для таймеров =====
        startDocTimeout(
            state,
            action: PayloadAction<{ docKey: string; duration?: number; startedAtMs?: number }>
        ) {
            const { docKey } = action.payload;
            const dur = action.payload.duration ?? docTimeoutMap[docKey] ?? 5;
            state.timersByDoc[docKey] = {
                startedAt: action.payload.startedAtMs ?? Date.now(),
                duration: dur,
                active: true,
            };
        },

        stopDocTimeout(state, action: PayloadAction<{ docKey: string }>) {
            const { docKey } = action.payload;
            const entry = state.timersByDoc[docKey];
            if (entry) {
                entry.active = false;
                entry.startedAt = null;
                entry.duration = 0;
            }
        },
        tickNow(state) {
            state.nowTs = Date.now();
        },


        nextDocType(state) {
            const currentIndex = docTypes.findIndex((doc) => doc === state.currentConfirmableDoc);
            if (currentIndex < docTypes.length - 1) {
                state.currentConfirmableDoc = docTypes[currentIndex + 1];
            }
        },

        setUploadDocSocket(state, action: PayloadAction<{ docId: string; socketId: string }>) {
            const { docId, socketId } = action.payload;
            state.uploadDocs[docId] = { socketId, status: "pending" };
        },
        resetBrokerIds(state) {
            state.brokerIds = [];
            state.brokersCount = 0;
        },
        // внутри reducers: { ... }
        setCustomDocumentData(state, action: PayloadAction<CustomDocData>) {
            state.customDocumentsData = action.payload;
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
                const doc = state.userDocuments.find((d) => d.key === docId);
                if (doc) doc.timeoutPending = 0;
            }
        },


        setAvailabilityPersonalAccountMenuItems(
            state,
            action: PayloadAction<AvailabilityPersonalAccountMenuItems>
        ) {
            state.availabilityPersonalAccountMenuItems = action.payload;
        },

        setIsWaitingBrokerVerification(state, action: PayloadAction<boolean>) {
            state.is_waiting_manual_verification_broker = action.payload;
        },
        setIsWaitingDocumentsVerification(
            state,
            action: PayloadAction<{ type_doc_agreement_transfer_broker: string; type_doc_passport: string }>
        ) {
            state.waiting_manual_document_verification = action.payload;
        },

        // ===== Новые reducers для авторизованных пользователей =====
        setCustomDocumentsUser(state, action: PayloadAction<CustomDocUserData[]>) {
            state.customDocumentsUser = action.payload;
        },

        setCurrentCustomDocUser(state, action: PayloadAction<CustomDocUserData | null>) {
            state.currentCustomDocUser = action.payload;
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
            });
    },
});

// ===== Selectors =====

/**
 * Сколько секунд осталось для конкретного документа.
 * Если таймер не активен — 0.
 */
export const selectRemainingTimeoutByDoc = (state: RootState, docKey: string): number => {
    const entry = state.documents.timersByDoc[docKey];
    if (!entry || !entry.active || !entry.startedAt) return 0;
    const now = Date.now();
    const elapsed = Math.floor((now - entry.startedAt) / 1000);
    return Math.max(0, entry.duration - elapsed);
};


export const {
    setCurrentConfirmableDoc,
    setCurrentConfirmationMethod,
    setUserDocuments,
    nextDocType,
    setNotSignedDocumentsHtmls,
    setCurrentSignedDocuments,
    setIsRiksProfileComplete,
    setUserPasportData,
    setBrokerSuccessResponseInfo,
    setBrokerIds,
    setBrokers,
    setCustomDocumentData,
    setUploadDocSocket,
    setUploadDocStatus,
    resetBrokerIds,
    setAvailabilityPersonalAccountMenuItems,
    setIsWaitingBrokerVerification,
    setIsWaitingDocumentsVerification,

    // новые
    startDocTimeout,
    stopDocTimeout,
    tickNow,

    // для авторизованных пользователей
    setCustomDocumentsUser,
    setCurrentCustomDocUser,
} = documentsSlice.actions;

export default documentsSlice.reducer;
