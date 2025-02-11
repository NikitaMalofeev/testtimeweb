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
    void,                   // что возвращаем при успехе (ничего)
    SendCodePayload,        // что принимаем в payload
    { rejectValue: string } // что возвращаем при ошибке
>(
    "riskProfile/sendConfirmationCode",
    async ({ user_id, codeFirst, codeSecond, method, onSuccess }, { rejectWithValue, dispatch }) => {
        try {
            if (method === "whatsapp") {
                // 1) Если выбрали подтверждение через WhatsApp:
                //    — отправляем один запрос с type = 'phone' (т.к. бэкенд не знает "whatsapp").
                const response = await postConfirmationCode({
                    user_id,
                    code: codeFirst,
                    type: "phone",
                });

                if (response.status === "success") {
                    // Успешно => ставим confirmationStatusSuccess = true и вызываем onSuccess
                    dispatch(setConfirmationStatusSuccess(true));
                    if (onSuccess) {
                        onSuccess();
                    }
                } else {
                    // Ошибка — диспатчим сообщение об ошибке, если пришло с сервера
                    dispatch(setError(response.message || "Ошибка при отправке кода (WhatsApp)"));
                    return rejectWithValue(response.message || "Ошибка при отправке кода (WhatsApp)");
                }
            } else {
                // 2) Если выбрали подтверждение 'phone' (т.е. phone + email):
                //    => делаем два параллельных запроса
                //    (первый для телефона, второй для e-mail)
                if (!codeSecond) {
                    // Если по какой-то причине второго кода нет,
                    // можно выбросить ошибку, т.к. ожидается 2 кода
                    const msg = "Отсутствует код для e-mail, а метод 'phone' требует два кода";
                    dispatch(setError(msg));
                    return rejectWithValue(msg);
                }

                const [responsePhone, responseEmail] = await Promise.all([
                    postConfirmationCode({
                        user_id,
                        code: codeFirst,
                        type: "phone",
                    }),
                    postConfirmationCode({
                        user_id,
                        code: codeSecond,
                        type: "email",
                    }),
                ]);

                // Проверяем, что оба запроса отработали "success"
                const isPhoneOk = responsePhone.status === "success";
                const isEmailOk = responseEmail.status === "success";

                if (isPhoneOk && isEmailOk) {
                    // Оба запроса удачные => ставим success + onSuccess
                    dispatch(setConfirmationStatusSuccess(true));
                    if (onSuccess) {
                        onSuccess();
                    }
                } else {
                    // Если хоть один вернул ошибку, выдаём ошибку
                    const errorTextPhone = responsePhone.message || "";
                    const errorTextEmail = responseEmail.message || "";
                    const combinedError = `Ошибка при отправке кода. 
                        ${errorTextPhone ? "Телефон: " + errorTextPhone : ""} 
                        ${errorTextEmail ? "Email: " + errorTextEmail : ""}`;

                    dispatch(setError(combinedError));
                    return rejectWithValue(combinedError);
                }
            }
        } catch (error: any) {
            // Ловим исключения типа "сеть упала" и т.п.
            const msg = error.response?.data?.message || "Ошибка при отправке кода";
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
