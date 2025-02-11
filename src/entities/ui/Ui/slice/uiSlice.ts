import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UiState {
    additionalMenu: {
        currentStep: number;
    };
    /** Старый общий статус — "все нужные подтверждения пройдены" */
    confirmationStatusSuccess: boolean;

    /** Новые отдельные флаги */
    confirmationPhoneSuccess: string;
    confirmationEmailSuccess: string;
    confirmationWhatsappSuccess: string;

    isScrollToBottom: boolean;
}

const initialState: UiState = {
    additionalMenu: {
        currentStep: 0,
    },
    confirmationStatusSuccess: false,

    // Изначально все отдельные статусы — false
    confirmationPhoneSuccess: '',
    confirmationEmailSuccess: '',
    confirmationWhatsappSuccess: '',

    isScrollToBottom: true,
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

        // Старый общий статус — оставляем
        setConfirmationStatusSuccess: (state, action: PayloadAction<boolean>) => {
            state.confirmationStatusSuccess = action.payload;
        },

        // Новые экшены для управления флагами
        setConfirmationPhoneSuccess: (state, action: PayloadAction<string>) => {
            state.confirmationPhoneSuccess = action.payload;
        },
        setConfirmationEmailSuccess: (state, action: PayloadAction<string>) => {
            state.confirmationEmailSuccess = action.payload;
        },
        setConfirmationWhatsappSuccess: (state, action: PayloadAction<string>) => {
            state.confirmationWhatsappSuccess = action.payload;
        },

        setIsBottom: (state, action: PayloadAction<boolean>) => {
            state.isScrollToBottom = action.payload;
        },
    },
});

export const {
    nextStep,
    prevStep,
    resetStep,
    setIsBottom,
    setConfirmationStatusSuccess,
    setConfirmationPhoneSuccess,
    setConfirmationEmailSuccess,
    setConfirmationWhatsappSuccess
} = uiSlice.actions;

export default uiSlice.reducer;
