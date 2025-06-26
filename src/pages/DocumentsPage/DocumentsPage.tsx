import React, { useState, useEffect, useMemo } from "react";

import { useDispatch, useSelector } from "react-redux";
import { RootState } from "app/providers/store/config/store";

import {
    docTypes as docTypesConfirm,
    docTypeLabels as docTypeLabelsCoавваваnfirm,
    confirmDocsRequestThunk,
    setCurrentConfirmableDoc,
    getUserDocumentsStateThunk,
    getUserDocumentsSignedThunk,
    getBrokerDocumentsSignedThunk,
    getUserDocumentsNotSignedThunk,
    getUserDocumentNotSignedThunk,
    getAllBrokersThunk,
    decrementDocumentTimeout,
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
import styles from "./styles.module.scss";
import { DocumentPreviewModal } from "features/Documents/DocumentsPreviewModal/DocumentPreviewModal";
import { selectIsAnyModalOpen } from "entities/ui/Modal/selectors/selectorsModals";
import { getAllUserInfoThunk, getUserPersonalAccountInfoThunk } from "entities/User/slice/userSlice";
import WarningIcon from 'shared/assets/svg/Warning.svg'
import { getAllUserChecksThunk } from "entities/Payments/slice/paymentsSlice";
import { useDevice } from "shared/hooks/useDevice";
import { CheckPreviewModal } from "features/Payments/CheckPreviewModal/CheckPreviewModal";

const DocumentsPage: React.FC = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const device = useDevice()
    const modalState = useSelector((state: RootState) => state.modal);
    const { documentsPreview, documentsPreviewSigned } = modalState;

    const { userDocuments, loading, filledRiskProfileChapters, brokerIds, brokersCount } = useSelector((state: RootState) => state.documents);
    const currentDocument = useSelector((state: RootState) => state.documents.currentSugnedDocument.document);
    const currentConfirmableDocument = useSelector((state: RootState) => state.documents.currentConfirmableDoc);
    const currentTariffId = useSelector((state: RootState) => state.payments.currentTariffId);
    const uploadDocs = useSelector((s: RootState) => s.documents.uploadDocs);
    const payments = useSelector((s: RootState) => s.payments.payments_info);
    const userChecks = useSelector((s: RootState) => s.payments.checks);
    const tariff = useSelector((s: RootState) => s.payments.payments_info);
    const activeTariffs = useSelector((s: RootState) => s.payments.activeTariffs);
    const currentUserTariffIdForPayments = useSelector((s: RootState) => s.payments.currentUserTariffIdForPayments);
    const targetTariffId = currentUserTariffIdForPayments || '';


    const normalize = (id: string) => id.replace(/-/g, '');

    const activePaidTariffs = useMemo(
        () => activeTariffs.filter(t => normalize(t.id) === normalize(targetTariffId)),
        [activeTariffs, targetTariffId]
    );

    useEffect(() => {
        dispatch(getUserDocumentsStateThunk());
        dispatch(getAllUserInfoThunk());
        dispatch(getAllUserChecksThunk({ onSuccess: () => { } }))
        dispatch(getAllBrokersThunk({ is_confirmed_type_doc_agreement_transfer_broker: true, onSuccess: () => { } }));
    }, []);

    useEffect(() => {
        dispatch(getUserDocumentsStateThunk());
        dispatch(getUserDocumentsNotSignedThunk())
    }, [currentConfirmableDocument]);

    const isAnyModalOpen = useSelector(selectIsAnyModalOpen);

    useEffect(() => {
        if (modalState.documentsPreview.isOpen) {
            document.body.style.overflow = "hidden";
            document.body.style.position = "fixed";
            document.body.style.width = "100%";
            document.documentElement.style.overflow = "hidden";
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
    }, [modalState.documentsPreview.isOpen, isAnyModalOpen]);

    // Лейблы для отображения
    const docTypeLabels: Record<string, string> = {
        type_doc_passport: "1. Паспортные данные",
        type_doc_EDS_agreement: "2. Соглашение об ЭДО",
        type_doc_RP_questionnairy: "3. Анкета РП",
        type_doc_agreement_investment_advisor: "4. Договор ИС",
        type_doc_risk_declarations: "5. Декларация о рисках",
        type_doc_agreement_personal_data_policy: "6. Политика перс. данных",
        type_doc_investment_profile_certificate: "7. Справка ИП",
        type_doc_broker_api_token: "8. Согласие на передачу API ключа к брокерскому счету",
        type_doc_agreement_investment_advisor_app_1: '9. Договор ИС: Приложение 1',
        type_doc_agreement_account_maintenance: "10. Доверенность на управление счетом",
    };

    // Порядок документов
    const docOrder = [
        "type_doc_passport",
        "type_doc_EDS_agreement",
        "type_doc_RP_questionnairy",
        "type_doc_agreement_investment_advisor",
        "type_doc_risk_declarations",
        "type_doc_agreement_personal_data_policy",
        "type_doc_investment_profile_certificate",
        "type_doc_broker_api_token",
        'type_doc_agreement_investment_advisor_app_1',
        "type_doc_agreement_account_maintenance",
    ];

    // Метод для подписания конкретного документа
    const handleSignDocument = (docId: string) => {
        switch (docId) {
            case "type_doc_RP_questionnairy":
                dispatch(setCurrentConfirmableDoc("type_doc_RP_questionnairy"));
                dispatch(setStepAdditionalMenuUI(4));
                dispatch(
                    openModal({
                        type: ModalType.IDENTIFICATION,
                        size: ModalSize.FULL,
                        animation: ModalAnimation.LEFT,
                    })
                );
                break;
            case "type_doc_passport": {
                // Проверяем, подписан ли паспорт (есть ли дата подтверждения)
                const passportDocInfo = userDocuments.find((doc) => doc.key === "type_doc_passport");
                const isPassportSigned = !!passportDocInfo?.date_last_confirmed;

                if (!filledRiskProfileChapters.is_complete_passport || !isPassportSigned) {
                    dispatch(setCurrentConfirmableDoc("type_doc_passport"));
                    dispatch(setStepAdditionalMenuUI(2));
                    dispatch(
                        openModal({
                            type: ModalType.IDENTIFICATION,
                            size: ModalSize.FULL,
                            animation: ModalAnimation.LEFT,
                        })
                    );
                } else if (!filledRiskProfileChapters.is_exist_scan_passport) {
                    dispatch(setCurrentConfirmableDoc("type_doc_passport"));
                    dispatch(setStepAdditionalMenuUI(3));
                    dispatch(
                        openModal({
                            type: ModalType.IDENTIFICATION,
                            size: ModalSize.FULL,
                            animation: ModalAnimation.LEFT,
                        })
                    );
                } else {
                    dispatch(setCurrentConfirmableDoc("type_doc_passport"));
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
            }
            case "type_doc_broker_api_token": {
                const firstBroker = brokerIds[0];
                const isBrokerFilled = firstBroker !== null && firstBroker !== undefined;

                if (isBrokerFilled) {
                    dispatch(setCurrentConfirmableDoc("type_doc_broker_api_token"));
                    dispatch(setStepAdditionalMenuUI(4));
                    dispatch(
                        openModal({
                            type: ModalType.IDENTIFICATION,
                            size: ModalSize.FULL,
                            animation: ModalAnimation.LEFT,
                        })
                    );
                }
                else {
                    dispatch(setStepAdditionalMenuUI(5));
                    dispatch(
                        openModal({
                            type: ModalType.IDENTIFICATION,
                            size: ModalSize.FULL,
                            animation: ModalAnimation.LEFT,
                        })
                    );
                }
                break;
            }
            case "type_doc_agreement_account_maintenance": {
                if (activePaidTariffs.length > 0) {
                    dispatch(setCurrentConfirmableDoc(docId));
                    dispatch(setStepAdditionalMenuUI(4));
                    dispatch(
                        openModal({
                            type: ModalType.IDENTIFICATION,
                            size: ModalSize.FULL,
                            animation: ModalAnimation.LEFT,
                        })
                    );
                }
            }
            case "type_doc_EDS_agreement":
            case 'type_doc_agreement_investment_advisor_app_1':
            case "type_doc_agreement_investment_advisor":
            case "type_doc_risk_declarations":
            case "type_doc_agreement_personal_data_policy":
            case "type_doc_investment_profile_certificate":

                if (docId === "type_doc_EDS_agreement" && !filledRiskProfileChapters.is_exist_scan_passport) {
                    // Если паспорт не существует, не даём подписывать документ
                    return;
                }
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
        // Ищем документ с key===type в userDocuments
        const docInfo = userDocuments.find((doc) => doc.key === type);

        const date =
            type === "type_doc_broker_api_token"
                ? docInfo?.date_last_confirmed_type_doc_agreement_transfer_broker ?? null
                : docInfo?.date_last_confirmed ?? null;
        let status = date ? "signed" : "signable"; // если нет даты => значит не подписан

        // Обработка исключений для EDS и брокерского документа
        if (type === "type_doc_EDS_agreement" && !filledRiskProfileChapters.is_exist_scan_passport) {
            status = "disabled";
        }
        if (type === "type_doc_broker_api_token" && brokersCount > 0) {
            status = "signed";
        }
        return {
            id: type,
            title: docTypeLabels[type],
            date, // date_last_confirmed или null
            status,
            timeoutPending: docInfo?.timeoutPending, // здесь добавляем новое свойство
            isPayment: false,
        };
    });

    const checksArray = Object.values(userChecks)        // ← UserCheck[]
        .sort((a, b) =>
            (b.date_time_check ?? '').localeCompare(a.date_time_check ?? ''),
        );

    // 2. Формируем массив “документов-чеков”
    const paymentDocuments = checksArray.map((check, idx) => ({
        id: `payment_${check.id}`,              // id берём из самого чека
        title: `Чек #${check.fd}`,
        date: check.date_time_check ?? null,
        status: 'signed',
        timeoutPending: 0,
        isPayment: true,
    }));

    // 3. Исключаем дубликаты с documents
    const uniquePaymentDocs = paymentDocuments.filter(
        (d) => !documents.some((doc) => doc.id === d.id),
    );

    // 4. Итоговый список
    const allDocuments = [...uniquePaymentDocs, ...documents];

    // Ищем первый документ, у которого status === "signable" (то есть не подписан)
    const firstNotConfirmed = documents.find((doc) => doc.status === "signable")?.id;

    // Генерируем нужный цвет кнопки (или "подписано").
    // Логика:
    // - Если документ подписан => зелёная плашка "Подписано"
    // - Если не подписан, но это именно "первый" не подписанный => серый
    // - Если не подписан, но не первый => красный
    const renderedDocuments = allDocuments.map((doc) => {
        let colorClass = styles.button__gray;
        let additionalMessages = '';
        let tariffs = currentTariffId

        // 1) Специально для app_1
        if (doc.id === 'type_doc_agreement_investment_advisor_app_1') {
            // если хоть один из трёх флагов не выполняется — красим в red
            if (
                !filledRiskProfileChapters.is_exist_scan_passport ||
                !brokerIds[0] ||
                !tariffs
            ) {
                colorClass = styles.button__red;
                additionalMessages = `Для подписания${!filledRiskProfileChapters.is_exist_scan_passport ? ' заполните паспорт,' : ''} ${brokerIds[0] !== null ? 'подключите брокера' : ' и подключите'} ${activePaidTariffs.length === 0 ? 'тариф' : ''}`;
            } else {
                colorClass = styles.button__gray;
                additionalMessages = '';
            }

            // 2) Иначе для брокерского токена    
        } else if (doc.id === "type_doc_broker_api_token") {
            if (brokersCount === 0) {
                colorClass = styles.button__gray;
                additionalMessages = 'Для подписания подключите брокерский счет';
            } else {
                colorClass = styles.button__red;
            }

            // 3) Иначе общий случай    
        } else if (doc.id === 'type_doc_agreement_account_maintenance') {
            if (activePaidTariffs.length > 0) {
                colorClass = styles.button__gray;
                additionalMessages = 'Для подписания подключите брокерский счет';
            } else {
                colorClass = styles.button__red;
            }
        } else {
            if (doc.status === "signable") {
                if (doc.id === firstNotConfirmed) {
                    colorClass = styles.button__gray;
                } else {
                    colorClass = styles.button__red;
                }
            } else if (doc.status === "disabled") {
                colorClass = styles.button__gray;
            }
        }

        return {
            ...doc,
            colorClass,
            additionalMessages
        };
    });


    const [selectedDocId, setSelectedDocId] = useState<string | null>(null);

    const handleOpenPreview = (docId: string) => {
        console.log(docId);
        if (docId === "type_doc_passport") {
            setSelectedDocId(docId);
            dispatch(
                openModal({
                    type: ModalType.DOCUMENTS_PREVIEW,
                    animation: ModalAnimation.LEFT,
                    size: ModalSize.FULL,
                    docId: docId
                })
            );
        } else if (docId === "type_doc_broker_api_token") {
            setSelectedDocId(docId);
            dispatch(getBrokerDocumentsSignedThunk({ purpose: "download", onSuccess: () => { } }));
            dispatch(
                openModal({
                    type: ModalType.DOCUMENTS_PREVIEW_SIGNED,
                    animation: ModalAnimation.LEFT,
                    size: ModalSize.FULL,
                    docId,
                })
            );
        } else if (docId.startsWith('payment_')) {
            const tariffId = docId.split('_')[1];          // "payment_123" → 123
            const isPaid = payments.find(p => p.user_tariff_id === tariffId)?.order.paid;

            const checkId = docId.split('_')[1];       // "payment_42" → "42"
            setSelectedDocId(docId);
            dispatch(
                openModal({
                    type: ModalType.CHECKS_PREVIEW,         // новый тип
                    size: ModalSize.FULL,
                    animation: ModalAnimation.LEFT,
                    docId: checkId,                               // сохраним ID в state.modal
                })
            );

            // подгружаем PDF чека (подписанный — или черновик, если ещё не оплачен)
            // await dispatch(
            //     (isPaid ? getSignedTariffDoc : getNotSignedTariffDoc)({
            //         user_tariff_id: tariffId,
            //         purpose: 'preview',
            //         onSuccess: () => { }
            //     })
            // );

            // setSelectedDocId(docId);
            // dispatch(
            //     openModal({
            //         type: ModalType.DOCUMENTS_PREVIEW_SIGNED,
            //         animation: ModalAnimation.LEFT,
            //         size: ModalSize.FULL,
            //         docId,
            //     })
            // );
        } else {
            dispatch(
                getUserDocumentsSignedThunk({
                    type_document: docId,
                    purpose: "preview",
                    onSuccess: () => { }
                })
            );
            setSelectedDocId(docId);
            dispatch(
                openModal({
                    type: ModalType.DOCUMENTS_PREVIEW_SIGNED,
                    animation: ModalAnimation.LEFT,
                    size: ModalSize.FULL,
                    docId,
                })
            );
        }
    };

    const handleDownloadPdf = async (docId: string) => {
        try {
            // 1) Брокерский токен
            if (docId === "type_doc_broker_api_token") {

                const pdfBytes: Uint8Array = await dispatch(
                    getBrokerDocumentsSignedThunk({
                        purpose: "download",
                        onSuccess: () => { },
                    })
                ).unwrap();
                downloadBlob(pdfBytes, docId);
                return;
            }

            // 2) Прочие документы (кроме паспорта)
            if (docId !== "type_doc_passport") {
                const pdfBytes: Uint8Array = await dispatch(
                    getUserDocumentsSignedThunk({
                        type_document: docId,
                        purpose: "download",
                        onSuccess: () => { },
                    })
                ).unwrap();

                downloadBlob(pdfBytes, docId);
            }
        } catch (error) {
            console.error("Ошибка при скачивании PDF", error);
        }
    };

    // вспомогалка для создания Blob и скачивания
    function downloadBlob(data: Uint8Array, docId: string) {
        const blob = new Blob([data], { type: "application/pdf" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${docId}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }


    useEffect(() => {
        const interval = setInterval(() => {
            // Пройдём по каждому документу, если таймер активен, уменьшаем его на 1000 мс
            documents.forEach((doc) => {
                if (doc.status === "signed" && typeof doc.timeoutPending === "number" && doc.timeoutPending > 0) {
                    dispatch(decrementDocumentTimeout({ docKey: doc.id, decrement: 1000 }));
                }
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [userDocuments, dispatch]);


    const handleClosePreview = () => {
        setSelectedDocId(null);
        setTimeout(() => {
            dispatch(closeModal(ModalType.DOCUMENTS_PREVIEW_SIGNED));
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
                    {renderedDocuments.map((doc) => {
                        // Вынесем логику определения отображения кнопки/статуса
                        const isSigned = doc.status === "signed";
                        const isPassport = doc.id === "type_doc_passport";
                        const isBroker = doc.id === "type_doc_broker_api_token";
                        const isAdvisorAgreement = doc.id === 'type_doc_agreement_investment_advisor_app_1';

                        const showSuccess =
                            (isPassport && isSigned && filledRiskProfileChapters.is_exist_scan_passport) ||
                            (!isPassport && isSigned);

                        let buttonText = "Подписать";
                        if (isBroker && brokersCount === 0) {
                            buttonText = brokerIds && brokerIds.length ? "Подписать" : "Заполнить";
                        } else if (isPassport) {
                            buttonText = filledRiskProfileChapters.is_exist_scan_passport ? "Подписать" : "Заполнить";
                        } else if (doc.id === "type_doc_RP_questionnairy") {
                            buttonText = filledRiskProfileChapters.is_risk_profile_complete_final ? "Подписать" : "Заполнить";
                        }

                        const isDisabled = isBroker
                            ? !(filledRiskProfileChapters.is_exist_scan_passport)
                            : isAdvisorAgreement
                                ? !(filledRiskProfileChapters.is_exist_scan_passport && brokerIds[0] && currentTariffId)
                                : (isBroker && filledRiskProfileChapters.is_exist_scan_passport) || isPassport
                                    ? false
                                    : doc.id !== firstNotConfirmed || !filledRiskProfileChapters.is_exist_scan_passport;


                        return (
                            <>
                                {device === 'mobile' ? (
                                    <div key={doc.id} className={styles.document__item}>
                                        <div className={styles.document__info}>
                                            <span className={styles.document__info__title}>{doc.title}</span>
                                            <div className={styles.document__info__flex}>
                                                {doc.isPayment && (
                                                    <Button
                                                        className={styles.document__preview}
                                                        theme={ButtonTheme.UNDERLINE}
                                                        onClick={() => handleOpenPreview(doc.id)}
                                                    >
                                                        Просмотр
                                                    </Button>
                                                )}
                                                {doc.status === "signed" && (
                                                    <>
                                                        {doc.timeoutPending && doc.timeoutPending > 0 ? (
                                                            <span className={styles.documents__timer}>
                                                                Формирование документа (
                                                                {Math.ceil(doc.timeoutPending / 1000)} с)
                                                            </span>
                                                        ) : (
                                                            <>
                                                                <Button
                                                                    className={styles.document__preview}
                                                                    theme={ButtonTheme.UNDERLINE}
                                                                    onClick={() => handleOpenPreview(doc.id)}
                                                                >
                                                                    Просмотр
                                                                </Button>
                                                                {doc.id !== "type_doc_passport" && (
                                                                    <Icon
                                                                        Svg={DownloadIcon}
                                                                        onClick={() => handleDownloadPdf(doc.id)}
                                                                        width={33}
                                                                        height={33}
                                                                    />
                                                                )}
                                                            </>
                                                        )}
                                                    </>
                                                )}
                                                {doc.additionalMessages && (
                                                    <div className={styles.documents__warning}>
                                                        <Icon Svg={WarningIcon} width={16} height={16} />
                                                        <span >{doc.additionalMessages}</span>
                                                    </div>
                                                )}

                                            </div>
                                        </div>

                                        <div className={styles.document__status}>
                                            {/* Показываем дату, если документ подписан */}
                                            <span className={styles.document__date}>

                                                {doc.date
                                                    ? new Date(doc.date).toLocaleDateString("ru-RU", {
                                                        day: "2-digit",
                                                        month: "2-digit",
                                                        year: "numeric",
                                                    })
                                                    : (doc.id === "type_doc_passport"
                                                        ? "Дата заполнения"
                                                        : "Дата подписания")}

                                            </span>

                                            {doc.isPayment
                                                ? (
                                                    <div className={styles.document__paymentStatus} >Оплачено</div>
                                                )
                                                : showSuccess
                                                    ? (
                                                        <div className={styles.document__button_success}>
                                                            <Icon Svg={SuccessBlueIcon} width={24} height={24} />
                                                            <span>
                                                                {isPassport
                                                                    ? "Подтверждено"
                                                                    : isBroker && brokerIds[0] && filledRiskProfileChapters.is_exist_scan_passport
                                                                        ? "Подтверждено"
                                                                        : "Подписано"}
                                                            </span>
                                                        </div>
                                                    )
                                                    : (
                                                        <Button
                                                            onClick={() => handleSignDocument(doc.id)}
                                                            disabled={isDisabled}
                                                            className={doc.colorClass}
                                                            theme={ButtonTheme.BLUE}
                                                        >
                                                            {buttonText}
                                                        </Button>
                                                    )
                                            }
                                        </div>
                                    </div>
                                ) : (
                                    <div key={doc.id} className={styles.document__item}>
                                        <div className={styles.document__info}>
                                            {/* Показываем дату, если документ подписан */}
                                            <span className={styles.document__date}>

                                                {doc.date
                                                    ? new Date(doc.date).toLocaleDateString("ru-RU", {
                                                        day: "2-digit",
                                                        month: "2-digit",
                                                        year: "numeric",
                                                    })
                                                    : (doc.id === "type_doc_passport"
                                                        ? "Дата заполнения"
                                                        : "Дата подписания")}

                                            </span>
                                            <span className={styles.document__info__title}>{doc.title}</span>

                                        </div>

                                        <div className={styles.document__info__flex} style={doc.status !== 'signed' ? { flexDirection: 'column', alignItems: 'end', justifyContent: 'end' } : {}}>
                                            <div className={styles.document__status} style={{ display: 'flex' }}>

                                                {doc.isPayment && (
                                                    <Button
                                                        className={styles.document__preview}
                                                        theme={ButtonTheme.UNDERLINE}
                                                        onClick={() => handleOpenPreview(doc.id)}
                                                    >
                                                        Просмотр
                                                    </Button>
                                                )}
                                                {doc.status === "signed" && !doc.isPayment && (
                                                    <>
                                                        {doc.timeoutPending && doc.timeoutPending > 0 ? (
                                                            <span className={styles.documents__timer}>
                                                                Формирование документа (
                                                                {Math.ceil(doc.timeoutPending / 1000)} с)
                                                            </span>
                                                        ) : (
                                                            <>
                                                                <Button
                                                                    className={styles.document__preview}
                                                                    theme={ButtonTheme.UNDERLINE}
                                                                    onClick={() => handleOpenPreview(doc.id)}
                                                                >
                                                                    Просмотр
                                                                </Button>
                                                                {doc.id !== "type_doc_passport" && (
                                                                    <Icon
                                                                        Svg={DownloadIcon}
                                                                        onClick={() => handleDownloadPdf(doc.id)}
                                                                        width={33}
                                                                        height={33}
                                                                    />
                                                                )}
                                                            </>
                                                        )}
                                                    </>
                                                )}
                                                {doc.additionalMessages && (
                                                    <div className={styles.documents__warning}>
                                                        <Icon Svg={WarningIcon} width={16} height={16} />
                                                        <span >{doc.additionalMessages}</span>
                                                    </div>
                                                )}

                                            </div>

                                            {doc.isPayment
                                                ? (
                                                    <div className={styles.document__paymentStatus} >Оплачено</div>
                                                )
                                                : showSuccess
                                                    ? (
                                                        <div className={styles.document__button_success}>
                                                            <Icon Svg={SuccessBlueIcon} width={24} height={24} />
                                                            <span>
                                                                {isPassport
                                                                    ? "Подтверждено"
                                                                    : isBroker && brokerIds[0] && filledRiskProfileChapters.is_exist_scan_passport
                                                                        ? "Подтверждено"
                                                                        : "Подписано"}
                                                            </span>
                                                        </div>
                                                    )
                                                    : (
                                                        <Button
                                                            onClick={() => handleSignDocument(doc.id)}
                                                            disabled={isDisabled}
                                                            className={`${doc.colorClass} ${styles.button}`}
                                                            theme={ButtonTheme.BLUE}
                                                        >
                                                            {buttonText}
                                                        </Button>
                                                    )
                                            }
                                        </div>
                                    </div>
                                )}
                            </>


                        );
                    })}
                </div>
            </div>

            <DocumentPreviewModal
                isOpen={documentsPreview.isOpen || documentsPreviewSigned.isOpen}
                onClose={handleClosePreview}
                isSignedDoc={documentsPreviewSigned.isOpen}
                docId={documentsPreview.docId || documentsPreviewSigned.docId}
                title={
                    (documentsPreview.docId || documentsPreviewSigned.docId)
                        ? docTypeLabels[
                        documentsPreview.docId || documentsPreviewSigned.docId!
                        ]
                        : 'Документ'
                }
            />
            <CheckPreviewModal
                isOpen={modalState.checksPreview.isOpen}
                checkId={modalState.checksPreview.docId}
                onClose={() => dispatch(closeModal(ModalType.CHECKS_PREVIEW))}
            />
        </div>
    );
};

export default DocumentsPage;
