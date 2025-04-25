import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "app/providers/store/config/store";
import { setError } from "entities/Error/slice/errorSlice";
import {
    createOrder,
    getAllTariffs,
    getOrderStatus,
    paymentsSetTariff,
    robokassaResult,
} from "entities/Payments/api/paymentsApi";
import { PaymentsCreateOrderPayload } from "../types/paymentsTypes";

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

export const { clearPaymentsError, resetPaymentsState } = paymentsSlice.actions;
export default paymentsSlice.reducer;
