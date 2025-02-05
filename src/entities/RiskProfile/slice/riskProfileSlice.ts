import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
    IdentificationProfileData,
    ConfirmationCodeData,
    NeedHelpData
} from "../model/types";
import { postConfirmationCode, postIdentificationData, postNeedHelpRequest } from "shared/api/RiskProfileApi/riskProfileApi";
import { setUserId } from "entities/User/slice/userSlice";
import { setConfirmationStatusSuccess } from "entities/ui/Ui/slice/uiSlice";

interface RiskProfileFormState {
    loading: boolean;
    error: string | null;
    success: boolean;
}

const initialState: RiskProfileFormState = {
    loading: false,
    error: null,
    success: false,
};

export const createRiskProfile = createAsyncThunk<
    void,
    IdentificationProfileData,
    { rejectValue: string }
>(
    "riskProfile/createRiskProfile",
    async (data, { dispatch, rejectWithValue }) => {
        try {
            const response = await postIdentificationData(data);
            const { id } = response;
            dispatch(setUserId(id));
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data?.message || "Ошибка при отправке данных"
            );
        }
    }
);


export const sendConfirmationCode = createAsyncThunk<
    void,
    ConfirmationCodeData,
    { rejectValue: string }
>(
    "riskProfile/sendConfirmationCode",
    async (data, { rejectWithValue, dispatch }) => {
        try {
            const response = await postConfirmationCode(data);

            // Проверяем поле status в ответе
            if (response.status === "success") {
                // Если success, выставляем флажок
                dispatch(setConfirmationStatusSuccess(true));
            }

        } catch (error: any) {
            return rejectWithValue(
                error.response?.data?.message || "Ошибка при отправке кода"
            );
        }
    }
);

export const requestNeedHelp = createAsyncThunk<
    void,
    NeedHelpData,
    { rejectValue: string }
>("riskProfile/requestNeedHelp", async (data, { rejectWithValue }) => {
    try {
        await postNeedHelpRequest(data);
    } catch (error: any) {
        return rejectWithValue(
            error.response?.data?.message || "Ошибка при запросе помощи"
        );
    }
});

const riskProfileSlice = createSlice({
    name: "riskProfile",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(createRiskProfile.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.success = false;
            })
            .addCase(createRiskProfile.fulfilled, (state) => {
                state.loading = false;
                state.success = true;
            })
            .addCase(createRiskProfile.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(sendConfirmationCode.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(sendConfirmationCode.fulfilled, (state) => {
                state.loading = false;
                state.success = true;
            })
            .addCase(sendConfirmationCode.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(requestNeedHelp.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(requestNeedHelp.fulfilled, (state) => {
                state.loading = false;
                state.success = true;
            })
            .addCase(requestNeedHelp.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export default riskProfileSlice.reducer;
