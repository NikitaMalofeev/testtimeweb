import React, { useEffect } from "react";
import ReactDOM from "react-dom";
import { motion } from "framer-motion";
import { useDispatch, useSelector } from "react-redux";

import { RootState } from "app/providers/store/config/store";
import { closeModal } from "entities/ui/Modal/slice/modalSlice";
import { ModalType } from "entities/ui/Modal/model/modalTypes";
import { selectIsAnyModalOpen } from "entities/ui/Modal/selectors/selectorsModals";

import styles from "./styles.module.scss";
import { Icon } from "shared/ui/Icon/Icon";
import CloseIcon from "shared/assets/svg/close.svg";
import { RiskProfileAllData } from "features/RiskProfile/RiskProfileAllData/RiskProfileAllData";

interface PreviewModalProps {
    isOpen: boolean;       // Открыта ли модалка
    onClose: () => void;   // Закрытие модалки
    title?: string;        // Заголовок (необязательно)
    docId?: string | null; // Ключ документа
}

export const DocumentPreviewModal: React.FC<PreviewModalProps> = ({
    isOpen,
    onClose,
    title,
    docId,
}) => {
    const dispatch = useDispatch();

    // Все HTML-документы лежат в Redux-стейте (ключ -> html-строка)
    const allDocumentsHtml = useSelector(
        (state: RootState) => state.documents.allNotSignedDocumentsHtml
    );

    // Глобальная проверка "есть ли в системе другие открытые модалки"
    const isAnyModalOpen = useSelector(selectIsAnyModalOpen);

    // Эффект для блокировки скролла при открытии.
    // Он всегда вызывается (пусть даже модалка закрыта).
    useEffect(() => {
        if (isOpen) {
            // Заблокировать скролл
            document.body.style.overflow = "hidden";
            document.body.style.position = "fixed";
            document.body.style.width = "100%";
            document.documentElement.style.overflow = "hidden";
        } else {
            // С небольшой задержкой восстанавливаем скролл
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

    // Обработчик закрытия
    const handleClose = () => {
        dispatch(closeModal(ModalType.DOCUMENTS_PREVIEW));
        onClose();
    };

    // Если модалка не открыта — не рендерим содержимое вовсе
    if (!isOpen) {
        return null;
    }

    // Достаём HTML (если docId не задан, будет "")
    const docHtml = docId && allDocumentsHtml ? allDocumentsHtml[docId] : "";

    // Находим/создаём контейнер для портала
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
                // Простейшая анимация (если нужна)
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
                    {docId === 'type_doc_passport' ?
                        <RiskProfileAllData /> :
                        <>
                            {docHtml ? (
                                <div
                                    className={styles.htmlContainer}
                                    dangerouslySetInnerHTML={{ __html: docHtml }}
                                />
                            ) : (
                                <div>Документ не найден (пустой HTML)</div>
                            )}
                        </>
                    }

                </div>
            </motion.div>
        </div>,
        modalRoot
    );
};
