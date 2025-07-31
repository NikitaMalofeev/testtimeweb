import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from 'app/providers/store/config/store';
import { setError } from 'entities/Error/slice/errorSlice';
import {
    checkConfirmationCodeTariff,
    createOrder,
    getAllActiveTariffs,
    getAllTariffs,
    getAllUserTariffs,
    getChecksUser,
    getNotSignedTariffDoc,
    getOrderStatus,
    getSignedTariffDoc,
    paymentsSetTariff,
    robokassaResult,
    signingTariff,
} from 'entities/Payments/api/paymentsApi';
import {
    OrderStatusResponse,
    PaymentData,
    PaymentsCreateOrderPayload,
    RobokassaResultResponse,
    Tariff,
    UserCheck,
} from '../types/paymentsTypes';
import {
    setCurrentSignedDocuments,
    setNotSignedDocumentsHtmls,
} from 'entities/Documents/slice/documentsSlice';
import { setStepAdditionalMenuUI, setWarning } from 'entities/ui/Ui/slice/uiSlice';
import { closeModal, openModal } from 'entities/ui/Modal/slice/modalSlice';
import { ModalAnimation, ModalSize, ModalType } from 'entities/ui/Modal/model/modalTypes';
import { useNavigate } from 'react-router-dom';

/* -------------------------------------------------------------------------- */
/* TYPES */
/* -------------------------------------------------------------------------- */

// Полное описание объекта из `payments_info`
export interface PaymentInfo {
    order: {
        description: string;
        payment_system: string;
        amount: string;
        currency: string;
        paid: boolean;
    };
    broker: {
        broker: string;
        strategy: string | null;
    };
    payment_type: string | null;
    user_tariff_id: string;
    user_tariff_key: string | null;
    user_tariff_is_active: boolean;
    user_tariff_title: string | null;
    user_tariff_description: string | null;
    user_tariff_days_service_validity: number | null;
    user_tariff_commission_deposit: number | null;
    user_tariff_commission_asset: number | null;
    user_tariff_commission_asset_days: number | null;
    user_tariff_date_activated: string | null;
    user_tariff_expiry: string | null;
    user_tariff_created: string | null;
    user_tariff_updated: string | null;
    created: string;
    updated: string;
}

/* -------------------------------------------------------------------------- */
/* STATE */
/* -------------------------------------------------------------------------- */

interface PaymentsState {
    tariffs: Tariff[];
    activeTariffs: Tariff[];
    checks: Record<string, UserCheck>;
    paidTariffKeys: Record<string, string>;
    orderStatus: OrderStatusResponse | null;
    robokassaData: RobokassaResultResponse | null;

    currentTariffId: string;                 // выбранный тариф (back-id, нужен для API)
    currentUserTariffIdForPayments: string;  // тариф пользователя (ключ из ответа setTariff)
    currentOrderId: string;                  // выбранный заказ для UI
    currentOrder: PaymentData | null;
    currentOrderStatus: 'pay' | 'success' | 'loading' | 'failed' | 'exit' | '';
    payments_info: PaymentInfo[];            // <== НОВОЕ: список платежей / активных тарифов
    error: string | null;
}

const initialState: PaymentsState = {
    tariffs: [],
    activeTariffs: [],
    paidTariffKeys: {},
    checks: {},
    orderStatus: null,

    robokassaData: null,

    currentTariffId: '',
    currentUserTariffIdForPayments: '',
    currentOrderId: '',
    currentOrder: null,
    currentOrderStatus: '',
    payments_info: [{
        "order": {
            "description": "username: Пушкин Александр Сергеевич 1000.0",
            "payment_system": "ROBOKASSA",
            "amount": "1000.00",
            "currency": "RUB",
            "paid": false
        },
        "broker": {
            "broker": "tinkoff_brokers",
            "strategy": null
        },
        "payment_type": null,
        "user_tariff_id": "1663f09a-496b-40e2-bece-4f0f80f7ae0c",
        "user_tariff_key": null,
        "user_tariff_is_active": false,
        "user_tariff_title": null,
        "user_tariff_description": null,
        "user_tariff_days_service_validity": null,
        "user_tariff_commission_deposit": null,
        "user_tariff_commission_asset": null,
        "user_tariff_commission_asset_days": null,
        "user_tariff_date_activated": null,
        "user_tariff_expiry": null,
        "user_tariff_created": null,
        "user_tariff_updated": null,
        "created": "2025-04-21T19:46:31.919550+03:00",
        "updated": "2025-04-21T19:46:31.919561+03:00"
    }],                       // <== НОВОЕ
    error: null,
};

