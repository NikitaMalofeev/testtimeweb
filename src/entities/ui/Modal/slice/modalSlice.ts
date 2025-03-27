import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ModalType, ModalSize, ModalAnimation, ModalState, ModalStateItem } from '../model/modalTypes';

export interface ExtendedModalState extends ModalState {
    confirmationMethod: 'SMS' | 'WHATSAPP' | 'EMAIL';
    selectedCountry: string;
    currentProblemScreen: string | undefined;
    modalStack: ModalType[];
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
        animation: ModalAnimation.BOTTOM,
        isScrolled: false
    },
    [ModalType.PROBLEM]: {
        isOpen: false,
        size: ModalSize.MINI,
        animation: ModalAnimation.BOTTOM,
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
    [ModalType.PROGRESS]: {
        isOpen: false,
        size: ModalSize.XXS,
        animation: ModalAnimation.BOTTOM,
        isScrolled: false
    },
    modalStack: [],
    confirmationMethod: 'SMS',
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
            if (state[type].isOpen) return;
            state[type] = { ...state[type], isOpen: true, size, animation };
            // Добавляем тип модалки в стек
            state.modalStack.push(type);
        },


        setCurrentConfirmModalType: (state, action: PayloadAction<'SMS' | 'WHATSAPP' | 'EMAIL'>) => {
            state.confirmationMethod = action.payload;
        },

        closeModal: (state, action: PayloadAction<ModalType>) => {
            const type = action.payload;
            state[type].isOpen = false;
            // Удаляем модалку из стека (если она там есть)
            state.modalStack = state.modalStack.filter(modal => modal !== type);
        },
        // Новый редьюсер для закрытия последней открытой модалки
        closeLastModal: (state) => {
            const lastModal = state.modalStack.pop();
            if (lastModal) {
                state[lastModal].isOpen = false;
            }
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
            // Очищаем стек
            state.modalStack = [];
        },
    },
});

export const {
    openModal,
    closeModal,
    setModalScrolled,
    setCurrentConfirmModalType,
    setSelectedCountry,
    closeAllModals,
    setCurrentProblemScreen,
    closeLastModal,
    // Экспортируем экшен для открытия селекта
} = modalSlice.actions;

export default modalSlice.reducer;
