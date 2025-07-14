// ui/DocumentPreviewModal/DocumentPreviewModal.tsx
import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { motion } from "framer-motion";
import { useSelector } from "react-redux";
import { RootState } from "app/providers/store/config/store";
import { closeAllModals, closeModal } from "entities/ui/Modal/slice/modalSlice";
import { ModalType } from "entities/ui/Modal/model/modalTypes";
import { selectIsAnyModalOpen } from "entities/ui/Modal/selectors/selectorsModals";
import styles from "./styles.module.scss";
import { Icon } from "shared/ui/Icon/Icon";
import CloseIcon from "shared/assets/svg/close.svg";
import { RiskProfileAllData } from "features/RiskProfile/RiskProfileAllData/RiskProfileAllData";
import { Loader } from "shared/ui/Loader/Loader";
import { useAppDispatch } from "shared/hooks/useAppDispatch";
import { useNavigate } from "react-router-dom";
import { Button, ButtonTheme } from "shared/ui/Button/Button";
import ErrorIcon from "shared/assets/svg/Error.svg";

interface PreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    docId?: string | null;
}

export const DocumentPreviewModal: React.FC<PreviewModalProps> = ({
    isOpen,
    onClose,
    title,
    docId,
}) => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    const allDocumentsHtml = useSelector(
        (s: RootState) => s.documents.allNotSignedDocumentsHtml,
    );
    const { loading } = useSelector((s: RootState) => s.documents);

    const [isContentReady, setIsContentReady] = useState(false);

    useEffect(() => {
        if (loading) {
            setIsContentReady(false);
            return;
        }

        if (docId?.startsWith("iir")) {
            setIsContentReady(true);
            return;
        }

        if (docId === "type_doc_passport") {
            setIsContentReady(true);
            return;
        }

        if (docId && allDocumentsHtml?.hasOwnProperty(docId)) {
            setTimeout(() => setIsContentReady(true), 1000);
            return;
        }

        setIsContentReady(false);
    }, [loading, docId, allDocumentsHtml]);

    const isAnyModalOpen = useSelector(selectIsAnyModalOpen);
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
            document.body.style.position = "fixed";
            document.body.style.width = "100%";
            document.documentElement.style.overflow = "hidden";
        } else {
            setTimeout(() => {
                if (!isAnyModalOpen) {
                    document.body.style.overflow = "";
                    document.body.style.position = "";
                    document.body.style.width = "";
                    document.documentElement.style.overflow = "";
                }
            }, 50);
        }
    }, [isOpen, isAnyModalOpen]);

    const handleClose = () => {
        dispatch(closeModal(ModalType.DOCUMENTS_PREVIEW));
        onClose();
    };

    if (!isOpen) return null;

    let modalRoot = document.getElementById("modal-root");
    if (!modalRoot) {
        modalRoot = document.createElement("div");
        modalRoot.id = "modal-root";
        document.body.appendChild(modalRoot);
    }

    return ReactDOM.createPortal(
        <div className={styles.overlay} onClick={handleClose}>
            <motion.div
                className={styles.modal}
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ duration: 0.3 }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className={styles.modalHeader}>
                    <span className={styles.modalTitle}>{title || "Документ"}</span>
                    <Icon Svg={CloseIcon} width={20} height={20} onClick={handleClose} />
                </div>

                <div className={styles.modalContent}>
                    {!isContentReady && !loading ? (
                        <Loader />
                    ) : docId === "type_doc_passport" ? (
                        <div className={styles.htmlContainer}>
                            <RiskProfileAllData />
                        </div>
                    ) : docId && allDocumentsHtml?.[docId] ? (
                        <div
                            className={styles.htmlContainer}
                            style={{ padding: "10px" }}
                            dangerouslySetInnerHTML={{ __html: allDocumentsHtml[docId] }}
                        />
                    ) : (
                        <div className={styles.error}>
                            <Icon width={36} height={36} Svg={ErrorIcon} />
                            <div>Документ не найден</div>
                            <Button
                                theme={ButtonTheme.UNDERLINE}
                                onClick={() => {
                                    dispatch(closeAllModals());
                                    navigate("/support");
                                }}
                                className={styles.error__button}
                            >
                                Перейти в чат поддержки
                            </Button>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>,
        modalRoot,
    );
};
