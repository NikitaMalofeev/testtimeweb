import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { PersonalAccountItem } from "../types/personalAccountTypes";
import { getUserId, resetPassword } from "shared/api/userApi/userApi";
import { setError } from "entities/Error/slice/errorSlice";

interface PasswordResetState {
    type_confirm: string;
    password: string;
    password2: string;
    email: string;
}

interface PersonalAccountState {
    currentTab: string;
    menuItems: PersonalAccountItem[];

    // Блок для данных сброса пароля (кроме code)
    passwordReset: PasswordResetState;

    // Храним code отдельно
    resetCode: string;
    user_id: string | null;  // ID пользователя

    loading: boolean; // Добавляем состояние загрузки
}

const initialState: PersonalAccountState = {
    currentTab: "",
    menuItems: [],

    passwordReset: {
        type_confirm: "",
        password: "",
        password2: "",
        email: ''
    },
    user_id: null,

    resetCode: "",
    loading: false, // Начальное состояние загрузки
};

export const getUserIdThunk = createAsyncThunk<
    any,
    { phone?: string; email?: string; onSuccess: () => void },
    { rejectValue: string }
>(
    "riskProfile/fetchUserId",
    async ({ onSuccess, phone, email }, { rejectWithValue, dispatch }) => {
        try {
            const response = await getUserId(phone ? { phone } : { email });
            dispatch(setUserId(response.id));
            onSuccess();
            return response;
        } catch (error: any) {
            dispatch(setError(error.response?.data?.errorText || "Ошибка"));
            return rejectWithValue(
                error.response?.data?.message || "Ошибка при загрузке данных"
            );
        }
    }
);

export const resetPasswordThunk = createAsyncThunk<
    any,
    { onSuccess: () => void },
    { rejectValue: string; state: { personalAccount: PersonalAccountState } }
>(
    "riskProfile/resetPassword",
    async ({ onSuccess }, { rejectWithValue, dispatch, getState }) => {
        try {
            const state = getState().personalAccount;
            const { passwordReset, user_id } = state;

            if (!user_id) {
                return rejectWithValue("Ошибка: отсутствует user_id");
            }

            const requestData = {
                user_id,
                type_confirm: passwordReset.type_confirm,
                code: state.resetCode,
                password: passwordReset.password,
                password2: passwordReset.password2,
            };

            const response = await resetPassword(requestData);

            onSuccess();
            return response;
        } catch (error: any) {
            dispatch(setError(error.response?.data?.errorText || "Ошибка"));
            return rejectWithValue(
                error.response?.data?.message || "Ошибка при сбросе пароля"
            );
        }
    }
);

export const personalAccountSlice = createSlice({
    name: "personalAccount",
    initialState,
    reducers: {
        setCurrentTab: (state, action: PayloadAction<string>) => {
            state.currentTab = action.payload;
        },
        setMenuItems: (state, action: PayloadAction<PersonalAccountItem[]>) => {
            state.menuItems = action.payload;
        },
        setPasswordResetData: (
            state,
            action: PayloadAction<Partial<PasswordResetState>>
        ) => {
            state.passwordReset = {
                ...state.passwordReset,
                ...action.payload
            };
        },
        setResetCode: (state, action: PayloadAction<string>) => {
            state.resetCode = action.payload;
        },
        setUserId: (state, action: PayloadAction<string>) => {
            state.user_id = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            // Обрабатываем загрузку user_id
            .addCase(getUserIdThunk.pending, (state) => {
                state.loading = true;
            })
            .addCase(getUserIdThunk.fulfilled, (state) => {
                state.loading = false;
            })
            .addCase(getUserIdThunk.rejected, (state) => {
                state.loading = false;
            })

            // Обрабатываем загрузку сброса пароля
            .addCase(resetPasswordThunk.pending, (state) => {
                state.loading = true;
            })
            .addCase(resetPasswordThunk.fulfilled, (state) => {
                state.loading = false;
            })
            .addCase(resetPasswordThunk.rejected, (state) => {
                state.loading = false;
            });
    },
});

export const {
    setCurrentTab,
    setMenuItems,
    setPasswordResetData,
    setResetCode,
    setUserId
} = personalAccountSlice.actions;

export default personalAccountSlice.reducer;
