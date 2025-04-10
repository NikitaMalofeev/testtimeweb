import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "app/providers/store/config/store";
import { Button, ButtonTheme } from "shared/ui/Button/Button";
import { Checkbox } from "shared/ui/Checkbox/Checkbox";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useAppDispatch } from "shared/hooks/useAppDispatch";
import {
    closeAllModals,
    closeModal,
    openModal
} from "entities/ui/Modal/slice/modalSlice";
import { ModalAnimation, ModalSize, ModalType } from "entities/ui/Modal/model/modalTypes";
import { ConfirmDocsModal } from "../ConfirmDocsModal/ConfirmDocsModal";
import styles from "./styles.module.scss";
import {
    confirmDocsRequestThunk,
    docTypeLabels,
    docTypes,
    getAllBrokersThunk,
    getUserDocumentNotSignedThunk,
    getUserDocumentsNotSignedThunk,
    getUserDocumentsStateThunk,
    setCurrentConfirmableDoc,
    setCurrentConfirmationMethod
} from "entities/Documents/slice/documentsSlice";
import DocsImage from "shared/assets/svg/docsImage.svg";
import { Icon } from "shared/ui/Icon/Icon";
import { CheckboxGroup } from "shared/ui/CheckboxGroup/CheckboxGroup";
import { DocumentPreviewModal } from "features/Documents/DocumentsPreviewModal/DocumentPreviewModal";
import { getAllUserInfoThunk } from "entities/User/slice/userSlice";
import { setStepAdditionalMenuUI } from "entities/ui/Ui/slice/uiSlice";
import { useNavigate } from "react-router-dom";
import ArrowBack from 'shared/assets/svg/ArrowBack.svg';
import { SuccessModal } from "../SuccessModal/SuccessModal";

