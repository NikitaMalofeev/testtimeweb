import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ModalType, ModalSize, ModalAnimation, ModalState } from '../model/modalTypes';

// Начальное состояние для всех модалок
const initialState: ModalState = {
    [ModalType.IDENTIFICATION]: { isOpen: false, size: ModalSize.FULL, animation: ModalAnimation.LEFT, isScrolled: false },
    [ModalType.CONFIRM_CODE]: { isOpen: false, size: ModalSize.MIDDLE, animation: ModalAnimation.BOTTOM, isScrolled: false },
    [ModalType.PROBLEM_WITH_CODE]: { isOpen: false, size: ModalSize.MINI, animation: ModalAnimation.LEFT, isScrolled: false },
};

const modalSlice = createSlice({
    name: 'modal',
    initialState,
    reducers: {
        /** Открыть конкретную модалку с переданными параметрами */
        openModal: (
            state,
            action: PayloadAction<{ type: ModalType; size: ModalSize; animation: ModalAnimation }>
        ) => {
            const { type, size, animation } = action.payload;
            state[type] = { ...state[type], isOpen: true, size, animation };
        },

        /** Закрыть конкретную модалку */
        closeModal: (state, action: PayloadAction<ModalType>) => {
            const type = action.payload;
            state[type].isOpen = false;
        },

        /** Обновить состояние скролла для конкретной модалки */
        setModalScrolled: (state, action: PayloadAction<{ type: ModalType; isScrolled: boolean }>) => {
            const { type, isScrolled } = action.payload;
            state[type].isScrolled = isScrolled;
        }
    },
});

export const { openModal, closeModal, setModalScrolled } = modalSlice.actions;
export default modalSlice.reducer;
