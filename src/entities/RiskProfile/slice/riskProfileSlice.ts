import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import {
    IdentificationProfileData,
    ConfirmationCodeData,
    NeedHelpData
} from "../model/types";
import { getAllSelects, postConfirmationCode, postIdentificationData, postNeedHelpRequest, postResendConfirmationCode } from "shared/api/RiskProfileApi/riskProfileApi";
import { setUserId } from "entities/User/slice/userSlice";
import { setConfirmationEmailSuccess, setConfirmationPhoneSuccess, setConfirmationStatusSuccess, setConfirmationWhatsappSuccess } from "entities/ui/Ui/slice/uiSlice";
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

interface SendCodePayload {
    user_id: string;
    codeFirst: string;        // Код из первой формы
    codeSecond?: string;      // Код из второй формы (при методе 'phone' + email)
    method: 'phone' | 'email' | 'whatsapp' | 'type_doc_EDS_agreement'  // Как в вашем modalSlice
    onSuccess?: () => void;
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
            if (error.response.data.info) {
                dispatch(setError(error.response.data.info))
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
    SendCodePayload,
    { rejectValue: string }
>(
    "riskProfile/sendConfirmationCode",
    async ({ user_id, codeFirst, codeSecond, method, onSuccess }, { rejectWithValue, dispatch }) => {
        try {
            // Очистим старые ошибки и (опционально) сбросим частичные успехи, если нужно
            // dispatch(setConfirmationPhoneSuccess(false));
            // dispatch(setConfirmationEmailSuccess(false));
            // dispatch(setConfirmationWhatsappSuccess(false));

            if (method === "whatsapp") {
                // 1) Если выбрали подтверждение WhatsApp, отправляем код как `type: 'phone'`
                const response = await postConfirmationCode({
                    user_id,
                    code: codeFirst,
                    type: "phone",
                });

                if (response.status === "success") {
                    // Отдельный флаг для WhatsApp
                    dispatch(setConfirmationWhatsappSuccess('пройдено'));
                    // Общий флаг
                    dispatch(setConfirmationStatusSuccess(true));
                    if (onSuccess) {
                        onSuccess();
                    }
                } else {
                    const errMsg = response.error_text || "Ошибка при отправке кода (WhatsApp)";
                    dispatch(setError(errMsg));
                    // При желании сбрасываем флаг
                    dispatch(setConfirmationWhatsappSuccess('не пройдено'));
                    return rejectWithValue(errMsg);
                }

            } else if (method === "phone") {
                // 2) Если выбрали подтверждение телефоном (т.е. код телефона + код e-mail)
                if (!codeSecond) {
                    const msg = "Отсутствует код для e-mail, а метод 'phone' требует два кода";
                    dispatch(setError(msg));
                    return rejectWithValue(msg);
                }

                // Делаем два параллельных запроса
                const [resPhone, resEmail] = await Promise.allSettled([
                    postConfirmationCode({ user_id, code: codeFirst, type: "phone" }),
                    postConfirmationCode({ user_id, code: codeSecond, type: "email" }),
                ]);

                let isPhoneOk = false;
                let isEmailOk = false;

                // Проверяем телефон
                if (resPhone.status === "fulfilled") {
                    if (resPhone.value.status === "success") {
                        isPhoneOk = true;
                        dispatch(setConfirmationPhoneSuccess('пройдено'));
                    } else {
                        const phoneError = resPhone.value.error_text || "Ошибка верификации телефона";
                        dispatch(setError(phoneError));
                        dispatch(setConfirmationPhoneSuccess('не пройдено'));
                    }
                } else {
                    // Сеть/сервер упал для телефона
                    const phoneError =
                        resPhone.reason?.response?.data?.error_text ||
                        "Ошибка при отправке кода на телефон (сеть/сервер)";
                    dispatch(setError(phoneError));
                    dispatch(setConfirmationPhoneSuccess('не пройдено'));
                }

                // Проверяем e-mail
                if (resEmail.status === "fulfilled") {
                    if (resEmail.value.status === "success") {
                        isEmailOk = true;
                        dispatch(setConfirmationEmailSuccess('пройдено'));
                    } else {
                        const emailError = resEmail.value.error_text || "Ошибка верификации e-mail";
                        dispatch(setError(emailError));
                        dispatch(setConfirmationEmailSuccess('не пройдено'));
                    }
                } else {
                    // Сеть/сервер упал для e-mail
                    const emailError =
                        resEmail.reason?.response?.data?.error_text ||
                        "Ошибка при отправке кода на e-mail (сеть/сервер)";
                    dispatch(setError(emailError));
                    dispatch(setConfirmationEmailSuccess('не пройдено'));
                }

                // Если оба ОК, включаем общий success
                if (isPhoneOk && isEmailOk) {
                    dispatch(setConfirmationStatusSuccess(true));
                    if (onSuccess) {
                        onSuccess();
                    }
                } else {
                    // Общее сообщение, если нужно:
                    const combinedError = [
                        !isPhoneOk ? "Телефон не подтверждён" : "",
                        !isEmailOk ? "E-mail не подтверждён" : "",
                    ].filter(Boolean).join(" | ");

                    if (combinedError) {
                        return rejectWithValue(combinedError);
                    }
                }

            } else {
                // 3) Пример: метод 'email' или 'type_doc_EDS_agreement'
                const response = await postConfirmationCode({
                    user_id,
                    code: codeFirst,
                    type: method
                });

                if (response.status === "success") {
                    if (method === "email") {
                        dispatch(setConfirmationEmailSuccess('пройдено'));
                    } else if (method === "type_doc_EDS_agreement") {
                        // У вас может быть своя логика
                        // например, ставим общий success
                        // или заводим отдельный флаг EDS
                    }

                    // Общий флаг
                    dispatch(setConfirmationStatusSuccess(true));
                    if (onSuccess) {
                        onSuccess();
                    }
                } else {
                    const errMsg = response.error_text || `Ошибка при отправке кода (${method})`;
                    dispatch(setError(errMsg));

                    // Если хотим сбрасывать — сбрасываем
                    if (method === "email") {
                        dispatch(setConfirmationEmailSuccess('не пройдено'));
                    }
                    return rejectWithValue(errMsg);
                }
            }

        } catch (error: any) {
            const msg = error.response?.data?.error_text || "Ошибка при отправке кода (непредвиденная)";
            dispatch(setError(msg));
            return rejectWithValue(msg);
        }
    }
);


export const resendConfirmationCode = createAsyncThunk<
    void,
    { user_id: string; method: "whatsapp" | "phone" | "email" | 'type_doc_EDS_agreement' },
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
