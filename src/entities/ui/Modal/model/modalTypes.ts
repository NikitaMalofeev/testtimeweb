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
    CONFIRM_CODE = 'confirmCodeModal',
    PROBLEM_WITH_CODE = 'problemWithCodeModal',
}

/** Состояние одной конкретной модалки */
export interface ModalStateItem {
    isOpen: boolean;
    size: ModalSize;
    animation: ModalAnimation;
    isScrolled: boolean;
}

/** Полное состояние для всех модалок */
export type ModalState = Record<ModalType, ModalStateItem>;
