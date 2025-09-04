import React, { useEffect } from "react";
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
    openModal,
} from "entities/ui/Modal/slice/modalSlice";
import {
    ModalAnimation,
    ModalSize,
    ModalType,
} from "entities/ui/Modal/model/modalTypes";
import { ConfirmDocsModal } from "../ConfirmDocsModal/ConfirmDocsModal";
import styles from "./styles.module.scss";
import {
    confirmDocsRequestThunk,
    confirmTariffRequestThunk,
    docTypeLabels,
    docTypes,
    getAllBrokersThunk,
    getUserDocumentNotSignedThunk,
    getUserDocumentsNotSignedThunk,
    getUserDocumentsStateThunk,
    setCurrentConfirmableDoc,
    setCurrentConfirmationMethod,
    selectRemainingTimeoutByDoc,
    startDocTimeout,
    tickNow,
    docTimeoutMap,
} from "entities/Documents/slice/documentsSlice";
import DocsImage from "shared/assets/svg/docsImage.svg";
import { Icon } from "shared/ui/Icon/Icon";
import { CheckboxGroup } from "shared/ui/CheckboxGroup/CheckboxGroup";
import { getAllUserInfoThunk } from "entities/User/slice/userSlice";
import { setStepAdditionalMenuUI } from "entities/ui/Ui/slice/uiSlice";
import { useNavigate } from "react-router-dom";
import ArrowBack from "shared/assets/svg/ArrowBack.svg";
import { SuccessModal } from "../SuccessModal/SuccessModal";
import {
    getNotSignedTariffDocThunk,
    setTariffIdThunk,
} from "entities/Payments/slice/paymentsSlice";
import { useDevice } from "shared/hooks/useDevice";
import CloseIcon from "shared/assets/svg/close.svg";