export const ConfirmAllDocs: React.FC = () => {
    const dispatch = useAppDispatch();
    const isBottom = useSelector((state: RootState) => state.ui.isScrollToBottom);
    const navigate = useNavigate();
    const currentTypeDoc = useSelector((state: RootState) => state.documents.currentConfirmableDoc);
    const [currentTimeout, setCurrentTimeout] = useState(0);
    const modalState = useSelector((state: RootState) => state.modal.documentsPreview);
    const isPasportFilled = useSelector((state: RootState) => state.documents.filledRiskProfileChapters.is_complete_passport);
    const isRPFilled = useSelector((state: RootState) => state.documents.filledRiskProfileChapters.is_risk_profile_complete);
    const isRPFinalFilled = useSelector((state: RootState) => state.documents.filledRiskProfileChapters.is_risk_profile_complete);
    const timeoutBetweenConfirmation = useSelector((state: RootState) => state.documents.timeoutBetweenConfirmation);
    const messageTypeOptions = { SMS: "SMS", EMAIL: "Email", WHATSAPP: "Whatsapp" };

    // Состояние для хранения последнего подписанного документа (для описания в successModal)
    const [lastConfirmedDoc, setLastConfirmedDoc] = useState<string>("");

    useEffect(() => {
        dispatch(getAllBrokersThunk({ is_confirmed_type_doc_agreement_transfer_broker: true, onSuccess: () => { } }));
    }, [dispatch]);

    useEffect(() => {
        dispatch(getUserDocumentsStateThunk());
    }, [currentTypeDoc, isRPFilled, isRPFinalFilled, dispatch]);

    useEffect(() => {
        if (isPasportFilled) {
            dispatch(getUserDocumentsNotSignedThunk());
        }
    }, [isPasportFilled, dispatch]);

    useEffect(() => {
        if (isRPFinalFilled) {
            dispatch(getUserDocumentsNotSignedThunk());
        }
    }, [isRPFinalFilled, dispatch]);

    const handleMethodChange = (method: 'SMS' | 'EMAIL' | 'WHATSAPP') => {
        formik.setFieldValue("type_message", method);
        dispatch(setCurrentConfirmationMethod(method));
    };

    const currentIndex = docTypes.findIndex((d) => d === currentTypeDoc);
    const totalDocs = docTypes.length;

    const handleOpenPreview = () => {
        // dispatch(getUserDocumentNotSignedThunk())
        dispatch(
            openModal({
                type: ModalType.DOCUMENTS_PREVIEW,
                size: ModalSize.FULL,
                animation: ModalAnimation.LEFT,
            })
        );
    };

    // useEffect(() => {
    //     dispatch(getUserDocumentsNotSignedThunk())
    // }, [currentTypeDoc])

    // useEffect(() => {
    //     dispatch(getUserDocumentsNotSignedThunk())
    // }, [])

    const formik = useFormik({
        initialValues: {
            type_message: "EMAIL",
            type_document: currentTypeDoc,
            is_agree: false,
        },
        validationSchema: Yup.object({
            is_agree: Yup.boolean().oneOf([true], "внимание"),
        }),
        onSubmit: () => {
            if (currentTypeDoc === "type_doc_passport" && !isPasportFilled) {
                dispatch(setStepAdditionalMenuUI(0));
            } else if (currentTypeDoc === "type_doc_RP_questionary") {
                if (isRPFilled) {
                    dispatch(setStepAdditionalMenuUI(2));
                } else if (isRPFinalFilled) {
                    dispatch(setStepAdditionalMenuUI(3));
                } else {
                    dispatch(setStepAdditionalMenuUI(4));
                }
            } else {
                // При успешном запросе открываем ConfirmDocsModal
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
            }
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
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [currentTimeout]);

    useEffect(() => {
        if (currentTypeDoc) {
            formik.resetForm({
                values: {
                    type_message: "EMAIL",
                    type_document: currentTypeDoc,
                    is_agree: false,
                },
            });
            window.scrollTo({ top: 0, behavior: "smooth" });
        }

    }, [currentTypeDoc]);

    const renderDocLabel = () => {
        switch (currentTypeDoc) {
            case "type_doc_RP_questionnairy":
            case "type_doc_passport":
            case "type_doc_EDS_agreement":
            case "type_doc_agreement_investment_advisor":
            case "type_doc_risk_declarations":
            case "type_doc_agreement_personal_data_policy":
            case "type_doc_investment_profile_certificate":
            case "type_doc_agreement_account_maintenance":
            case "type_doc_broker_api_token":
                return docTypeLabels[currentTypeDoc];
            default:
                navigate("/documents");
                dispatch(closeAllModals());
                return "";
        }
    };

    useEffect(() => {
        dispatch(getAllUserInfoThunk());
    }, [dispatch]);

    useEffect(() => {
        formik.setFieldValue("is_agree", false);
    }, [currentTypeDoc]);

    useEffect(() => {
        if (currentTypeDoc === 'type_doc_passport') {
            dispatch(setCurrentConfirmableDoc('type_doc_EDS_agreement'));
        }
    }, []);

    // Функция для открытия SuccessModal после успешного действия в ConfirmDocsModal
    const openSuccessModal = (docType?: string) => {
        const confirmedDoc = docType || currentTypeDoc;
        setLastConfirmedDoc(confirmedDoc);
        dispatch(
            openModal({
                type: ModalType.SUCCESS,
                size: ModalSize.MC,
                animation: ModalAnimation.BOTTOM,
            })
        );
    };



    return (
        <>
            <div className={styles.page}>
                <div className={styles.header}>
                    <div className={styles.back} onClick={() => dispatch(closeModal(ModalType.IDENTIFICATION))}>
                        <Icon Svg={ArrowBack} width={24} height={24} /> Назад
                    </div>
                    <div className={styles.page__counter}>
                        Документ {currentIndex + 1} из {totalDocs}
                    </div>
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
                        <Button onClick={handleOpenPreview} theme={ButtonTheme.UNDERLINE} className={styles.button_preview}>
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
                            label={<span className={styles.checkbox__text}>Я ознакомился с вышеизложенным документом и его содержанием</span>}
                            error={formik.touched.is_agree && formik.errors.is_agree ? formik.errors.is_agree : ""}
                        />
                    </div>
                </div>
                <span className={styles.method__title}>Куда отправить код</span>
                <div className={styles.method}>
                    <CheckboxGroup
                        name="type_message"
                        label=""
                        direction="row"
                        options={Object.entries(messageTypeOptions).map(([value, label]) => ({ label, value }))}
                        value={formik.values.type_message}
                        onChange={(name, selectedValue) => {
                            handleMethodChange(selectedValue as keyof typeof messageTypeOptions);
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
                        {!currentTimeout ? "Подтвердить" : `(${currentTimeout})`}
                    </Button>
                </div>
            </div>
            <DocumentPreviewModal
                isOpen={modalState.isOpen}
                onClose={() => {
                    dispatch(closeModal(ModalType.DOCUMENTS_PREVIEW));
                    dispatch(closeModal(ModalType.DOCUMENTS_PREVIEW_SIGNED));
                }}
                title={renderDocLabel()}
                docId={currentTypeDoc}
            />
            <ConfirmDocsModal
                isOpen={useSelector((state: RootState) => state.modal.confirmDocsModal.isOpen)}
                onClose={() => {
                    dispatch(closeModal(ModalType.CONFIRM_DOCS));
                }}
                docsType={currentTypeDoc}
                lastData={formik.values}
                openSuccessModal={openSuccessModal}
            />
            <SuccessModal
                isOpen={useSelector((state: RootState) => state.modal.success.isOpen)}
                onClose={() => {
                    dispatch(closeModal(ModalType.SUCCESS));
                }}
                title="Документ подписан"
                description={
                    <div style={{ textAlign: "center" }}>
                        Документ “<strong>{lastConfirmedDoc ? docTypeLabels[lastConfirmedDoc] : ""}</strong>” успешно подписан. Можете перейти к подписанию следующего документа
                    </div>
                }
                action={() => {
                    dispatch(closeModal(ModalType.SUCCESS));
                    dispatch(closeModal(ModalType.CONFIRM_DOCS));
                }}
            />
        </>
    );
};
