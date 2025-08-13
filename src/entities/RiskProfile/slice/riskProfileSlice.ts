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
    ThirdRiskProfileResponse,
    PasportFormData,
    SendCodeDocsConfirmPayload,
    SecondRiskProfileFinalPayload,
    BrokerSetTokenPayload,
    PassportFormData,
    LegalFormData,
    LegalDataFormRequest,
    LegalConfirmData
} from "../model/types";
import {
    getAllSelects,
    postBrokerApiToken,
    postConfirmationCode,
    postConfirmationCodeLegal,
    postConfirmationDocsCode,
    postFirstRiskProfile,
    postIdentificationData,
    postINNScanData,
    postLegalInfoForm,
    postNeedHelpRequest,
    postPasportData,
    postPasportScanData,
    postResendConfirmationCode,
    postResendConfirmationCodeLegal,
    postSecondRiskProfile,
    postSecondRiskProfileFinal,
    postTrustedPersonInfoApi
} from "entities/RiskProfile/api/riskProfileApi";
import { setUserId, setUserIsActive, setUserToken, updateUserAllData } from "entities/User/slice/userSlice";
import { setConfirmationEmailSuccess, setConfirmationPhoneSuccess, setConfirmationStatusSuccess, setConfirmationWhatsappSuccess, setTooltipActive, setWarning } from "entities/ui/Ui/slice/uiSlice";
import { setError } from "entities/Error/slice/errorSlice";
import { RootState } from "app/providers/store/config/store";
import { PasportScanData } from "features/RiskProfile/PassportScanForm/PassportScanForm";
import { omit } from "lodash";
import { setBrokerSuccessResponseInfo } from "entities/Documents/slice/documentsSlice";
import { EMPTY_LEGAL_FORM } from "../constants/constansRiskProfile";
import { openModal } from "entities/ui/Modal/slice/modalSlice";
import { ModalAnimation, ModalSize, ModalType } from "entities/ui/Modal/model/modalTypes";

interface RiskProfileFormState {
    loading: boolean;
    error: string | null;
    success: boolean;
    IdentificationFromData: IdentificationProfileData | null;
    riskProfileForm: RiskProfileFormData | null;
    secondRiskProfileData: SecondRiskProfileResponse | null;
    thirdRiskProfileResponse: ThirdRiskProfileResponse | null;
    riskProfileSelectors: RiskProfileSelectors | null;
    formValues: Record<string, string>;
    stepsFirstForm: {
        currentStep: number;
    };
    passportFormData: PassportFormData;
    legalFormData: LegalFormData;
    legalConfirmData: LegalConfirmData | null;
    currentConfirmingDoc: string;
    pasportScanSocketId: string;
    pasportScanProgress: number
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
    legalConfirmData: null,
    legalFormData: EMPTY_LEGAL_FORM,
    passportFormData: {
        last_name: "",
        gender: '',
        first_name: "",
        patronymic: "",
        birth_date: "",
        birth_place: "",
        passport_series: "",
        passport_number: "",
        department_code: "",
        issue_date: "",
        issue_whom: "",
        inn: "",
        region: "",
        city: "",
        street: "",
        house: "",
        apartment: "",
        is_live_this_address: false,
        is_receive_mail_this_address: false,
        address_residential_region: "",
        address_residential_city: "",
        address_residential_street: "",
        address_residential_house: "",
        address_residential_apartment: ""
    },
    currentConfirmingDoc: 'type_doc_passport',
    pasportScanSocketId: '',
    pasportScanProgress: 0
};

export const createRiskProfile = createAsyncThunk<
    void,
    { data: IdentificationProfileData, onError: () => void, onSuccess: () => void },
    { rejectValue: string }
