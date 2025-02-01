import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export enum ModalAnimation {
    SCALE = "scale",
    LEFT = "left",
    RIGHT = "right",
    TOP = "top",
    BOTTOM = "bottom",
}

interface ModalState {
    isOpen: boolean;
    animation: ModalAnimation;
}

interface UiState {
    modals: ModalState;
    additionalMenu: {
        currentStep: number;
    };
}

const initialState: UiState = {
    modals: {
        isOpen: false,
        animation: ModalAnimation.SCALE,
    },
    additionalMenu: {
        currentStep: 0,
    },
};

const uiSlice = createSlice({
    name: "ui",
    initialState,
    reducers: {
        openModal: (state, action: PayloadAction<ModalAnimation>) => {
            state.modals.isOpen = true;
            state.modals.animation = action.payload;
        },
        closeModal: (state) => {
            state.modals.isOpen = false;
        },
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

export const { openModal, closeModal, nextStep, prevStep, resetStep } = uiSlice.actions;
export default uiSlice.reducer;