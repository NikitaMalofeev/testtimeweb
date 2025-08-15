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
import { PdfViewer } from "shared/ui/PDFViewer/PDFViewer";
import { useNavigate } from "react-router-dom";
import { Button, ButtonTheme } from "shared/ui/Button/Button";
import ErrorIcon from 'shared/assets/svg/Error.svg'
import { getUserDocumentNotSignedThunk, getUserDocumentsStateThunk } from "entities/Documents/slice/documentsSlice";

interface PreviewModalProps {
    isOpen: boolean;       // Открыта ли модалка
    onClose: () => void;   // Функция закрытия модалки
    title?: string;        // Заголовок модалки
    docId?: string | null; // Идентификатор документа
    justPreview?: string;  // Если передаём URL для превью
    isSignedDoc?: boolean;
}

export const DocumentPreviewModal: React.FC<PreviewModalProps> = ({
    isOpen,
    onClose,
    title,
    docId,
    isSignedDoc,
    justPreview,
}) => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate()
    // Все HTML-документы для неподписанных лежат в Redux-стейте
    const allDocumentsHtml = useSelector(
        (state: RootState) => state.documents.allNotSignedDocumentsHtml
    );


    // Данные для подписанного документа (бинарный PDF)
    const hasCurrentSighedDocument = useSelector(
        (state: RootState) => state.documents.currentSugnedDocument
    );
    const { loading } = useSelector((state: RootState) => state.documents);

    // Локальное состояние готовности содержимого
    const [isContentReady, setIsContentReady] = useState(false);

    useEffect(() => {
        // console.log(docId)
        // console.log(allDocumentsHtml)
        // console.log(isSignedDoc)
        // docId && // console.log(allDocumentsHtml?.[docId])
    }, [docId, isContentReady])

    useEffect(() => {

        if (loading) {
            setIsContentReady(false);
            return;
        }
        if (docId?.startsWith('iir')) {
            setIsContentReady(true);
            return;
        }
        if (justPreview) {
            setIsContentReady(true);
            return;
        }
        if (docId) {
            if (docId === "type_doc_passport") {
                setIsContentReady(true);
                return;
            }
            // Если документ не подписан – ожидаем наличие HTML (даже если пустая строка)
            if (allDocumentsHtml && allDocumentsHtml.hasOwnProperty(docId)) {
                setTimeout(() => {
                    setIsContentReady(true);
                }, 1000);
            }
            // Если документ подписан – проверяем наличие бинарных данных
            if (isSignedDoc && hasCurrentSighedDocument && hasCurrentSighedDocument.document) {
                if (hasCurrentSighedDocument.document.length > 0) {
                    setIsContentReady(true);
                    return;
                }
            }
        }
        setIsContentReady(false);
    }, [
        loading,
        justPreview,
        docId,
        allDocumentsHtml,
        hasCurrentSighedDocument.document,
        isSignedDoc
    ]);

    // useEffect(() => {
    //     // console.log(isSignedDoc)
    //     // console.log(isContentReady)
    //     // console.log('hasCurrentSighedDocument', hasCurrentSighedDocument);
    // }, [hasCurrentSighedDocument, isContentReady]);

    // Блокировка скролла, если модалка открыта
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
        dispatch(closeModal(ModalType.DOCUMENTS_PREVIEW_SIGNED));
        onClose();
    };

    if (!isOpen) {
        return null;
    }

    // Находим или создаём контейнер для портала
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
                    <Icon Svg={CloseIcon} width={20} height={20} onClick={handleClose} pointer />
                </div>
                <div className={styles.modalContent} style={!isSignedDoc ? {} : { overflowY: 'hidden' }}>
                    {/* style={
                    isSignedDoc
                        ? ({ padding: '8px 0 8px 22px', '--after-display': 'block' } as React.CSSProperties)
                        : ({ padding: '8px 16px', '--after-display': 'none' } as React.CSSProperties)
                } */}
                    {!isContentReady && !loading ? (
                        <Loader />
                    ) : (isSignedDoc && hasCurrentSighedDocument &&
                        hasCurrentSighedDocument.document &&
                        Object.keys(hasCurrentSighedDocument.document).length > 0) ? (

                        <div className={styles.htmlContainer}>
                            <PdfViewer pdfBinary={hasCurrentSighedDocument.document} />
                        </div>
                    ) : justPreview ? (
                        <PdfViewer pdfUrl={justPreview} />
                    ) : docId === "type_doc_passport" ? (
                        <div className={styles.htmlContainer}>
                            <RiskProfileAllData />
                        </div>
                    ) : !isSignedDoc && docId && (allDocumentsHtml && allDocumentsHtml.hasOwnProperty(docId)) ? (
                        <div
                            className={styles.htmlContainer}
                            style={{ padding: '10px' }}
                            dangerouslySetInnerHTML={{ __html: allDocumentsHtml[docId] }}
                        />
                    ) : (
                        <div className={styles.error}>
                            <Icon width={36} height={36} Svg={ErrorIcon} />
                            <div>Документ не найден</div>
                            <Button
                                theme={ButtonTheme.UNDERLINE}
                                onClick={() => {
                                    dispatch(closeAllModals())
                                    navigate('/support')
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
        modalRoot
    );
};
