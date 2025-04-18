// store/model/modalTypes.ts

export enum ModalSize {
    FULL = 'full',
    MIDDLE = 'middle',
    MINI = 'mini',
    XXS = 'xxs',
    MC = 'mc',
    MCSQ = 'mcsq'
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
    CONFIRM_CUSTOM_DOCS = 'confirmCustomDocsModal',
    PROBLEM_WITH_CODE = 'problemWithCodeModal',
    PROBLEM = 'problem',
    PREVIEW = 'preview',
    DOCUMENTS_PREVIEW_SIGNED = 'documentsPreviewSigned',
    DOCUMENTS_PREVIEW = 'documentsPreview',
    RESET_PASSWORD = 'resetPassword',
    PROGRESS = 'progress',
    INFO = 'info',
    SUCCESS = 'success'
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