/* -------------------------------------------------------------------------- */
/* THUNKS */
/* -------------------------------------------------------------------------- */

// 0. создать заказ на оплату
export const createOrderThunk = createAsyncThunk<
    PaymentData,
    { payload: PaymentsCreateOrderPayload; onSuccess?: () => void },
    { rejectValue: string; state: RootState }
>('payments/createOrder', async ({ payload, onSuccess }, { dispatch, rejectWithValue, getState }) => {
    try {
        const token = getState().user.token;
        const response = await createOrder(payload, token);
        dispatch(setCurrentOrder(response));
        onSuccess?.();
        return response;
    } catch (err: any) {
        const msg = err.response?.data?.info || err.response?.data?.errorText || err.message;
        dispatch(setError(msg));
        return rejectWithValue(msg);
    }
});

export const getAllUserTariffsThunk = createAsyncThunk<
    PaymentInfo[],
    { onSuccess?: () => void },
    { rejectValue: string; state: RootState }
>('payments/getAllUserTariffsThunk',
    async ({ onSuccess }, { dispatch, rejectWithValue, getState }) => {
        try {
            const token = getState().user.token;
            const response = token && await getAllUserTariffs('RUB', token);
            // кладём массив в стейт
            // dispatch(setPaymentsInfo(response.payments_info));
            onSuccess?.();
            return response.payments_info;
        } catch (err: any) {
            const msg = err.response?.data?.info || err.message;
            dispatch(setError(msg));
            return rejectWithValue(msg);
        }
    },
);

export const getAllUserChecksThunk = createAsyncThunk<
    UserCheck[],
    { onSuccess?: () => void },
    { rejectValue: string; state: RootState }
>(
    'payments/getAllUserChecksThunk',
    async ({ onSuccess }, { dispatch, rejectWithValue, getState }) => {
        try {
            const token = getState().user.token;
            const data = token && await getChecksUser(token);
            dispatch(setUserChecks(data));
            onSuccess?.();
            return data;
        } catch (err: any) {
            const msg = err.response?.data?.info || err.message;
            dispatch(setError(msg));
            return rejectWithValue(msg);
        }
    },
);

export const getAllActiveTariffsThunk = createAsyncThunk<
    PaymentInfo[],                                       // <== НОВОЕ
    { onSuccess?: () => void },
    { rejectValue: string; state: RootState }
>('payments/getAllUserTariffsThunk',
    async ({ onSuccess }, { dispatch, rejectWithValue, getState }) => {
        try {
            const token = getState().user.token;
            const response = token && await getAllActiveTariffs(token);
            dispatch(setActiveTariffs(response.tariffs))
            onSuccess?.();
            return response.payments_info;
        } catch (err: any) {
            const msg = err.response?.data?.errorText || err.message;
            msg !== 'Тарифы для данного пользователя не найдены!' && dispatch(setError(msg));
            return rejectWithValue(msg);
        }
    },
);

// 1. проверка кода подтверждения тарифа
export const checkConfirmationCodeTariffThunk = createAsyncThunk<
    void,
    { tariff_id: string; code: string; onSuccess?: () => void },
    { rejectValue: string; state: RootState }
>(
    'payments/checkConfirmationCodeTariff',
    async ({ tariff_id, code, onSuccess }, { dispatch, getState, rejectWithValue }) => {
        try {
            const token = getState().user.token;
            await checkConfirmationCodeTariff(tariff_id, code, token);
            onSuccess?.();
        } catch (err: any) {
            const msg = err.response?.data?.errorText || err.message;
            dispatch(setError(msg));
            return rejectWithValue(msg);
        }
    },
);

// 2. получить подписанный PDF по тарифу
export const getSignedTariffDocThunk = createAsyncThunk<
    Uint8Array,
    { tariff_id: string; purpose?: 'download' | 'preview'; onSuccess?: () => void },
    { rejectValue: string; state: RootState }
