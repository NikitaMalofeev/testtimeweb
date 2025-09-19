import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AllUserInfo, CountryCode, ProblemsRequestData, userAllData, UserLogin, UserPersonalAccount, userType } from "../types/userTypes";
import { sendProblemsRequest, sendProblemsRequestNotAuth, setPersonType } from "entities/User/api/userApi";
import { getAllCountryCodes, getAllUserInfo, getUserPersonalAccountInfo, userLogin } from "../api/userApi";
import { setError } from "entities/Error/slice/errorSlice";
import { RootState } from "app/providers/store/config/store";
import { setIsWaitingDocumentsVerification } from "entities/Documents/slice/documentsSlice";
import { resetRiskProfile } from "entities/RiskProfile/slice/riskProfileSlice";

interface UserState {
    is_active: boolean;
    loading: boolean;
    is_vip: boolean;
    person_type: string;
    error: string | null;
    success: boolean;
    userId: string | null;
    token: string;
    user: userType;
    userPersonalAccountInfo: UserPersonalAccount | null
    allUserDataForDocuments: AllUserInfo | null;
    userForPersonalAccount: userAllData | null;
    countryCodes: CountryCode[];
    countryCodesLoading: boolean;
}

const initialState: UserState = {
    is_active: false,
    loading: false,
    error: '',
    is_vip: false,
    person_type: '',
    success: false,
    userId: null,
    token: "",
    user: {
        phone: "",
        email: "",
        first_name: "",
        patronymic: "",
        last_name: "",
        is_agreement: false,
    },
    userPersonalAccountInfo: null,
    allUserDataForDocuments: null,
    userForPersonalAccount: null,
    countryCodes: [],
    countryCodesLoading: false,
};

export const sendProblemsThunk = createAsyncThunk<
    void,
    ProblemsRequestData,
    { rejectValue: string, state: RootState }
>(
    "user/sendProblems",
    async (data, { rejectWithValue, getState }) => {
        const token = getState().user.token
        try {
            await sendProblemsRequest(data, token);
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data?.message || "Ошибка при отправке данных"
            );
        }
    }
);

export const sendProblemsNotAuthThunk = createAsyncThunk<
    void,
    { data: ProblemsRequestData, onSuccess: () => void },
    { rejectValue: string, state: RootState }
>(
    "user/sendProblemsNotAuthThunk",
    async ({ data, onSuccess }, { rejectWithValue, getState }) => {
        try {
            const response = await sendProblemsRequestNotAuth(data);

            response && onSuccess()
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data?.message || "Ошибка при отправке данных"
            );
        }
    }
);

export const setPersonTypeThunk = createAsyncThunk<
    void,
    { person_type: string, onSuccess: () => void },
    { rejectValue: string, state: RootState }
>(
    "user/setPersonTypeThunk",
    async ({ person_type, onSuccess }, { rejectWithValue, getState }) => {
        try {
            const response = await setPersonType(person_type);

            response && onSuccess()
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data?.message || "Ошибка при отправке данных"
            );
        }
    }
);

export const userLoginThunk = createAsyncThunk<
    void,
    { data: UserLogin, onSuccess: () => void },
    { rejectValue: string }
>(
    "user/userLoginThunk",
    async ({ data, onSuccess }, { rejectWithValue, dispatch }) => {
        try {
            const response = await userLogin(data);
            // console.log("Токен из API:", response.token);

            if (response.token) {
                dispatch(setUserToken(response.token));
                dispatch(setUserData({
                    phone: response.phone ?? "",
                    email: response.email ?? "",
                }));
                onSuccess()
            } else {
                console.error("Токен отсутствует в ответе сервера:", response);
            }

            return response;
        } catch (error: any) {
            dispatch(setError(error.response?.data?.errorText || "Ошибка при входе"));
            return rejectWithValue(error.response?.data?.message || "Ошибка при отправке данных");
        }
    }
);


export const getAllUserInfoThunk = createAsyncThunk<
    any, // Здесь можно указать конкретный тип, если известно, что возвращает getAllUserInfo
    void,
    { state: RootState, rejectValue: string }
>(
    "user/getAllUserInfoThunk",
    async (_, { getState, rejectWithValue, dispatch }) => {
        try {
            const token = getState().user.token
            if (!token) {
                return
            }
            const response = await getAllUserInfo(token); // Сохраняем результат в переменную
            dispatch(setUserAllInfo(response))
            return response;
        } catch (error: any) {
            console.error("Ошибка при получении данных пользователя:", error);
            return rejectWithValue(
                error.response?.data?.message || "Ошибка при отправке данных"
            );
        }
    }
);

export const getUserPersonalAccountInfoThunk = createAsyncThunk<
    any, // Здесь можно указать конкретный тип, если известно, что возвращает getAllUserInfo
    void,
    { state: RootState, rejectValue: string }
