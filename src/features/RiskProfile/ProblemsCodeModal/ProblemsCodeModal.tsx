import React, { memo, useState } from "react";
import { Modal } from "shared/ui/Modal/Modal";
import styles from "./styles.module.scss";
import { Button, ButtonTheme } from "shared/ui/Button/Button";
import { Checkbox } from "shared/ui/Checkbox/Checkbox";
import { ModalSize, ModalType } from "entities/ui/Modal/model/modalTypes";
import { useSelector } from "react-redux";

interface ConfirmInfoModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ProblemsCodeModal = memo(({ isOpen, onClose }: ConfirmInfoModalProps) => {
    const modalState = useSelector((state: any) => state.modal);
    const [checkboxes, setCheckboxes] = useState({
        phoneCode: false,
        whatsappCode: false,
        invalidCode: false,
    });

    type CheckboxKey = "phoneCode" | "whatsappCode" | "invalidCode";


    const handleCheckboxChange = (name: CheckboxKey) => {
        setCheckboxes((prev) => ({
            ...prev,
            [name]: !prev[name],
        }));
    };

    const handleSubmit = () => {
        console.log("Selected problems:", checkboxes);

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
