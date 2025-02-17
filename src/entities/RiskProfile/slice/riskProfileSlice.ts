import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import {
    IdentificationProfileData,
    ConfirmationCodeData,
    NeedHelpData
} from "../model/types";
import { getAllSelects, postConfirmationCode, postFirstRiskProfile, postIdentificationData, postNeedHelpRequest, postResendConfirmationCode, postSecondRiskProfile } from "shared/api/RiskProfileApi/riskProfileApi";
import { setUserId, setUserToken } from "entities/User/slice/userSlice";
import { setConfirmationEmailSuccess, setConfirmationPhoneSuccess, setConfirmationStatusSuccess, setConfirmationWhatsappSuccess } from "entities/ui/Ui/slice/uiSlice";
import { setError } from "entities/Error/slice/errorSlice";
import { RootState } from "app/providers/store/config/store";

export interface FirstRiskProfileResponse {
    info: string;
    summ: number;
    recommended_risk_profiles: Record<string, string>;
}

interface RiskProfileFormState {
    loading: boolean;
    error: string | null;
    success: boolean;
    firstRiskProfileData: FirstRiskProfileResponse | null,
    riskProfileSelectors: RiskProfileSelectors | null
    formValues: Record<string, string>;
    stepsFirstForm: {
        currentStep: number;
    };
    secondForm: {
        amount_expected_replenishment: number,
        portfolio_parameters: string;
    }
}

interface SendCodePayload {
    user_id: string;
    codeFirst: string;        // Код из первой формы
    codeSecond?: string;      // Код из второй формы (при методе 'phone' + email)
    method: 'phone' | 'email' | 'whatsapp'  // Как в вашем modalSlice
    onSuccess?: (data?: any) => void;
    onError?: (data?: any) => void;
    onClose?: () => void;
}

export interface SecondRiskProfilePayload {
    amount_expected_replenishment: number,
    portfolio_parameters: string,
}

interface RiskProfileSelectors {
    [key: string]: Record<string, string>;
}

const initialState: RiskProfileFormState = {
    loading: false,
    error: null,
    success: false,
    firstRiskProfileData: null,
    riskProfileSelectors: null,
    formValues: {},
    stepsFirstForm: {
        currentStep: 0
    },
    secondForm: {
        amount_expected_replenishment: 10000000,
        portfolio_parameters: 'risk_prof_balanced'
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
            const { id, token } = response;
            dispatch(setUserId(id));
            dispatch(setUserToken(token));
        } catch (error: any) {
            if (error.response.data.password) {
                dispatch(setError(error.response.data.password))
            }
            if (error.response.data.phone) {
                dispatch(setError(error.response.data.phone))
            }
            if (error.response.data.info) {
                dispatch(setError(error.response.data.info))
            }
            return rejectWithValue(
                error.response?.data?.message || "Ошибка при отправке данных"
            );
        }
    }
);

export const postSecondRiskProfileForm = createAsyncThunk<
    void,
    SecondRiskProfilePayload,
    { rejectValue: string }
>(
    "riskProfile/postSecondRiskProfileForm",
    async (data, { dispatch, rejectWithValue }) => {
        try {
            const token = 'e55b763400c82c8374d809035976364e98d4fed7'
            console.log()
            const response = await postSecondRiskProfile(data, token);
            // const { id } = response;
            // dispatch(setUserId(id));
        } catch (error: any) {
            // if (error.response.data.password) {
            //     dispatch(setError(error.response.data.password))
            // }
            return rejectWithValue(
                error.response?.data?.message || "Ошибка при отправке данных"
            );
        }
    }
);

export const postFirstRiskProfileForm = createAsyncThunk<
    void,
    Record<string, string>,
    { state: RootState; rejectValue: string }
