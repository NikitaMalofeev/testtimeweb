import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import { RootState } from 'app/providers/store/config/store';
import { closeModal } from 'entities/ui/Modal/slice/modalSlice';
import { ModalType } from 'entities/ui/Modal/model/modalTypes';
import { selectIsAnyModalOpen } from 'entities/ui/Modal/selectors/selectorsModals';
import { Icon } from 'shared/ui/Icon/Icon';
import CloseIcon from 'shared/assets/svg/close.svg';
import { Loader } from 'shared/ui/Loader/Loader';
import styles from './styles.module.scss';
import ErrorIcon from 'shared/assets/svg/Error.svg';
import { useAppDispatch } from 'shared/hooks/useAppDispatch';

interface Props {
    isOpen: boolean;
    checkId: string | undefined;
    title?: string;
    onClose: () => void;
}

export const CheckPreviewModal: React.FC<Props> = ({
    isOpen,
    checkId,
    title = 'Чек',
    onClose,
}) => {
    const dispatch = useAppDispatch();
    const isAnyModalOpen = useSelector(selectIsAnyModalOpen);

    /* сам HTML чека — лежит в state.payments.checks[id].check_html */
    const html = useSelector(
        (s: RootState) => checkId && s.payments.checks[checkId]?.check_html
    );
    /* загрузка */
    const loading = useSelector((s: RootState) => s.payments.error === null && !html);

    useEffect(() => {
        // console.log('html' + html)
        // console.log('checkid' + checkId)
        // console.log(loading)
    }, [html, checkId, loading])

    /* блокировка скролла */
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            document.body.style.position = 'fixed';
            document.body.style.width = '100%';
            document.documentElement.style.overflow = 'hidden';
        } else {
            setTimeout(() => {
                if (!isAnyModalOpen) {
                    document.body.style.overflow = '';
                    document.body.style.position = '';
                    document.body.style.width = '';
                    document.documentElement.style.overflow = '';
                }
            }, 50);
        }
    }, [isOpen, isAnyModalOpen]);

    const handleClose = () => {
        dispatch(closeModal(ModalType.CHECKS_PREVIEW));
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
                    <Icon Svg={CloseIcon} width={20} height={20} onClick={handleClose} pointer />
                </div>

                <div className={styles.modalContent}>
                    {loading ? (
                        <Loader />
                    ) : html ? (
                        <div
                            className={styles.htmlContainer}
                            dangerouslySetInnerHTML={{ __html: html }}
                        />
                    ) : (
                        <div className={styles.error}>
                            <Icon Svg={ErrorIcon} width={36} height={36} />
                            <div>Чек не найден</div>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>,
        modalRoot
    );
};
