import { RootState } from "app/providers/store/config/store";
import { ModalType } from "../model/modalTypes";


export const selectIsAnyModalOpen = (state: RootState) => {
    console.log("Current modal state:", state.modal);

    return Object.values(state.modal)
        .filter((modal) => modal !== undefined) // 🔹 Убираем undefined-модалки
        .some((modal) => modal?.isOpen);
};




export const selectModalState = (state: RootState, type: ModalType) => state.modal[type];
