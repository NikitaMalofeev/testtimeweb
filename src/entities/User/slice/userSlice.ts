import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AllUserInfo, userAllData, userType } from "../types/userTypes";
import { ProblemsRequestData, sendProblemsRequest } from "shared/api/userApi/userApi";
import { getAllUserInfo } from "../api/userApi";

interface UserState {
    userId: string | null;
    token: string;
    user: userType;
    allUserDataForDocuments: AllUserInfo | null;
    userForPersonalAccount: userAllData | null;
}

const initialState: UserState = {
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
        setUserToken: (state, action: PayloadAction<string>) => {
            state.token = action.payload;
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
} = userSlice.actions;

export default userSlice.reducer;
