export interface ModalState {
    isOpen: boolean;
    size: ModalSize;
    animation: ModalAnimation;
}

export enum ModalSize {
    FULL = 'full',
    MIDDLE = 'middle',
    MINI = 'mini',
}

export enum ModalAnimation {
    LEFT = 'left',
    BOTTOM = 'bottom',
}