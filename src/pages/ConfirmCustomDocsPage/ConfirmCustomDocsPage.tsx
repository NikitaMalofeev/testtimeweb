import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { RootState } from "app/providers/store/config/store";
import { Button, ButtonTheme } from "shared/ui/Button/Button";
import { Checkbox } from "shared/ui/Checkbox/Checkbox";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useAppDispatch } from "shared/hooks/useAppDispatch";
import { closeModal, openModal } from "entities/ui/Modal/slice/modalSlice";
import { ModalAnimation, ModalSize, ModalType } from "entities/ui/Modal/model/modalTypes";
import { setError } from "entities/Error/slice/errorSlice";
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
    getAllCustomDocumentUserThunk,
    confirmCustomDocumentUserThunk,
    getUserNotSignedDocumentHtmlThunk,
    getSignedCustomDocumentUserThunk,
    setCurrentCustomDocUser,
} from "entities/Documents/slice/documentsSlice";
import DocsImage from "shared/assets/svg/docsImage.svg";
import { Icon } from "shared/ui/Icon/Icon";
import { CheckboxGroup } from "shared/ui/CheckboxGroup/CheckboxGroup";
import styles from "./styles.module.scss";
import { ConfirmCustomDocsModal } from "features/RiskProfile/ConfirmCustomDocModal/ConfirmCustomDocModal";
import { ConfirmCustomDocUserModal } from "features/RiskProfile/ConfirmCustomDocUserModal/ConfirmCustomDocUserModal";
import { SuccessModal } from "features/RiskProfile/SuccessModal/SuccessModal";
import { SuccessCustomModal } from "features/RiskProfile/SuccessCustomModal/SuccessCustomModal";
import { DocumentPreviewModal } from "features/Documents/DocumentsPreviewModal/DocumentPreviewModal";
import SuccessBlueIcon from "shared/assets/svg/SuccessBlueIcon.svg";
import { Loader, LoaderSize, LoaderTheme } from "shared/ui/Loader/Loader";

