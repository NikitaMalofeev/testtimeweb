import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import {
    IdentificationProfileData,
    ConfirmationCodeData,
    NeedHelpData,
    RiskProfileFormData,
    TrustedPersonInfo,
    SecondRiskProfilePayload,
    SendCodePayload,
    RiskProfileSelectors,
    SecondRiskProfileResponse,
    ThirdRiskProfileResponse
} from "../model/types";
import { getAllSelects, postConfirmationCode, postFirstRiskProfile, postIdentificationData, postNeedHelpRequest, postResendConfirmationCode, postSecondRiskProfile, postSecondRiskProfileFinal, postTrustedPersonInfoApi } from "shared/api/RiskProfileApi/riskProfileApi";
import { setUserId, setUserToken } from "entities/User/slice/userSlice";
import { nextStep, setConfirmationEmailSuccess, setConfirmationPhoneSuccess, setConfirmationStatusSuccess, setConfirmationWhatsappSuccess } from "entities/ui/Ui/slice/uiSlice";
import { setError } from "entities/Error/slice/errorSlice";
import { RootState } from "app/providers/store/config/store";
interface RiskProfileFormState {
    loading: boolean;
    error: string | null;
    success: boolean;
    IdentificationFromData: IdentificationProfileData | null;
    riskProfileForm: RiskProfileFormData | null;
    secondRiskProfileData: SecondRiskProfileResponse | null,
    thirdRiskProfileResponse: ThirdRiskProfileResponse | null,
    riskProfileSelectors: RiskProfileSelectors | null
    formValues: Record<string, string>;
    stepsFirstForm: {
        currentStep: number;
    };
}



const initialState: RiskProfileFormState = {
    loading: false,
    error: null,
    success: false,
    secondRiskProfileData: null,
    riskProfileForm: null,
    IdentificationFromData: null,
    riskProfileSelectors: null,
    thirdRiskProfileResponse: null,
    formValues: {},
    stepsFirstForm: {
        currentStep: 0
    },
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
    { state: RootState; rejectValue: string }
>(
    "riskProfile/postSecondRiskProfileForm",
    async (data, { dispatch, rejectWithValue, getState }) => {
        try {
            const token = getState().user.token;
            console.log()
            const response = await postSecondRiskProfile(data, token);
            dispatch(setThirdRiskProfileResponse(response))
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data?.message || "Ошибка при отправке данных"
            );
        }
    }
);

export const postSecondRiskProfileFormFinal = createAsyncThunk<
    void,
    SecondRiskProfilePayload,
    { state: RootState; rejectValue: string }
>(
    "riskProfile/postSecondRiskProfileFormFinal",
    async (data, { dispatch, rejectWithValue, getState }) => {
        try {
            const token = getState().user.token;
            const response = await postSecondRiskProfileFinal(data, token);

            dispatch(nextStep())
        } catch (error: any) {
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

            // Убираем ненужные поля
            const { trusted_person_fio, trusted_person_phone, trusted_person_other_contact, ...filteredData } = data;

            const transformedData = {
                ...filteredData,
                is_qualified_investor_status: filteredData.is_qualified_investor_status === "true",
            };

            const response = await postFirstRiskProfile(transformedData, token);
            dispatch(setFirstRiskProfileData(response));
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data?.message || "Ошибка при отправке данных"
            );
        }
    }
);


export const postTrustedPersonInfo = createAsyncThunk<
    void,
    { data: TrustedPersonInfo; onSuccess: () => void; },
    { state: RootState; rejectValue: string }
>(
    "riskProfile/postFirstRiskProfileForm",
    async ({ data, onSuccess }, { getState, rejectWithValue, dispatch }) => {
        try {
            const token = getState().user.token;
            if (!token) {
                return rejectWithValue("Отсутствует токен авторизации");
            }
            const response = await postTrustedPersonInfoApi(data, token);
            if (response === true) {
                onSuccess();
            }
        } catch (error: any) {
            console.log(error)
            dispatch(setError(error.response.data.trusted_person_phone))
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
            console.log(error)
            const msg =
                error.response.data?.error_text ||
                "Ошибка при отправке кода (непредвиденная)";
            dispatch(setError(msg))
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

                onSuccess?.(responseEmail);
            }
        } catch (error: any) {
            dispatch(setConfirmationEmailSuccess(
                'не пройдено'
            ))
            console.log(error)
            const msg =
                error.response.data?.error_text ||
                "Ошибка при отправке кода (непредвиденная)";
            dispatch(setError(msg))
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
        setFirstRiskProfileData(state, action: PayloadAction<SecondRiskProfileResponse>) {
            state.secondRiskProfileData = action.payload;
        },
        setThirdRiskProfileResponse(state, action: PayloadAction<ThirdRiskProfileResponse>) {
            state.thirdRiskProfileResponse = action.payload;
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

export const { updateFieldValue, nextRiskProfileStep, prevRiskProfileStep, setThirdRiskProfileResponse, setFirstRiskProfileData } = riskProfileSlice.actions;
export default riskProfileSlice.reducer;
