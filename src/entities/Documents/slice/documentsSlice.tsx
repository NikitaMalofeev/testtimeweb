// documentsSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

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
}

const initialState: DocumentsState = {
    // Начинаем с первого типа
    currentConfirmableDoc: docTypes[1]
};

export const documentsSlice = createSlice({
    name: "documents",
    initialState,
    reducers: {
        setCurrentConfirmableDoc(state, action: PayloadAction<string>) {
            state.currentConfirmableDoc = action.payload;
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

export const { setCurrentConfirmableDoc, nextDocType } = documentsSlice.actions;
export default documentsSlice.reducer;
