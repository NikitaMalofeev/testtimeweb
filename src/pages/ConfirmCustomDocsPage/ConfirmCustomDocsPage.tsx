import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { RootState } from "app/providers/store/config/store";
import { Button, ButtonTheme } from "shared/ui/Button/Button";
import { Checkbox } from "shared/ui/Checkbox/Checkbox";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useAppDispatch } from "shared/hooks/useAppDispatch";
import { closeModal, openModal } from "entities/ui/Modal/slice/modalSlice";
import { ModalAnimation, ModalSize, ModalType } from "entities/ui/Modal/model/modalTypes";
import {
    confirmDocsRequestThunk,
    confirmCustomDocsRequestThunk,
    docTypeLabels,
    getAllBrokersThunk,
    getUserDocumentsStateThunk,
    getUserDocumentNotSignedThunk,
    setCurrentConfirmableDoc,
    setCurrentConfirmationMethod,
    getUserDocumentsSignedThunk,
} from "entities/Documents/slice/documentsSlice";
import DocsImage from "shared/assets/svg/docsImage.svg";
import { Icon } from "shared/ui/Icon/Icon";
import { CheckboxGroup } from "shared/ui/CheckboxGroup/CheckboxGroup";
import styles from "./styles.module.scss";
import { ConfirmCustomDocsModal } from "features/RiskProfile/ConfirmCustomDocModal/ConfirmCustomDocModal";
import { SuccessModal } from "features/RiskProfile/SuccessModal/SuccessModal";
import { DocumentPreviewModal } from "features/Documents/DocumentsPreviewModal/DocumentPreviewModal";
import SuccessBlueIcon from "shared/assets/svg/SuccessBlueIcon.svg";
import { Loader, LoaderSize, LoaderTheme } from "shared/ui/Loader/Loader";

