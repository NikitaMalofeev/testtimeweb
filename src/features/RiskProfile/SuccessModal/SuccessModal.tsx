import React, { memo, ReactElement, useEffect } from "react";
import { Modal } from "shared/ui/Modal/Modal";
import styles from "./styles.module.scss";
import { Button, ButtonTheme } from "shared/ui/Button/Button";
import { ModalType } from "entities/ui/Modal/model/modalTypes";
import { useSelector } from "react-redux";
import { RootState } from "app/providers/store/config/store";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "shared/hooks/useAppDispatch";
import { closeAllModals, closeModal } from "entities/ui/Modal/slice/modalSlice";
import { Icon } from "shared/ui/Icon/Icon";
import SuccessIcon from 'shared/assets/svg/SuccessLabel.svg'

interface SuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    description: ReactElement;
    action: () => void;
    actionText?: string;
}

export const SuccessModal = memo(({ isOpen, onClose, title, description, action, actionText }: SuccessModalProps) => {
    const modalState = useSelector((state: RootState) => state.modal);
    const navigate = useNavigate()
    const dispatch = useAppDispatch()
    const handleBackToPA = () => {
        navigate('/lk')
        dispatch(closeAllModals())
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size={modalState.success.size}
            animation={modalState.success.animation}
            withCloseIcon
            titleWidth="250px"
            type={ModalType.INFO}
        >
            <div className={styles.modalContent}>
                <div className={styles.content}>
                    <Icon width={36} height={36} Svg={SuccessIcon} />
                    <span className={styles.title}>{title}</span>
                    <span className={styles.description}>{description}</span>
                </div>
                <div className={styles.buttons}>
                    <Button
                        theme={ButtonTheme.UNDERLINE}
                        onClick={handleBackToPA}
                        className={styles.submitButton}
                    >
                        Вернуться в личный кабинет
                    </Button>
                    <Button
                        theme={ButtonTheme.BLUE}
                        onClick={() => action()}
                        className={styles.submitButton}
                    >
                        {actionText ? actionText : 'Перейти к следующему'}
                    </Button>
                </div>
            </div>
        </Modal>
    );
});
