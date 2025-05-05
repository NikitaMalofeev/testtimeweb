import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from 'app/providers/store/config/store';
import { setError } from 'entities/Error/slice/errorSlice';
import {
    checkConfirmationCodeTariff,
    createOrder,
    getAllTariffs,
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
    currentOrderId: string;                  // <== НОВОЕ: выбранный тариф для UI
    currentOrder: PaymentData | null;
    currentOrderStatus: 'pay' | 'success' | 'loading' | 'failed' | 'exit' | '';
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
    currentOrderId: '',          // <== НОВОЕ
    currentOrder: null,
    currentOrderStatus: '',
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
export const getAllTariffsThunk = createAsyncThunk<Tariff[], void, { rejectValue: string; state: RootState }>(
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
>('payments/getOrderStatus', async ({ orderId, token }, { dispatch, rejectWithValue }) => {
    try {
        const data = await getOrderStatus(orderId, token);
        return data;
    } catch (err: any) {
        const msg = err.response?.data?.error || err.message;
        dispatch(setError(msg));
        return rejectWithValue(msg);
    }
});

// 8. приём результата от Robokassa
export const robokassaResultThunk = createAsyncThunk<
    RobokassaResultResponse,
    { payload: RobokassaResultResponse },
    { rejectValue: string }
>('payments/robokassaResult', async ({ payload }, { dispatch, rejectWithValue }) => {
    try {
        const data = await robokassaResult(payload);
        return data;
    } catch (err: any) {
        const msg = err.response?.data?.error || err.message;
        dispatch(setError(msg));
        return rejectWithValue(msg);
    }
});


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
        setCurrentOrderId: (state, action: PayloadAction<string>) => {   // <== НОВОЕ
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
    setCurrentOrderId,          // <== НОВОЕ
    setCurrentOrderStatus,
} = paymentsSlice.actions;

export default paymentsSlice.reducer;
