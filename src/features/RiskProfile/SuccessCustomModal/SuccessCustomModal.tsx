import React, { memo } from "react";
import { Modal } from "shared/ui/Modal/Modal";
import styles from "./styles.module.scss";
import { Button, ButtonTheme } from "shared/ui/Button/Button";
import { ModalType } from "entities/ui/Modal/model/modalTypes";
import { useSelector } from "react-redux";
import { RootState } from "app/providers/store/config/store";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "shared/hooks/useAppDispatch";
import { closeAllModals } from "entities/ui/Modal/slice/modalSlice";
import { Icon } from "shared/ui/Icon/Icon";
import SuccessIcon from 'shared/assets/svg/SuccessLabel.svg'

interface SuccessCustomModalProps {
    isOpen: boolean;
    onClose: () => void;
    isUserAuthorized: boolean;
    isLastDocument: boolean;
}

export const SuccessCustomModal = memo(({
    isOpen,
    onClose,
    isUserAuthorized,
    isLastDocument
}: SuccessCustomModalProps) => {
    const modalState = useSelector((state: RootState) => state.modal);
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const handleBackToPA = () => {
        navigate('/lk');
        onClose();
        dispatch(closeAllModals());
    };

    // Определяем заголовок, описание и кнопку в зависимости от статуса
    const getModalContent = () => {
        if (isUserAuthorized && isLastDocument) {
            return {
                title: "Документ подписан",

                buttonText: "Перейти в личный кабинет",
                buttonAction: handleBackToPA
            };
        } else if (!isUserAuthorized && !isLastDocument) {
            return {
                title: "Документ подписан",
                buttonText: 'Перейти к следующему', // нет кнопки для неавторизованных на последнем документе
                buttonAction: onClose
            };
        } else if (!isUserAuthorized && isLastDocument) {
            return {
                title: "Документ подписан",
                description: "Спасибо за подписание документов",
                buttonText: null, // нет кнопки для неавторизованных на последнем документе
                buttonAction: null
            };
        } else {
            // Промежуточные документы - этот случай не должен вызываться, но оставляем для безопасности
            return {
                title: "Документ подписан",
                description: "Документ успешно подписан",
                buttonText: isUserAuthorized ? "Перейти в личный кабинет" : "Продолжить",
                buttonAction: isUserAuthorized ? handleBackToPA : onClose
            };
        }
    };

    const { title, description, buttonText, buttonAction } = getModalContent();

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
                    {buttonText && buttonAction && (
                        <Button
                            theme={ButtonTheme.BLUE}
                            onClick={buttonAction}
                            className={styles.submitButton}
                        >
                            {buttonText}
                        </Button>
                    )}
                </div>
            </div>
        </Modal>
    );
});