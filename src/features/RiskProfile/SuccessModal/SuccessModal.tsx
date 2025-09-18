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
import closeIcon from 'shared/assets/svg/close.svg'

interface SuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    description: ReactElement;
    action: () => void;
    actionText?: string;
    customSuccessModal?: boolean;
    isLastDocument?: boolean;
}

export const SuccessModal = memo(({ isOpen, onClose, title, description, action, actionText, customSuccessModal, isLastDocument }: SuccessModalProps) => {
    const modalState = useSelector((state: RootState) => state.modal);
    const customDocsData = useSelector((state: RootState) => state.documents.customDocumentsData);
    const userToken = useSelector((state: RootState) => state.user.token);
    const isUserAuthorized = Boolean(userToken);
    const navigate = useNavigate()
    const filledChapters = useSelector((state: RootState) => state.documents.filledRiskProfileChapters);
    const dispatch = useAppDispatch()
    const handleBackToPA = () => {
        navigate('/lk');
        onClose();
        dispatch(closeAllModals());
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
                <Icon width={20} height={20} Svg={closeIcon} className={styles.closeIcon} onClick={onClose} pointer />
                <div className={styles.content}>
                    <Icon width={36} height={36} Svg={SuccessIcon} />
                    <span className={styles.title}>{title}</span>
                    <span className={styles.description}>{description}</span>
                </div>
                <div className={styles.buttons}>
                    {isLastDocument || !customSuccessModal && (filledChapters.is_complete_passport || filledChapters.is_complete_person_legal) && (
                        <>
                            <Button
                                theme={ButtonTheme.BLUE}
                                onClick={() => action()}
                                className={styles.submitButton}
                            >
                                Перейти к следующему
                            </Button>

                        </>
                    )}
                    {/* Для риск профиля */}
                    {!isLastDocument || !customSuccessModal && (
                        <>
                            <Button
                                theme={ButtonTheme.BLUE}
                                onClick={() => action()}
                                className={styles.submitButton}
                            >
                                Перейти к заполнению документов
                            </Button>

                        </>
                    )}
                    <Button
                        theme={ButtonTheme.UNDERLINE}
                        onClick={handleBackToPA}
                        className={styles.submitButton}
                    >
                        Вернуться в личный кабинет
                    </Button>
                    {customSuccessModal && (
                        // Для кастомных документов проверяем, является ли это последним документом и авторизован ли пользователь
                        isLastDocument && isUserAuthorized ? (
                            <Button
                                theme={ButtonTheme.BLUE}
                                onClick={handleBackToPA}
                                className={styles.submitButton}
                            >
                                Перейти в личный кабинет
                            </Button>
                        ) : isLastDocument && !isUserAuthorized ? (
                            // Для неавторизованных пользователей на последнем документе просто закрываем модал
                            null
                        ) : customDocsData?.is_confirmed_type_doc_custom ? (
                            <Button
                                theme={ButtonTheme.BLUE}
                                onClick={() => action()}
                                className={styles.submitButton}
                            >
                                {actionText ? actionText : 'Просмотр документа'}
                            </Button>
                        ) : (
                            <Button
                                theme={ButtonTheme.BLUE}
                                onClick={() => action()}
                                className={styles.submitButton}
                            >
                                {actionText ? actionText : 'Перейти к следующему'}
                            </Button>
                        )
                    )}

                </div>
            </div>
        </Modal>
    );
});
