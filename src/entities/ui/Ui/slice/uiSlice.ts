import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ReactElement } from "react";
interface UiState {
    additionalMenu: {
        currentStep: number;
    };
    confirmationStatusSuccess: boolean;
    confirmationPhoneSuccess: string;
    confirmationEmailSuccess: string;
    confirmationWhatsappSuccess: string;
    isScrollToBottom: boolean;
    isTooltipActive: {
        active: boolean
        message: string
    }
    isPushNotificationActive: {
        active: boolean;
        purpose: string;
    }
    confirmationDocs: string;
}
const initialState: UiState = {
    additionalMenu: {
        currentStep: 0,
    },
    confirmationStatusSuccess: false,
    confirmationPhoneSuccess: 'не определено',
    confirmationEmailSuccess: 'не определено',
    confirmationWhatsappSuccess: 'не определено',
    isScrollToBottom: true,
    isTooltipActive: {
        active: false,
        message: ''
    },
    isPushNotificationActive: {
        active: false,
        purpose: 'filledRP'
    },
    confirmationDocs: 'не определено',
};


const uiSlice = createSlice({
    name: "ui",
    initialState,
    reducers: {
        nextStep: (state) => {
            if (state.additionalMenu.currentStep < 7) {
                state.additionalMenu.currentStep += 1;
            }
        },
        prevStep: (state) => {
            if (state.additionalMenu.currentStep > 0) {
                state.additionalMenu.currentStep -= 1;
            }
        },
        setStepAdditionalMenuUI(state, action: PayloadAction<number>) {
            state.additionalMenu.currentStep = action.payload;
        },
        resetStep: (state) => {
            state.additionalMenu.currentStep = 0;
        },
        setConfirmationStatusSuccess: (state, action: PayloadAction<boolean>) => {
            state.confirmationStatusSuccess = action.payload;
        },
        setConfirmationPhoneSuccess: (state, action: PayloadAction<string>) => {
            state.confirmationPhoneSuccess = action.payload;
        },
        setConfirmationEmailSuccess: (state, action: PayloadAction<string>) => {
            state.confirmationEmailSuccess = action.payload;
        },
        setConfirmationWhatsappSuccess: (state, action: PayloadAction<string>) => {
            state.confirmationWhatsappSuccess = action.payload;
        },
        setConfirmationDocsSuccess: (state, action: PayloadAction<string>) => {
            state.confirmationDocs = action.payload;
        },
        setTooltipActive: (state, action: PayloadAction<{ active: boolean; message: string }>) => {
            state.isTooltipActive = action.payload;
        },
        setPushNotificationActive: (state, action: PayloadAction<{ active: boolean; purpose: string }>) => {
            state.isPushNotificationActive = action.payload;
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
    setConfirmationWhatsappSuccess,
    setConfirmationDocsSuccess,
    setTooltipActive,
    setStepAdditionalMenuUI,
    setPushNotificationActive
} = uiSlice.actions;

export default uiSlice.reducer;
