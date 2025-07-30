import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "app/providers/store/config/store";
import { closeModal, setAdditionalOverlayVisibility } from "entities/ui/Modal/slice/modalSlice";
import { ModalType } from "entities/ui/Modal/model/modalTypes";
import { motion } from "framer-motion";
import ReactDOM from "react-dom";
import { Icon } from "shared/ui/Icon/Icon";
import CloseIcon from "shared/assets/svg/close.svg";
import styles from "./styles.module.scss";
import { selectIsAnyModalOpen, selectModalState } from "entities/ui/Modal/selectors/selectorsModals";
import { useDevice } from "shared/hooks/useDevice";
import { riskProfiles } from "shared/static/riskProfiles";

interface PreviewModalProps {
    title: string;
    content: React.ReactNode;
    contentPurpose: 'docs' | 'riskProfiles';
}

export const PreviewModal: React.FC<PreviewModalProps> = ({ title, content, contentPurpose }) => {
    const dispatch = useDispatch();
    const modalState = useSelector((state: RootState) => selectModalState(state, ModalType.PREVIEW));
    const isAnyModalOpen = useSelector(selectIsAnyModalOpen);
    const device = useDevice()

    let modalRoot = document.getElementById("modal-root");
    if (!modalRoot) {
        modalRoot = document.createElement("div");
        modalRoot.id = "modal-root";
        document.body.appendChild(modalRoot);
    }



    useEffect(() => {
        if (modalState.isOpen) {
            document.body.style.overflow = 'hidden';
            document.body.style.position = 'fixed';
            document.body.style.width = '100%';
            document.documentElement.style.overflow = 'hidden';
        }

        return () => {
            if (!isAnyModalOpen) {
                document.body.style.overflow = '';
                document.body.style.position = '';
                document.body.style.width = '';
                document.documentElement.style.overflow = '';
            }
        };
    }, [modalState.isOpen, isAnyModalOpen]);

    const handleClose = () => {
        dispatch(setAdditionalOverlayVisibility(true))
        dispatch(closeModal(ModalType.PREVIEW));
    }

    return ReactDOM.createPortal(
        modalState.isOpen ? (
            <motion.div className={styles.overlay} onClick={handleClose}>
                <motion.div
                    className={styles.modal}
                    initial={{ x: "100%" }}
                    animate={{ x: 0 }}
                    exit={{ x: "100%" }}
                    transition={device === 'mobile' ? { duration: 0.3 } : { duration: 0.15 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className={styles.modalHeader}>
                        <span className={styles.modalTitle}>{title}</span>
                        <Icon Svg={CloseIcon} width={20} height={20} onClick={handleClose} pointer/>
                    </div>
                    <div className={styles.modalContent__wrapper}>
                        <div className={`${contentPurpose === 'riskProfiles' ? styles.modalContent_grid : styles.modalContent}`}>{content}</div>
                    </div>
                </motion.div>
            </motion.div >
        ) : null,
        modalRoot
    );

};