>(
    "riskProfile/createRiskProfile",
    async ({ data, onError, onSuccess }, { dispatch, rejectWithValue }) => {
        try {
            const response = await postIdentificationData(data);
            const { id, token, is_active } = response;
            dispatch(setUserIsActive(is_active));
            dispatch(setUserId(id));
            dispatch(setUserToken(token));

            localStorage.removeItem("riskProfileFormData");
            dispatch(updateRiskProfileForm({}))
            dispatch(setStep(0))
            onSuccess()
        } catch (error: any) {
            onError()

            if (error.response.status === 502) {
                const msg = "Ошибка сервера. Пожалуйста, повторите попытку";
                dispatch(setError(msg));
                return rejectWithValue(msg);
            }
            if (error.response.data.password) {
                dispatch(setError(error.response.data.password));
            }
            if (error.response.data.phone) {
                dispatch(setError(error.response.data.phone));
            }
            if (error.response.data.email) {
                dispatch(setError(error.response.data.email));
            }
            if (error.response.data.info) {
                dispatch(setError(error.response.data.info));
            }
            if (error.response.data.errorText) {
                dispatch(setError(error.response.data.errorText));
            }
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
            const response = await postSecondRiskProfile(data, token);
            dispatch(setThirdRiskProfileResponse(response));
        } catch (error: any) {

        }
    }
);

// ❌ onSuccess больше не нужен в аргументах
export const postLegalInfoThunk = createAsyncThunk<
    LegalConfirmData,                       // что возвращаем
    LegalDataFormRequest,                   // что передаём
    { state: RootState; rejectValue: string }
>(
    "riskProfile/postLegalInfoThunk",
    async (data, { getState, rejectWithValue, dispatch }) => {
        console.log('до try')
        try {
            const token = getState().user.token;
            console.log('need contacts before')
            const response = await postLegalInfoForm(data, token);
            dispatch(setLegalConfirmData(response));
            console.log(JSON.stringify(null, response, 2) + 'need contacts')

            const needContacts =
                response.is_need_confirm_email || response.is_need_confirm_phone;
            console.log(needContacts)
            dispatch(
                openModal({
                    type: needContacts
                        ? ModalType.CONFIRM_CONTACTS
                        : ModalType.CONFIRM_DOCS,
                    size: ModalSize.MIDDLE,
                    animation: ModalAnimation.LEFT,
                })
            );
            return response
        } catch (error: any) {
            return rejectWithValue("Не удалось отправить юр. форму");
        }
    }
);



export const postBrokerApiTokenThunk = createAsyncThunk<
    void,
    { data: BrokerSetTokenPayload, onSuccess: () => void },
    { state: RootState; rejectValue: string }
>(
    "riskProfile/postBrokerApiTokenThunk",
    async ({ data, onSuccess }, { dispatch, rejectWithValue, getState }) => {
        try {
            const token = getState().user.token;
            const response = await postBrokerApiToken(data, token);
            if (response) {
                dispatch(
                    setBrokerSuccessResponseInfo({
                        brokerId: response.broker_id,
                        notSignedDocBroker: response.not_signed_doc_broker,
                    })
                );
                onSuccess();
            }
        } catch (error: any) {
            // dispatch(
            //     // setWarning({
            //     //     active: true,
            //     //     description: error.response.data.errorText,
            //     //     buttonLabel: "Перейти к подключению",
            //     //     action: () => {
            //     //         window.location.href = '/payments';
            //     //         dispatch(setWarning(
            //     //             {
            //     //                 active: false
            //     //             }
            //     //         ))
            //     //     },
            //     // }),
            // );
            dispatch(setError(error.response.data.token))
        }
    }
);

export const postSecondRiskProfileFormFinal = createAsyncThunk<
    void,
    SecondRiskProfileFinalPayload,
    { state: RootState; rejectValue: string }
>(
    "riskProfile/postSecondRiskProfileFormFinal",
    async (data, { dispatch, rejectWithValue, getState }) => {
        try {
            const token = getState().user.token;
            const response = await postSecondRiskProfileFinal(data, token);
            dispatch(updateUserAllData({ first_name: response.first_name, last_name: response.last_name, patronymic: response.patronymic, gender: response.gender }));
            return response;
        } catch (error: any) {

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
            const filteredData = omit(data, [
                "trusted_person_fio",
                "trusted_person_phone",
                "trusted_person_other_contact",
                "address_residential_apartment",
                "address_residential_city",
                "address_residential_house",
                "address_residential_street",
                'issue_whom', 'passport_series',
                'region',
                'city',
                'apartment',
                'street',
                'passport_number',
                'house',
                'inn',
                'birth_place',
                'legal_specialist_qualification',
                'legal_operations_volume',
                'legal_net_assets_ratio',
                'legal_invest_target',
                'legal_assets_size',
                'gender',
                'legal_additional_conditions',
                'assets',
                'invest_goal',
                'volatility',
                'person_type',
                'operations',
                'invest_period',
                'legal_risk_tolerance',
                'net_assets',
                'additional',
                'qualification',
                'legal_investment_period'
            ]);
            const transformedData = {
                ...filteredData,
                is_qualified_investor_status: filteredData.is_qualified_investor_status === "true"
            };
            const response = await postFirstRiskProfile(transformedData, token);
            dispatch(setFirstRiskProfileData(response));
        } catch (error: any) {

        }
    }
);

