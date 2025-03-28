import React from "react";
import { Modal } from "shared/ui/Modal/Modal";
import styles from "./styles.module.scss";
import { ModalAnimation, ModalSize, ModalType } from "entities/ui/Modal/model/modalTypes";
import { useAppDispatch } from "shared/hooks/useAppDispatch";
import { ProgressBar } from "shared/ui/ProgressBar/ProgressBar"; // путь будет свой
import { RootState } from "app/providers/store/config/store";
import { useSelector } from "react-redux";
import { Button, ButtonTheme } from "shared/ui/Button/Button";

interface UploadProgressModalProps {
    isOpen: boolean;
    onClose: () => void;
    processName: string;
    processTitle: string;
    description: string;
    buttonTitle: string;
    action: () => void;
}

export const UploadProgressModal: React.FC<UploadProgressModalProps> = ({
    isOpen,
    onClose,
    processName,
    processTitle,
    description,
    buttonTitle,
    action
}) => {
    const dispatch = useAppDispatch();

    // Достаём из нашего слайса текущее значение прогресса и сообщение
    const progress = useSelector((state: RootState) => state.riskProfile.pasportScanProgress);
    const modalState = useSelector((state: RootState) => state.modal.progress);

    return (
        <Modal
            type={ModalType.PROGRESS}
            animation={modalState.animation}
            size={modalState.size}
            isOpen={isOpen}
            onClose={onClose}
            withCloseIcon
        >
            <div className={styles.modalContent}>
                <div>

                    <div className={styles.header}>
                        <span className={styles.title}>{processTitle}</span><span className={styles.percentage}>{progress}%</span>
                    </div>
                    <div>
                        <h3 className={styles.name}>{processName}</h3>
                    </div>
                </div>
                <div>
                    <ProgressBar progress={progress} />
                </div>
                <div className={styles.description}>
                    <span className={styles.title}>{description}</span>
                    <Button theme={ButtonTheme.UNDERLINE} className={styles.button} onClick={action} children={buttonTitle} padding="7px 16px" />
                </div>
            </div>
        </Modal>
    );
};
