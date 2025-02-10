import { RootState } from "app/providers/store/config/store";
import { ModalType } from "../model/modalTypes";


export const selectIsAnyModalOpen = (state: RootState) =>
    Object.values(state.modal).some((modal) => modal.isOpen);

export const selectModalState = (state: RootState, type: ModalType) => state.modal[type];
