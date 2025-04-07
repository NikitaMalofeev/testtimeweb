import React, { memo, ReactElement, useState } from "react";
import { Modal } from "shared/ui/Modal/Modal";
import styles from "./styles.module.scss";
import { Button, ButtonTheme } from "shared/ui/Button/Button";
import { Checkbox } from "shared/ui/Checkbox/Checkbox";
import { ModalSize, ModalType } from "entities/ui/Modal/model/modalTypes";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "app/providers/store/config/store";
import { Input } from "shared/ui/Input/Input";
import { sendProblemsNotAuthThunk } from "entities/User/slice/userSlice";
import { useAppDispatch } from "shared/hooks/useAppDispatch";
import { setTooltipActive } from "entities/ui/Ui/slice/uiSlice";
import { ProblemsRequestData } from "entities/User/types/userTypes";

interface ConfirmInfoModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
}

export const ProblemsCodeModal = memo(({ isOpen, onClose, title = 'Проблемы с получением кода' }: ConfirmInfoModalProps) => {
    const dispatch = useAppDispatch();
    const modalState = useSelector((state: RootState) => state.modal);
    const { phone, email } = useSelector((state: RootState) => state.user.user);
    const token = useSelector((state: RootState) => state.user.token);

    const currentProblemScreen = useSelector((state: RootState) => state.modal.currentProblemScreen)

    const [checkboxes, setCheckboxes] = useState({
        is_phone_code_not_received: false,
        is_email_code_not_received: false,
        is_invalid_code_received: false,
    });

    const [description, setDescription] = useState("");

    type CheckboxKey = "is_phone_code_not_received" | "is_email_code_not_received" | "is_invalid_code_received";

    const handleCheckboxChange = (name: CheckboxKey) => {
        setCheckboxes((prev) => ({
            ...prev,
            [name]: !prev[name],
        }));
    };

    const handleSubmit = () => {
        // if (!token) {
        //     console.error("User ID отсутствует");
        //     return;
        // }

        const requestData: ProblemsRequestData = {
            screen: currentProblemScreen ? currentProblemScreen : 'identification',
            email,
            phone,
            is_phone_code_not_received: checkboxes.is_phone_code_not_received,
            is_email_code_not_received: checkboxes.is_email_code_not_received,
            is_invalid_code_received: checkboxes.is_invalid_code_received,
            description,
        };

        dispatch(sendProblemsNotAuthThunk({
            data: requestData, onSuccess: () => {
                dispatch(setTooltipActive({ active: false, message: 'Уже спешим помочь вам, ожидайте ответа команды Ranks' }))
                onClose();
            }
        }));

    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size={modalState.problemWithCodeModal.size}
            animation={modalState.problemWithCodeModal.animation}
            withCloseIcon
            titleWidth={"250px"}
            type={ModalType.PROBLEM_WITH_CODE}
            withTitle={<span>{title}</span>}
        >
            <div className={styles.modalContent}>
                <div>
                    <Checkbox
                        name="phoneCode"
                        value={checkboxes.is_phone_code_not_received}
                        onChange={() => handleCheckboxChange("is_phone_code_not_received")}
                        label={<span>Не приходит код на телефон</span>}
                    />

                    <Checkbox
                        name="whatsappCode"
                        value={checkboxes.is_email_code_not_received}
                        onChange={() => handleCheckboxChange("is_email_code_not_received")}
                        label={<span>Не приходит код на почту</span>}
                    />

                    <Checkbox
                        name="invalidCode"
                        value={checkboxes.is_invalid_code_received}
                        onChange={() => handleCheckboxChange("is_invalid_code_received")}
                        label={<span>Код неверный</span>}
                    />

                    <Input
                        type="textarea"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Опишите проблему"
                    />
                </div>

                <Button
                    theme={ButtonTheme.BLUE}
                    onClick={handleSubmit}
                    className={styles.submitButton}
                >
                    Отправить запрос
                </Button>
            </div>
        </Modal>
    );
});