export const ConfirmAllDocs: React.FC = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    const isBottom = useSelector((state: RootState) => state.ui.isScrollToBottom);
    const modalState = useSelector(
        (state: RootState) => state.modal.documentsPreview
    );
    const isRPFilled = useSelector(
        (state: RootState) =>
            state.documents.filledRiskProfileChapters.is_risk_profile_complete
    );
    const isRPFinalFilled = useSelector(
        (state: RootState) =>
            state.documents.filledRiskProfileChapters.is_risk_profile_complete_final
    );
    const { filledRiskProfileChapters, brokerIds } = useSelector(
        (state: RootState) => state.documents
    );

    const successModalOpen = useSelector(
        (state: RootState) => state.modal.success.isOpen
    );
    const currentTariffId = useSelector(
        (state: RootState) => state.payments.currentTariffId
    );
    const currentUserTariffIdForPayments = useSelector(
        (state: RootState) => state.payments.currentUserTariffIdForPayments
    );
    const device = useDevice();
    const isUserIP = !!useSelector(
        (s: RootState) => s.user.userPersonalAccountInfo?.is_individual_entrepreneur
    );
    const activeTariffs = useSelector((s: RootState) => s.payments.activeTariffs);
    const currentOrderId = useSelector((s: RootState) => s.payments.currentOrderId);
    const deposit = useSelector((s: RootState) => s.payments.calculator.min_deposit);
    const brokerId = useSelector((s: RootState) => s.documents.brokerIds[0]);
    const currentTypeDoc = useSelector(
        (state: RootState) => state.documents.currentConfirmableDoc
    );

    // оставляем объект опций как было
    const messageTypeOptions = { SMS: "SMS", EMAIL: "Email", WHATSAPP: "Whatsapp" };

    // «карточка заполнена» / «сканы загружены»
    const isIdentityDataComplete = isUserIP
        ? filledRiskProfileChapters.is_complete_person_legal
        : filledRiskProfileChapters.is_complete_passport;

    const isIdentityScanExist = isUserIP
        ? filledRiskProfileChapters.is_exist_scan_person_legal
        : filledRiskProfileChapters.is_exist_scan_passport;

    const hasIdentityDocs = isIdentityDataComplete && isIdentityScanExist;

    // Состояние для хранения последнего подписанного документа (для описания в successModal)
    const [lastConfirmedDoc, setLastConfirmedDoc] = React.useState<string>("");
    
    // ⏱ оставшееся время по текущему документу — теперь из Redux
    const remainingSeconds = useSelector((s: RootState) =>
        selectRemainingTimeoutByDoc(s, currentTypeDoc)
    );

    // один общий тикающий интервал для обновления nowTs в Redux
    useEffect(() => {
        const id = setInterval(() => {
            dispatch(tickNow());
        }, 1000);
        return () => clearInterval(id);
    }, [dispatch]);

    useEffect(() => {
        dispatch(
            getAllBrokersThunk({
                is_confirmed_type_doc_agreement_transfer_broker: true,
                onSuccess: () => { },
            })
        );
    }, []);

    useEffect(() => {
        dispatch(getUserDocumentsStateThunk());
    }, [currentTypeDoc, isRPFilled, isRPFinalFilled]);

    useEffect(() => {
        if (isIdentityDataComplete) {
            dispatch(getUserDocumentsNotSignedThunk());
        }
    }, [isIdentityDataComplete]);

    useEffect(() => {
        if (isRPFinalFilled) {
            dispatch(getUserDocumentsNotSignedThunk());
        }
    }, [isRPFinalFilled]);

    const handleMethodChange = (method: "SMS" | "EMAIL" | "WHATSAPP") => {
        formik.setFieldValue("type_message", method);
        dispatch(setCurrentConfirmationMethod(method));
    };

    const currentIndex = docTypes.findIndex((d) => d === currentTypeDoc);
    const totalDocs = docTypes.length;

    const handleOpenPreview = async () => {
        navigate("documents");
        const tariffId = currentTariffId || currentUserTariffIdForPayments;
        const previewId = `tariff_${tariffId}`;

        if (currentTypeDoc === "type_doc_broker_api_token" && brokerIds.length === 0) {
            dispatch(setStepAdditionalMenuUI(5));
        }
        if (currentTypeDoc === "type_doc_agreement_investment_advisor_app_1") {
            await dispatch(getNotSignedTariffDocThunk({ tariff_id: tariffId }));

            dispatch(
                openModal({
                    type: ModalType.DOCUMENTS_PREVIEW,
                    size: ModalSize.FULL,
                    animation: ModalAnimation.LEFT,
                    docId: previewId,
                })
            );
        } else {
            dispatch(
                openModal({
                    type: ModalType.DOCUMENTS_PREVIEW,
                    size: ModalSize.FULL,
                    animation: ModalAnimation.LEFT,
                    docId: currentTypeDoc,
                })
            );
        }
    };

    const formik = useFormik({
        initialValues: {
            type_message: "EMAIL",
            type_document: currentTypeDoc,
            is_agree: false,
        },
        enableReinitialize: true,
        validationSchema: Yup.object({
            is_agree: Yup.boolean().oneOf([true], "внимание"),
        }),
        onSubmit: () => {
            if (currentTypeDoc === "type_doc_passport" && !isIdentityDataComplete) {
                dispatch(setStepAdditionalMenuUI(3));
            } else if (currentTypeDoc === "type_doc_RP_questionary" /* опечатка источника? оставляю как было */) {
                if (isRPFilled) {
                    dispatch(setStepAdditionalMenuUI(0));
                } else if (isRPFinalFilled) {
                    dispatch(setStepAdditionalMenuUI(1));
                } else {
                    dispatch(setStepAdditionalMenuUI(4));
                }
            } else if (
                currentTypeDoc === "type_doc_broker_api_token" &&
                brokerIds.length === 0
            ) {
                dispatch(setStepAdditionalMenuUI(5));
            } else if (currentTypeDoc === "type_doc_agreement_investment_advisor_app_1") {
                currentOrderId &&
                    dispatch(
                        setTariffIdThunk({
                            tariff_key: currentOrderId,
                            broker_id: brokerId,
                            type_message: formik.values.type_message,
                            manual_price: deposit,
                            is_agree: formik.values.is_agree,
                            onSuccess: () => {
                                // + СТАРТ ТАЙМЕРА по маппингу (duration не передаём — возьмётся из docTimeoutMap)
                                dispatch(startDocTimeout({ docKey: currentTypeDoc }));
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
            } else {
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
        formik.setFieldValue("type_message", "EMAIL");
        dispatch(setCurrentConfirmationMethod("EMAIL"));
    }, []);

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
            case "type_doc_agreement_investment_advisor_app_1":
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
        if (currentTypeDoc === "type_doc_passport") {
            dispatch(setCurrentConfirmableDoc("type_doc_EDS_agreement"));
        }
    }, []);

    // Открыть SuccessModal из дочерней модалки
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

    const confirmDocsModalOpen = useSelector(
        (state: RootState) => state.modal.confirmDocsModal.isOpen
    );

    return (
        <>
            <div className={styles.page}>
                <div className={styles.header}>
                    <div
                        className={styles.back}
                        onClick={() => {
                            dispatch(getUserDocumentsStateThunk());
                            dispatch(closeModal(ModalType.IDENTIFICATION));
                        }}
                    >
                        <Icon Svg={ArrowBack} width={24} height={24} /> Назад
                    </div>
                    <div
                        className={styles.close}
                        onClick={() => {
                            if (currentTypeDoc === "type_doc_EDS_agreement") {
                                dispatch(getUserDocumentsStateThunk());
                            }
                            dispatch(closeModal(ModalType.IDENTIFICATION));
                        }}
                        title="Закрыть"
                    >
                        <Icon Svg={CloseIcon} width={24} height={24} pointer />
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
                        <Button
                            onClick={handleOpenPreview}
                            theme={ButtonTheme.UNDERLINE}
                            className={styles.button_preview}
                        >
                            Просмотр
                        </Button>
                    </div>
                </div>

                <div className={styles.desktop__container}>
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

                    <div className={styles.desktop__container__code}>
                        <span className={styles.method__title}>Куда отправить код</span>
                        <div className={styles.method}>
                            <CheckboxGroup
                                name="type_message"
                                label=""
                                greedOrFlex="flex"
                                direction="row"
                                options={Object.entries(messageTypeOptions).map(
                                    ([value, label]) => ({ label, value })
                                )}
                                value={formik.values.type_message}
                                onChange={(_, selectedValue) => {
                                    handleMethodChange(
                                        selectedValue as keyof typeof messageTypeOptions
                                    );
                                }}
                            />
                        </div>
                    </div>

                    <div
                        className={`${styles.buttons} ${!isBottom ? styles.shadow : ""}`}
                    >
                        <Button
                            onClick={() => formik.handleSubmit()}
                            theme={ButtonTheme.BLUE}
                            className={styles.button}
                            disabled={!formik.values.is_agree || remainingSeconds > 0}
                        >
                            {remainingSeconds > 0 ? `(${remainingSeconds})` : "Подтвердить"}
                        </Button>
                    </div>
                </div>
            </div>

            <ConfirmDocsModal
                isOpen={confirmDocsModalOpen}
                onClose={() => {
                    dispatch(closeModal(ModalType.CONFIRM_DOCS));
                }}
                docsType={currentTypeDoc}
                lastData={formik.values}
                openSuccessModal={openSuccessModal}
                title={`${docTypeLabels[currentTypeDoc] ?? ""}`}
            />

            <SuccessModal
                isOpen={successModalOpen}
                onClose={() => {
                    dispatch(closeModal(ModalType.SUCCESS));
                    dispatch(closeModal(ModalType.CONFIRM_DOCS));
                }}
                title="Документ подписан"
                description={
                    <div style={{ textAlign: "center" }}>
                        Документ “<strong>
                            {lastConfirmedDoc ? docTypeLabels[lastConfirmedDoc] : ""}
                        </strong>
                        ” успешно подписан. Можете перейти к подписанию следующего
                        документа
                    </div>
                }
                action={() => {
                    if (
                        currentTypeDoc === "type_doc_broker_api_token" &&
                        brokerIds.length === 0
                    ) {
                        dispatch(setStepAdditionalMenuUI(5));
                    }
                    dispatch(closeModal(ModalType.SUCCESS));
                    dispatch(closeModal(ModalType.CONFIRM_DOCS));
                }}
            />
        </>
    );
};