>(
    'payments/getSignedTariffDoc',
    async ({ tariff_id, purpose = 'preview', onSuccess }, { dispatch, getState, rejectWithValue }) => {
        try {
            const token = getState().user.token;
            const arrayBuf = await getSignedTariffDoc(tariff_id, token);
            const pdfBytes = new Uint8Array(arrayBuf);
            dispatch(
                setCurrentSignedDocuments({
                    type: `tariff_${tariff_id}`,
                    document: pdfBytes,
                }),
            );
            if (purpose === 'download') onSuccess?.();
            return pdfBytes;
        } catch (err: any) {
            const msg = err.response?.data?.errorText || err.message;
            dispatch(setError(msg));
            return rejectWithValue(msg);
        }
    },
);

// 3. получить HTML неподписанного тарифа и сохранить в documentsSlice
export const getNotSignedTariffDocThunk = createAsyncThunk<
    void,
    { tariff_id: string },
    { rejectValue: string; state: RootState }
>(
    'payments/getNotSignedTariffDoc',
    async ({ tariff_id }, { dispatch, getState, rejectWithValue }) => {
        try {
            const token = getState().user.token;
            const { not_signed_document_html } = await getNotSignedTariffDoc(tariff_id, token);
            dispatch(
                setNotSignedDocumentsHtmls({
                    [`tariff_${tariff_id}`]: not_signed_document_html,
                }),
            );
        } catch (err: any) {
            const msg = err.response?.data?.errorText || err.message;
            dispatch(setError(msg));
            return rejectWithValue(msg);
        }
    },
);

// 4. инициировать подписание тарифа
export const signingTariffThunk = createAsyncThunk<
    void,
    { tariff_id: string; type_message: string; is_agree: boolean; onSuccess?: () => void },
    { rejectValue: string; state: RootState }
>(
    'payments/signingTariff',
    async ({ tariff_id, type_message, is_agree, onSuccess }, { dispatch, getState, rejectWithValue }) => {
        try {
            const token = getState().user.token;
            await signingTariff(tariff_id, type_message, is_agree, token);
            onSuccess?.();
        } catch (err: any) {
            const msg = err.response?.data?.errorText || err.message;
            dispatch(setError(msg));
            return rejectWithValue(msg);
        }
    },
);

// 5. получить все тарифы
export const getAllTariffsThunk = createAsyncThunk<
    Tariff[],
    void,
    { rejectValue: string; state: RootState }
>(
    'payments/getAllTariffsThunk',
    async (_, { dispatch, rejectWithValue, getState }) => {
        try {
            const token = getState().user.token;
            const data = await getAllTariffs(token);
            dispatch(setAllTariffs(data))
            return data;
        } catch (err: any) {
            const msg = err.response?.data?.errorText || err.message;
            dispatch(setError(msg));
            return rejectWithValue(msg);
        }
    },
);

// 6. установить тариф пользователю
export const setTariffIdThunk = createAsyncThunk<
    void,
    { tariff_key: string; broker_id: string; type_message: string; is_agree: boolean; onSuccess: () => void },
    { rejectValue: string; state: RootState }
>(
    'payments/setTariffIdThunk',
    async ({ tariff_key, broker_id, type_message, is_agree, onSuccess }, { dispatch, rejectWithValue, getState }) => {
        try {
            const token = getState().user.token;
            const res = await paymentsSetTariff(tariff_key, broker_id, type_message, is_agree, token);
            const key = res.tariff.key;
            /* ← добавляем key в “каталоговый” тариф */
            dispatch(updateTariffKey({ id: tariff_key, key }));

            /* а это — id уже «юзер-тарифа» */
            dispatch(setCurrentUserTariff(key));
            onSuccess();
        } catch (err: any) {
            const msg = err.response.data.broker_id ? `Перед подключением тарифа необходимо предоставить api-ключ брокера` : err.response?.data?.errorText;
            const riskProfileFilled = getState().documents.filledRiskProfileChapters.is_risk_profile_complete_final
            const riskProfileFinall = getState().documents.filledRiskProfileChapters.is_risk_profile_complete_final
            const hasBroker = getState().documents.brokersCount > 0
            dispatch(
                setWarning({
                    active: true,
                    description: msg,
                    buttonLabel: "Перейти к заполнению",
                    action: () => {
                        if (!hasBroker) {
                            dispatch(setStepAdditionalMenuUI(5));
                            dispatch(
                                openModal({
                                    type: ModalType.IDENTIFICATION,
                                    size: ModalSize.FULL,
                                    animation: ModalAnimation.LEFT,
                                })
                            );
                        } else if (riskProfileFinall) {
                            window.location.href = '/documents';
                            dispatch(setWarning(
                                {
                                    active: false
                                }
                            ))
                        } else if (!riskProfileFinall && riskProfileFilled) {
                            dispatch(setStepAdditionalMenuUI(1));
                            dispatch(
                                openModal({
                                    type: ModalType.IDENTIFICATION,
                                    size: ModalSize.FULL,
                                    animation: ModalAnimation.LEFT,
                                })
                            );
                        } else {
                            dispatch(setStepAdditionalMenuUI(0));
                            dispatch(
                                openModal({
                                    type: ModalType.IDENTIFICATION,
                                    size: ModalSize.FULL,
                                    animation: ModalAnimation.LEFT,
                                })
                            );
                        }
                    },
                }),
            );
            // dispatch(setError(msg));
            return rejectWithValue(msg);
        }
    },
);

