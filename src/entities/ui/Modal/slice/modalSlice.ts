// store/modalSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ModalAnimation, ModalSize } from '../model/modalTypes';

interface ModalState {
    isOpen: boolean;
    size: ModalSize;
    animation: ModalAnimation;
}

const initialState: ModalState = {
    isOpen: false,
    size: ModalSize.FULL,
    animation: ModalAnimation.LEFT,
};

const modalSlice = createSlice({
    name: 'modal',
    initialState,
    reducers: {
        // Позволяем открыть модалку с нужным размером и анимацией
        openModal: (
            state,
            action: PayloadAction<{ size: ModalSize; animation: ModalAnimation }>
        ) => {
            state.isOpen = true;
            state.size = action.payload.size;
            state.animation = action.payload.animation;
        },
        closeModal: (state) => {
            state.isOpen = false;
        },
    },
});

export const { openModal, closeModal } = modalSlice.actions;
export default modalSlice.reducer;
