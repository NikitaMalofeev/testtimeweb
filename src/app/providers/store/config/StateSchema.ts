import { ModalState } from "entities/ui/Modal/model/modalTypes";
import { UiSchema } from "entities/ui/Ui/types/uiTypes";
export interface StateSchema {
    ui: UiSchema;
    modal: ModalState;
}