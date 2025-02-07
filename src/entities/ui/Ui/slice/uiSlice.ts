import { createSlice, PayloadAction } from "@reduxjs/toolkit";
interface UiState {
    additionalMenu: {
        currentStep: number;
    };
    confirmationStatusSuccess: boolean;
    isScrollToBottom: boolean;
}

const initialState: UiState = {
    additionalMenu: {
        currentStep: 1,
    },
    confirmationStatusSuccess: false,
    isScrollToBottom: true
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
        setIsBottom: (state, action: PayloadAction<boolean>) => { // Добавляем экшен
            state.isScrollToBottom = action.payload;
        },
    },
});

export const { nextStep, prevStep, resetStep, setIsBottom, setConfirmationStatusSuccess } = uiSlice.actions;
export default uiSlice.reducer;