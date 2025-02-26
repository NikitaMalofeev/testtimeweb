// documentsSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "app/providers/store/config/store";
import { ConfirmDocsPayload } from "../types/documentsTypes";
import { confirmDocsRequest } from "../api/documentsApi";
import { setCurrentConfirmingDoc } from "entities/RiskProfile/slice/riskProfileSlice";
import { setConfirmationDocsSuccess } from "entities/ui/Ui/slice/uiSlice";
import { setError } from "entities/Error/slice/errorSlice";
import { SendCodeDocsConfirmPayload } from "entities/RiskProfile/model/types";
import { postConfirmationDocsCode } from "shared/api/RiskProfileApi/riskProfileApi";

// Массив с последовательностью типов документов,
// которые необходимо подписать по порядку.
export const docTypes = [
    "type_doc_passport",
    "type_doc_EDS_agreement",
    "type_doc_RP_questionnairy",
    "type_doc_agreement_investment_advisor",
    "type_doc_risk_declarations",
    "type_doc_agreement_personal_data_policy",
    "type_doc_investment_profile_certificate"
];

export const docTypeLabels: Record<string, string> = {
    type_doc_passport: "Паспорт",
    type_doc_EDS_agreement: "Соглашение об ЭДО",
    type_doc_RP_questionnairy: "Анкета РП",
    type_doc_agreement_investment_advisor: "Договор ИИС",
    type_doc_risk_declarations: "Декларация о рисках",
    type_doc_agreement_personal_data_policy: "Политика перс. данных",
    type_doc_investment_profile_certificate: "Справка ИП",
};

interface DocumentsState {
    currentConfirmableDoc: string;  // Текущий документ на подписании
    confirmationMethod: string;
}

const initialState: DocumentsState = {
    // Начинаем с первого типа
    currentConfirmableDoc: docTypes[1],
    confirmationMethod: 'EMAIL'
};

export const confirmDocsRequestThunk = createAsyncThunk<
    void,
    { data: ConfirmDocsPayload, onSuccess: () => void },
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
                const responseDocs = await confirmDocsRequest({
                    type_message: type_message, type_document: type_document, is_agree: is_agree
                }, token);
                onSuccess?.();
                return responseDocs
            }
        } catch (error: any) {
            dispatch(setConfirmationDocsSuccess(
                'не пройдено'
            ))
            console.log(error)
            const msg =
                error.response.data?.error_text ||
                "Ошибка при отправке кода (непредвиденная)";
            dispatch(setError(msg))
        }
    }
);

export const sendDocsConfirmationCode = createAsyncThunk<
    void,
    SendCodeDocsConfirmPayload,
    { rejectValue: string; state: RootState }
>(
    "riskProfile/sendDocsConfirmationCode",
    async (
        { codeFirst, docs, onSuccess, onClose },
        { getState, dispatch, rejectWithValue }
    ) => {
        try {
            console.log('submit2')
            const token = getState().user.token;
            if (!token) {
                return rejectWithValue("Отсутствует токен авторизации");
            }
            if (codeFirst) {
                const responseDocs = await postConfirmationDocsCode({ code: codeFirst, type_document: docs }, token);
                onSuccess?.(responseDocs);
                console.log(responseDocs.next_document)
                dispatch(setCurrentConfirmableDoc(responseDocs.next_document))
            }
        } catch (error: any) {
            dispatch(setConfirmationDocsSuccess(
                'не пройдено'
            ))
            console.log(error)
            const msg =
                error.response.data?.error_text ||
                "Ошибка при отправке кода (непредвиденная)";
            dispatch(setError(msg))
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
        // Экшен, который переключает `currentConfirmableDoc` на следующий документ.
        nextDocType(state) {
            const currentIndex = docTypes.findIndex(
                (doc) => doc === state.currentConfirmableDoc
            );
            // Если мы не на последнем документе — переключаемся на следующий
            if (currentIndex < docTypes.length - 1) {
                state.currentConfirmableDoc = docTypes[currentIndex + 1];
            } else {
                // Здесь можно обработать «все документы подписаны»
                // Например, зафиксировать статус завершённости,
                // или просто оставить всё как есть.
                console.log("Все документы подписаны!");
            }
        }
    }
});

export const { setCurrentConfirmableDoc, nextDocType, setCurrentConfirmationMethod } = documentsSlice.actions;
export default documentsSlice.reducer;
