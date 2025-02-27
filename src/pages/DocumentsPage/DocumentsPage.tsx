// DocumentsPage.tsx

import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { motion } from "framer-motion";
import { useFormik } from "formik";
import * as Yup from "yup";

import { useDispatch, useSelector } from "react-redux";
import { RootState } from "app/providers/store/config/store";

import {
    docTypes as docTypesConfirm,
    docTypeLabels as docTypeLabelsConfirm,
    confirmDocsRequestThunk,
    setCurrentConfirmableDoc,
    getUserDocumentsStateThunk
} from "entities/Documents/slice/documentsSlice";

import { openModal, closeModal } from "entities/ui/Modal/slice/modalSlice";
import { ModalAnimation, ModalSize, ModalType } from "entities/ui/Modal/model/modalTypes";

import { Icon } from "shared/ui/Icon/Icon";
import { Button, ButtonTheme } from "shared/ui/Button/Button";
import { Checkbox } from "shared/ui/Checkbox/Checkbox";
import { CheckboxGroup } from "shared/ui/CheckboxGroup/CheckboxGroup";
import { PdfViewer } from "shared/ui/PDFViewer/PDFViewer";
import { Loader } from "shared/ui/Loader/Loader";
import { useAppDispatch } from "shared/hooks/useAppDispatch";

import DocsImage from "shared/assets/svg/docsImage.svg";
import CloseIcon from "shared/assets/svg/close.svg";
import EDSPdf from "shared/assets/documents/EDS.pdf";
import BackIcon from "shared/assets/svg/ArrowBack.svg";
import SuccessBlueIcon from "shared/assets/svg/SuccessBlueIcon.svg";
import DownloadIcon from "shared/assets/svg/DownloadDocument.svg";

import { setStepAdditionalMenuUI } from "entities/ui/Ui/slice/uiSlice";

import { useNavigate } from "react-router-dom";

import styles from "./styles.module.scss";
import { RiskProfileAllData } from "features/RiskProfile/RiskProfileAllData/RiskProfileAllData";

// -----------------------------------------------------------------------------
// Ниже - логика, которая раньше была в ConfirmAllDocs.tsx
// -----------------------------------------------------------------------------

/**
 * Это та же самая модалка превью документа, перенесённая из ConfirmAllDocs.
 * Единственное отличие: теперь для отображения контента используется
 * локальный state (selectedDocId), а не currentTypeDoc из redux.
 */
interface PreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    docId?: string | null;
}

/**
 * Модальное окно для предпросмотра документа (анимация выезда слева).
 */
