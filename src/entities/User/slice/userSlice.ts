import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AllUserInfo, userAllData, UserLogin, UserPersonalAccount, userType } from "../types/userTypes";
import { ProblemsRequestData, sendProblemsRequest } from "shared/api/userApi/userApi";
import { getAllUserInfo, getUserPersonalAccountInfo, userLogin } from "../api/userApi";
import { setError } from "entities/Error/slice/errorSlice";
import { RootState } from "app/providers/store/config/store";

interface UserState {
    is_active: boolean;
    loading: boolean;
    error: string | null;
    success: boolean;
    userId: string | null;
    token: string;
    user: userType;
    userPersonalAccountInfo: UserPersonalAccount | null
    allUserDataForDocuments: AllUserInfo | null;
    userForPersonalAccount: userAllData | null;
}

const initialState: UserState = {
    is_active: false,
    loading: false,
    error: '',
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
};

export const sendProblems = createAsyncThunk<
    void,
    ProblemsRequestData,
    { rejectValue: string }
>(
    "user/sendProblems",
    async (data, { rejectWithValue }) => {
        try {
            await sendProblemsRequest(data);
        } catch (error: any) {
            return rejectWithValue(
                error.response?.data?.message || "Ошибка при отправке данных"
            );
        }
    }
);

export const userLoginThunk = createAsyncThunk<
    void,
    UserLogin,
    { rejectValue: string }
>(
    "user/userLoginThunk",
    async (data, { rejectWithValue, dispatch }) => {
        try {
            const response = await userLogin(data);
            console.log("Токен из API:", response.token);

            if (response.token) {
                dispatch(setUserToken(response.token));
                console.log("Токен сохранен в Redux:", response.token);
                dispatch(setUserData({
                    phone: response.phone ?? "",
                    email: response.email ?? "",
                }));
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
    "user/getAllUserInfo",
    async (_, { getState, rejectWithValue, dispatch }) => {
        try {
            const token = getState().user.token
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
            const response = await getUserPersonalAccountInfo(token);
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
            console.log("Устанавливаем токен в state:", action.payload);
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
} = userSlice.actions;

export default userSlice.reducer;