const ConfirmCustomDocsPage: React.FC = () => {
    const { id = "" } = useParams<{ id: string }>();
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    // Проверяем, авторизован ли пользователь
    const userToken = useSelector((state: RootState) => state.user.token);
    const userInfo = useSelector((state: RootState) => state.user.userPersonalAccountInfo);
    const isUserAuthorized = Boolean(userToken);

    // Step: 1 — EDS agreement, 2 — custom document
    const [step, setStep] = useState<1 | 2>(1);
    const isBottom = useSelector((state: RootState) => state.ui.isScrollToBottom);
    const documentsPreviewState = useSelector((state: RootState) => state.modal.documentsPreview);
    const { loading } = useSelector((state: RootState) => state.documents);
    const customData = useSelector((state: RootState) => state.documents.customDocumentsData);
    const customDocumentsUser = useSelector((state: RootState) => state.documents.customDocumentsUser);
    const currentCustomDocUser = useSelector((state: RootState) => state.documents.currentCustomDocUser);
    const userDocuments = useSelector((state: RootState) => state.documents.userDocuments);
    const successModalOpen = useSelector((state: RootState) => state.modal.success.isOpen);
    const confirmCustomDocModalOpen = useSelector(
        (state: RootState) => state.modal.confirmCustomDocsModal.isOpen
    );

    // Проверяем, подписан ли ЭДО документ для авторизованных пользователей
    const edsDocument = isUserAuthorized ?
        userDocuments.find(doc => doc.key === 'type_doc_EDS_agreement')
        : null;

    const isEdsDocumentSigned = isUserAuthorized ?
        (edsDocument && edsDocument.date_last_confirmed !== null)
        : true; // для неавторизованных пользователей используем старую логику

    // Нужно ли показывать ЭДО документ первым для авторизованных пользователей
    const shouldShowEdsFirst = isUserAuthorized && !isEdsDocumentSigned;


    const displayKey = step === 1 ? "type_doc_EDS_agreement" : id;
    const previewDocId = step === 1 ? "type_doc_EDS_agreement" : id;



    // Отдельный useEffect для установки текущего документа когда список загрузился
    useEffect(() => {
        if (isUserAuthorized && customDocumentsUser.length > 0) {
            if (id) {
                const currentDoc = customDocumentsUser.find(doc => doc.id.toString() === id);
                if (currentDoc) {
                    dispatch(setCurrentCustomDocUser(currentDoc));
                }
            }
        }
    }, [dispatch, isUserAuthorized, id, customDocumentsUser]);

    useEffect(() => {
        if (isUserAuthorized) {
            dispatch(getAllCustomDocumentUserThunk());
            dispatch(getUserDocumentsStateThunk()); // Загружаем 
            // Для авторизованных пользователей загружаем только кастомный документ
            if (id) {
                dispatch(getUserNotSignedDocumentHtmlThunk({
                    data: { id: id }
                }));
            }
        } else {
            // Для неавторизованных пользователей

            dispatch(setCurrentConfirmableDoc(displayKey));
            // console.log('useEffectINAUTH')
            // console.log(step)
            // console.log(isUserAuthorized)
            // Для неавторизованных пользователей используем кастомный API
            if (step === 1) {
                // ЭДО для неавторизованных через кастомный API
                // console.log('Dispatching EDS document with id:', id);
                dispatch(
                    getUserDocumentNotSignedThunk({
                        custom: true,
                        customId: id,
                        type: 'type_doc_EDS_agreement',
                    })
                );
            } else {
                // Кастомный документ по id - используем старый API для неавторизованных
                // console.log('Dispatching custom document with id:', id);
                dispatch(
                    getUserDocumentNotSignedThunk({
                        custom: true,
                        customId: id,
                        type: 'type_doc_custom',
                    })
                );
            }
        }
    }, [id, isUserAuthorized]);


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

    const handleNavigateToDocuments = () => {
        navigate('/documents');
    };

    const handleSubmit = () => {
        if (!formik.values.is_agree) return;

        if (isUserAuthorized) {
            // Для авторизованных пользователей
            if (id && !isEdsDocumentSigned) {
                // Для авторизованных пользователей без подписанного ЭДО - показываем ошибку
                const errorMessage = "Сначала нужно подписать Соглашение об ЭДО перед этим документом";
                dispatch(setError(errorMessage));
                return;
            } else if (id) {
                // Подписываем кастомный документ (используем новый API)
                dispatch(confirmCustomDocumentUserThunk({
                    data: { id: id, is_agree: true },
                    onSuccess: () => {
                        dispatch(
                            openModal({
                                type: ModalType.CONFIRM_CUSTOM_DOCS,
                                size: ModalSize.MIDDLE,
                                animation: ModalAnimation.LEFT,
                            })
                        );
                    }
                }));
            }
        } else {
            // Для неавторизованных пользователей (старая логика)
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
        }
    };

    const handleOpenPreview = async () => {
        if (isUserAuthorized) {
            // Для авторизованных пользователей
            if (id && currentCustomDocUser?.is_confirmed) {
                await dispatch(getSignedCustomDocumentUserThunk({
                    data: { id: id },
                    onSuccess: () => { },
                }));
            }
        } else {
            // Для неавторизованных пользователей
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
        }

        dispatch(
            openModal({
                type: ModalType.DOCUMENTS_PREVIEW,
                size: ModalSize.FULL,
                animation: ModalAnimation.LEFT,
                docId: isUserAuthorized ? `custom_doc_user_${id}` : previewDocId,
            })
        );
    };

    const handleSuccessEffect = () => {
        dispatch(
            openModal({
                type: ModalType.SUCCESS,
                size: ModalSize.MC,
                animation: ModalAnimation.BOTTOM,
            })
        );
        dispatch(closeModal(ModalType.CONFIRM_CUSTOM_DOCS));

        if (isUserAuthorized) {
            // Для авторизованных пользователей просто обновляем список
            dispatch(getAllCustomDocumentUserThunk());
        } else {
            // Для неавторизованных пользователей сохраняем старую логику
            if (step === 1) {
                setStep(2);
                formik.resetForm({ values: { type_message: "EMAIL", is_agree: false } });
            }
        }
    };

    const handleSuccessAction = () => {
        dispatch(closeModal(ModalType.SUCCESS));

        if (!isUserAuthorized) {
            // Для неавторизованных пользователей сохраняем старую логику
            if (step === 1) {
                dispatch(closeModal(ModalType.CONFIRM_CUSTOM_DOCS));
                setStep(2);
                formik.resetForm({ values: { type_message: "EMAIL", is_agree: false } });
            }
        }
    };

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                {/* <div className={styles.page__counter}>{displayLabel}</div> */}
                <div className={styles.page__counter}>
                    {isUserAuthorized
                        ? (currentCustomDocUser?.title || 'Кастомный документ')
                        : `документ ${step} из 2`
                    }
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
                    <span className={styles.page__doctype}>
                        {isUserAuthorized
                            ? (currentCustomDocUser?.title || 'Кастомный документ')
                            : (step === 1 ? 'Соглашение об ЭЦП' : `${customData?.title}`)
                        }
                    </span>
                    <Button
                        onClick={handleOpenPreview}
                        theme={ButtonTheme.UNDERLINE}
                        className={styles.button_preview}
                    >
                        {loading ? <Loader size={LoaderSize.SMALL} theme={LoaderTheme.BLUE} /> : 'Просмотр'}
                    </Button>
                </div>
            </div>
            {(isUserAuthorized
                ? currentCustomDocUser?.is_confirmed
                : customData?.is_confirmed_type_doc_custom
            ) ? (
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
                    {!isUserAuthorized && (
                        <>
                            <span className={styles.method__title}>Куда отправить код</span>
                            <div className={styles.method}>
                                <CheckboxGroup
                                    name="type_message"
                                    greedOrFlex="flex"
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
                        </>
                    )}
                    <div className={`${styles.buttons} ${!isBottom ? styles.shadow : ""}`}>
                        {isUserAuthorized && !isEdsDocumentSigned ? (
                            <Button
                                onClick={handleNavigateToDocuments}
                                theme={ButtonTheme.BLUE}
                                className={styles.button}
                                disabled={!formik.values.is_agree}
                            >
                                Перейти к документам
                            </Button>
                        ) : (
                            <Button
                                onClick={handleSubmit}
                                theme={ButtonTheme.BLUE}
                                className={styles.button}
                                disabled={!formik.values.is_agree}
                            >
                                Подтвердить
                            </Button>
                        )}
                    </div>
                </>
            )}

            {/* Confirmation modals */}
            {isUserAuthorized ? (
                <ConfirmCustomDocUserModal
                    isOpen={confirmCustomDocModalOpen}
                    onClose={() => dispatch(closeModal(ModalType.CONFIRM_CUSTOM_DOCS))}
                    documentId={id}
                    openSuccessModal={handleSuccessEffect}
                />
            ) : (
                <ConfirmCustomDocsModal
                    isOpen={confirmCustomDocModalOpen}
                    onClose={() => dispatch(closeModal(ModalType.CONFIRM_CUSTOM_DOCS))}
                    docsType={step === 1 ? 'type_doc_EDS_agreement' : "type_doc_custom"}
                    openSuccessModal={handleSuccessEffect}
                    custimId={id}
                    phone={customData?.phone || ''}
                    email={customData?.email || ''}
                />
            )}
            <SuccessCustomModal
                isOpen={successModalOpen}
                onClose={() => dispatch(closeModal(ModalType.SUCCESS))}
                isUserAuthorized={isUserAuthorized}
                isLastDocument={
                    isUserAuthorized ? true : step === 2

                }
            />
            {isUserAuthorized ? (
                <DocumentPreviewModal
                    isOpen={documentsPreviewState.isOpen}
                    onClose={() => dispatch(closeModal(currentCustomDocUser?.is_confirmed ? ModalType.DOCUMENTS_PREVIEW : ModalType.DOCUMENTS_PREVIEW_SIGNED))}
                    docId={`custom_doc_user_${id}`}
                    isSignedDoc={currentCustomDocUser?.is_confirmed}
                    title={currentCustomDocUser?.title || 'Кастомный документ'}
                />
            ) : (
                !customData?.is_confirmed_type_doc_custom && step === 1 ? (
                    <DocumentPreviewModal
                        isOpen={documentsPreviewState.isOpen}
                        onClose={() => dispatch(closeModal(ModalType.DOCUMENTS_PREVIEW_SIGNED))}
                        docId={id}
                        title="Документ"
                    />
                ) : customData?.is_confirmed_type_doc_custom && step === 2 ? (
                    <DocumentPreviewModal
                        isOpen={documentsPreviewState.isOpen}
                        onClose={() => dispatch(closeModal(ModalType.DOCUMENTS_PREVIEW))}
                        isSignedDoc={true}
                        docId={id}
                        title={customData.title}
                    />
                ) : (
                    <DocumentPreviewModal
                        isOpen={documentsPreviewState.isOpen}
                        onClose={() => dispatch(closeModal(ModalType.DOCUMENTS_PREVIEW))}
                        isSignedDoc={true}
                        docId={id}
                        title={''}
                    />
                )
            )}
        </div>
    );
};

export default ConfirmCustomDocsPage