>(
    "user/getUserPersonalAccountInfoThunk",
    async (_, { getState, rejectWithValue, dispatch }) => {
        try {
            const token = getState().user.token
            if (!token) {
                return
            }
            const response = await getUserPersonalAccountInfo(token);
            dispatch(setIsWaitingDocumentsVerification(response.waiting_manual_document_verification))
            dispatch(setUserPersonalAccountInfo(response))
            return response;
        } catch (error: any) {
            console.error("Ошибка при получении данных пользователя:", error);
            return rejectWithValue(
                error.response?.data?.message || "Ошибка при отправке данных"
            );
        }
    }
);

export const getAllCountryCodesThunk = createAsyncThunk<
    void,
    void,
    { rejectValue: string }
>(
    "user/getAllCountryCodesThunk",
    async (_, { rejectWithValue, dispatch }) => {
        try {
            dispatch(setCountryCodesLoading(true));
            const response = await getAllCountryCodes();
            console.log("API Response:", response);
            console.log("Response type:", typeof response);
            console.log("Is array:", Array.isArray(response));

            const countryCodes = Array.isArray(response.data) ? response.data : [];
            console.log("Setting countryCodes:", countryCodes.length);
            dispatch(setCountryCodes(countryCodes));

        } catch (error: any) {
            console.error("Ошибка при получении кодов стран:", error);
            dispatch(setCountryCodesLoading(false));
            return rejectWithValue(
                error.response?.data?.message || "Ошибка при получении кодов стран"
            );
        }
    }
);

export const logoutUser = createAsyncThunk<
    void,
    void,
    { rejectValue: string }
>(
    "user/logoutUser",
    async (_, { dispatch }) => {
        // Очищаем localStorage
        localStorage.removeItem("savedToken");
        localStorage.removeItem("lastExit");
        localStorage.removeItem("lastExitSignature");

        // Сбрасываем токен
        dispatch(setUserToken(""));

        // Сбрасываем riskProfile
        dispatch(resetRiskProfile());
    }
);


export const userSlice = createSlice({
    name: "user",
    initialState,
    reducers: {
        setUserId: (state, action: PayloadAction<string>) => {
            state.userId = action.payload;
        },
        setUserIsActive: (state, action: PayloadAction<boolean>) => {
            state.is_active = action.payload;
        },
        setUserToken: (state, action: PayloadAction<string>) => {
            // console.log("Устанавливаем токен в state:", action.payload);
            return {
                ...state,
                token: action.payload, // Обновляем state через return
            };
        },
        setUserData: (state, action: PayloadAction<userType>) => {
            state.user = action.payload;
        },
        // Полная замена userForPersonalAccount (перезапись всего объекта)
        setUserAllData: (state, action: PayloadAction<userAllData>) => {
            state.userForPersonalAccount = action.payload;
        },
        setUserAllInfo: (state, action: PayloadAction<AllUserInfo>) => {
            state.allUserDataForDocuments = action.payload;
        },
        setUserPersonalAccountInfo: (state, action: PayloadAction<UserPersonalAccount>) => {
            state.userPersonalAccountInfo = action.payload;
        },
        // Частичное обновление userForPersonalAccount
        updateUserAllData: (state, action: PayloadAction<Partial<userAllData>>) => {
            // Если userForPersonalAccount сейчас `null`, инициализируем объект
            if (!state.userForPersonalAccount) {
                state.userForPersonalAccount = { ...action.payload };
            } else {
                // Расширяем существующий объект новыми (или обновленными) полями
                state.userForPersonalAccount = {
                    ...state.userForPersonalAccount,
                    ...action.payload,
                };
            }
        },
        // Очистка кодов стран при уходе со страницы
        clearCountryCodes: (state) => {
            state.countryCodes = [];
            state.countryCodesLoading = false;
        },
        // Установка кодов стран
        setCountryCodes: (state, action: PayloadAction<CountryCode[]>) => {
            state.countryCodes = action.payload;
            state.countryCodesLoading = false;
        },
        // Установка загрузки кодов стран
        setCountryCodesLoading: (state, action: PayloadAction<boolean>) => {
            state.countryCodesLoading = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(userLoginThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.success = false;
            })
            .addCase(userLoginThunk.fulfilled, (state) => {
                state.loading = false;
                state.success = true;
            })
            .addCase(userLoginThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(getUserPersonalAccountInfoThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.success = false;
            })
            .addCase(getUserPersonalAccountInfoThunk.fulfilled, (state) => {
                state.loading = false;
                state.success = true;
            })
            .addCase(getUserPersonalAccountInfoThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(getAllUserInfoThunk.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.success = false;
            })
            .addCase(getAllUserInfoThunk.fulfilled, (state) => {
                state.loading = false;
                state.success = true;
            })
            .addCase(getAllUserInfoThunk.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })

    },
});

export const {
    setUserId,
    setUserData,
    setUserToken,
    setUserAllData,
    updateUserAllData,
    setUserAllInfo,
    setUserIsActive,
    setUserPersonalAccountInfo,
    clearCountryCodes,
    setCountryCodes,
    setCountryCodesLoading,
} = userSlice.actions;

export default userSlice.reducer;
