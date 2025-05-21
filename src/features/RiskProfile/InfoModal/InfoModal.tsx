import React, { memo } from "react";
import { Modal } from "shared/ui/Modal/Modal";
import styles from "./styles.module.scss";
import { Button, ButtonTheme } from "shared/ui/Button/Button";
import { ModalType } from "entities/ui/Modal/model/modalTypes";
import { useSelector } from "react-redux";
import { RootState } from "app/providers/store/config/store";

interface InfoModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    buttonText?: string;
    description?: string;
    action?: () => void;
    infoComponent?: React.ReactElement
}

export const InfoModal = memo(({ isOpen, onClose, title, buttonText, description, infoComponent, action }: InfoModalProps) => {
    const modalState = useSelector((state: RootState) => state.modal);


    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size={modalState.info.size}
            animation={modalState.info.animation}
            withCloseIcon
            titleWidth="250px"
            type={ModalType.INFO}
            withTitle={<span>{title}</span>}
        >
            <div className={styles.modalContent}>
                {infoComponent ? infoComponent : <>
                    <span className={styles.description}>{description}</span>
                    <Button
                        theme={ButtonTheme.BLUE}
                        onClick={() => action && action()}
                        className={styles.submitButton}
                    >
                        {buttonText}
                    </Button>
                </>}

            </div>
        </Modal>
    );
});
