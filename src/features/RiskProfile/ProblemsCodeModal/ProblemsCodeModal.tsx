import React, { memo, useState } from "react";
import { Modal } from "shared/ui/Modal/Modal";
import styles from "./styles.module.scss";
import { Button, ButtonTheme } from "shared/ui/Button/Button";
import { Checkbox } from "shared/ui/Checkbox/Checkbox";
import { ModalSize, ModalType } from "entities/ui/Modal/model/modalTypes";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "app/providers/store/config/store";
import { Input } from "shared/ui/Input/Input";
import { sendProblems } from "entities/User/slice/userSlice";
import { ProblemsRequestData } from "shared/api/userApi/userApi";
import { useAppDispatch } from "shared/hooks/useAppDispatch";
import { setTooltipActive } from "entities/ui/Ui/slice/uiSlice";

interface ConfirmInfoModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ProblemsCodeModal = memo(({ isOpen, onClose }: ConfirmInfoModalProps) => {
    const dispatch = useAppDispatch();
    const modalState = useSelector((state: RootState) => state.modal);
    const { phone, email } = useSelector((state: RootState) => state.user.user);
    const userId = useSelector((state: RootState) => state.user.userId);

    const [checkboxes, setCheckboxes] = useState({
        phoneCode: false,
        whatsappCode: false,
        invalidCode: false,
    });

    const [description, setDescription] = useState("");

    type CheckboxKey = "phoneCode" | "whatsappCode" | "invalidCode";

    const handleCheckboxChange = (name: CheckboxKey) => {
        setCheckboxes((prev) => ({
            ...prev,
            [name]: !prev[name],
        }));
    };

    const handleSubmit = () => {
        if (!userId) {
            console.error("User ID отсутствует");
            return;
        }

        const requestData: ProblemsRequestData = {
            user_id: userId,
            screen: 'code_confirmation',
            email,
            phone,
            is_phone_code_not_received: checkboxes.phoneCode,
            is_email_code_not_received: checkboxes.whatsappCode,
            is_invalid_code_received: checkboxes.invalidCode,
            description,
        };

        dispatch(sendProblems(requestData));
        dispatch(setTooltipActive({ active: false, message: 'Уже спешим помочь вам, ожидайте ответа команды Ranks' }))
        onClose();
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
            withTitle="Проблемы с получением кода"
        >
            <div className={styles.modalContent}>
                <Checkbox
                    name="phoneCode"
                    value={checkboxes.phoneCode}
                    onChange={() => handleCheckboxChange("phoneCode")}
                    label={<span>Не приходит код на телефон</span>}
                />
                <Checkbox
                    name="whatsappCode"
                    value={checkboxes.whatsappCode}
                    onChange={() => handleCheckboxChange("whatsappCode")}
                    label={<span>Не приходит код на WhatsApp</span>}
                />
                <Checkbox
                    name="invalidCode"
                    value={checkboxes.invalidCode}
                    onChange={() => handleCheckboxChange("invalidCode")}
                    label={<span>Код неверный</span>}
                />

                <Input
                    type="textarea"
                    typeProgramm="textarea"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Опишите проблему"
                />

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
