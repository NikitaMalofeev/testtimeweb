import { RootState } from "app/providers/store/config/store";


export const selectIsAnyModalOpen = (state: RootState) =>
    Object.values(state.modal).some((modal) => modal.isOpen);
