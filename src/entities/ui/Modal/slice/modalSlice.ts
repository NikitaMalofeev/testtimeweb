import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ModalType, ModalSize, ModalAnimation, ModalState, ModalStateItem } from '../model/modalTypes';

/**
 * Расширяем исходный тип `ModalState` (Record<ModalType, ModalStateItem>)
 * дополнительным полем `confirmationMethod`.
 */
interface ExtendedModalState extends ModalState {
    confirmationMethod: 'phone' | 'email' | 'whatsapp' | 'type_doc_EDS_agreement';
}

// Начальное состояние для всех модалок + новое поле `confirmationMethod`
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
    [ModalType.PROBLEM_WITH_CODE]: {
        isOpen: false,
        size: ModalSize.MINI,
        animation: ModalAnimation.LEFT,
        isScrolled: false
    },
    // Новое поле
    confirmationMethod: 'phone',
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

        /**
         * Устанавливаем текущий способ подтверждения (phone, email, whatsapp),
         * чтобы потом считать его в ConfirmInfoModal
         */
        setCurrentConfirmModalType: (state, action: PayloadAction<'phone' | 'email' | 'whatsapp' | 'type_doc_EDS_agreement'>) => {
            state.confirmationMethod = action.payload;
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

export const {
    openModal,
    closeModal,
    setModalScrolled,
    setCurrentConfirmModalType, // экспортируем наш новый экшен
} = modalSlice.actions;

export default modalSlice.reducer;
