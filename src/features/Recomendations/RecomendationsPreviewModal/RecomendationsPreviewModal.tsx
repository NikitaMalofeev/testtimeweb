import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import { RootState } from 'app/providers/store/config/store';
import { closeModal } from 'entities/ui/Modal/slice/modalSlice';
import { ModalType } from 'entities/ui/Modal/model/modalTypes';
import { selectIsAnyModalOpen } from 'entities/ui/Modal/selectors/selectorsModals';
import styles from './styles.module.scss';
import { Icon } from 'shared/ui/Icon/Icon';
import CloseIcon from 'shared/assets/svg/close.svg';
import { Loader } from 'shared/ui/Loader/Loader';
import { useAppDispatch } from 'shared/hooks/useAppDispatch';
import { PdfViewer } from 'shared/ui/PDFViewer/PDFViewer';
import ErrorIcon from 'shared/assets/svg/Error.svg';

interface RecomendationsPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    uuid: string | undefined;                // чистый uuid без «iir_»
    title?: string;
    isSigned?: boolean;
}

export const RecomendationsPreviewModal: React.FC<RecomendationsPreviewModalProps> = ({
    isOpen,
    onClose,
    uuid,
    title = 'Индивидуальная инвестиционная рекомендация',
    isSigned = false,
}) => {
    const dispatch = useAppDispatch();

    /** html-кэш и pdf-кэш из recomendationsSlice */
    const { notSignedHtmls, signedDocs, loading } = useSelector(
        (s: RootState) => s.recomendations,
    );



    const htmlKey = uuid ? `iir_${uuid}` : '';
    const pdfKey = htmlKey;

    const [ready, setReady] = useState(false);

    useEffect(() => {
        console.log(uuid)
        console.log(ready)
        console.log(htmlKey)
        console.log(pdfKey)
    }, [uuid, ready, htmlKey, pdfKey])

    /* ───────── проверяем готовность контента ───────── */
    useEffect(() => {
        if (!uuid) {
            setReady(false);
            return;
        }

        if (loading) {
            setReady(false);
            return;
        }

        if (isSigned && signedDocs[pdfKey]?.length) {
            setReady(true);
            return;
        }

        if (!isSigned && Object.prototype.hasOwnProperty.call(notSignedHtmls, htmlKey)) {
            setReady(true);
            return;
        }

        setReady(false);
    }, [uuid, isSigned, loading, signedDocs, notSignedHtmls]);

    /* ───────── блокируем скролл, если открыто ───────── */
    const isAnyModalOpen = useSelector(selectIsAnyModalOpen);
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            document.body.style.position = 'fixed';
            document.body.style.width = '100%';
        } else {
            if (!isAnyModalOpen) {
                document.body.style.overflow = '';
                document.body.style.position = '';
                document.body.style.width = '';
            }
        }
    }, [isOpen, isAnyModalOpen]);

    const handleClose = () => {
        dispatch(closeModal(ModalType.DOCUMENTS_PREVIEW));
        onClose();
    };

    if (!isOpen) return null;

    let modalRoot = document.getElementById('modal-root');
    if (!modalRoot) {
        modalRoot = document.createElement('div');
        modalRoot.id = 'modal-root';
        document.body.appendChild(modalRoot);
    }

    return ReactDOM.createPortal(
        <div className={styles.overlay} onClick={handleClose}>
            <motion.div
                className={styles.modal}
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ duration: 0.3 }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className={styles.modalHeader}>
                    <span className={styles.modalTitle}>{title}</span>
                    <Icon Svg={CloseIcon} width={20} height={20} onClick={handleClose} />
                </div>

                <div className={styles.modalContent}>
                    {!ready ? (
                        <Loader />
                    ) : isSigned ? (
                        <PdfViewer pdfBinary={signedDocs[pdfKey]} />
                    ) : (
                        <div
                            className={styles.htmlContainer}
                            dangerouslySetInnerHTML={{ __html: notSignedHtmls[htmlKey] }}
                        />
                    )}
                </div>

                {!ready && !loading && (
                    <div className={styles.error}>
                        <Icon width={36} height={36} Svg={ErrorIcon} />
                        Документ не найден
                    </div>
                )}
            </motion.div>
        </div>,
        modalRoot,
    );
};