const ConfirmCustomDocsPage: React.FC = () => {
    const { id = "" } = useParams<{ id: string }>();
    const dispatch = useAppDispatch();

    // Step: 1 — EDS agreement, 2 — custom document
    const [step, setStep] = useState<1 | 2>(1);
    const isBottom = useSelector((state: RootState) => state.ui.isScrollToBottom);
    const documentsPreviewState = useSelector((state: RootState) => state.modal.documentsPreview);
    const { loading } = useSelector((state: RootState) => state.documents);
    const customData = useSelector((state: RootState) => state.documents.customDocumentsData);
    const successModalOpen = useSelector((state: RootState) => state.modal.success.isOpen);
    const confirmCustomDocModalOpen = useSelector(
        (state: RootState) => state.modal.confirmCustomDocsModal.isOpen
    );

    const displayKey = step === 1 ? "type_doc_EDS_agreement" : id;
    const previewDocId = step === 1 ? "type_doc_EDS_agreement" : id;

    // Initial overall data fetch
    useEffect(() => {
        dispatch(getUserDocumentsStateThunk());
        dispatch(setCurrentConfirmableDoc(displayKey));
    }, [dispatch, displayKey]);

    useEffect(() => {
        if (step === 1) {
            dispatch(getUserDocumentNotSignedThunk({ custom: true, customId: id, type: 'type_doc_custom' }));
        } else {
            dispatch(getUserDocumentNotSignedThunk({ custom: true, customId: id, type: 'type_doc_custom' }));
        }
    }, [dispatch, step, id]);

    // Formik for shared fields (agreement checkbox and message method)
    const formik = useFormik({
        initialValues: { type_message: "EMAIL", is_agree: false },
        validationSchema: Yup.object({
            is_agree: Yup.boolean().oneOf([true], "Необходимо согласиться с документом"),
        }),
        onSubmit: () => { }, // handled in handleSubmit
    });

    const handleMethodChange = (method: string) => {
        formik.setFieldValue("type_message", method);
        dispatch(setCurrentConfirmationMethod(method))
    };

    const handleSubmit = () => {
        if (!formik.values.is_agree) return;
        const dataCommon = { type_message: formik.values.type_message, is_agree: true };
        if (step === 1) {
            dispatch(
                confirmCustomDocsRequestThunk({
                    data: { ...dataCommon, type_document: "type_doc_EDS_agreement", id_sign: id },
                    onSuccess: () =>
                        dispatch(
                            openModal({
                                type: ModalType.CONFIRM_CUSTOM_DOCS,
                                size: ModalSize.MIDDLE,
                                animation: ModalAnimation.LEFT,
                            })
                        ),
                })
            );
        } else {
            dispatch(
                confirmCustomDocsRequestThunk({
                    data: { ...dataCommon, type_document: "type_doc_custom", id_sign: id },
                    onSuccess: () =>
                        dispatch(
                            openModal({
                                type: ModalType.CONFIRM_CUSTOM_DOCS,
                                size: ModalSize.MIDDLE,
                                animation: ModalAnimation.LEFT,
                            })
                        ),
                })
            );
        }
    };

    const handleOpenPreview = async () => {
        if (step === 2 && customData?.is_confirmed_type_doc_custom) {
            await dispatch(
                getUserDocumentsSignedThunk({
                    type_document: 'type_doc_custom',
                    purpose: 'preview',
                    onSuccess: () => { },
                    id_sign: id,
                })
            );
        }
        dispatch(
            openModal({
                type: ModalType.DOCUMENTS_PREVIEW,
                size: ModalSize.FULL,
                animation: ModalAnimation.LEFT,
                docId: previewDocId,
            })
        );
    };

    const handleSuccessEffect = () => {
        if (step === 1) {
            dispatch(
                openModal({
                    type: ModalType.SUCCESS,
                    size: ModalSize.MC,
                    animation: ModalAnimation.BOTTOM,
                })
            );
            dispatch(closeModal(ModalType.CONFIRM_CUSTOM_DOCS));
            setStep(2);
            formik.resetForm({ values: { type_message: "EMAIL", is_agree: false } });
        } else {
            dispatch(
                openModal({
                    type: ModalType.SUCCESS,
                    size: ModalSize.MC,
                    animation: ModalAnimation.BOTTOM,
                })
            );
            dispatch(closeModal(ModalType.CONFIRM_CUSTOM_DOCS));
            // final step; optionally navigate away
        }
    };

    const handleSuccessAction = () => {
        if (step === 1) {
            dispatch(closeModal(ModalType.CONFIRM_CUSTOM_DOCS));
            dispatch(closeModal(ModalType.SUCCESS));
            setStep(2);
            formik.resetForm({ values: { type_message: "EMAIL", is_agree: false } });
        } else {
            dispatch(closeModal(ModalType.SUCCESS));
            // final step; optionally navigate away
        }
    };

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                {/* <div className={styles.page__counter}>{displayLabel}</div> */}
                <div className={styles.page__counter}>документ {step} из 2</div>
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
                    <span className={styles.page__doctype}>{step === 1 ? 'Соглашение об ЭДО' : `${customData?.title}`}</span>
                    <Button
                        onClick={handleOpenPreview}
                        theme={ButtonTheme.UNDERLINE}
                        className={styles.button_preview}
                    >
                        {loading ? <Loader size={LoaderSize.SMALL} theme={LoaderTheme.BLUE} /> : 'Просмотр'}

                    </Button>
                </div>
            </div>
            {customData?.is_confirmed_type_doc_custom ? (
                <div className={styles.end}>
                    <Icon Svg={SuccessBlueIcon} width={24} height={24} />
                    Подписано
                </div>
            ) : (
                <>
                    <div className={styles.page__container}>
                        <div className={styles.page__checkbox}>
                            <Checkbox
                                name="is_agree"
                                value={formik.values.is_agree}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                label={<span className={styles.checkbox__text}>Я ознакомился с содержанием документа</span>}
                                error={formik.touched.is_agree && formik.errors.is_agree ? formik.errors.is_agree : undefined}
                            />
                        </div>
                    </div>
                    <span className={styles.method__title}>Куда отправить код</span>
                    <div className={styles.method}>
                        <CheckboxGroup
                            name="type_message"
                            direction="row"
                            options={[
                                { value: "SMS", label: "SMS" },
                                { value: "EMAIL", label: "Email" },
                                { value: "WHATSAPP", label: "Whatsapp" },
                            ]}
                            value={formik.values.type_message}
                            onChange={(_, v) => handleMethodChange(v)}
                        />
                    </div>
                    <div className={`${styles.buttons} ${!isBottom ? styles.shadow : ""}`}>
                        <Button
                            onClick={handleSubmit}
                            theme={ButtonTheme.BLUE}
                            className={styles.button}
                            disabled={!formik.values.is_agree}
                        >
                            Подтвердить
                        </Button>
                    </div>
                </>
            )}

            {/* Confirmation modals */}
            <ConfirmCustomDocsModal
                isOpen={confirmCustomDocModalOpen}
                onClose={() => dispatch(closeModal(ModalType.CONFIRM_CUSTOM_DOCS))}
                docsType={step === 1 ? 'type_doc_EDS_agreement' : "type_doc_custom"}
                openSuccessModal={handleSuccessEffect}
                custimId={id}
                phone={customData?.phone || ''}
                email={customData?.email || ''}
            />
            <SuccessModal
                isOpen={successModalOpen}
                onClose={() => dispatch(closeModal(ModalType.SUCCESS))}
                title="Документ подписан"
                description={
                    <div style={{ textAlign: "center" }}>
                        Документ “<strong>{step === 1 ? 'Соглашение об ЭДО' : `${customData?.title}`}</strong>” успешно подписан.
                    </div>
                }
                customSuccessModal
                action={handleSuccessAction}
            />
            {!customData?.is_confirmed_type_doc_custom ? (
                <DocumentPreviewModal
                    isOpen={documentsPreviewState.isOpen}
                    onClose={() => dispatch(closeModal(ModalType.DOCUMENTS_PREVIEW_SIGNED))}
                    docId={step === 1 ? 'type_doc_EDS_agreement' : id}
                    title="Документ"
                />
            ) : (
                <DocumentPreviewModal
                    isOpen={documentsPreviewState.isOpen}
                    onClose={() => dispatch(closeModal(ModalType.DOCUMENTS_PREVIEW))}
                    isSignedDoc={true}
                    docId={id}
                    title={
                        customData.title
                    }
                />
            )}
        </div>
    );
};

export default ConfirmCustomDocsPage