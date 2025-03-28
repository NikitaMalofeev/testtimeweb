import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface ErrorState {
    error: string;
    purpose?: string;
}

const initialState: ErrorState = {
    error: '',
    purpose: ''
};

const errorSlice = createSlice({
    name: "error",
    initialState,
    reducers: {
        setError: {
            reducer: (state, action: PayloadAction<ErrorState>) => {
                state.error = action.payload.error;
                state.purpose = action.payload.purpose;
            },
            prepare: (error: string, purpose?: string) => ({
                payload: { error, purpose }
            }),
        },
    },
});

export const { setError } = errorSlice.actions;
export default errorSlice.reducer;