>(
    "riskProfile/postFirstRiskProfileForm",
    async (data, { getState, dispatch, rejectWithValue }) => {
        try {
            const token = getState().user.token;
            if (!token) {
                return rejectWithValue("Отсутствует токен авторизации");
            }
            const transformedData = {
                ...data,
                is_qualified_investor_status: data.is_qualified_investor_status === "true",
            };
            const response = await postFirstRiskProfile(transformedData, token);
            // Обновляем state сразу: сохраняем данные ответа первой формы
            dispatch(setFirstRiskProfileData(response));
        } catch (error: any) {
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

export const sendPhoneConfirmationCode = createAsyncThunk<
    void,
    SendCodePayload,
    { rejectValue: string; state: RootState }
>(
    "riskProfile/sendPhoneConfirmationCode",
    async (
        { user_id, codeFirst, method, onSuccess, onError },
        { getState, dispatch }
    ) => {
        try {
            if (codeFirst) {
                const responsePhone = await postConfirmationCode({ user_id, code: codeFirst, type: method });
                if (responsePhone.status === "success") {
                    onSuccess?.(responsePhone);
                } else if (responsePhone.code !== 200) {
                    const msg =
                        responsePhone.data?.error_text ||
                        "Ошибка при отправке кода (непредвиденная)";
                    dispatch(setError(msg))
                    onSuccess?.(responsePhone);
                }

            }
        } catch (error: any) {
            dispatch(setConfirmationPhoneSuccess(
                'не пройдено'
            ))
        }
    }
);

export const sendEmailConfirmationCode = createAsyncThunk<
    void,
    { user_id: string; codeSecond: string; onSuccess?: (data: any) => void; onError?: (data: any) => void },
    { rejectValue: string; state: RootState }
>(
    "riskProfile/sendEmailConfirmationCode",
    async (
        { user_id, codeSecond, onSuccess, onError },
        { getState, dispatch }
    ) => {
        try {
            const responseEmail = await postConfirmationCode({ user_id, code: codeSecond, type: "email" });
            if (responseEmail.status === "success") {
                onSuccess?.(responseEmail);
            } else if (responseEmail.code !== 200) {
                const msg =
                    responseEmail.data?.error_text ||
                    "Ошибка при отправке кода (непредвиденная)";
                dispatch(setError(msg))
                onSuccess?.(responseEmail);
            }
        } catch {
            dispatch(setConfirmationEmailSuccess(
                'не пройдено'
            ))
        }
    }
);






export const resendConfirmationCode = createAsyncThunk<
    void,
    { user_id: string; method: "whatsapp" | "phone" | "email" },
    { rejectValue: string }
>(
    "riskProfile/resendConfirmationCode",
    async ({ user_id, method }, { rejectWithValue }) => {
        try {
            // Подготовим body в зависимости от типа кода
            const payload: Record<string, any> = {
                user_id,
            };

            if (method === "whatsapp") {
                payload.type = "phone";
                payload.type_sms_message = "WHATSAPP";
            } else if (method === "phone") {
                payload.type = "phone";
            } else if (method === "email") {
                payload.type = "email";
            }

            // Единственный вызов, без второго
            await postResendConfirmationCode(payload);

        } catch (error: any) {
            return rejectWithValue(
                error.response?.data?.message ||
                "Ошибка при повторной отправке кода"
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
    reducers: {
        updateFieldValue: (state, action: PayloadAction<{ name: string; value: string }>) => {
            state.formValues[action.payload.name] = action.payload.value;
        },
        nextRiskProfileStep(state) {
            state.stepsFirstForm.currentStep += 1;
        },
        prevRiskProfileStep(state) {
            if (state.stepsFirstForm.currentStep > 0) {
                state.stepsFirstForm.currentStep -= 1;
            }
        },
        setStep(state, action) {
            state.stepsFirstForm.currentStep = action.payload;
        },
        setFirstRiskProfileData(state, action: PayloadAction<FirstRiskProfileResponse>) {
            state.firstRiskProfileData = action.payload;
        },
        // Новый экшен для обновления данных второй формы
        setSecondRiskProfileData(state, action: PayloadAction<SecondRiskProfilePayload>) {
            state.secondForm = action.payload;
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
            })

    },
});

export const { updateFieldValue, nextRiskProfileStep, prevRiskProfileStep, setFirstRiskProfileData, setSecondRiskProfileData } = riskProfileSlice.actions;
export default riskProfileSlice.reducer;
