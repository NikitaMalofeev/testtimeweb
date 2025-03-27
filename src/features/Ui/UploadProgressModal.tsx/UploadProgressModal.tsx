import React from "react";
import { Modal } from "shared/ui/Modal/Modal";
import styles from "./styles.module.scss";
import { ModalAnimation, ModalSize, ModalType } from "entities/ui/Modal/model/modalTypes";
import { useAppDispatch } from "shared/hooks/useAppDispatch";
import { ProgressBar } from "shared/ui/ProgressBar/ProgressBar"; // путь будет свой
import { RootState } from "app/providers/store/config/store";
import { useSelector } from "react-redux";

interface UploadProgressModalProps {
    isOpen: boolean;
    onClose: () => void;
    processName: string;
    processTitle: string;
}

export const UploadProgressModal: React.FC<UploadProgressModalProps> = ({
    isOpen,
    onClose,
    processName,
    processTitle
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
            </div>
        </Modal>
    );
};
