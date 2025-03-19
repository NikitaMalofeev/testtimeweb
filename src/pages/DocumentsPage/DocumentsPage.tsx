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
    getUserDocumentsStateThunk,
    getUserDocumentsNotSignedThunk,
    getUserDocumentsSignedThunk,
    // Удалён старый setNotConfirmedDocuments
} from "entities/Documents/slice/documentsSlice";

import { closeModal, openModal } from "entities/ui/Modal/slice/modalSlice";
import { ModalAnimation, ModalSize, ModalType } from "entities/ui/Modal/model/modalTypes";

import { Icon } from "shared/ui/Icon/Icon";
import { Button, ButtonTheme } from "shared/ui/Button/Button";
import { Loader } from "shared/ui/Loader/Loader";
import { useAppDispatch } from "shared/hooks/useAppDispatch";


import BackIcon from "shared/assets/svg/ArrowBack.svg";
import SuccessBlueIcon from "shared/assets/svg/SuccessBlueIcon.svg";
import DownloadIcon from "shared/assets/svg/DownloadDocument.svg";

import { setStepAdditionalMenuUI } from "entities/ui/Ui/slice/uiSlice";

import { useNavigate } from "react-router-dom";
import mockpdf from 'shared/ui/PDFViewer/mockpdf.txt?raw'
import styles from "./styles.module.scss";
import { DocumentPreviewModal } from "features/Documents/DocumentsPreviewModal/DocumentPreviewModal";
import { selectIsAnyModalOpen } from "entities/ui/Modal/selectors/selectorsModals";
import { getAllUserInfoThunk } from "entities/User/slice/userSlice";
import { getDocumentsSigned } from "entities/Documents/api/documentsApi";
import { setCurrentConfirmingDoc } from "entities/RiskProfile/slice/riskProfileSlice";
import { RiskProfileModal } from "features/RiskProfile/RiskProfileModal/RiskProfileModal";

