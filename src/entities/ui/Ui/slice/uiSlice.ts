import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export enum ModalAnimation {
    SCALE = 'scale',
    LEFT = 'left',
    RIGHT = 'right',
    TOP = 'top',
    BOTTOM = 'bottom',
}

interface ModalState {
    isOpen: boolean;
    animation: ModalAnimation;
}

interface UiState {
    modals: ModalState;
}

const initialState: UiState = {
    modals: {
        isOpen: false,
        animation: ModalAnimation.SCALE,
    },
};

const uiSlice = createSlice({
    name: 'ui',
    initialState,
    reducers: {
        openModal: (state, action: PayloadAction<ModalAnimation>) => {
            state.modals.isOpen = true;
            state.modals.animation = action.payload;
        },
        closeModal: (state) => {
            state.modals.isOpen = false;
        },
    },
});

export const { openModal, closeModal } = uiSlice.actions;
export default uiSlice.reducer;
