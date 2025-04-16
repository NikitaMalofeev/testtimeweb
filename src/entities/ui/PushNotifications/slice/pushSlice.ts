// src/entities/Push/slice/pushSlice.ts

import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "app/providers/store/config/store";
import { FilledRiskProfileChapters } from "entities/Documents/types/documentsTypes";

export interface PushNotificationItem {
    id: string;
    title: string;
    description: string;
    active: boolean;
    hasOpened: boolean;
    route?: string;
    uiStep?: number;
}

export interface PushState {
    /** Список всех пуш-уведомлений */
    notifications: PushNotificationItem[];
}

const initialState: PushState = {
    notifications: [
        {
            id: "fillRiskProfiling",
            title: "Пройдите риск-профилирование",
            description: "Пройдите риск-профилирование в разделе \"\nРиск-профиль\"\n  Личного Кабинета",
            active: false,
            hasOpened: false,
            uiStep: 0
        },
        {
            id: "confirmRiskProfile",
            title: "Подтвердите выбор риск-профиля",
            description: "Подтвердить риск-профиль можно в разделе \"\nРиск-профиль\"\n  Личного Кабинета",
            active: false,
            hasOpened: false,
            uiStep: 1
        },
        {
            id: "fillPassportData",
            title: "Заполнить паспортные данные",
            description: "Заполните паспортные данные в разделе \n\"Документы\"\n Личного Кабинета",
            active: false,
            hasOpened: false,
            uiStep: 2
        },
        {
            id: "uploadDocuments",
            title: "Загрузить сканы паспорта",
            description: "Загрузите сканы паспорта  в разделе \n\"Документы\"\n Личного кабинета",
            active: false,
            hasOpened: false,
            uiStep: 3
        },
        {
            id: "type_doc_EDS_agreement",
            title: "Подписать соглашение об эцп",
            description: "Подпишите соглашение об электронно-цифровой подписи в разделе \n\"Документы\"\n Личного Кабинета",
            active: false,
            hasOpened: false,
            route: '/documents',
            uiStep: 4
        },
        {
            id: "type_doc_RP_questionnairy",
            title: "Подписать анкету РП",
            description: "Подпишите анкету риск-профилирования в разделе \n\"Документы\"\n Личного Кабинета",
            active: false,
            hasOpened: false,
            route: '/documents',
            uiStep: 4
        },
        {
            id: "type_doc_agreement_investment_advisor",
            title: "Подписать договор ИС",
            description: "Подпишите договор с инвестиционным советником в разделе \n\"Документы\"\n Личного Кабинета",
            active: false,
            hasOpened: false,
            route: '/documents',
            uiStep: 4
        },
        {
            id: "type_doc_risk_declarations",
            title: "Подписать Декларацию о рисках",
            description: "Подпишите декларацию о рисках в разделе \n\"Документы\"\n Личного Кабинета",
            active: false,
            hasOpened: false,
            route: '/documents',
            uiStep: 4
        },
        {
            id: "type_doc_agreement_personal_data_policy",
            title: "Подписать политику перс. данных",
            description: "Подпишите политику обработки персональных данных в разделе \n\"Документы\"\n Личного Кабинета",
            active: false,
            hasOpened: false,
            route: '/documents',
            uiStep: 4
        },
        {
            id: "type_doc_investment_profile_certificate",
            title: "Подписать справку ИП",
            description: "Подпишите наличие справки инвестиционного профиля в разделе \n\"Документы\"\n Личного Кабинета",
            active: false,
            hasOpened: false,
            route: '/documents',
            uiStep: 4
        },
        {
            id: "type_doc_agreement_account_maintenance",
            title: "Подписать договор на обслуживание аккаунта",
            description: "Подпишите договор на обслуживание аккаунта в разделе \n\"Документы\"\n Личного Кабинета",
            active: false,
            hasOpened: false,
            route: '/documents',
            uiStep: 4
        },
        {
            id: "type_doc_broker_api_token_fill",
            title: "Подключить брокера",
            description: "Подключите брокера для дальнейшей работы",
            active: false,
            hasOpened: false,
            route: '/documents',
            uiStep: 5
        },
        {
            id: "type_doc_broker_api_token_sign",
            title: "Подпишите согласие на передачу API ключа",
            description: "Подпишите согласие на передачу API ключа брокера в разделе \n\"Документы\"\n Личного Кабинета",
            active: false,
            hasOpened: false,
            route: '/documents',
            uiStep: 4
        },
        {
            id: "startWork",
            title: "Проверка документов",
            description: "Ваши документы на проверке, уведомление о начале работы придет в Личный Кабинет",
            active: false,
            hasOpened: false,
        },
        {
            id: "contractExpiresSoon",
            title: "Заканчивается срок действия договора",
            description: "Обратите внимание, срок действия вашего договора скоро истечет",
            active: false,
            hasOpened: false,
            route: '/documents',
            uiStep: 4
        },
    ],
};

