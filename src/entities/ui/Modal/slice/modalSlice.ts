import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ModalType, ModalSize, ModalAnimation, ModalState, ModalStateItem } from '../model/modalTypes';

interface ExtendedModalState extends ModalState {
    confirmationMethod: 'phone' | 'email' | 'whatsapp';
    selectedCountry: string; // Добавляем поле для хранения выбранной страны
}

const initialState: ExtendedModalState = {
    [ModalType.IDENTIFICATION]: {
        isOpen: false,
        size: ModalSize.FULL,
        animation: ModalAnimation.LEFT,
        isScrolled: false
    },
    [ModalType.CONFIRM_CODE]: {
        isOpen: false,
        size: ModalSize.MIDDLE,
        animation: ModalAnimation.BOTTOM,
        isScrolled: false
    },
    [ModalType.CONFIRM_DOCS]: {
        isOpen: false,
        size: ModalSize.MIDDLE,
        animation: ModalAnimation.BOTTOM,
        isScrolled: false
    },
    [ModalType.PROBLEM_WITH_CODE]: {
        isOpen: false,
        size: ModalSize.MINI,
        animation: ModalAnimation.LEFT,
        isScrolled: false
    },
    [ModalType.SELECT]: { // Добавлена модалка для селекта
        isOpen: false,
        size: ModalSize.FULL,
        animation: ModalAnimation.LEFT,
        isScrolled: false
    },
    confirmationMethod: 'phone',
    selectedCountry: "", // Начальное состояние для выбранной страны
};

const modalSlice = createSlice({
    name: 'modal',
    initialState,
    reducers: {
        openModal: (
            state,
            action: PayloadAction<{ type: ModalType; size: ModalSize; animation: ModalAnimation }>
        ) => {
            const { type, size, animation } = action.payload;
            state[type] = { ...state[type], isOpen: true, size, animation };
        },

        setCurrentConfirmModalType: (state, action: PayloadAction<'phone' | 'email' | 'whatsapp'>) => {
            state.confirmationMethod = action.payload;
        },

        closeModal: (state, action: PayloadAction<ModalType>) => {
            const type = action.payload;
            state[type].isOpen = false;
        },

        setModalScrolled: (state, action: PayloadAction<{ type: ModalType; isScrolled: boolean }>) => {
            const { type, isScrolled } = action.payload;
            state[type].isScrolled = isScrolled;
        },

        // ✅ Экшен для установки выбранной страны
        setSelectedCountry: (state, action: PayloadAction<string>) => {
            state.selectedCountry = action.payload;
        },
    },
});

export const {
    openModal,
    closeModal,
    setModalScrolled,
    setCurrentConfirmModalType,
    setSelectedCountry,
    // Экспортируем экшен для открытия селекта
} = modalSlice.actions;

export default modalSlice.reducer;
