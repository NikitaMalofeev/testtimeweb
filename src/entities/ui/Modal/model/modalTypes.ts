// store/model/modalTypes.ts

export enum ModalSize {
    FULL = 'full',
    MIDDLE = 'middle',
    MINI = 'mini',
}

export enum ModalAnimation {
    LEFT = 'left',
    BOTTOM = 'bottom',
}

/** Все типы модалок в приложении */
export enum ModalType {
    IDENTIFICATION = 'identificationModal',
    SELECT = 'select',
    CONFIRM_CODE = 'confirmCodeModal',
    CONFIRM_DOCS = 'confirmDocsModal',
    PROBLEM_WITH_CODE = 'problemWithCodeModal',
    PREVIEW = 'preview',
    DOCUMENTS_PREVIEW = 'documentsPreview',
    RESET_PASSWORD = 'resetPassword'
}

/** Состояние одной конкретной модалки */
export interface ModalStateItem {
    isOpen: boolean;
    size: ModalSize;
    animation: ModalAnimation;
    isScrolled: boolean;
    title?: string;
    docId?: string;
}

/** Полное состояние для всех модалок */
export type ModalState = Record<ModalType, ModalStateItem>;
