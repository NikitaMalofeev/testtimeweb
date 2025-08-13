// src/entities/ui/Modal/slice/modalSlice.ts

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
    ModalType,
    ModalSize,
    ModalAnimation,
    ModalState,
    ModalStateItem,
} from '../model/modalTypes';

export interface ExtendedModalState extends ModalState {
    modalStack: ModalType[];
    confirmationMethod: 'SMS' | 'WHATSAPP' | 'EMAIL';
    selectedCountry: string;
    additionalOverlayVisibility: boolean;
    currentProblemScreen: string | undefined;
}

const initialState: ExtendedModalState = {
    [ModalType.IDENTIFICATION]: {
        isOpen: false,
        size: ModalSize.FULL,
        animation: ModalAnimation.LEFT,
        isScrolled: false,
    },
    [ModalType.SELECT]: {
        isOpen: false,
        size: ModalSize.FULL,
        animation: ModalAnimation.LEFT,
        isScrolled: false,
    },
    [ModalType.CONFIRM_CODE]: {
        isOpen: false,
        size: ModalSize.MIDDLE,
        animation: ModalAnimation.BOTTOM,
        isScrolled: false,
    },
    [ModalType.CONFIRM_DOCS]: {
        isOpen: false,
        size: ModalSize.MIDDLE,
        animation: ModalAnimation.BOTTOM,
        isScrolled: false,
    },
    [ModalType.CONFIRM_CUSTOM_DOCS]: {
        isOpen: false,
        size: ModalSize.MIDDLE,
        animation: ModalAnimation.BOTTOM,
        isScrolled: false,
    },
    [ModalType.PROBLEM_WITH_CODE]: {
        isOpen: false,
        size: ModalSize.MINI,
        animation: ModalAnimation.BOTTOM,
        isScrolled: false,
    },
    [ModalType.PROBLEM]: {
        isOpen: false,
        size: ModalSize.MINI,
        animation: ModalAnimation.BOTTOM,
        isScrolled: false,
    },
    [ModalType.DOCUMENTS_PREVIEW]: {
        isOpen: false,
        size: ModalSize.FULL,
        animation: ModalAnimation.LEFT,
        isScrolled: false,
        // extra field for preview
        docId: undefined,
    } as ModalStateItem & { checkId?: string },
    [ModalType.DOCUMENTS_PREVIEW_PDF]: {
        isOpen: false,
        size: ModalSize.FULL,
        animation: ModalAnimation.LEFT,
        isScrolled: false,
    },
    [ModalType.CHECKS_PREVIEW]: {
        isOpen: false,
        size: ModalSize.FULL,
        animation: ModalAnimation.LEFT,
        isScrolled: false,
        // extra field for preview
        docId: undefined,
    } as ModalStateItem & { docId?: string },
    [ModalType.RECOMENDATIONS_PREVIEW]: {
        isOpen: false,
        size: ModalSize.FULL,
        animation: ModalAnimation.LEFT,
        isScrolled: false,
        // extra field for preview
        docId: undefined,
    } as ModalStateItem & { docId?: string },
    [ModalType.DOCUMENTS_PREVIEW_SIGNED]: {
        isOpen: false,
        size: ModalSize.FULL,
        animation: ModalAnimation.LEFT,
        isScrolled: false,
        // extra field for signed preview
        docId: undefined,
    } as ModalStateItem & { docId?: string },
    [ModalType.RESET_PASSWORD]: {
        isOpen: false,
        size: ModalSize.MC,
        animation: ModalAnimation.BOTTOM,
        isScrolled: false,
    },
    [ModalType.PREVIEW]: {
        isOpen: false,
        size: ModalSize.FULL,
        animation: ModalAnimation.LEFT,
        isScrolled: false,
    },
    [ModalType.PROGRESS]: {
        isOpen: false,
        size: ModalSize.XXS,
        animation: ModalAnimation.BOTTOM,
        isScrolled: false,
    },
    [ModalType.INFO]: {
        isOpen: false,
        size: ModalSize.XXS,
        animation: ModalAnimation.BOTTOM,
        isScrolled: false,
    },
    [ModalType.SUCCESS]: {
        isOpen: false,
        size: ModalSize.MC,
        animation: ModalAnimation.BOTTOM,
        isScrolled: false,
    },
    [ModalType.WARNING]: {
        isOpen: false,
        size: ModalSize.MC,
        animation: ModalAnimation.BOTTOM,
        isScrolled: false,
    },
    [ModalType.NOTIFICATION]: {
        isOpen: false,
        size: ModalSize.MC,
        animation: ModalAnimation.BOTTOM,
        isScrolled: false,
    },
    [ModalType.CONFIRM_CONTACTS]: {
        isOpen: false,
        size: ModalSize.MIDDLE,
        animation: ModalAnimation.BOTTOM,
        isScrolled: false,
    },
    [ModalType.CONFIRM_ALL_DOCS]: {
        isOpen: false,
        size: ModalSize.MIDDLE,
        animation: ModalAnimation.BOTTOM,
        isScrolled: false,
    },
    [ModalType.CONFIRM_ALL_DOCS_ONE_CODE]: {
        isOpen: false,
        size: ModalSize.MIDDLE,
        animation: ModalAnimation.BOTTOM,
        isScrolled: false,
    },

    // auxiliary fields
    additionalOverlayVisibility: true,
    modalStack: [],
    confirmationMethod: 'SMS',
    selectedCountry: '',
    currentProblemScreen: '',
};

