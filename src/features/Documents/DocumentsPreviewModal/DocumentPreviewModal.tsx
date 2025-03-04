import React, { useEffect } from "react";
import ReactDOM from "react-dom";
import { motion } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "app/providers/store/config/store";
import { closeModal } from "entities/ui/Modal/slice/modalSlice";
import { Icon } from "shared/ui/Icon/Icon";
import { PdfViewer } from "shared/ui/PDFViewer/PDFViewer";
import styles from "./styles.module.scss";
import CloseIcon from "shared/assets/svg/close.svg";
import EDSPdf from "shared/assets/documents/EDS.pdf?url";
import Broker from "shared/assets/documents/Broker.pdf?url";
import IS from "shared/assets/documents/IS.pdf?url";
import PersonalPolicy from "shared/assets/documents/PersonalPolicy.pdf?url";
import RiskDeclaration from "shared/assets/documents/RiskDeclaration.pdf?url";
import RiskProfile from "shared/assets/documents/RiskProfile.pdf?url";
import Profile from "shared/assets/documents/Profile.pdf?url";
import { ModalType } from "entities/ui/Modal/model/modalTypes";
import { selectIsAnyModalOpen } from "entities/ui/Modal/selectors/selectorsModals";
import { RiskProfileAllData } from "features/RiskProfile/RiskProfileAllData/RiskProfileAllData";


interface PreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    docId?: string | null;
}

export const DocumentPreviewModal = ({ isOpen, onClose, title, docId }: PreviewModalProps) => {
    const dispatch = useDispatch();

    if (!isOpen) return <div style={{ display: "none" }} />;

    let modalRoot = document.getElementById("modal-root");
    if (!modalRoot) {
        modalRoot = document.createElement("div");
        modalRoot.id = "modal-root";
        document.body.appendChild(modalRoot);
    }

    const isAnyModalOpen = useSelector(selectIsAnyModalOpen);

    useEffect(() => {
        console.log("Modal state changed:", { isOpen, isAnyModalOpen });

        if (isOpen) {
            document.body.style.overflow = 'hidden';
            document.body.style.position = 'fixed';
            document.body.style.width = '100%';
            document.documentElement.style.overflow = 'hidden';
        } else {
            setTimeout(() => {
                if (!isAnyModalOpen) {
                    console.log("All modals closed, resetting styles.");
                    document.body.style.overflow = "";
                    document.body.style.position = "";
                    document.body.style.width = "";
                    document.documentElement.style.overflow = "";
                }
            }, 50);
        }
    }, [isOpen, isAnyModalOpen]);


    const handleClose = () => dispatch(closeModal(ModalType.DOCUMENTS_PREVIEW));

    const renderDocPreviewContent = (docType: string | null) => {
        switch (docType) {
            case "type_doc_passport":
                return <RiskProfileAllData />;
            case "type_doc_RP_questionnairy":
                return <PdfViewer fileUrl={RiskProfile} />;
            case "type_doc_EDS_agreement":
                return <PdfViewer fileUrl={EDSPdf} />;
            case "type_doc_agreement_investment_advisor":
                return <PdfViewer fileUrl={IS} />;
            case "type_doc_risk_declarations":
                return <PdfViewer fileUrl={RiskDeclaration} />;
            case "type_doc_agreement_personal_data_policy":
                return <PdfViewer fileUrl={PersonalPolicy} />;
            case "type_doc_investment_profile_certificate":
                return <PdfViewer fileUrl={Profile} />;
            default:
                return <div>Неизвестный документ. Нет превью.</div>;
        }
    };

    return ReactDOM.createPortal(
        <motion.div className={styles.overlay} onClick={handleClose}>
            <motion.div
                className={styles.modal}
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ duration: 0.3 }}
                onClick={(e) => e.stopPropagation()}
            >

                <div className={styles.modalHeader}>
                    <span className={styles.modalTitle}>{title}</span>
                    <Icon Svg={CloseIcon} width={20} height={20} onClick={handleClose} />
                </div>
                <div className={styles.modalContainer}>
                    <div className={styles.modalContent}>{docId && renderDocPreviewContent(docId)}</div>
                </div>

            </motion.div>
        </motion.div>,
        modalRoot
    );
};
