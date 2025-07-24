// ui/DocumentsPreviewPdf/DocumentsPreviewPdf.tsx
import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { motion } from "framer-motion";
import { useSelector } from "react-redux";
import { selectIsAnyModalOpen } from "entities/ui/Modal/selectors/selectorsModals";
import styles from "./styles.module.scss";
import { Icon } from "shared/ui/Icon/Icon";
import CloseIcon from "shared/assets/svg/close.svg";
import { Loader } from "shared/ui/Loader/Loader";
import { useAppDispatch } from "shared/hooks/useAppDispatch";
import { closeModal } from "entities/ui/Modal/slice/modalSlice";
import { ModalType } from "entities/ui/Modal/model/modalTypes";
import { PdfViewer } from "shared/ui/PDFViewer/PDFViewer";

interface DocumentsPreviewPdfProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    pdfUrl?: string;
}

export const DocumentsPreviewPdfModal: React.FC<DocumentsPreviewPdfProps> = ({
    isOpen,
    onClose,
    title,
    pdfUrl,
}) => {
    const dispatch = useAppDispatch();

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

    useEffect(() => {
        console.log(pdfUrl + 'url')
    }, [pdfUrl])

    const handleClose = () => {
        dispatch(closeModal(ModalType.DOCUMENTS_PREVIEW_PDF));
        onClose();
    };


    if (!isOpen || !pdfUrl) return null;

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
                    {/* {pdfUrl && <PdfViewer pdfUrl={pdfUrl} />} */}
                    <PdfViewer pdfUrl={pdfUrl} />
                </div>
            </motion.div>
        </div>,
        modalRoot,
    );
};