const modalSlice = createSlice({
    name: 'modal',
    initialState,
    reducers: {
        openModal: (
            state,
            action: PayloadAction<{
                type: ModalType;
                size: ModalSize;
                animation: ModalAnimation;
                title?: string;
                docId?: string;
            }>
        ) => {
            const { type, size, animation, title, docId } = action.payload;
            if (state[type].isOpen) return;

            state[type].isOpen = true;
            state[type].size = size;
            state[type].animation = animation;
            if (title !== undefined) {
                state[type].title = title;
            }

            // only store docId for preview modals
            if (
                type === ModalType.DOCUMENTS_PREVIEW ||
                type === ModalType.DOCUMENTS_PREVIEW_SIGNED ||
                type === ModalType.CHECKS_PREVIEW
            ) {
                // @ts-ignore
                state[type].docId = docId;
            }

            state.modalStack.push(type);
        },

        closeModal: (state, action: PayloadAction<ModalType>) => {
            const type = action.payload;
            state[type].isOpen = false;

            // only clear docId for preview modals
            if (
                type === ModalType.DOCUMENTS_PREVIEW ||
                type === ModalType.DOCUMENTS_PREVIEW_SIGNED ||
                type === ModalType.CHECKS_PREVIEW
            ) {
                // @ts-ignore
                state[type].docId = undefined;
            }

            state.modalStack = state.modalStack.filter((m) => m !== type);
        },

        closeLastModal: (state) => {
            const last = state.modalStack.pop();
            if (last) {
                state[last].isOpen = false;
                if (
                    last === ModalType.DOCUMENTS_PREVIEW ||
                    last === ModalType.DOCUMENTS_PREVIEW_SIGNED ||
                    last === ModalType.CHECKS_PREVIEW
                ) {
                    // @ts-ignore
                    state[last].docId = undefined;
                }
            }
        },

        setModalScrolled: (
            state,
            action: PayloadAction<{ type: ModalType; isScrolled: boolean }>
        ) => {
            const { type, isScrolled } = action.payload;
            state[type].isScrolled = isScrolled;
        },

        setCurrentConfirmModalType: (
            state,
            action: PayloadAction<'SMS' | 'WHATSAPP' | 'EMAIL'>
        ) => {
            state.confirmationMethod = action.payload;
        },

        setSelectedCountry: (state, action: PayloadAction<string>) => {
            state.selectedCountry = action.payload;
        },

        setCurrentProblemScreen: (
            state,
            action: PayloadAction<string | undefined>
        ) => {
            state.currentProblemScreen = action.payload;
        },
        setAdditionalOverlayVisibility: (
            state,
            action: PayloadAction<boolean>
        ) => {
            state.additionalOverlayVisibility = action.payload;
        },

        closeAllModals: (state) => {
            Object.values(ModalType).forEach((type) => {
                if (type !== ModalType.CONFIRM_CODE) {
                    state[type].isOpen = false;
                    if (
                        type === ModalType.DOCUMENTS_PREVIEW ||
                        type === ModalType.DOCUMENTS_PREVIEW_SIGNED
                    ) {
                        // @ts-ignore
                        state[type].docId = undefined;
                    }
                }
            });
            state.modalStack = state.modalStack.filter(
                (m) => m === ModalType.CONFIRM_CODE
            );
        },
    },
});

export const {
    openModal,
    closeModal,
    closeLastModal,
    setModalScrolled,
    setCurrentConfirmModalType,
    setSelectedCountry,
    setCurrentProblemScreen,
    closeAllModals,
    setAdditionalOverlayVisibility
} = modalSlice.actions;

export default modalSlice.reducer;