export const postTrustedPersonInfo = createAsyncThunk<
    void,
    { data: TrustedPersonInfo; onSuccess: () => void; },
    { state: RootState; rejectValue: string }
>(
    "riskProfile/postTrustedPersonInfo",
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
            dispatch(setError(error.response.data.trusted_person_phone));

        }
    }
);

export const postPasportInfo = createAsyncThunk<
    void,
    { data: PasportFormData; onSuccess: () => void; },
    { state: RootState; rejectValue: string }
>(
    "riskProfile/postPasportInfo",
    async ({ data, onSuccess }, { getState, rejectWithValue, dispatch }) => {
        try {
            const token = getState().user.token;
            if (!token) {
                return rejectWithValue("Отсутствует токен авторизации");
            }
            const response = await postPasportData(data, token);
            dispatch(setPasportScanSocketId(response.group_name_upload_scans_progress));
            onSuccess();
            return response;
        } catch (error: any) {
            if (error.response.data.birth_date) {
                dispatch(setError(error.response.data.birth_date));
            }
            else {
                dispatch(setError(error.response.data.errorText));
            }


        }
    }
);

export const postPasportScanThunk = createAsyncThunk<
    void,
    { data: FormData; onSuccess: () => void; },
    { state: RootState; rejectValue: string }
>(
    "riskProfile/postPasportScan",
    async ({ data, onSuccess }, { getState, rejectWithValue, dispatch }) => {
        try {
            const token = getState().user.token;
            if (!token) {
                return rejectWithValue("Отсутствует токен авторизации");
            }
            // Отправляем данные сканов через API
            await postPasportScanData(data, token);
            // Вызываем onSuccess после успешной отправки
            onSuccess();
        } catch (error: any) {
            const errorText = error.response?.data?.errorText;
            console.log('Статус ошибки:', error.response?.status);
            console.log('Текст ошибки:', errorText);

            if (errorText && errorText.trim() === 'Сканы уже загружены. Для изменения сканов обратитесь в поддержку') {
                dispatch(setError(errorText));
            } else {
                dispatch(setError(errorText, 'pasportScan'));
            }
        }

    }
);

export const postINNScanThunk = createAsyncThunk<
    void,
    { data: FormData; onSuccess: () => void; },
    { state: RootState; rejectValue: string }
>(
    "riskProfile/postINNScanThunk",
    async ({ data, onSuccess }, { getState, rejectWithValue, dispatch }) => {
        try {
            const token = getState().user.token;
            if (!token) {
                return rejectWithValue("Отсутствует токен авторизации");
            }
            // Отправляем данные сканов через API
            await postINNScanData(data, token);
            // Вызываем onSuccess после успешной отправки
            onSuccess();
            dispatch(setTooltipActive({ active: true, message: 'Скан ИИН успешно загружен' }))
        } catch (error: any) {
            const errorText = error.response?.data?.errorText;
            console.log('Статус ошибки:', error.response?.status);
            console.log('Текст ошибки:', errorText);

            if (errorText && errorText.trim() === 'Сканы уже загружены. Для изменения сканов обратитесь в поддержку') {
                dispatch(setError(errorText));
            } else {
                dispatch(setError(errorText, 'pasportScan'));
            }
        }

    }
);

export const openPasportScanWebsocketThunk = createAsyncThunk<
    void,
    { onSuccess: () => void },
    { state: RootState; rejectValue: string }
