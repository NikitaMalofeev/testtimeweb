import { createSlice, PayloadAction } from "@reduxjs/toolkit";
interface UiState {
    additionalMenu: {
        currentStep: number;
    };
    confirmationStatusSuccess: boolean;
}

const initialState: UiState = {
    additionalMenu: {
        currentStep: 1,
    },
    confirmationStatusSuccess: false,
};

const uiSlice = createSlice({
    name: "ui",
    initialState,
    reducers: {
        nextStep: (state) => {
            if (state.additionalMenu.currentStep < 4) {
                state.additionalMenu.currentStep += 1;
            }
        },
        prevStep: (state) => {
            if (state.additionalMenu.currentStep > 0) {
                state.additionalMenu.currentStep -= 1;
            }
        },
        resetStep: (state) => {
            state.additionalMenu.currentStep = 0;
        },
        setConfirmationStatusSuccess: (state, action: PayloadAction<boolean>) => {
            state.confirmationStatusSuccess = action.payload;
        },
    },
});

export const { nextStep, prevStep, resetStep, setConfirmationStatusSuccess } = uiSlice.actions;
export default uiSlice.reducer;