const DocumentsPage: React.FC = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const modalPreviewState = useSelector((state: RootState) => state.modal.documentsPreview)
    
    const { userDocuments, loading, filledRiskProfileChapters } = useSelector((state: RootState) => state.documents);
    const isPasportFilled = useSelector((state: RootState) => state.user.allUserDataForDocuments?.address_residential_apartment);
    const isRpFilled = useSelector((state: RootState) => state.user.allUserDataForDocuments?.invest_target);
    const currentDocument = useSelector((state: RootState) => state.documents.currentSugnedDocument.document);

    useEffect(() => {
        dispatch(getUserDocumentsStateThunk());
        dispatch(getUserDocumentsNotSignedThunk());
        dispatch(getAllUserInfoThunk());
    }, []);

    const isAnyModalOpen = useSelector(selectIsAnyModalOpen);

    useEffect(() => {
        // console.log("Modal state changed:", { modalPreviewState, isAnyModalOpen });

        if (modalPreviewState.isOpen) {
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
    }, [modalPreviewState.isOpen, isAnyModalOpen]);



    // Лейблы для отображения
    const docTypeLabels: Record<string, string> = {
        type_doc_RP_questionnairy: "1. Анкета РП",
        type_doc_passport: "2. Паспортные данные",
        type_doc_EDS_agreement: "3. Соглашение об ЭДО",
        type_doc_agreement_investment_advisor: "4. Договор ИС",
        type_doc_risk_declarations: "5. Декларация о рисках",
        type_doc_agreement_personal_data_policy: "6. Политика перс. данных",
        type_doc_investment_profile_certificate: "7. Справка ИП",
    };

    // Порядок документов
    const docOrder = [
        "type_doc_RP_questionnairy",
        "type_doc_passport",
        "type_doc_EDS_agreement",
        "type_doc_agreement_investment_advisor",
        "type_doc_risk_declarations",
        "type_doc_agreement_personal_data_policy",
        "type_doc_investment_profile_certificate",
    ];

    // Метод для подписания конкретного документа
    const handleSignDocument = (docId: string) => {
        switch (docId) {
            case "type_doc_RP_questionnairy":
                if (filledRiskProfileChapters.is_risk_profile_complete && !filledRiskProfileChapters.is_risk_profile_complete_final) {
                    dispatch(setStepAdditionalMenuUI(1));
                    dispatch(
                        openModal({
                            type: ModalType.IDENTIFICATION,
                            size: ModalSize.FULL,
                            animation: ModalAnimation.LEFT,
                        })
                    );
                } else if (filledRiskProfileChapters.is_risk_profile_complete_final) {
                    dispatch(setCurrentConfirmableDoc('type_doc_RP_questionnairy'));
                    dispatch(setStepAdditionalMenuUI(4));
                    dispatch(
                        openModal({
                            type: ModalType.IDENTIFICATION,
                            size: ModalSize.FULL,
                            animation: ModalAnimation.LEFT,
                        })
                    );
                } else {
                    dispatch(setStepAdditionalMenuUI(0));
                    dispatch(
                        openModal({
                            type: ModalType.IDENTIFICATION,
                            size: ModalSize.FULL,
                            animation: ModalAnimation.LEFT,
                        })
                    );
                }
                break;
            case "type_doc_passport":
                if (!filledRiskProfileChapters.is_complete_passport) {
                    dispatch(setCurrentConfirmableDoc('type_doc_passport'));
                    dispatch(setStepAdditionalMenuUI(2));
                    dispatch(
                        openModal({
                            type: ModalType.IDENTIFICATION,
                            size: ModalSize.FULL,
                            animation: ModalAnimation.LEFT,
                        })
                    );
                } else if (!filledRiskProfileChapters.is_exist_scan_passport) {
                    dispatch(setCurrentConfirmableDoc('type_doc_passport'));
                    dispatch(setStepAdditionalMenuUI(3));
                    dispatch(
                        openModal({
                            type: ModalType.IDENTIFICATION,
                            size: ModalSize.FULL,
                            animation: ModalAnimation.LEFT,
                        })
                    );
                } else {
                    dispatch(setCurrentConfirmableDoc('type_doc_passport'));
                    dispatch(setStepAdditionalMenuUI(4));
                    dispatch(
                        openModal({
                            type: ModalType.IDENTIFICATION,
                            size: ModalSize.FULL,
                            animation: ModalAnimation.LEFT,
                        })
                    );
                }
                break;
            case "type_doc_EDS_agreement":
            case "type_doc_agreement_investment_advisor":
            case "type_doc_risk_declarations":
            case "type_doc_agreement_personal_data_policy":
            case "type_doc_investment_profile_certificate":
                dispatch(setCurrentConfirmableDoc(docId));
                dispatch(setStepAdditionalMenuUI(4));
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


    // Генерируем список документов с учётом даты из userDocuments.
    // Если date_last_confirmed === null => "not signed" (или "signable").
    // Иначе => "signed".
    const documents = docOrder.map((type) => {
        // Ищем объект в userDocuments с key===type
        const docInfo = userDocuments.find((doc) => doc.key === type);

        const date = docInfo?.date_last_confirmed || null;
        const status = date ? "signed" : "signable"; // если нет даты => значит не подписан

        return {
            id: type,
            title: docTypeLabels[type],
            date, // date_last_confirmed или null
            status,
        };
    });

    // Ищем первый документ, у которого status === "signable" (то есть не подписан)
    const firstNotConfirmed = documents.find((doc) => doc.status === "signable")?.id;

    // Генерируем нужный цвет кнопки (или "подписано").
    // Логика:
    // - Если документ подписан => зелёная плашка "Подписано"
    // - Если не подписан, но это именно "первый" не подписанный => серый
    // - Если не подписан, но не первый => красный
    const renderedDocuments = documents.map((doc) => {
        let colorClass = styles.button__green; // по умолчанию зелёный
        if (doc.status === "signable") {
            // не подписан
            if (doc.id === firstNotConfirmed) {
                colorClass = styles.button__gray; // первый неподписанный
            } else {
                colorClass = styles.button__red; // остальные неподписанные
            }
        }
        return {
            ...doc,
            colorClass,
        };
    });

    const [selectedDocId, setSelectedDocId] = useState<string | null>(null);

    const handleOpenPreview = (docId: string) => {
        if (docId !== 'type_doc_passport') {
            dispatch(getUserDocumentsSignedThunk({ type_document: docId, purpose: 'preview', onSuccess: () => { } }))
            setSelectedDocId(docId);
            dispatch(openModal({ type: ModalType.DOCUMENTS_PREVIEW, animation: ModalAnimation.LEFT, size: ModalSize.FULL }))
        } else {
            setSelectedDocId(docId);
            dispatch(openModal({ type: ModalType.DOCUMENTS_PREVIEW, animation: ModalAnimation.LEFT, size: ModalSize.FULL }))
        }
    };

    const handleDownloadPdf = (docId: string) => {
        if (docId !== 'type_doc_passport') {
            dispatch(getUserDocumentsSignedThunk({
                type_document: docId,
                purpose: 'download',
                onSuccess: () => {
                    if (currentDocument) {
                        const blob = new Blob([currentDocument], { type: "application/pdf" }); // Создаём Blob
                        const url = window.URL.createObjectURL(blob);

                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${docId}.pdf`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);

                        window.URL.revokeObjectURL(url);
                    }
                }
            }));
        }
    };


    const handleClosePreview = () => {
        setSelectedDocId(null);
        setTimeout(() => {
            dispatch(closeModal(ModalType.DOCUMENTS_PREVIEW));
        }, 0); // Убедимся, что стейт обновился перед Redux-диспатчем
    };


    return loading ? (
        <Loader />
    ) : (
        <div className={styles.page}>

            {/* Шапка страницы */}
            <div className={styles.page__container}>
                <div className={styles.page__title}>
                    <Icon Svg={BackIcon} width={24} height={24} onClick={() => navigate("/lk")} />
                    <h2 className={styles.page__title}>Список документов</h2>
                </div>

                {/* Список документов */}
                <div className={styles.documents__list}>
                    {renderedDocuments.map((doc) => (
                        <div key={doc.id} className={styles.document__item}>
                            <div className={styles.document__info}>
                                <span className={styles.document__info__title}>{doc.title}</span>
                                <div className={styles.document__info__flex}>
                                    {/* Кнопка "Просмотр" => открывает превью */}

                                    {doc.status === "signed" ? <>
                                        <Button
                                            className={styles.document__preview}
                                            theme={ButtonTheme.UNDERLINE}
                                            onClick={() => handleOpenPreview(doc.id)}
                                        >
                                            Просмотр
                                        </Button>
                                        {doc.id !== 'type_doc_passport' && (
                                            <Icon Svg={DownloadIcon} onClick={() => handleDownloadPdf(doc.id)} width={33} height={33} />
                                        )}
                                    </> : ''}

                                </div>
                            </div>

                            <div className={styles.document__status}>
                                {/* Показываем дату, если документ подписан */}
                                <span className={styles.document__date}>
                                    {doc.date
                                        ? new Date(doc.date).toLocaleDateString()
                                        : "Дата подписания"}
                                </span>

                                {doc.status === "signed" ? (
                                    <div className={styles.document__button_success}>
                                        <Icon Svg={SuccessBlueIcon} width={24} height={24} />
                                        <span>Подписано</span>
                                    </div>
                                ) : (
                                    <Button
                                        onClick={() => handleSignDocument(doc.id)}
                                        disabled={
                                            // Можно отключать кнопку,
                                            // если это не первый неподписанный документ:
                                            doc.id !== firstNotConfirmed
                                            // false
                                        }
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

            {/* Модалка предпросмотра документа */}
            <DocumentPreviewModal
                isOpen={modalPreviewState.isOpen}
                onClose={handleClosePreview}
                title={
                    selectedDocId
                        ? docTypeLabels[selectedDocId] || "Документ"
                        : "Документ"
                }
                docId={selectedDocId}
            />

        </div>
    );
};

export default DocumentsPage;
