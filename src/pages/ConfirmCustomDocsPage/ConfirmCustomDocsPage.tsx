import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { RootState } from "app/providers/store/config/store";
import { Button, ButtonTheme } from "shared/ui/Button/Button";
import { Checkbox } from "shared/ui/Checkbox/Checkbox";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useAppDispatch } from "shared/hooks/useAppDispatch";
import {
    closeModal,
    openModal
} from "entities/ui/Modal/slice/modalSlice";
import { ModalAnimation, ModalSize, ModalType } from "entities/ui/Modal/model/modalTypes";
import {
    confirmDocsRequestThunk,
    docTypeLabels,
    getAllBrokersThunk,
    setCurrentConfirmableDoc,
    getUserDocumentsStateThunk,
    getUserDocumentNotSignedThunk,
    confirmCustomDocsRequestThunk
} from "entities/Documents/slice/documentsSlice";
import DocsImage from "shared/assets/svg/docsImage.svg";
import { Icon } from "shared/ui/Icon/Icon";
import { CheckboxGroup } from "shared/ui/CheckboxGroup/CheckboxGroup";
import styles from "./styles.module.scss";
import ArrowBack from 'shared/assets/svg/ArrowBack.svg';
import { ConfirmCustomDocsModal } from "features/RiskProfile/ConfirmCustomDocModal/ConfirmCustomDocModal";
import { SuccessModal } from "features/RiskProfile/SuccessModal/SuccessModal";
import { DocumentPreviewModal } from "features/Documents/DocumentsPreviewModal/DocumentPreviewModal";

export const ConfirmCustomDocsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const currentDocType = id || "";
    const isBottom = useSelector((state: RootState) => state.ui.isScrollToBottom);
    const successModalOpen = useSelector((state: RootState) => state.modal.success.isOpen);
    const confirmCustomDocModalOpen = useSelector((state: RootState) => state.modal.confirmCustomDocsModal.isOpen)

    const [lastConfirmedDoc, setLastConfirmedDoc] = useState<string>("");
    const { documentsPreview, documentsPreviewSigned } = useSelector((state: RootState) => state.modal);

    // Fetch brokers and document state
    useEffect(() => {
        dispatch(getAllBrokersThunk({ is_confirmed_type_doc_agreement_transfer_broker: true, onSuccess: () => { } }));
        dispatch(setCurrentConfirmableDoc(currentDocType));
        dispatch(getUserDocumentsStateThunk());
    }, [dispatch, currentDocType]);

    const handleClosePreview = () => {
        setTimeout(() => {
            dispatch(closeModal(ModalType.DOCUMENTS_PREVIEW_SIGNED));
        }, 0); // Убедимся, что стейт обновился перед Redux-диспатчем
    };

    useEffect(() => {
        dispatch(getUserDocumentNotSignedThunk({ custom: true, customId: id }))
        console.log('id')
    }, [id])

    const formik = useFormik({
        initialValues: {
            type_message: "EMAIL",
            type_document: 'type_doc_custom',
            is_agree: false,
            id_sign: id
        },
        validationSchema: Yup.object({
            is_agree: Yup.boolean().oneOf([true], "Необходимо согласиться с документом")
        }),
        onSubmit: () => {
            dispatch(confirmCustomDocsRequestThunk({
                data: formik.values,
                onSuccess: () => {
                    dispatch(openModal({ type: ModalType.CONFIRM_CUSTOM_DOCS, size: ModalSize.MIDDLE, animation: ModalAnimation.LEFT }));
                }
            }));
        }
    });

    useEffect(() => {
        formik.resetForm({
            values: { type_message: "EMAIL", type_document: 'type_doc_custom', is_agree: false, id_sign: id }
        });
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, [currentDocType]);

    const handleMethodChange = (method: string) => {
        formik.setFieldValue("type_message", method);
    };

    const handleOpenPreview = () => {
        dispatch(openModal({ type: ModalType.DOCUMENTS_PREVIEW, size: ModalSize.FULL, animation: ModalAnimation.LEFT, docId: id }));
    };

    const openSuccessModal = () => {
        id && setLastConfirmedDoc(id);
        dispatch(openModal({ type: ModalType.SUCCESS, size: ModalSize.MC, animation: ModalAnimation.BOTTOM }));
    };

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div className={styles.page__counter}>Документ {id}</div>
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
                    <span className={styles.page__doctype}>{docTypeLabels[currentDocType] || "Документ"}</span>
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
                        label={<span className={styles.checkbox__text}>Я ознакомился с содержанием документа</span>}
                        error={formik.touched.is_agree && formik.errors.is_agree ? formik.errors.is_agree : ""}
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
                        { value: "WHATSAPP", label: "Whatsapp" }
                    ]}
                    value={formik.values.type_message}
                    onChange={(_, v) => handleMethodChange(v)}
                />
            </div>

            <div className={`${styles.buttons} ${!isBottom ? styles.shadow : ""}`}>
                <Button
                    onClick={() => formik.handleSubmit()}
                    theme={ButtonTheme.BLUE}
                    className={styles.button}
                    disabled={!formik.values.is_agree}
                >
                    Подтвердить
                </Button>
            </div>

            <ConfirmCustomDocsModal
                isOpen={confirmCustomDocModalOpen}
                onClose={() => dispatch(closeModal(ModalType.CONFIRM_CUSTOM_DOCS))}
                docsType={id}
                openSuccessModal={openSuccessModal}
            />

            <SuccessModal
                isOpen={successModalOpen}
                onClose={() => dispatch(closeModal(ModalType.SUCCESS))}
                title="Документ подписан"
                description={
                    <div style={{ textAlign: "center" }}>
                        Документ “<strong>{docTypeLabels[lastConfirmedDoc]}</strong>” успешно подписан.
                    </div>
                }
                action={() => {
                    dispatch(closeModal(ModalType.SUCCESS));
                    dispatch(closeModal(ModalType.CONFIRM_DOCS));
                }}
            />

            <DocumentPreviewModal
                isOpen={documentsPreview.isOpen}
                onClose={handleClosePreview}
                docId={documentsPreview.docId}
                title={'Документ'}
            />
        </div>
    );
};