// push/checkNotifications.ts
export const checkPushNotificationsThunk = createAsyncThunk<
    void,
    void,
    { state: RootState }
>(
    'push/checkNotifications',
    (_, { dispatch, getState }) => {
        const {
            filledRiskProfileChapters,
            currentConfirmableDoc,
            brokerIds,
            brokersCount,
            userDocuments
        } = getState().documents;

        /* ---------- 1. Рисковый профиль / паспорт ---------- */
        const pushMapping: { field: keyof FilledRiskProfileChapters; id: string }[] =
            [
                { field: 'is_risk_profile_complete', id: 'fillRiskProfiling' },
                { field: 'is_risk_profile_complete_final', id: 'confirmRiskProfile' },
                { field: 'is_complete_passport', id: 'fillPassportData' },
                { field: 'is_exist_scan_passport', id: 'uploadDocuments' },
            ];

        pushMapping.forEach(({ field, id }) =>
            filledRiskProfileChapters[field]
                ? dispatch(deactivatePush(id))
                : dispatch(activatePush(id)),
        );

        const confirmableDocPushes: string[] = [
            'type_doc_EDS_agreement',
            'type_doc_RP_questionnairy',
            'type_doc_agreement_investment_advisor',
            'type_doc_risk_declarations',
            'type_doc_agreement_personal_data_policy',
            'type_doc_investment_profile_certificate',
            'type_doc_agreement_account_maintenance',
        ];

        confirmableDocPushes.forEach((docId) => {
            // Проверяем, есть ли документ с данным id в userDocuments.
            // Если userDocuments – объект, получаем массив его значений.
            const documentExists = Object.values(userDocuments).some(
                (doc: { key: string }) => doc.key === docId
            );

            // Если документа нет, активируем пуш, иначе деактивируем.
            if (!documentExists) {
                dispatch(activatePush(docId));
            } else {
                dispatch(deactivatePush(docId));
            }
        });

        /* ---------- 3. Старт работы с брокером ---------- */
        if (brokerIds.length === 0) {
            dispatch(activatePush('type_doc_broker_api_token_fill'));
        } else {
            dispatch(deactivatePush('type_doc_broker_api_token_fill'));
        }
        if (brokerIds.length !== 0 && brokersCount === 0) {
            dispatch(activatePush('type_doc_broker_api_token_sign'));
        } else {
            dispatch(deactivatePush('type_doc_broker_api_token_sign'));
        }

        const allDocsIsSigned = Object.keys(userDocuments).length === 8

        if (allDocsIsSigned && brokersCount > 0) {
            dispatch(activatePush('startWork'));
        }
    },
);


const pushSlice = createSlice({
    name: "push",
    initialState,
    reducers: {
        activatePush(state, action: PayloadAction<string>) {
            const id = action.payload;
            const notification = state.notifications.find((n) => n.id === id);
            if (notification) {
                notification.active = true;
            }
        },
        deactivatePush(state, action: PayloadAction<string>) {
            const id = action.payload;
            const notification = state.notifications.find((n) => n.id === id);
            if (notification) {
                notification.active = false;
            }
        },
        markPushAsOpened(state, action: PayloadAction<string>) {
            const id = action.payload;
            const notification = state.notifications.find((n) => n.id === id);
            if (notification) {
                notification.hasOpened = true;
            }
        },
        updatePushStatuses(
            state,
            action: PayloadAction<{ id: string; active: boolean }[]>
        ) {
            action.payload.forEach(({ id, active }) => {
                const notification = state.notifications.find((n) => n.id === id);
                if (notification) {
                    notification.active = active;
                }
            });
        },
        resetPushNotifications(state) {
            state.notifications.forEach((notification) => {
                notification.active = false;
            });
        },
    },
});

export const {
    activatePush,
    deactivatePush,
    markPushAsOpened,
    updatePushStatuses,
    resetPushNotifications,
} = pushSlice.actions;
export default pushSlice.reducer;
