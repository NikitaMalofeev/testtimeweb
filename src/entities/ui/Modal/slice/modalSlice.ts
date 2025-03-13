import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ModalType, ModalSize, ModalAnimation, ModalState, ModalStateItem } from '../model/modalTypes';

interface ExtendedModalState extends ModalState {
    confirmationMethod: 'SMS' | 'email' | 'WHATSAPP';
    confirmationMethod2: 'SMS' | 'EMAIL' | 'WHATSAPP';
    selectedCountry: string;
    currentProblemScreen: string | undefined;
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
    [ModalType.DOCUMENTS_PREVIEW]: {
        isOpen: false,
        size: ModalSize.FULL,
        animation: ModalAnimation.LEFT,
        isScrolled: false
    },
    [ModalType.RESET_PASSWORD]: {
        isOpen: false,
        size: ModalSize.MINI,
        animation: ModalAnimation.BOTTOM,
        isScrolled: false
    },
    [ModalType.PREVIEW]: { isOpen: false, size: ModalSize.FULL, animation: ModalAnimation.LEFT, isScrolled: false },
    confirmationMethod: 'SMS',
    confirmationMethod2: 'EMAIL',
    selectedCountry: "",
    currentProblemScreen: ''
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

        setCurrentConfirmModalType: (state, action: PayloadAction<'SMS' | 'email' | 'WHATSAPP'>) => {
            state.confirmationMethod = action.payload;
        },
        setCurrentConfirmModalType2: (state, action: PayloadAction<'SMS' | 'EMAIL' | 'WHATSAPP'>) => {
            state.confirmationMethod2 = action.payload;
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
        setCurrentProblemScreen: (state, action: PayloadAction<string | undefined>) => {
            state.currentProblemScreen = action.payload;
        },
        closeAllModals: (state) => {
            Object.values(ModalType).forEach((type) => {
                if (state[type]) {
                    state[type].isOpen = false;
                }
            });
        },
    },
});

export const {
    openModal,
    closeModal,
    setModalScrolled,
    setCurrentConfirmModalType,
    setCurrentConfirmModalType2,
    setSelectedCountry,
    closeAllModals,
    setCurrentProblemScreen,
    // Экспортируем экшен для открытия селекта
} = modalSlice.actions;

export default modalSlice.reducer;
