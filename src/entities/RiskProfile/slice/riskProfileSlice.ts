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
    onSuccess?: () => void;
    onError?: () => void;
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

export const sendConfirmationCode = createAsyncThunk<
    void,
    SendCodePayload,
    { rejectValue: string; state: RootState }
>(
    "riskProfile/sendConfirmationCode",
    async (
        { user_id, codeFirst, codeSecond, method, onSuccess, onError, onClose },
        { rejectWithValue, dispatch, getState }
    ) => {
        try {
            // Получаем текущие статусы подтверждения из uiReducer
            const {
                confirmationEmailSuccess,
                confirmationPhoneSuccess,
                confirmationWhatsappSuccess
            } = getState().ui;

            // ----- СЛУЧАЙ 1: метод "whatsapp" или "phone" -----
            if (method === "whatsapp" || method === "phone") {
                // Определяем, нужен ли подтверждение для телефона/WhatsApp
                const needConfirmPhone =
                    method === "whatsapp"
                        ? confirmationWhatsappSuccess !== "пройдено"
                        : confirmationPhoneSuccess !== "пройдено";
                // Определяем, нужно ли подтверждать email
                const needConfirmEmail = confirmationEmailSuccess !== "пройдено";

                // Если оба канала уже подтверждены – выходим
                if (!needConfirmPhone && !needConfirmEmail) {
                    dispatch(setConfirmationStatusSuccess(true));
                    onClose?.();
                    return;
                }

                // Если для текущего вызова передан только код для телефона/WhatsApp,
                // то отправляем запрос только для него
                if (codeSecond === undefined) {
                    if (needConfirmPhone && !codeFirst) {
                        const msg = `Метод "${method}" требует codeFirst (телефон/WhatsApp), а он не передан`;
                        dispatch(setError(msg));

                        return rejectWithValue(msg);
                    }
                    const response = await postConfirmationCode({
                        user_id,
                        code: codeFirst!,
                        type: "phone"
                    });
                    if (response.status === "success") {
                        if (method === "whatsapp") {
                            dispatch(setConfirmationWhatsappSuccess("пройдено"));
                        } else {
                            dispatch(setConfirmationPhoneSuccess("пройдено"));
                        }
                        onSuccess?.();
                    } else {
                        onError?.()
                        const phoneError =
                            response.error_text || "Ошибка верификации телефона/WhatsApp";
                        dispatch(setError(phoneError));
                        if (method === "whatsapp") {
                            dispatch(setConfirmationWhatsappSuccess("не пройдено"));
                        } else {
                            dispatch(setConfirmationPhoneSuccess("не пройдено"));
                        }
                        return rejectWithValue(phoneError);
                    }
                    return;
                }

                // Если же переданы оба кода, выполняется комбинированная отправка:
                if (needConfirmPhone && !codeFirst) {
                    const msg = `Метод "${method}" требует codeFirst (телефон/WhatsApp), а он не передан`;
                    dispatch(setError(msg));
                    return rejectWithValue(msg);
                }
                if (needConfirmEmail && !codeSecond) {
                    const msg = `Метод "${method}" требует codeSecond (email), а он не передан`;
                    dispatch(setError(msg));
                    return rejectWithValue(msg);
                }

                const phonePromise = needConfirmPhone
                    ? postConfirmationCode({
                        user_id,
                        code: codeFirst!,
                        type: "phone",
                    })
                    : null;

                const emailPromise = needConfirmEmail
                    ? postConfirmationCode({
                        user_id,
                        code: codeSecond!,
                        type: "email",
                    })
                    : null;

                // Отправляем запросы параллельно
                const [resPhone, resEmail] = await Promise.allSettled([
                    phonePromise,
                    emailPromise,
                ]);

                let isPhoneOk = !needConfirmPhone;
                let isEmailOk = !needConfirmEmail;

                // Обработка результата для телефона/WhatsApp
                if (phonePromise) {
                    if (resPhone.status === "fulfilled") {
                        if (resPhone.value.status === "success") {
                            isPhoneOk = true;
                            if (method === "whatsapp") {
                                dispatch(setConfirmationWhatsappSuccess("пройдено"));
                            } else {
                                dispatch(setConfirmationPhoneSuccess("пройдено"));
                            }
                        } else {
                            const phoneError =
                                resPhone.value.error_text || "Ошибка верификации телефона/WhatsApp";
                            dispatch(setError(phoneError));
                            if (method === "whatsapp") {
                                dispatch(setConfirmationWhatsappSuccess("не пройдено"));
                            } else {
                                dispatch(setConfirmationPhoneSuccess("не пройдено"));
                            }
                        }
                    } else {
                        const phoneError =
                            resPhone.reason?.response?.data?.error_text ||
                            "Ошибка при отправке кода (телефон/WhatsApp)";
                        dispatch(setError(phoneError));
                        if (method === "whatsapp") {
                            dispatch(setConfirmationWhatsappSuccess("не пройдено"));
                        } else {
                            dispatch(setConfirmationPhoneSuccess("не пройдено"));
                        }
                    }
                }

                // Обработка результата для email
                if (emailPromise) {
                    if (resEmail.status === "fulfilled") {
                        if (resEmail.value.status === "success") {
                            isEmailOk = true;
                            dispatch(setConfirmationEmailSuccess("пройдено"));
                        } else {
                            const emailError =
                                resEmail.value.error_text || "Ошибка верификации e-mail";
                            dispatch(setError(emailError));
                            dispatch(setConfirmationEmailSuccess("не пройдено"));
                        }
                    } else {
                        const emailError =
                            resEmail.reason?.response?.data?.error_text ||
                            "Ошибка при отправке кода (email)";
                        dispatch(setError(emailError));
                        dispatch(setConfirmationEmailSuccess("не пройдено"));
                    }
                }

                if (isPhoneOk && isEmailOk) {
                    dispatch(setConfirmationStatusSuccess(true));
                    onSuccess?.();
                } else {
                    const combinedError = [
                        !isPhoneOk ? "Телефон (WhatsApp) не подтверждён" : "",
                        !isEmailOk ? "E-mail не подтверждён" : "",
                    ]
                        .filter(Boolean)
                        .join(" | ");
                    return rejectWithValue(combinedError || "Ошибка верификации телефона/почты");
                }
            }
            // ----- СЛУЧАЙ 2: метод "email" -----
            else if (method === "email") {
                if (confirmationEmailSuccess === "пройдено") {
                    dispatch(setConfirmationStatusSuccess(true));
                    onSuccess?.();
                    return;
                }
                if (!codeFirst) {
                    const msg = `Метод "email" требует codeFirst (email), а он не передан`;
                    dispatch(setError(msg));
                    return rejectWithValue(msg);
                }
                const response = await postConfirmationCode({
                    user_id,
                    code: codeFirst,
                    type: "email"
                });
                if (response.status === "success") {
                    dispatch(setConfirmationEmailSuccess("пройдено"));
                    dispatch(setConfirmationStatusSuccess(true));
                    onSuccess?.();
                } else {
                    onError?.()
                    const errMsg =
                        response.error_text || `Ошибка при отправке кода (email)`;
                    dispatch(setError(errMsg));
                    dispatch(setConfirmationEmailSuccess("не пройдено"));
                    return rejectWithValue(errMsg);
                }
            }
            // ----- СЛУЧАЙ 3: любой другой метод -----
            else {
                if (!codeFirst) {
                    const msg = `Метод "${method}" требует codeFirst, а он не передан`;
                    dispatch(setError(msg));
                    return rejectWithValue(msg);
                }
                const response = await postConfirmationCode({
                    user_id,
                    code: codeFirst,
                    type: method,
                });
                if (response.status === "success") {
                    dispatch(setConfirmationStatusSuccess(true));
                    onSuccess?.();
                } else {
                    onError?.()
                    const errMsg =
                        response.error_text || `Ошибка при отправке кода (${method})`;
                    dispatch(setError(errMsg));
                    return rejectWithValue(errMsg);
                }
            }
        } catch (error: any) {
            const msg =
                error.response?.data?.error_text ||
                "Ошибка при отправке кода (непредвиденная)";
            dispatch(setError(msg));
            return rejectWithValue(msg);
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
            })

    },
});

export const { updateFieldValue, nextRiskProfileStep, prevRiskProfileStep, setFirstRiskProfileData, setSecondRiskProfileData } = riskProfileSlice.actions;
export default riskProfileSlice.reducer;
