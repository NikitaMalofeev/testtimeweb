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
import { RootState } from "app/providers/store/config/store";

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
    { rejectValue: string; state: RootState }
>(
    "riskProfile/sendConfirmationCode",
    async (
        { user_id, codeFirst, codeSecond, method, onSuccess },
        { rejectWithValue, dispatch, getState }
    ) => {
        try {
            // Достаем текущие статусы подтверждения из uiReducer
            const {
                confirmationEmailSuccess,
                confirmationPhoneSuccess,
                confirmationWhatsappSuccess
            } = getState().ui;

            // ----- СЛУЧАЙ 1: whatsapp или phone -----
            // Предполагаем, что нужно подтверждать телефон/whatsapp + email.
            if (method === "whatsapp" || method === "phone") {
                // Нужно ли подтверждать телефон/whatsapp?
                // (т.е. если еще НЕ "пройдено")
                const needConfirmPhone =
                    method === "whatsapp"
                        ? confirmationWhatsappSuccess !== "пройдено"
                        : confirmationPhoneSuccess !== "пройдено";

                // Нужно ли подтверждать email?
                const needConfirmEmail = confirmationEmailSuccess !== "пройдено";

                // Если оба канала уже "пройдено", ничего делать не надо
                if (!needConfirmPhone && !needConfirmEmail) {
                    dispatch(setConfirmationStatusSuccess(true));
                    onSuccess?.();
                    return;
                }

                // Проверяем, что коды переданы (если соответствующий канал нуждается в подтверждении)
                if (needConfirmPhone && !codeFirst) {
                    const msg = `Метод "${method}" требует codeFirst (телефон/whatsapp), а он не передан`;
                    dispatch(setError(msg));
                    return rejectWithValue(msg);
                }
                if (needConfirmEmail && !codeSecond) {
                    const msg = `Метод "${method}" требует codeSecond (email), а он не передан`;
                    dispatch(setError(msg));
                    return rejectWithValue(msg);
                }

                // Формируем запросы для тех каналов, которые надо подтвердить
                const phonePromise = needConfirmPhone
                    ? postConfirmationCode({
                        user_id,
                        code: codeFirst!,
                        type: "phone", // и при WhatsApp, и при phone бек использует "phone"
                    })
                    : null;

                const emailPromise = needConfirmEmail
                    ? postConfirmationCode({
                        user_id,
                        code: codeSecond!,
                        type: "email",
                    })
                    : null;

                // Запускаем параллельно, но используя allSettled для независимой обработки
                const [resPhone, resEmail] = await Promise.allSettled([
                    phonePromise,
                    emailPromise,
                ]);

                // Изначально считаем, что там, где не нужно подтверждать — уже "пройдено"
                let isPhoneOk = !needConfirmPhone;
                let isEmailOk = !needConfirmEmail;

                // --- ОБРАБОТКА РЕЗУЛЬТАТА ТЕЛЕФОНА/WHATSAPP ---
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
                                resPhone.value.error_text ||
                                "Ошибка верификации телефона/WhatsApp";
                            dispatch(setError(phoneError));
                            if (method === "whatsapp") {
                                dispatch(setConfirmationWhatsappSuccess("не пройдено"));
                            } else {
                                dispatch(setConfirmationPhoneSuccess("не пройдено"));
                            }
                        }
                    } else {
                        // Если промис отклонился (reject)
                        const phoneError =
                            resPhone.reason?.response?.data?.error_text ||
                            "Ошибка при отправке кода (телефон/whatsapp)";
                        dispatch(setError(phoneError));
                        if (method === "whatsapp") {
                            dispatch(setConfirmationWhatsappSuccess("не пройдено"));
                        } else {
                            dispatch(setConfirmationPhoneSuccess("не пройдено"));
                        }
                    }
                }

                // --- ОБРАБОТКА РЕЗУЛЬТАТА EMAIL ---
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

                // Если оба канала подтверждены успешно, включаем общий флаг
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

                    return rejectWithValue(
                        combinedError || "Ошибка верификации телефона/почты"
                    );
                }
            }
            // ----- СЛУЧАЙ 2: только email -----
            else if (method === "email") {
                // Если уже подтвержден email, то ничего делать не нужно
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
                    const errMsg =
                        response.error_text || `Ошибка при отправке кода (email)`;
                    dispatch(setError(errMsg));
                    dispatch(setConfirmationEmailSuccess("не пройдено"));
                    return rejectWithValue(errMsg);
                }
            }
            // ----- СЛУЧАЙ 3: любой другой метод (например, type_doc_EDS_agreement) -----
            else {
                // Если у вас для этого метода нет отдельного флага, просто отправляем один код
                // (или делайте отдельный флаг - зависит от вашей логики)
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
            const responseEmail = await postResendConfirmationCode('email');

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
