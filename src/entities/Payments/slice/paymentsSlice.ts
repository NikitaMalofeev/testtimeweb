import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "app/providers/store/config/store";
import { setError } from "entities/Error/slice/errorSlice";
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
} from "entities/Payments/api/paymentsApi";
import { PaymentsCreateOrderPayload } from "../types/paymentsTypes";
import { setCurrentSignedDocuments, setNotSignedDocumentsHtmls } from "entities/Documents/slice/documentsSlice";

// --- Types ---
export interface CreateOrderPayload {
    first_name: string;
    last_name: string;
    email: string;
    payment_system: string;
    currency: string;
}

export interface CreateOrderResponse {
    order_id: string;
    payment_url: string;
}

export interface Tariff {
    id: string;
    is_active: boolean;
    title: string;
    name_icon: string | null;
    description: string;
    days_service_validity: number;
    commission_deposit: number | null;
    commission_asset: number | null;
    commission_asset_days: number | null;
    created: string;
    updated: string;
    descriptionDetail: string;
}

export interface OrderStatusResponse {
    id: number;
    paid: boolean;
    status: string;
}

export interface RobokassaResultResponse {
    OutSum: string;
    InvId: string;
    EMail: string;
    SignatureValue: string;
    IsTest?: string;
}

// --- State ---
interface PaymentsState {
    isCreatingOrder: boolean;
    createOrderResult: CreateOrderResponse | null;

    isFetchingTariffs: boolean;
    tariffs: Tariff[];

    isFetchingStatus: boolean;
    orderStatus: OrderStatusResponse | null;

    isPostingRobokassa: boolean;
    robokassaData: RobokassaResultResponse | null;
    currentTariffId: string;
    error: string | null;
}

const initialState: PaymentsState = {
    isCreatingOrder: false,
    createOrderResult: null,

    isFetchingTariffs: false,
    tariffs: [],

    isFetchingStatus: false,
    orderStatus: null,

    isPostingRobokassa: false,
    robokassaData: null,
    currentTariffId: '',
    error: null,
};

// --- Thunks ---
export const createOrderThunk = createAsyncThunk<
    CreateOrderResponse,
    { payload: PaymentsCreateOrderPayload; onSuccess?: () => void },
    { rejectValue: string, state: RootState }
>(
    "payments/createOrder",
    async ({ payload, onSuccess }, { dispatch, rejectWithValue, getState }) => {
        try {
            const token = getState().user.token;
            const response = await createOrder(payload, token);
            onSuccess?.();
            return response;
        } catch (err: any) {
            const msg = err.response?.data?.error || err.message;
            dispatch(setError(msg));
            return rejectWithValue(msg);
        }
    }
);

// 1. проверка кода подтверждения тарифа
export const checkConfirmationCodeTariffThunk = createAsyncThunk<
    void,
    { tariff_id: string; code: string; onSuccess?: () => void },
    { rejectValue: string; state: RootState }
>(
    "payments/checkConfirmationCodeTariff",
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
    }
);

// 2. получить подписанный PDF по тарифу
export const getSignedTariffDocThunk = createAsyncThunk<
    Uint8Array,
    { tariff_id: string; purpose?: "download" | "preview"; onSuccess?: () => void },
    { rejectValue: string; state: RootState }
>(
    "payments/getSignedTariffDoc",
    async ({ tariff_id, purpose = "preview", onSuccess }, { dispatch, getState, rejectWithValue }) => {
        try {
            const token = getState().user.token;
            const arrayBuf = await getSignedTariffDoc(tariff_id, token);
            const pdfBytes = new Uint8Array(arrayBuf);

            dispatch(
                setCurrentSignedDocuments({
                    type: `tariff_${tariff_id}`,
                    document: pdfBytes,
                })
            );

            if (purpose === "download") onSuccess?.();
            return pdfBytes;
        } catch (err: any) {
            const msg = err.response?.data?.error || err.message;
            dispatch(setError(msg));
            return rejectWithValue(msg);
        }
    }
);

// 3. получить HTML неподписанного тарифа и сохранить в documentsSlice
export const getNotSignedTariffDocThunk = createAsyncThunk<
    void,
    { tariff_id: string },
    { rejectValue: string; state: RootState }
