import { createSlice, PayloadAction } from "@reduxjs/toolkit";
interface UiState {
    additionalMenu: {
        currentStep: number;
    };
}

const initialState: UiState = {
    additionalMenu: {
        currentStep: 0,
    },
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
    },
});

export const { nextStep, prevStep, resetStep } = uiSlice.actions;
export default uiSlice.reducer;