// ConfirmAllDocs.tsx
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "app/providers/store/config/store";
import { Button, ButtonTheme } from "shared/ui/Button/Button";
import { Checkbox } from "shared/ui/Checkbox/Checkbox";
import { useFormik } from "formik";
import { useAppDispatch } from "shared/hooks/useAppDispatch";
import { closeModal, openModal } from "entities/ui/Modal/slice/modalSlice";
import { ModalAnimation, ModalSize, ModalType } from "entities/ui/Modal/model/modalTypes";
import { ConfirmDocsModal } from "../ConfirmDocsModal/ConfirmDocsModal";
import styles from "./styles.module.scss";
import { docTypeLabels, docTypes } from "entities/Documents/slice/documentsSlice";
import DocsImage from "shared/assets/svg/docsImage.svg";
import { Icon } from "shared/ui/Icon/Icon";
import CloseIcon from "shared/assets/svg/close.svg";

// ======== Модалка для превью документа (пример с framer-motion) ========
import { motion } from "framer-motion";
import ReactDOM from "react-dom";
import { getAllUserInfoThunk } from "entities/User/slice/userSlice";
import { RiskProfileAllData } from "../RiskProfileAllData/RiskProfileAllData";

interface PreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children?: React.ReactNode;
}

/**
 * Простая модалка, которая выезжает слева без всяких дополнительных настроек.
 * Если нужно - вынесите её в отдельный файл.
 */
const PreviewModal: React.FC<PreviewModalProps> = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    // Создаём контейнер для модалки, если его нет
    let modalRoot = document.getElementById("modal-root");
    if (!modalRoot) {
        modalRoot = document.createElement("div");
        modalRoot.id = "modal-root";
        document.body.appendChild(modalRoot);
    }

    // Запрещаем прокрутку фона, пока модалка открыта
    React.useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isOpen]);

    // Закрываем по ESC
    React.useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape" && isOpen) {
                onClose();
            }
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    // Начальное и конечное положение для анимации "слева направо"
    const initialPosition = { x: "100%", y: 0 };
    const exitPosition = { x: "100%", y: 0 };

    return ReactDOM.createPortal(
        <motion.div
            className={styles.overlay} // Затемняющая подложка (можно стилизовать)
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
        >
            <motion.div
                className={styles.modal} // Основной блок модалки
                initial={initialPosition}
                animate={{ x: 0, y: 0 }}
                exit={exitPosition}
                transition={{ duration: 0.3, ease: "easeOut" }}
                onClick={(e) => e.stopPropagation()} // Чтобы клик внутри модалки не закрывал
            >
                <div className={styles.modalHeader}>
                    <span className={styles.modalTitle}>{title}</span>
                    <Icon Svg={CloseIcon} width={20} height={20} onClick={onClose} />
                </div>
                <div className={styles.modalContainer}>
                    <div className={styles.modalContent}>{children}</div>
                </div>
            </motion.div>
        </motion.div>,
        modalRoot
    );
};

