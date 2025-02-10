import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import {
    IdentificationProfileData,
    ConfirmationCodeData,
    NeedHelpData
} from "../model/types";
import { getAllSelects, postConfirmationCode, postIdentificationData, postNeedHelpRequest, postResendConfirmationCode } from "shared/api/RiskProfileApi/riskProfileApi";
import { setUserId } from "entities/User/slice/userSlice";
import { setConfirmationStatusSuccess } from "entities/ui/Ui/slice/uiSlice";
import { setError } from "entities/Error/slice/errorSlice";

interface RiskProfileFormState {
    loading: boolean;
    error: string | null;
    success: boolean;
    riskProfileSelectors: RiskProfileSelectors | null
    formValues: Record<string, string>;
    stepsFirstForm: {
        currentStep: number;
    };
}

interface RiskProfileSelectors {
    [key: string]: Record<string, string>;
}

const initialState: RiskProfileFormState = {
    loading: false,
    error: null,
    success: false,
    riskProfileSelectors: null,
    formValues: {},
    stepsFirstForm: {
        currentStep: 0
    }
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
            if (error.response.data.password) {
                dispatch(setError(error.response.data.password))
            }
            if (error.response.data.phone) {
                dispatch(setError(error.response.data.phone))
            }
            return rejectWithValue(
                error.response?.data?.message || "Ошибка при отправке данных"
            );
        }
    }
);

export const fetchAllSelects = createAsyncThunk<
    any,
    void,
    { rejectValue: string }
>(
    "riskProfile/fetchAllSelects",
    async (_, { rejectWithValue }) => {
        try {
            const response = await getAllSelects();
            return response;
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data?.message || "Ошибка при загрузке данных"
            );
        }
    }
);


export const sendConfirmationCode = createAsyncThunk<
    void,
    ConfirmationCodeData & { onSuccess?: () => void }, // Добавляем колбэк
    { rejectValue: string }
>(
    "riskProfile/sendConfirmationCode",
    async ({ onSuccess, ...data }, { rejectWithValue, dispatch }) => {
        try {
            const response = await postConfirmationCode(data);

            if (response.status === "success") {
                dispatch(setConfirmationStatusSuccess(true));

                // Вызываем колбэк при успешном ответе
                if (onSuccess) {
                    onSuccess();
                }
            }
        } catch (error: any) {
            dispatch(setError(error.response?.data?.errorText || "Ошибка при отправке кода"));
            console.log(error.response?.data);
            return rejectWithValue(
                error.response?.data?.message || "Ошибка при отправке кода"
            );
        }
    }
);

export const resendConfirmationCode = createAsyncThunk<
    void,
    { user_id: string; method: "whatsapp" | "phone" | "email" },
    { rejectValue: string }
>(
    "riskProfile/resendConfirmationCode",
    async ({ user_id, method }, { rejectWithValue, dispatch }) => {
        try {
            // Подготовим разные поля под конкретный метод
            let payload: Record<string, any> = { user_id };
            if (method === "whatsapp") {
                payload.type = "type_doc_EDS_agreement";
                payload.type_sms_message = "WHATSAPP";
            } else if (method === "phone") {
                payload.type = "phone";
            } else if (method === "email") {
                payload.type = "email";
            }

            const response = await postResendConfirmationCode(payload);

            // Если нужно - обработайте ответ, например, показать уведомление
            console.log("Resend response:", response);

        } catch (error: any) {
            // Замените обработку под ваш сценарий
            return rejectWithValue(error.response?.data?.message || "Ошибка при повторной отправке кода");
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
    reducers: {
        updateFieldValue: (state, action: PayloadAction<{ name: string; value: string }>) => {
            state.formValues[action.payload.name] = action.payload.value;
        },
        nextStep(state) {
            state.stepsFirstForm.currentStep += 1;
        },
        prevStep(state) {
            if (state.stepsFirstForm.currentStep > 0) {
                state.stepsFirstForm.currentStep -= 1;
            }
        },
        setStep(state, action) {
            state.stepsFirstForm.currentStep = action.payload;
        },
    },
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
            })
            .addCase(fetchAllSelects.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchAllSelects.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                state.riskProfileSelectors = action.payload;
            })
            .addCase(fetchAllSelects.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });

    },
});

export const { updateFieldValue, nextStep, prevStep } = riskProfileSlice.actions;
export default riskProfileSlice.reducer;
