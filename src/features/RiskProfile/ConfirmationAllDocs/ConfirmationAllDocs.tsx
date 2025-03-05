// ConfirmAllDocs.tsx
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "app/providers/store/config/store";
import { Button, ButtonTheme } from "shared/ui/Button/Button";
import { Checkbox } from "shared/ui/Checkbox/Checkbox";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useAppDispatch } from "shared/hooks/useAppDispatch";
import { closeModal, openModal } from "entities/ui/Modal/slice/modalSlice";
import { ModalAnimation, ModalSize, ModalType } from "entities/ui/Modal/model/modalTypes";
import { ConfirmDocsModal } from "../ConfirmDocsModal/ConfirmDocsModal";
import styles from "./styles.module.scss";
import { confirmDocsRequestThunk, docTypeLabels, docTypes, setCurrentConfirmationMethod } from "entities/Documents/slice/documentsSlice";
import DocsImage from "shared/assets/svg/docsImage.svg";
import { Icon } from "shared/ui/Icon/Icon";
import { RiskProfileAllData } from "../RiskProfileAllData/RiskProfileAllData";
import { CheckboxGroup } from "shared/ui/CheckboxGroup/CheckboxGroup";
import { PdfViewer } from "shared/ui/PDFViewer/PDFViewer";
import { PreviewModal } from "../PreviewModal/PreviewModal";
import EDSPdf from "shared/assets/documents/EDS.pdf?url";
import Broker from "shared/assets/documents/Broker.pdf?url";
import IS from "shared/assets/documents/IS.pdf?url";
import PersonalPolicy from "shared/assets/documents/PersonalPolicy.pdf?url";
import RiskDeclaration from "shared/assets/documents/RiskDeclaration.pdf?url";
import RiskProfile from "shared/assets/documents/RiskProfile.pdf?url";
import Profile from "shared/assets/documents/Profile.pdf?url";
import { DocumentPreviewModal } from "features/Documents/DocumentsPreviewModal/DocumentPreviewModal";

export const ConfirmAllDocs: React.FC = () => {
    const dispatch = useAppDispatch();
    const isBottom = useSelector((state: RootState) => state.ui.isScrollToBottom);

    // Текущий документ, который нужно подписать
    const currentTypeDoc = useSelector(
        (state: RootState) => state.documents.currentConfirmableDoc
    );
    const [currentTimeout, setCurrentTimeout] = useState(0)
    const modalState = useSelector((state: RootState) => state.modal.documentsPreview)


    const timeoutBetweenConfirmation = useSelector(
        (state: RootState) => state.documents.timeoutBetweenConfirmation
    );
    const messageTypeOptions = {
        "SMS": 'SMS',
        "EMAIL": 'Email',
        "WHATSAPP": 'Whatsapp'
    }

    // Индекс и общее кол-во документов
    const currentIndex = docTypes.findIndex((d) => d === currentTypeDoc);
    const totalDocs = docTypes.length;

    const handleOpenPreview = () => {
        dispatch(openModal({ type: ModalType.DOCUMENTS_PREVIEW, size: ModalSize.FULL, animation: ModalAnimation.LEFT }));
    };

    // Formik (пример)
    const formik = useFormik({
        initialValues: {
            type_message: 'EMAIL',
            type_document: currentTypeDoc,
            is_agree: false,
        },
        validationSchema: Yup.object({
            is_agree: Yup.boolean().oneOf([true], 'внимание'),
        }),
        onSubmit: () => {
            console.log(formik.values)
            dispatch(
                confirmDocsRequestThunk({
                    data: formik.values,
                    onSuccess: () => {
                        dispatch(
                            openModal({
                                type: ModalType.CONFIRM_DOCS,
                                size: ModalSize.MIDDLE,
                                animation: ModalAnimation.LEFT,
                            })
                        );
                    },
                })
            );
        },
    });

    useEffect(() => {
        setCurrentTimeout(timeoutBetweenConfirmation);
    }, [timeoutBetweenConfirmation]);

    useEffect(() => {
        if (currentTimeout > 0) {
            const interval = setInterval(() => {
                setCurrentTimeout((prev) => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        return 0
                    }
                    return prev - 1
                });
            }, 1000);

            return () => clearInterval(interval);
        }
    }, [currentTimeout]);

    useEffect(() => {
        if (currentTypeDoc) {
            formik.setFieldValue("type_document", currentTypeDoc)
        }
    }, [currentTypeDoc])

    // Простой рендер названия документа
    const renderDocLabel = () => {
        switch (currentTypeDoc) {
            case "type_doc_RP_questionnairy":
            case "type_doc_passport":
            case "type_doc_EDS_agreement":
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

    useEffect


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

                <div className={styles.page__container}>
                    <div className={styles.page__checkbox}>
                        <Checkbox
                            name="is_agree"
                            value={formik.values.is_agree}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            label={
                                <span className={styles.checkbox__text}>
                                    Я ознакомился с вышеизложенным документом и его содержанием
                                </span>
                            }
                            error={
                                formik.touched.is_agree && formik.errors.is_agree
                                    ? formik.errors.is_agree
                                    : ""
                            }
                        />
                    </div>
                </div>
                <span className={styles.method__title}>Куда отправить код</span>
                <div className={styles.method}>
                    <CheckboxGroup
                        name='type_message'
                        label=""
                        direction="row"
                        options={Object.entries(messageTypeOptions).map(([value, label]) => ({
                            label,
                            value,
                        }))}
                        value={formik.values.type_message}
                        onChange={(name, selectedValue) => {
                            formik.setFieldValue(name, selectedValue);

                        }}
                    />
                </div>


                <div className={`${styles.buttons} ${!isBottom ? styles.shadow : ""}`}>
                    <Button
                        onClick={() => formik.handleSubmit()}
                        theme={ButtonTheme.BLUE}
                        className={styles.button}
                        disabled={!formik.values.is_agree || currentTimeout > 0}
                    >
                        {!currentTimeout ? 'Подписать' : `(${currentTimeout})`}
                    </Button>

                </div>
            </div>

            <DocumentPreviewModal isOpen={modalState.isOpen} onClose={() => {
                dispatch(closeModal(ModalType.DOCUMENTS_PREVIEW))
            }} title={renderDocLabel()} docId={currentTypeDoc} />

            {/* Модалка подтверждения (подписания) документа */}
            <ConfirmDocsModal
                isOpen={useSelector((state: RootState) => state.modal.confirmDocsModal.isOpen)}
                onClose={() => {
                    dispatch(closeModal(ModalType.CONFIRM_DOCS));
                }}
                docsType={currentTypeDoc}
                lastData={formik.values}
            />
        </>
    );
};
