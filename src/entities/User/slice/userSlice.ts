// userSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { userType } from "../types/userTypes";

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