>(
    "riskProfile/openPasportScanWebsocket",
    async ({ onSuccess }, { getState, rejectWithValue, dispatch }) => {
        try {
            const token = getState().user.token;
            if (!token) {
                return rejectWithValue("Отсутствует токен авторизации");
            }
            const socketId = getState().riskProfile.pasportScanSocketId;
            return await new Promise((resolve, reject) => {
                const socket = new WebSocket(`wss://test.webbroker.ranks.pro/ws/upload_scans_progress/${socketId}/`);

                socket.onopen = () => {
                    console.log("WebSocket открыт в:", new Date());
                    // При необходимости можно отправить первоначальное сообщение
                    socket.send('Сообщение при подключении от клиента')
                };

                socket.onmessage = (event) => {
                    const responseData = JSON.parse(event.data);

                    // Проверяем, что тип сообщения именно "progress_update"
                    if (responseData?.type === "progress_update") {
                        // Диспатчим экшен, чтобы сохранить прогресс в стейте
                        dispatch(
                            setPassportScanProgress(responseData.data.progress)
                        );

                        // Если прогресс 100% - можем закрыть сокет или выполнить что-то ещё
                        if (responseData.data.progress === 100) {
                            onSuccess();
                            resolve(responseData);
                            socket.close();
                        }
                    }
                };

                socket.onerror = (err) => {
                    console.error("Ошибка WebSocket:", err);
                    reject("Ошибка при открытии WebSocket");
                    socket.close();
                };

                socket.onclose = () => {
                    console.log("WebSocket закрыт");
                };
            });
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data?.message || "Ошибка при открытии WebSocket"
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
        { user_id, codeFirst, method, onSuccess, onError, purposeNewContacts, },
        { getState, dispatch }
    ) => {
        const IsLegal = getState().user.userPersonalAccountInfo?.is_individual_entrepreneur
        const token = getState().user.token;
        try {
            if (codeFirst) {
                const responsePhone = !purposeNewContacts || !IsLegal ? await postConfirmationCode({ user_id, code: codeFirst, type: 'phone' }) : await postConfirmationCodeLegal({ code: codeFirst, type_document: 'phone' }, token);
                if (responsePhone.is_confirmed_phone) {
                    onSuccess?.(responsePhone);
                } else {
                    const msg =
                        responsePhone.data?.errorText
                    dispatch(setError(msg));
                    onSuccess?.(responsePhone);
                }
            }
        } catch (error: any) {
            dispatch(setConfirmationPhoneSuccess('не пройдено'));
            const msg =
                error.response.data?.errorText
            dispatch(setError(msg));
        }
    }
);

export const sendEmailConfirmationCode = createAsyncThunk<
    void,
    { user_id: string; purposeNewContacts: boolean; codeSecond: string; onSuccess?: (data: any) => void; onError?: (data: any) => void },
    { rejectValue: string; state: RootState }
>(
    "riskProfile/sendEmailConfirmationCode",
    async (
        { user_id, codeSecond, onSuccess, onError, purposeNewContacts },
        { getState, dispatch }
    ) => {
        const IsLegal = getState().user.userPersonalAccountInfo?.is_individual_entrepreneur
        const token = getState().user.token;
        try {
            const responseEmail = !purposeNewContacts || !IsLegal ? await postConfirmationCode({ user_id, code: codeSecond, type: "email" }) : await postConfirmationCodeLegal({ code: codeSecond, type_document: 'email' }, token);
            if (responseEmail.status === "success") {
                onSuccess?.(responseEmail);
            } else if (responseEmail.code !== 200) {
                onSuccess?.(responseEmail);
            }
        } catch (error: any) {
            dispatch(setConfirmationEmailSuccess('не пройдено'));
            const msg =
                error.response.data?.errorText
            dispatch(setError(msg));
        }
    }
);

export const resendConfirmationCode = createAsyncThunk<
    void,
    { user_id: string; method: 'SMS' | 'email' | 'WHATSAPP' | 'whatsapp' | 'phone' | 'EMAIL' },
    { rejectValue: string }
>(
    "riskProfile/resendConfirmationCode",
    async ({ user_id, method }, { rejectWithValue }) => {
        try {
            const payload: Record<string, any> = {
                user_id
            };
            if (method === "WHATSAPP") {
                payload.type_confirm = "SMS";
                payload.type_message = "WHATSAPP";
            } else if (method === "SMS") {
                payload.type_confirm = "SMS";
                payload.type_message = "SMS";
            } else if (method === "email") {
                payload.type_confirm = "email";
            } else if (method === 'phone') {
                payload.type_confirm = "phone";
            }
            await postResendConfirmationCode(payload);
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data?.message ||
                "Ошибка при повторной отправке кода"
            );
        }
    }
);

