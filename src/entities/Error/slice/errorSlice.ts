import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface ErrorState {
    error: string
}

const initialState: ErrorState = {
    error: ''
};

const errorSlice = createSlice({
    name: "riskProfile",
    initialState,
    reducers: {
        setError: (state, action: PayloadAction<string>) => {
            state.error = action.payload
        },
    },
});

export const { setError } = errorSlice.actions;
export default errorSlice.reducer;
