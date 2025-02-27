import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AllUserInfo, userAllData, UserLogin, userType } from "../types/userTypes";
import { ProblemsRequestData, sendProblemsRequest } from "shared/api/userApi/userApi";
import { getAllUserInfo, userLogin } from "../api/userApi";
import { setError } from "entities/Error/slice/errorSlice";

interface UserState {
    is_active: boolean;
    userId: string | null;
    token: string;
    user: userType;
    allUserDataForDocuments: AllUserInfo | null;
    userForPersonalAccount: userAllData | null;
}

const initialState: UserState = {
    is_active: false,
    userId: null,
    token: "",
    user: {
        phone: "",
        email: "",
        first_name: "",
        middle_name: "",
        last_name: "",
        is_agreement: false,
    },
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
            } else {
                console.error("Токен отсутствует в ответе сервера:", response);
            }

            return response;
        } catch (error: any) {
            dispatch(setError(error.response?.data?.message || "Ошибка при входе"));
            return rejectWithValue(error.response?.data?.message || "Ошибка при отправке данных");
        }
    }
);


export const getAllUserInfoThunk = createAsyncThunk<
    any, // Здесь можно указать конкретный тип, если известно, что возвращает getAllUserInfo
    void,
    { rejectValue: string }
>(
    "user/getAllUserInfo",
    async (_, { rejectWithValue, dispatch }) => {
        try {
            const response = await getAllUserInfo(); // Сохраняем результат в переменную
            console.log("Результат getAllUserInfo:", response); // Выводим результат в консоль
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
});

export const {
    setUserId,
    setUserData,
    setUserToken,
    setUserAllData,
    updateUserAllData,
    setUserAllInfo,
    setUserIsActive,
} = userSlice.actions;

export default userSlice.reducer;