export const resendConfirmationCodeLegal = createAsyncThunk<
    void,
    { type_document: string; method: 'SMS' | 'email' | 'WHATSAPP' | 'whatsapp' | 'phone' | 'EMAIL' },
    { rejectValue: string }
>(
    "riskProfile/resendConfirmationCodeLegal",
    async ({ method, type_document }, { rejectWithValue }) => {
        try {
            const payload: Record<string, any> = {
                type_document
            };
            if (method === "WHATSAPP") {
                payload.type_confirm = "SMS";
                payload.type_message = "WHATSAPP";
            } else if (method === "SMS") {
                payload.type_confirm = "SMS";
                payload.type_message = "SMS";
            } else if (method === "email") {
                payload.type_confirm = "email";
            } else if (method === 'phone') {
                payload.type_confirm = "phone";
            }
            await postResendConfirmationCodeLegal(payload);
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
    { rejectValue: string, state: RootState }
>(
    "riskProfile/requestNeedHelp",
    async (data, { rejectWithValue, getState }) => {
        const token = getState().user.token
        try {
            await postNeedHelpRequest(data, token);
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data?.message || "Ошибка при запросе помощи"
            );
        }
    }
);

const riskProfileSlice = createSlice({
    name: "riskProfile",
    initialState,
    reducers: {
        updateFieldValue: (state, action: PayloadAction<{ name: string; value: string }>) => {
            const { name, value } = action.payload;
            if (state.formValues[name] !== value) {
                state.formValues[name] = value;
            }
            state.formValues[action.payload.name] = action.payload.value;
        },
        updateRiskProfileForm: (state, action: PayloadAction<Record<string, string>>) => {
            state.formValues = action.payload;
        },
        nextRiskProfileStep(state) {
            state.stepsFirstForm.currentStep += 1;
        },
        prevRiskProfileStep(state) {
            if (state.stepsFirstForm.currentStep > 0) {
                state.stepsFirstForm.currentStep -= 1;
            }
        },
        updatePassportFormData: (
            state,
            action: PayloadAction<Partial<PassportFormData>>
        ) => {
            state.passportFormData = { ...state.passportFormData, ...action.payload };
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
        setCurrentConfirmingDoc(state, action: PayloadAction<string>) {
            state.currentConfirmingDoc = action.payload;
        },
        setPasportScanSocketId(state, action: PayloadAction<string>) {
            state.pasportScanSocketId = action.payload;
        },
        setPassportScanProgress(state, action: PayloadAction<number>) {
            state.pasportScanProgress = action.payload
        },
        setLegalConfirmData(state, action: PayloadAction<LegalConfirmData>) {
            state.legalConfirmData = action.payload;
        },
        updateLegalFormData: (
            state,
            action: PayloadAction<Partial<LegalFormData>>
        ) => {
            Object.assign(state.legalFormData, action.payload);
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
            .addCase(postPasportScanThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(postPasportScanThunk.fulfilled, (state) => {
                state.loading = false;
            })
            .addCase(postPasportScanThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(postFirstRiskProfileForm.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(postFirstRiskProfileForm.fulfilled, (state) => {

            })
            .addCase(postFirstRiskProfileForm.rejected, (state, action) => {
                state.error = action.payload as string;
            })
            .addCase(postSecondRiskProfileForm.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(postSecondRiskProfileForm.fulfilled, (state) => {
                state.loading = false;
            })
            .addCase(postSecondRiskProfileForm.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(postPasportInfo.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(postPasportInfo.fulfilled, (state) => {
                state.loading = false;
            })
            .addCase(postPasportInfo.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(postLegalInfoThunk.fulfilled, (state, action) => {
                state.loading = false;
                state.legalConfirmData = action.payload;    // ⬅️  сохраняем
            })
            .addCase(postLegalInfoThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(postLegalInfoThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

    }
});

export const {
    updateFieldValue,
    setPasportScanSocketId,
    updateRiskProfileForm,
    setStep,
    setCurrentConfirmingDoc,
    nextRiskProfileStep,
    prevRiskProfileStep,
    setThirdRiskProfileResponse,
    setFirstRiskProfileData,
    setPassportScanProgress,
    updatePassportFormData,
    setLegalConfirmData,
    updateLegalFormData
} = riskProfileSlice.actions;
export default riskProfileSlice.reducer;