const PreviewModal: React.FC<PreviewModalProps> = ({ isOpen, onClose, title, docId }) => {
    if (!isOpen) return null;

    // Создаём контейнер для модалки, если его нет
    let modalRoot = document.getElementById("modal-root");
    if (!modalRoot) {
        modalRoot = document.createElement("div");
        modalRoot.id = "modal-root";
        document.body.appendChild(modalRoot);
    }

    // // // Запрещаем прокрутку фона, пока модалка открыта
    // useEffect(() => {
    //     if (isOpen) {
    //         document.body.style.overflow = "hidden";
    //     }
    //     return () => {
    //         document.body.style.overflow = "";
    //     };
    // }, [isOpen]);

    // Закрываем по ESC
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape" && isOpen) {
                onClose();
            }
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    // Начальное и конечное положение для анимации "справа налево"
    const initialPosition = { x: "100%", y: 0 };
    const exitPosition = { x: "100%", y: 0 };

    // Функция для выбора контента превью по docId
    const renderDocPreviewContent = (docType: string | null) => {
        switch (docType) {
            case "type_doc_passport":
                return <div>Здесь превью паспорта (сканы и т.д.)</div>;

            case "type_doc_EDS_agreement":
                return <PdfViewer fileUrl={EDSPdf} />;

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

    return ReactDOM.createPortal(
        <motion.div
            className={styles.overlay}
            onClick={onClose}
        >
            <motion.div
                className={styles.modal}
                initial={initialPosition}
                animate={{ x: 0, y: 0 }}
                exit={exitPosition}
                transition={{ duration: 0.3 }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className={styles.modalHeader}>
                    <span className={styles.modalTitle}>{title}</span>
                    <Icon Svg={CloseIcon} width={20} height={20} onClick={onClose} />
                </div>
                <div className={styles.modalContainer}>
                    <div
                        className={styles.modalContent}
                        style={
                            docId === "type_doc_RP_questionnairy"
                                ? { overflowY: "auto" }
                                : {}
                        }
                    >
                        {renderDocPreviewContent(docId || null)}
                    </div>
                </div>
            </motion.div>
        </motion.div>,
        modalRoot
    );
};

const DocumentsPage: React.FC = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    useEffect(() => {
        dispatch(getUserDocumentsStateThunk({}));
    }, [dispatch]);

    const { notConfirmedDocuments, loading } = useSelector((state: RootState) => state.documents);

    // "docTypeLabels" и "docOrder" из старого DocumentsPage:
    const docTypeLabels: Record<string, string> = {
        type_doc_RP_questionnairy: "1. Анкета РП",
        type_doc_passport: "2. Паспортные данные",
        type_doc_EDS_agreement: "3. Соглашение об ЭДО",
        type_doc_agreement_investment_advisor: "4. Договор ИС",
        type_doc_risk_declarations: "5. Декларация о рисках",
        type_doc_agreement_personal_data_policy: "6. Политика перс. данных",
        type_doc_investment_profile_certificate: "7. Справка ИП",
    };

    const docOrder = [
        "type_doc_RP_questionnairy",
        "type_doc_passport",
        "type_doc_EDS_agreement",
        "type_doc_agreement_investment_advisor",
        "type_doc_risk_declarations",
        "type_doc_agreement_personal_data_policy",
        "type_doc_investment_profile_certificate",
    ];

    // Старый метод handleSignDocument:
    const handleSignDocument = (docId: string) => {
        // Оставляем логику, как была
        switch (docId) {
            case "type_doc_RP_questionnairy":
                dispatch(setStepAdditionalMenuUI(1));
                dispatch(
                    openModal({
                        type: ModalType.IDENTIFICATION,
                        size: ModalSize.FULL,
                        animation: ModalAnimation.LEFT,
                    })
                );
                break;
            case "type_doc_passport":
                dispatch(setStepAdditionalMenuUI(3));
                dispatch(
                    openModal({
                        type: ModalType.IDENTIFICATION,
                        size: ModalSize.FULL,
                        animation: ModalAnimation.LEFT,
                    })
                );
                break;
            case "type_doc_EDS_agreement":
            case "type_doc_agreement_investment_advisor":
            case "type_doc_risk_declarations":
            case "type_doc_agreement_personal_data_policy":
            case "type_doc_investment_profile_certificate":
                dispatch(setCurrentConfirmableDoc(docId));
                dispatch(setStepAdditionalMenuUI(5));
                dispatch(
                    openModal({
                        type: ModalType.IDENTIFICATION,
                        size: ModalSize.FULL,
                        animation: ModalAnimation.LEFT,
                    })
                );
                break;
            default:
                console.log("Неподдерживаемый тип документа");
        }
    };

    // Генерируем список документов со статусом.
    const documents = docOrder.map((type) => {
        return {
            id: type,
            title: docTypeLabels[type],
            date: "07.03.2025",
            status: notConfirmedDocuments.includes(type) ? "signable" : "signed",
        };
    });

    const firstNotConfirmed = docOrder.find((type) => notConfirmedDocuments.includes(type));

    // Красим кнопку в зависимости от статуса документа (старая логика).
    const renderedDocuments = documents.map((doc) => {
        let colorClass = styles.button__green;
        if (notConfirmedDocuments.includes(doc.id)) {
            colorClass = styles.button__red; // неподписан
        }
        if (doc.id === firstNotConfirmed) {
            colorClass = styles.button__gray; // первый неподписанный
        }

        return {
            ...doc,
            colorClass,
        };
    });

    const [isPreviewOpen, setPreviewOpen] = useState(false);
    const [selectedDocId, setSelectedDocId] = useState<string | null>(null);

    const handleOpenPreview = (docId: string) => {
        setSelectedDocId(docId);
        setPreviewOpen(true);
    };
    const handleClosePreview = () => {
        setSelectedDocId(null);
        setPreviewOpen(false);
    };


    return loading ? (
        <Loader />
    ) : (
        <div className={styles.page}>

            {/* --- ШАПКА ДЛЯ "СПИСКА ДОКУМЕНТОВ" (СТАРАЯ ЛОГИКА) --- */}
            <div className={styles.page__container}>
                <div className={styles.page__title}>
                    <Icon Svg={BackIcon} width={24} height={24} onClick={() => navigate("/lk")} />
                    <h2 className={styles.page__title}>Список документов</h2>
                </div>

                {/* --- СПИСОК ДОКУМЕНТОВ --- */}
                <div className={styles.documents__list}>
                    {renderedDocuments.map((doc) => (
                        <div key={doc.id} className={styles.document__item}>
                            <div className={styles.document__info}>
                                <span className={styles.document__info__title}>{doc.title}</span>
                                <div className={styles.document__info__flex}>
                                    {/* КНОПКА ПРОСМОТР: теперь открывает превью-модалку по doc.id */}
                                    <Button
                                        className={styles.document__preview}
                                        theme={ButtonTheme.UNDERLINE}
                                        onClick={() => handleOpenPreview(doc.id)}
                                    >
                                        Просмотр
                                    </Button>
                                    <Icon Svg={DownloadIcon} width={33} height={33} />
                                </div>
                            </div>

                            <div className={styles.document__status}>
                                <span className={styles.document__date}>{doc.date}</span>
                                {doc.status === "signed" ? (
                                    <div className={styles.document__button_success}>
                                        <Icon Svg={SuccessBlueIcon} width={24} height={24} />
                                        <span>Подписано</span>
                                    </div>
                                ) : (
                                    <Button
                                        onClick={() => handleSignDocument(doc.id)}
                                        disabled={doc.status === "not_signable"}
                                        className={doc.colorClass}
                                        theme={ButtonTheme.BLUE}
                                    >
                                        Подписать
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* --- МОДАЛКА ПРЕВЬЮ ДОКУМЕНТА --- */}
            <PreviewModal
                isOpen={isPreviewOpen}
                onClose={handleClosePreview}
                title={selectedDocId ? docTypeLabels[selectedDocId] || "Документ" : "Документ"}
                docId={selectedDocId}
            />

        </div>
    );
};

export default DocumentsPage;