export const ConfirmAllDocs: React.FC = () => {
    const dispatch = useAppDispatch();
    const isBottom = useSelector((state: RootState) => state.ui.isScrollToBottom);

    // Текущий документ, который нужно подписать
    const currentTypeDoc = useSelector(
        (state: RootState) => state.documents.currentConfirmableDoc
    );

    // Индекс и общее кол-во документов
    const currentIndex = docTypes.findIndex((d) => d === currentTypeDoc);
    const totalDocs = docTypes.length;

    // State для открытия/закрытия превью-модалки
    const [isPreviewOpen, setPreviewOpen] = useState(false);

    // Открыть/закрыть превью
    const handleOpenPreview = () => setPreviewOpen(true);
    const handleClosePreview = () => setPreviewOpen(false);

    // Formik (пример)
    const formik = useFormik({
        initialValues: {
            is_agreement: false,
        },
        onSubmit: () => {
            // ...
        },
    });

    // Простой рендер названия документа
    const renderDocLabel = () => {
        switch (currentTypeDoc) {
            case "type_doc_passport":
            case "type_doc_EDS_agreement":
            case "type_doc_RP_questionnairy":
            case "type_doc_agreement_investment_advisor":
            case "type_doc_risk_declarations":
            case "type_doc_agreement_personal_data_policy":
            case "type_doc_investment_profile_certificate":
            case "type_doc_IP":
                return docTypeLabels[currentTypeDoc];
            default:
                return "Неизвестный документ";
        }
    };

    // Контент в превью-модалке в зависимости от типа документа
    const renderDocPreviewContent = () => {
        switch (currentTypeDoc) {
            case "type_doc_passport":
                return <div>Здесь превью паспорта (сканы и т.д.)</div>;

            case "type_doc_EDS_agreement":
                return <div>Здесь превью EDS-Agreement</div>;

            case "type_doc_RP_questionnairy":
                return <RiskProfileAllData />;

            case "type_doc_agreement_investment_advisor":
                return <div>Содержимое соглашения с инвест. советником</div>;

            case "type_doc_risk_declarations":
                return <div>Содержимое декларации рисков</div>;

            case "type_doc_agreement_personal_data_policy":
                return <div>Политика в отношении персональных данных</div>;

            case "type_doc_investment_profile_certificate":
                return <div>Сертификат инвест. профиля</div>;

            case "type_doc_IP":
                return <div>Содержимое документа IP</div>;

            default:
                return <div>Неизвестный документ. Нет превью.</div>;
        }
    };

    // Не хватает 
    // Доверенное лицо 

    // Лишнее
    // практический опыт 

    // Открываем модалку "Подтвердить документ"
    const handleOpenConfirm = () => {
        dispatch(
            openModal({
                type: ModalType.CONFIRM_DOCS,
                size: ModalSize.MIDDLE,
                animation: ModalAnimation.LEFT,
            })
        );
    };

    return (
        <>
            <div className={styles.page}>
                <div className={styles.page__counter}>
                    Документ {currentIndex + 1} из {totalDocs}
                </div>

                <div className={styles.page__container}>
                    <div className={styles.page__image}>
                        <div className={styles.page__image__circle}>
                            <Icon Svg={DocsImage} width={194} height={194} />
                        </div>

                    </div>
                </div>

                <div className={styles.page__container}>
                    <div className={styles.page__preview}>
                        <span className={styles.page__doctype}>{renderDocLabel()}</span>
                        <Button
                            onClick={handleOpenPreview}
                            theme={ButtonTheme.UNDERLINE}
                            className={styles.button_preview}
                            disabled={false}
                        >
                            Просмотр
                        </Button>
                    </div>
                </div>

                <div className={styles.page__checkbox}>
                    <Checkbox
                        name="is_agreement"
                        value={formik.values.is_agreement}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        label={
                            <span className={styles.checkbox__text}>
                                Я ознакомился с вышеизложенным документом и его содержанием
                            </span>
                        }
                        error={
                            formik.touched.is_agreement && formik.errors.is_agreement
                                ? formik.errors.is_agreement
                                : ""
                        }
                    />
                </div>

                <div className={`${styles.buttons} ${!isBottom ? styles.shadow : ""}`}>
                    <Button
                        onClick={handleOpenConfirm}
                        theme={ButtonTheme.BLUE}
                        className={styles.button}
                        disabled={false}
                    >
                        Подписать
                    </Button>
                </div>
            </div>

            {/* Модалка превью документа (фреймер-мошн слева) */}
            <PreviewModal
                isOpen={isPreviewOpen}
                onClose={handleClosePreview}
                title={renderDocLabel()}
            >
                {/* Сам контент превью в зависимости от текущего типа документа */}
                {renderDocPreviewContent()}
            </PreviewModal>

            {/* Модалка подтверждения (подписания) документа */}
            <ConfirmDocsModal
                isOpen={useSelector((state: RootState) => state.modal.confirmDocsModal.isOpen)}
                onClose={() => {
                    dispatch(closeModal(ModalType.CONFIRM_DOCS));
                }}
                docsType={currentTypeDoc}
            />
        </>
    );
};
