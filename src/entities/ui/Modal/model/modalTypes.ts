import { ModalAnimation } from "entities/ui/Ui/slice/uiSlice";

export interface ModalState {
    isOpen: boolean;
    animation: ModalAnimation;
}