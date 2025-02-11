// userSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { userType } from "../types/userTypes";
import { ProblemsRequestData, sendProblemsRequest } from "shared/api/userApi/userApi";

interface UserState {
    userId: string | null;
    user: userType
}

const initialState: UserState = {
    userId: null,
    user: {
        phone: '',
        email: '',
        first_name: '',
        middle_name: '',
        last_name: '',
        is_agreement: false,
    }
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
            return rejectWithValue(error.response?.data?.message || "Ошибка при отправке данных");
        }
    }
);

export const userSlice = createSlice({
    name: "user",
    initialState,
    reducers: {
        // Обычный редьюсер для записи userId
        setUserId: (state, action: PayloadAction<string>) => {
            state.userId = action.payload;
        },
        setUserData: (state, action: PayloadAction<userType>) => {
            state.user = action.payload
        }
    },
});

export const { setUserId, setUserData } = userSlice.actions;
export default userSlice.reducer;