// 7. статус заказа
export const getOrderStatusThunk = createAsyncThunk<
    OrderStatusResponse,
    { orderId: string; token: string },
    { rejectValue: string }
>('payments/getOrderStatus',
    async ({ orderId, token }, { dispatch, rejectWithValue }) => {
        try {
            const data = await getOrderStatus(orderId, token);
            return data;
        } catch (err: any) {
            const msg = err.response?.data?.errorText || err.message;
            dispatch(setError(msg));
            return rejectWithValue(msg);
        }
    },
);

// 8. приём результата от Robokassa
export const robokassaResultThunk = createAsyncThunk<
    RobokassaResultResponse,
    { payload: RobokassaResultResponse },
    { rejectValue: string }
>('payments/robokassaResult',
    async ({ payload }, { dispatch, rejectWithValue }) => {
        try {
            const data = await robokassaResult(payload);
            return data;
        } catch (err: any) {
            const msg = err.response?.data?.errorText || err.message;
            dispatch(setError(msg));
            return rejectWithValue(msg);
        }
    },
);

/* -------------------------------------------------------------------------- */
/* SLICE */
/* -------------------------------------------------------------------------- */

export const paymentsSlice = createSlice({
    name: 'payments',
    initialState,
    reducers: {
        clearPaymentsError: (state) => {
            state.error = null;
        },
        setAllTariffs: (state, action: PayloadAction<Tariff[]>) => {
            state.tariffs = action.payload;
        },
        setCurrentTariff: (state, action: PayloadAction<string>) => {
            state.currentTariffId = action.payload;
        },
        setCurrentUserTariff: (state, action: PayloadAction<string>) => {
            state.currentUserTariffIdForPayments = action.payload;
        },
        setCurrentOrder: (state, action: PayloadAction<PaymentData>) => {
            state.currentOrder = action.payload;
        },
        setCurrentOrderId: (state, action: PayloadAction<string>) => {
            state.currentOrderId = action.payload;
        },
        setCurrentOrderStatus: (
            state,
            action: PayloadAction<'pay' | 'success' | 'loading' | 'failed' | 'exit' | ''>,
        ) => {
            if (state.currentOrderStatus !== action.payload) {
                state.currentOrderStatus = action.payload;
            }
        },
        setUserChecks: (state, action: PayloadAction<UserCheck[]>) => {
            state.checks = action.payload.reduce<Record<string, UserCheck>>((acc, c) => {
                acc[c.id] = c;
                return acc;
            }, {});
        },
        setPaymentsInfo: (state, action: PayloadAction<PaymentInfo[]>) => { // <== НОВОЕ
            state.payments_info = action.payload;
        },
        setActiveTariffs: (state, action: PayloadAction<Tariff[]>) => {
            state.activeTariffs = action.payload;
        },
        updateTariffKey: (
            state,
            { payload: { id, key } }: PayloadAction<{ id: string; key: string }>
        ) => {
            state.paidTariffKeys = { ...state.paidTariffKeys, [id]: key };
        },
        resetPaymentsState: () => initialState,
    },
    extraReducers: (builder) => {
        builder
    },
});


export const {
    clearPaymentsError,
    resetPaymentsState,
    setCurrentTariff,
    setCurrentUserTariff,
    setCurrentOrder,
    setCurrentOrderId,
    setCurrentOrderStatus,
    setPaymentsInfo,
    setActiveTariffs,
    updateTariffKey,
    setUserChecks,
    setAllTariffs
} = paymentsSlice.actions;

export default paymentsSlice.reducer;