>(
    "payments/getNotSignedTariffDoc",
    async ({ tariff_id }, { dispatch, getState, rejectWithValue }) => {
        try {
            const token = getState().user.token;
            const { not_signed_document_html } = await getNotSignedTariffDoc(tariff_id, token);

            dispatch(
                setNotSignedDocumentsHtmls({
                    [`tariff_${tariff_id}`]: not_signed_document_html,
                })
            );
        } catch (err: any) {
            const msg = err.response?.data?.error || err.message;
            dispatch(setError(msg));
            return rejectWithValue(msg);
        }
    }
);

// 4. инициировать подписание тарифа
export const signingTariffThunk = createAsyncThunk<
    void,
    { tariff_id: string; type_message: string; is_agree: boolean; onSuccess?: () => void },
    { rejectValue: string; state: RootState }
>(
    "payments/signingTariff",
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
    }
);


export const getAllTariffsThunk = createAsyncThunk<
    Tariff[],
    void,
    { rejectValue: string, state: RootState }
>(
    "payments/getAllTariffs",
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
    }
);

export const setTariffIdThunk = createAsyncThunk<
    void,
    { tariff_key: string, onSuccess: () => void },
    { rejectValue: string, state: RootState }
>(
    "payments/setTariffIdThunk",
    async ({ tariff_key, onSuccess }, { dispatch, rejectWithValue, getState }) => {
        try {
            const token = getState().user.token;
            console.log(tariff_key)
            const data = await paymentsSetTariff(tariff_key, token);
            onSuccess()
            return data;
        } catch (err: any) {
            const msg = err.response?.data?.error || err.message;
            dispatch(setError(msg));
            return rejectWithValue(msg);
        }
    }
);

export const getOrderStatusThunk = createAsyncThunk<
    OrderStatusResponse,
    { orderId: string; token: string },
    { rejectValue: string }
>(
    "payments/getOrderStatus",
    async ({ orderId, token }, { dispatch, rejectWithValue }) => {
        try {
            const data = await getOrderStatus(orderId, token);
            return data;
        } catch (err: any) {
            const msg = err.response?.data?.error || err.message;
            dispatch(setError(msg));
            return rejectWithValue(msg);
        }
    }
);

export const robokassaResultThunk = createAsyncThunk<
    RobokassaResultResponse,
    { payload: RobokassaResultResponse },
    { rejectValue: string }
>(
    "payments/robokassaResult",
    async ({ payload }, { dispatch, rejectWithValue }) => {
        try {
            const data = await robokassaResult(payload);
            return data;
        } catch (err: any) {
            const msg = err.response?.data?.error || err.message;
            dispatch(setError(msg));
            return rejectWithValue(msg);
        }
    }
);

// --- Slice ---
export const paymentsSlice = createSlice({
    name: "payments",
    initialState,
    reducers: {
        clearPaymentsError: (state) => {
            state.error = null;
        },
        setCurrentTariff: (state, action: PayloadAction<string>) => {
            state.currentTariffId = action.payload;
        },
        resetPaymentsState: () => initialState,
    },
    extraReducers: (builder) => {
        builder
            // createOrder
            .addCase(createOrderThunk.pending, (state) => {
                state.isCreatingOrder = true;
                state.error = null;
            })
            .addCase(createOrderThunk.fulfilled, (state, { payload }) => {
                state.isCreatingOrder = false;
                state.createOrderResult = payload;
            })
            .addCase(createOrderThunk.rejected, (state) => {
                state.isCreatingOrder = false;
            })

            // getAllTariffs
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

            // getOrderStatus
            .addCase(getOrderStatusThunk.pending, (state) => {
                state.isFetchingStatus = true;
                state.error = null;
            })
            .addCase(getOrderStatusThunk.fulfilled, (state, { payload }) => {
                state.isFetchingStatus = false;
                state.orderStatus = payload;
            })
            .addCase(getOrderStatusThunk.rejected, (state) => {
                state.isFetchingStatus = false;
            })

            // robokassaResult
            .addCase(robokassaResultThunk.pending, (state) => {
                state.isPostingRobokassa = true;
                state.error = null;
            })
            .addCase(robokassaResultThunk.fulfilled, (state, { payload }) => {
                state.isPostingRobokassa = false;
                state.robokassaData = payload;
            })
            .addCase(robokassaResultThunk.rejected, (state) => {
                state.isPostingRobokassa = false;
            });
    },
});

export const { clearPaymentsError, resetPaymentsState, setCurrentTariff } = paymentsSlice.actions;
export default paymentsSlice.reducer;
