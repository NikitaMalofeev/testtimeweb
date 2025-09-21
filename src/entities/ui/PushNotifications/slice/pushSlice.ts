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
            description: "Пройдите риск-профилирование в разделе \n\"Риск-профиль\"\n  Личного Кабинета",
            active: false,
            hasOpened: false,
            uiStep: 0
        },
        {
            id: "confirmRiskProfile",
            title: "Подтвердите выбор риск-профиля",
            description: "Подтвердить риск-профиль можно в разделе \n\"Риск-профиль\"\n  Личного Кабинета",
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
            id: "fillIPData",
            title: "Заполните данные ИП",
            description:
                'Заполните регистрационные данные индивидуального предпринимателя в разделе \n"Документы"\n Личного Кабинета',
            active: false,
            hasOpened: false,
            uiStep: 2,
        },
        {
            id: "uploadIPDocuments",
            title: "Загрузите документы ИП",
            description:
                'Загрузите свидетельство о регистрации ИП и другие документы в разделе \n"Документы"\n Личного Кабинета',
            active: false,
            hasOpened: false,
            uiStep: 3,
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
            title: "Подписать анкету Риск Профиля",
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
            title: "Подписать политику персональных данных",
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
            id: "startWorkReady",
            title: "Начать работу",
            description: "Ваши документы успешно прошли проверку, вы можете подключить тариф для начала работы с вашим счетом",
            active: false,
            route: '/payments',
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
        {
            id: "type_doc_agreement_account_maintenance",
            title: "Подписать договор на обслуживание аккаунта",
            description: "Подпишите договор на обслуживание аккаунта в разделе \n\"Документы\"\n Личного Кабинета",
            active: false,
            hasOpened: false,
            route: '/documents',
            uiStep: 4
        },
    ],
};

// push/checkNotifications.ts
export const checkPushNotificationsThunk = createAsyncThunk<void, void, { state: RootState }>(
    'push/checkNotifications',
    (_, { dispatch, getState }) => {
        const state = getState();
        const {
            filledRiskProfileChapters,
            brokerIds,
            brokersCount,
            userDocuments,
            is_waiting_manual_verification_broker,
            waiting_manual_document_verification
        } = state.documents;

        const isAnotherBroker = state.riskProfile.isAnotherBroker;

        // важно: отличать "undefined" от false
        const isIpRaw = state.user.userPersonalAccountInfo?.is_individual_entrepreneur;
        if (typeof isIpRaw === 'undefined') return;
        const isIp = !!isIpRaw;

        type PushPair = { field: keyof FilledRiskProfileChapters; id: string };

        const personBlock: PushPair[] = isIp
            ? [{ field: 'is_complete_person_legal', id: 'fillIPData' }]
            : [
                { field: 'is_complete_passport', id: 'fillPassportData' },
                { field: 'is_exist_scan_passport', id: 'uploadDocuments' },
            ];

        const pushMapping: PushPair[] = [
            { field: 'is_risk_profile_complete', id: 'fillRiskProfiling' },
            { field: 'is_risk_profile_complete_final', id: 'confirmRiskProfile' },
            ...personBlock,
        ];

        // 1) Блок риск-профиля
        const firstRisk = pushMapping.find(({ field }) => !filledRiskProfileChapters[field]);
        let nextId: string | null = null;

        if (firstRisk) {
            nextId = firstRisk.id;
        } else {
            // 2) Подписание документов
            const confirmableDocs = [
                'type_doc_EDS_agreement',
                'type_doc_RP_questionnairy',
                'type_doc_agreement_investment_advisor',
                'type_doc_risk_declarations',
                'type_doc_agreement_personal_data_policy',
                'type_doc_investment_profile_certificate',
                'type_doc_agreement_account_maintenance',
            ] as const;

            const firstDocToSign = confirmableDocs.find(
                (docId) => !Object.values(userDocuments).some((doc) => doc.key === docId)
            );
            if (firstDocToSign) {
                nextId = firstDocToSign as string;
            } else {
                // 3) Подключение брокера
                if (brokerIds.length === 0) {
                    nextId = 'type_doc_broker_api_token_fill';
                } else if (brokerIds.length > 0 && brokersCount === 0 && !isAnotherBroker) {
                    nextId = 'type_doc_broker_api_token_sign';
                } else if (waiting_manual_document_verification.type_doc_agreement_transfer_broker) {
                    // логика у тебя такая — оставляю как есть
                    nextId = 'startWork';
                } else if (Object.values(waiting_manual_document_verification).length === 0 && (brokersCount > 0 || isAnotherBroker)) {
                    // логика у тебя такая — оставляю как есть
                    nextId = 'startWorkReady';
                } else {
                    // 4) Старт работы
                    const confirmableCount = confirmableDocs.length;
                    const allDocsSigned = Object.values(userDocuments).length === confirmableCount;
                    if (allDocsSigned && (brokersCount > 0 || isAnotherBroker)) {
                        nextId = 'startWork';
                    }
                }
            }
        }

        // Если активный не меняется — ничего не диспатчим (лишние ререндеры/экшены не нужны)
        const currentActiveId = state.push.notifications.find((n) => n.active)?.id ?? null;
        if (nextId === currentActiveId) return;

        if (nextId) {
            dispatch(activatePush(nextId));
        } else {
            dispatch(resetPushNotifications());
        }
    }
);


const pushSlice = createSlice({
    name: "push",
    initialState,
    reducers: {
        /** Активирует только указанный пуш, деактивируя все остальные */
        activatePush(state, action: PayloadAction<string>) {
            const id = action.payload;
            // 1) Сначала сбросим флаг active у всех пушей
            state.notifications.forEach((n) => {
                n.active = false;
            });
            // 2) Затем найдём и включим только нужный
            const notification = state.notifications.find((n) => n.id === id);
            if (notification) {
                notification.active = true;
            }
        },
        /** Деактивирует конкретный пуш (не затрагивая остальные) */
        deactivatePush(state, action: PayloadAction<string>) {
            const id = action.payload;
            const n = state.notifications.find(n => n.id === id);
            if (n) n.active = false;
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
