import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from 'app/providers/store/config/store';
import { setError } from 'entities/Error/slice/errorSlice';
import {
    checkConfirmationCodeTariff,
    createOrder,
    getAllTariffs,
    getAllUserTariffs,
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
} from '../types/paymentsTypes';
import {
    setCurrentSignedDocuments,
    setNotSignedDocumentsHtmls,
} from 'entities/Documents/slice/documentsSlice';

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
    isFetchingTariffs: boolean;
    tariffs: Tariff[];

    isFetchingStatus: boolean;
    orderStatus: OrderStatusResponse | null;

    isPostingRobokassa: boolean;
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
    isFetchingTariffs: false,
    tariffs: [],

    isFetchingStatus: false,
    orderStatus: null,

    isPostingRobokassa: false,
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
        const msg = err.response?.data?.info || err.message;
        dispatch(setError(msg));
        return rejectWithValue(msg);
    }
});

// получить все тарифы пользователя + информацию о платежах
export const getAllUserTariffsThunk = createAsyncThunk<
    PaymentInfo[],                                       // <== НОВОЕ
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
            const msg = err.response?.data?.error || err.message;
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
            const msg = err.response?.data?.error || err.message;
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
            const msg = err.response?.data?.error || err.message;
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
            const msg = err.response?.data?.error || err.message;
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
    'payments/getAllTariffs',
    async (_, { dispatch, rejectWithValue, getState }) => {
        try {
            const token = getState().user.token;
            const data = await getAllTariffs(token);
            return data;
        } catch (err: any) {
            const msg = err.response?.data?.error || err.message;
            dispatch(setError(msg));
            return rejectWithValue(msg);
        }
    },
);

// 6. установить тариф пользователю
export const setTariffIdThunk = createAsyncThunk<
    void,
    { tariff_key: string; onSuccess: () => void },
    { rejectValue: string; state: RootState }
>(
    'payments/setTariffIdThunk',
    async ({ tariff_key, onSuccess }, { dispatch, rejectWithValue, getState }) => {
        try {
            const token = getState().user.token;
            const res = await paymentsSetTariff(tariff_key, token);
            const key = res.tariff.key;
            dispatch(setCurrentUserTariff(key));
            onSuccess();
        } catch (err: any) {
            const msg = err.response?.data?.error || err.message;
            dispatch(setError(msg));
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
            const msg = err.response?.data?.error || err.message;
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
            const msg = err.response?.data?.error || err.message;
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
        setPaymentsInfo: (state, action: PayloadAction<PaymentInfo[]>) => { // <== НОВОЕ
            state.payments_info = action.payload;
        },
        resetPaymentsState: () => initialState,
    },
    extraReducers: (builder) => {
        builder
            /* getAllTariffs */
            .addCase(getAllTariffsThunk.pending, (state) => {
                state.isFetchingTariffs = true;
                state.error = null;
            })
            .addCase(getAllTariffsThunk.fulfilled, (state, { payload }) => {
                state.isFetchingTariffs = false;
                state.tariffs = payload;
            })
            .addCase(getAllTariffsThunk.rejected, (state) => {
                state.isFetchingTariffs = false;
            })

            /* getAllUserTariffs */
            // .addCase(getAllUserTariffsThunk.fulfilled, (state, { payload }) => {
            //     // payload уже массив PaymentInfo
            //     state.payments_info = payload;
            // })

            /* -------- остальные cases оставлены без изменений -------- */;
    },
});

/* -------------------------------------------------------------------------- */
/* EXPORTS */
/* -------------------------------------------------------------------------- */

export const {
    clearPaymentsError,
    resetPaymentsState,
    setCurrentTariff,
    setCurrentUserTariff,
    setCurrentOrder,
    setCurrentOrderId,
    setCurrentOrderStatus,
    setPaymentsInfo,            // <== НОВОЕ
} = paymentsSlice.actions;

export default paymentsSlice.reducer;
