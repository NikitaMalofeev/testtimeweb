import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { IdentificationProfileData } from "../model/types";
import { postIdentificationData } from "shared/api/RiskProfileApi/postIdentificationProfileData";

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
>("riskProfile/createRiskProfile", async (data, { rejectWithValue }) => {
    try {
        await postIdentificationData(data);
    } catch (error: any) {
        return rejectWithValue(
            error.response?.data?.message || "Ошибка при отправке данных"
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
            });
    },
});

export default riskProfileSlice.reducer;
