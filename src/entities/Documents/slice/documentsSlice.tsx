import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
interface RiskProfileFormState {
    currentConfirmableDoc: string;
}



const initialState: RiskProfileFormState = {
    currentConfirmableDoc: 'type_doc_passport',
};


const documentsSlice = createSlice({
    name: "documents",
    initialState,
    reducers: {
        setCurrentConfirmableDoc(state, action: PayloadAction<string>) {
            state.currentConfirmableDoc = action.payload;
        },

    },
    extraReducers: (builder) => {
    },
});

export const { setCurrentConfirmableDoc } = documentsSlice.actions;
export default documentsSlice.reducer;
