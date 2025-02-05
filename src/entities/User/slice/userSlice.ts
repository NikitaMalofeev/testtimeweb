// userSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UserState {
    userId: string | null;
}

const initialState: UserState = {
    userId: null,
};

export const userSlice = createSlice({
    name: "user",
    initialState,
    reducers: {
        // Обычный редьюсер для записи userId
        setUserId: (state, action: PayloadAction<string>) => {
            state.userId = action.payload;
        },
    },
});

export const { setUserId } = userSlice.actions;
export default userSlice.reducer;
