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
    getUserDocumentsInfoThunk,
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
import { getAllUserChecksThunk, getSignedTariffDocThunk, isSignedTariffThunk } from "entities/Payments/slice/paymentsSlice";
import { useDevice } from "shared/hooks/useDevice";
import { CheckPreviewModal } from "features/Payments/CheckPreviewModal/CheckPreviewModal";
import { PasportScanForm } from "features/RiskProfile/PassportScanForm/PassportScanForm";
import { Checkbox } from "shared/ui/Checkbox/Checkbox";
import { CheckboxGroup } from "shared/ui/CheckboxGroup/CheckboxGroup";
import { BulkSignModal } from "features/Documents/BulkSignModal/BulkSignModal";
import { ConfirmAllDocsOneCodeModal } from "features/RiskProfile/ConfirmAllDocsOneCode/ConfirmAllDocsOneCode";

const DocumentsPage: React.FC = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const device = useDevice()
    const modalState = useSelector((state: RootState) => state.modal);
    const { documentsPreview, documentsPreviewSigned } = modalState;

    const { userDocuments, loading, filledRiskProfileChapters, brokerIds, brokersCount, brokers } = useSelector((state: RootState) => state.documents);
    const { isAnotherBroker } = useSelector((state: RootState) => state.riskProfile);

    // Проверяем, есть ли брокер с is_confirmed_and_with_key: true
    const isBrokerConfirmedWithKey = brokers.some(broker => broker.is_confirmed_and_with_key);
    const currentDocument = useSelector((state: RootState) => state.documents.currentSugnedDocument.document);

    const currentConfirmableDocument = useSelector((state: RootState) => state.documents.currentConfirmableDoc);
    const currentTariffId = useSelector((state: RootState) => state.payments.currentTariffId);
    const uploadDocs = useSelector((s: RootState) => s.documents.uploadDocs);
    const payments = useSelector((s: RootState) => s.payments.payments_info);
    const userChecks = useSelector((s: RootState) => s.payments.checks);
    const tariff = useSelector((s: RootState) => s.payments.payments_info);
    const activeTariffs = useSelector((s: RootState) => s.payments.activeTariffs);
    const paidTariffKeys = useSelector((s: RootState) => s.payments.paidTariffKeys);
    const user = useSelector((s: RootState) => s.user.userPersonalAccountInfo);
    const isVip = useSelector((s: RootState) => s.user.is_vip);
    const currentUserTariffIdForPayments = useSelector((s: RootState) => s.payments.currentUserTariffIdForPayments);
    const targetTariffId = currentUserTariffIdForPayments || '';
    const isBulkEnabled = !!user?.is_confirm_all_documents_one_code;
    const brokerDoc = userDocuments.find(d => d.key === "type_doc_broker_api_token");
    const brokerConfirmation = userDocuments.find(
        d => d.is_confirmed_type_doc_agreement_transfer_broker === true,
    );
    const isBrokerSigned = !!brokerDoc;

    const isIp = !!user?.is_individual_entrepreneur;

    // Универсальные флаги «заполнена карточка» / «есть сканы»
    const isIdentityDataComplete = isIp
        ? filledRiskProfileChapters.is_complete_person_legal
        : filledRiskProfileChapters.is_complete_passport;

    const isIdentityScanExist = isIp
        ? filledRiskProfileChapters.is_exist_scan_person_legal
        : filledRiskProfileChapters.is_exist_scan_passport;


    //Логика с подписанием всех документов

    const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
    const [bulkOpen, setBulkOpen] = useState(false);

    // Проверяем наличие активного тарифа (нужно для EXCLUDED_BULK)
    const hasTariff = activeTariffs.some(tariff => tariff.is_active);

    /** документы, недоступные для массовой подписи */
    const EXCLUDED_BULK = [
        "type_doc_broker_api_token", // исключаем брокера из массового выбора
        "type_doc_passport", // исключаем паспорт из массового выбора
        // Приложение 1 исключается:
        // - Для VIP (если не another broker)
        // - Если нет тарифа
        // - Для another broker: если НЕТ with_key (не подтвержден брокер с ключом) ИЛИ нет тарифа
        ...((isVip && !isAnotherBroker) || !hasTariff || (isAnotherBroker && !isBrokerConfirmedWithKey))
            ? ["type_doc_agreement_investment_advisor_app_1"]
            : []
    ];

    /** обработчик подписания всех документов - автоматически выбираются все документы */
    const handleSignAllDocs = () => {
        const selectableDocIds = bulkSelectableDocs.map(d => d.id);
        setSelectedDocs(selectableDocIds);
        setBulkOpen(true);
    };

    //Логика с подписанием всех документов 
    const isEmptyObj = (v: unknown): v is Record<string, never> =>
        v != null && typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0;


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
        dispatch(getUserDocumentsNotSignedThunk());
    }, [currentConfirmableDocument, PasportScanForm, brokersCount, isIdentityScanExist]);
    //

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
                    // console.log("All modals closed, resetting styles.");
                    document.body.style.overflow = "";
                    document.body.style.position = "";
                    document.body.style.width = "";
                    document.documentElement.style.overflow = "";
                }
            }, 50);
        }
    }, [modalState.documentsPreview.isOpen, isAnyModalOpen]);


    // 1. Полное определение docOrder без каких-либо сокращений
    const docOrder = useMemo<string[]>(() => {
        /* ------------------------------------------------------------------
           Базовый список всех возможных документов в «правильном» порядке.
           В самом конце - «Договор ИС: Приложение 1».
        ------------------------------------------------------------------ */
        const baseOrder: string[] = [
            "type_doc_passport",
            "type_doc_EDS_agreement",
            "type_doc_RP_questionnairy",
            "type_doc_agreement_investment_advisor",
            "type_doc_risk_declarations",
            "type_doc_agreement_personal_data_policy",
            "type_doc_investment_profile_certificate",
            "type_doc_agreement_account_maintenance",
            "type_doc_broker_api_token",
            "type_doc_agreement_investment_advisor_app_1", // ← будет удалён для VIP
        ];

        /* ------------------------------------------------------------------
           Шаг 1. Если пользователь VIP - удаляем «Приложение 1» из baseOrder.
           НО для another broker всегда показываем Приложение 1
        ------------------------------------------------------------------ */
        let vipFiltered: string[] = (isVip && !isAnotherBroker)
            ? baseOrder.filter(
                (id) => id !== "type_doc_agreement_investment_advisor_app_1",
            )
            : baseOrder;

        /* ------------------------------------------------------------------
           Шаг 2. Если массовая подпись (one-code) неактивна → просто возвращаем
           полученный список (для VIP он уже без Приложения 1).
        ------------------------------------------------------------------ */
        if (!isBulkEnabled) {
            return vipFiltered;
        }

        /* ------------------------------------------------------------------
           Шаг 3. Массовая подпись активна (isBulkEnabled === true).
      
           Требование: паспорт + брокерский токен должны быть первыми
           (они нужны, чтобы one-code заработал). Дальше идёт «хвост» без дублей.
      
           Для VIP «хвост» уже не содержит Приложения 1, а для обычного клиента
           оно останется в списке после первых двух документов.
        ------------------------------------------------------------------ */
        const head: string[] = [
            "type_doc_passport",
            "type_doc_broker_api_token",
        ];

        const tail: string[] = vipFiltered.filter((id) => !head.includes(id));

        /* ------------------------------------------------------------------
           Итоговый порядок документов
           Для another broker всегда показываем документ брокера и Приложение 1
        ------------------------------------------------------------------ */
        return [...head, ...tail];
    }, [isBulkEnabled, isVip, isAnotherBroker, isBrokerConfirmedWithKey]);


    /** «Чистые» названия без нумерации  */
    const baseDocTitles: Record<string, string> = {
        type_doc_passport: user?.is_individual_entrepreneur === false
            ? "Паспортные данные"
            : "Данные об ИП",
        type_doc_EDS_agreement: "Соглашение об ЭЦП",
        type_doc_RP_questionnairy: "Анкета Риск Профиля",
        type_doc_agreement_investment_advisor: "Договор ИС",
        type_doc_risk_declarations: "Декларация о рисках",
        type_doc_agreement_personal_data_policy: "Политика персональных данных",
        type_doc_investment_profile_certificate: "Справка Инвестиционного профиля",
        type_doc_agreement_account_maintenance: "Доверенность на управление счётом",
        type_doc_broker_api_token: "Согласие на передачу API-ключа к брокерскому счёту",
        type_doc_agreement_investment_advisor_app_1: "Договор ИС: Приложение 1",
    };

    /** Итоговые лейблы с корректной нумерацией */
    const docTypeLabels: Record<string, string> = useMemo(() => {
        const labels: Record<string, string> = {};

        docOrder.forEach((key, idx) => {
            // base title + номер, начиная с 1
            labels[key] = `${idx + 1}. ${baseDocTitles[key] ?? key}`;
        });

        return labels;
    }, [docOrder, user?.is_individual_entrepreneur]);



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

                if (!isIdentityDataComplete || !isPassportSigned) {
                    dispatch(setCurrentConfirmableDoc("type_doc_passport"));
                    dispatch(setStepAdditionalMenuUI(2));
                    dispatch(
                        openModal({
                            type: ModalType.IDENTIFICATION,
                            size: ModalSize.FULL,
                            animation: ModalAnimation.LEFT,
                        })
                    );
                } else if (!isIdentityScanExist) {
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
                // Если выбран другой брокер, не позволяем подписывать документ
                if (isAnotherBroker) {
                    return;
                }

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
                // if (activePaidTariffs.length > 0) {
                if (true) {
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
                break
            }
            case 'type_doc_agreement_investment_advisor_app_1': {
                if (isVip) return;

                // Проверяем, подписан ли документ
                const advisorDoc = userDocuments.find(d => d.key === "type_doc_agreement_investment_advisor_app_1");
                const isDocSigned = !!advisorDoc?.date_last_confirmed;
                if (Object.keys(paidTariffKeys).length > 0) {
                    navigate('/payments/loading')
                } else if (isDocSigned && !hasTariff && activeTariffs.length > 0) {
                    // Документ подписан, но тариф не оплачен - переходим к оплате
                    navigate('/payments');
                } else if (isAnotherBroker && !hasTariff) {
                    navigate('/payments');
                    return
                } else if (isTariffSigned) {
                    navigate('/payments');
                } else if (hasTariff) {
                    // Тариф есть - подписываем документ
                    dispatch(setCurrentConfirmableDoc(docId));
                    dispatch(setStepAdditionalMenuUI(4));
                    dispatch(
                        openModal({
                            type: ModalType.IDENTIFICATION,
                            size: ModalSize.FULL,
                            animation: ModalAnimation.LEFT,
                        })
                    );
                } else if (!hasTariff && activeTariffs.length > 0) {
                    // Тариф не активен, но есть оплаченные тарифы - подписываем документ
                    dispatch(setCurrentConfirmableDoc(docId));
                    dispatch(setStepAdditionalMenuUI(4));
                    dispatch(
                        openModal({
                            type: ModalType.IDENTIFICATION,
                            size: ModalSize.FULL,
                            animation: ModalAnimation.LEFT,
                        })
                    );
                } else {
                    // Тарифа нет - переходим к оплате
                    navigate('/payments');
                }
                break
            }
            // Для отменя кнопки подписать на 1 документе при множетсвенном подписании
            case "type_doc_EDS_agreement": {
                if (isBulkEnabled) {
                    const selectableDocIds = bulkSelectableDocs.map(d => d.id);
                    setSelectedDocs(selectableDocIds);
                    setBulkOpen(true)
                } else {
                    if (docId === "type_doc_EDS_agreement" && !isIdentityScanExist) {
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
                }
                break
            }
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
            // console.log("Неподдерживаемый тип документа");
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
        if (type === "type_doc_EDS_agreement" && !isIdentityScanExist) {
            status = "disabled";
        }
        if (type === 'type_doc_passport') {
            status =
                isIdentityScanExist ? 'signed' :
                    date ? 'signed' : 'signable';
        }
        if (type === "type_doc_broker_api_token") {
            if (isAnotherBroker && !isBrokerConfirmedWithKey) {
                status = "disabled"; // Скелет брокера - неактивен
            } else if (isBrokerSigned) {
                status = "signed";
            }
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

    const bulkSelectableDocs = useMemo(
        () =>
            documents.filter(
                d => !EXCLUDED_BULK.includes(d.id) && d.status === 'signable'
            ),
        [documents]
    );

    // Показать кнопку "Подписать все" только после того, как подключен брокер
    const showSignAllButton =
        isBulkEnabled &&
        bulkSelectableDocs.length > 0 &&
        brokerIds.length > 0;

    useEffect(() => {
        console.log(isBulkEnabled)
        console.log(bulkSelectableDocs.length)
        console.log(brokerIds.length > 0)
        console.log(isBrokerSigned)
    }, [])

    // Не показываем индивидуальные чекбоксы
    const showBulkToolbar = false;

    useEffect(() => {
        setSelectedDocs(prev => {
            const updated = prev.filter(id =>
                bulkSelectableDocs.some(d => d.id === id)
            );
            // Если массив совпадает по длине и по элементам – не обновляем state
            const isSame =
                updated.length === prev.length &&
                updated.every((v, i) => v === prev[i]);
            return isSame ? prev : updated;
        });
    }, [bulkSelectableDocs]);


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

    // Функция для проверки, что все документы до брокера подписаны
    const areAllDocumentsBeforeBrokerSigned = () => {
        const brokerIndex = docOrder.findIndex(docId => docId === "type_doc_broker_api_token");
        if (brokerIndex === -1) return true; // если брокер не найден, не блокируем

        const documentsBeforeBroker = docOrder.slice(0, brokerIndex);
        return documentsBeforeBroker.every(docId => {
            const docInfo = userDocuments.find(doc => doc.key === docId);
            return docInfo?.date_last_confirmed !== null;
        });
    };

    // Генерируем нужный цвет кнопки (или "подписано").
    // Логика:
    // - Если документ подписан => зелёная плашка "Подписано"
    // - Если не подписан, но это именно "первый" не подписанный => серый
    // - Если не подписан, но не первый => красный
    //условия для проверки Договора ИС
    const hasPassport = isIdentityScanExist;
    const hasBroker = brokersCount > 0;             // или !!brokerIds.length
    const hasTariffAttempt = activePaidTariffs.length > 0

    const renderedDocuments = allDocuments.map((doc) => {
        /* ───────── базовые флаги ───────── */
        const isBroker = doc.id === "type_doc_broker_api_token";
        const isPassport = doc.id === "type_doc_passport";
        const isAdvisorAgreement = doc.id === "type_doc_agreement_investment_advisor_app_1";
        const isMaintenanceAgree = doc.id === "type_doc_agreement_account_maintenance";

        /* --- НОВОЕ: блокируем брокера, если нет one‑code и открыт не он --- */

        /* ───────── isDisabled ───────── */
        const isDisabled = isAdvisorAgreement
            ? isAnotherBroker
                ? !hasPassport || !hasTariff
                : !(hasPassport && hasBroker && hasTariff)                         // «Приложение 1»
            : isBroker
                ? isAnotherBroker && !isBrokerConfirmedWithKey
                    ? true  // Для другого брокера показываем скелет пока не подтвердится
                    : !hasPassport || !areAllDocumentsBeforeBrokerSigned()  // брокер: нужен паспорт И все документы до брокера подписаны
                : isPassport
                    ? false                                                     // паспорт всегда активен
                    : doc.id !== firstNotConfirmed || !hasPassport;             // прочие

        /* ───────── цвет и сообщения ───────── */
        let colorClass = styles.button__gray;
        let additionalMessages = '';

        /* 1) Приложение 1 (логика без изменений) */
        if (isAdvisorAgreement) {
            if (isAnotherBroker ? !hasPassport : (!hasPassport || !hasBroker)) {        // нет паспорта / брокера → серая
                colorClass = styles.button__gray;
                additionalMessages = isAnotherBroker
                    ? `Для подписания${!hasPassport ? ' заполните паспорт' : ''}${!hasTariff ? ' и тариф' : ''}`.replace(/,\s*$/, '')
                    : `Для подписания${!hasPassport ? ' заполните паспорт' : ''}${!hasPassport && !hasBroker ? ',' : ''}${!hasBroker ? ' подключите брокерский счет' : ''}${!hasTariff ? ' и тариф' : ''}`.replace(/,\s*$/, '');
            } else if (!hasTariff) {                 // всё есть, кроме тарифа → красная
                colorClass = styles.button__gray;
                additionalMessages = 'Оплатите тариф';
            }
        }

        /* 2) Брокерский токен */
        else if (isBroker) {
            if (isAnotherBroker && !isBrokerConfirmedWithKey) {
                colorClass = styles.button__gray;
                additionalMessages = 'Документ будет доступен для подписи после подключения брокера';
            } else if (brokerIds.length === 0) {
                colorClass = styles.button__gray;
                additionalMessages = 'Для подписания подключите брокерский счёт';
            } else {
                colorClass = styles.button__gray;
                // активный брокер
            }
        }

        /* 3) Доверенность на управление счётом */
        // else if (isMaintenanceAgree) {
        //     if (activePaidTariffs.length > 0) {
        //         colorClass = styles.button__gray;
        //     } else {
        //         colorClass = styles.button__red;
        //         if (brokerIds.length === 0) {

        //         }
        //     }
        // }

        /* 4) Общие документы */
        else {
            if (doc.status === 'signable') {
                colorClass =
                    doc.id === firstNotConfirmed ? styles.button__gray : styles.button__red;
            } else if (doc.status === 'disabled') {
                colorClass = styles.button__gray;
            }
        }

        return {
            ...doc,
            colorClass,
            additionalMessages,
            isDisabled,                 // кидаем внутрь, чтобы в JSX взять напрямую
        };
    });





    const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
    const [isTariffSigned, setIsTariffSigned] = useState<boolean | null>(null);

    // Проверяем подписанность тарифа для Приложения 1Ghjcv
    useEffect(() => {
        if (currentUserTariffIdForPayments) {
            dispatch(isSignedTariffThunk({ tariff_id: currentUserTariffIdForPayments }))
                .then((result) => {
                    if (result.payload && result.payload.is_confirmed_type_doc_agreement_investment_advisor_app_1) {
                        setIsTariffSigned(true);
                    } else {
                        setIsTariffSigned(false);
                    }
                })
                .catch(() => {
                    setIsTariffSigned(false);
                });
        }
    }, [currentUserTariffIdForPayments, dispatch]);

    const handleOpenPreview = (docId: string) => {
        // console.log(docId);
        if (docId === "type_doc_passport") {
            setSelectedDocId(docId);

            // всегда подтягиваем свежие данные перед превью
            dispatch(getAllUserInfoThunk());
            dispatch(getUserDocumentsInfoThunk());

            dispatch(
                openModal({
                    type: ModalType.DOCUMENTS_PREVIEW,
                    size: ModalSize.FULL,
                    animation: ModalAnimation.LEFT,
                    docId
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
        } else if (docId === "type_doc_agreement_investment_advisor_app_1") {
            // Для Приложения 1 вызываем специальную ручку get_signed_tariff_document
            if (currentUserTariffIdForPayments) {
                console.log('Calling getSignedTariffDocThunk with tariff_id:', currentUserTariffIdForPayments);
                dispatch(getSignedTariffDocThunk({
                    tariff_id: currentUserTariffIdForPayments,
                    purpose: 'preview'
                })).then((result) => {
                    console.log('getSignedTariffDocThunk result:', result);
                }).catch((error) => {
                    console.error('getSignedTariffDocThunk error:', error);
                });
                setSelectedDocId(docId);
                console.log('Opening modal with params:', {
                    type: ModalType.DOCUMENTS_PREVIEW_SIGNED,
                    docId,
                    isSignedDoc: true
                });
                dispatch(
                    openModal({
                        type: ModalType.DOCUMENTS_PREVIEW_SIGNED,
                        animation: ModalAnimation.LEFT,
                        size: ModalSize.FULL,
                        docId,
                    })
                );
            } else {
                console.error('No currentUserTariffIdForPayments available');
            }
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
                    <Icon Svg={BackIcon} width={24} height={24} onClick={() => navigate("/lk")} pointer />
                    <h2 className={styles.page__title}>Список документов</h2>
                </div>

                {/* Список документов */}
                {showSignAllButton && (
                    <div className={styles.bulkToolbar}>
                        <Button
                            theme={ButtonTheme.BLUE}
                            onClick={handleSignAllDocs}
                            className={styles.bulkButton}
                            padding="10px"
                        >
                            Подписать все документы
                        </Button>
                    </div>
                )}
                <div className={`
    ${styles.documents__list}
  `}>
                    {renderedDocuments.map((doc) => {
                        const isInBulk = false; // убираем возможность выбора отдельных документов

                        const isAdvisorAgreement = doc.id === 'type_doc_agreement_investment_advisor_app_1';
                        const isPassport = doc.id === "type_doc_passport";
                        const isBroker = doc.id === "type_doc_broker_api_token";

                        // Вынесем логику определения отображения кнопки/статуса
                        const isSignedApp1 = hasTariffAttempt && !hasTariff;
                        // НОВАЯ ЛОГИКА: также считаем app_1 подписанным если есть активный тариф
                        const isSignedApp1WithActiveTariff = hasTariff && activeTariffs.some(tariff => tariff.is_active === true);
                        const isSigned = isAdvisorAgreement
                            ? isSignedApp1 || isSignedApp1WithActiveTariff
                            : isBroker && isAnotherBroker && !isBrokerConfirmedWithKey
                                ? false  // Для скелета брокера никогда не показываем как подписанный
                                : doc.status === "signed";


                        const isDisabled = isAdvisorAgreement
                            ? isAnotherBroker
                                ? !hasPassport || !hasTariff
                                : !(hasPassport && hasBroker && hasTariff)
                            : isBroker
                                ? isAnotherBroker && !isBrokerConfirmedWithKey
                                    ? true  // Для другого брокера показываем скелет пока не подтвердится
                                    : !hasPassport || !areAllDocumentsBeforeBrokerSigned()
                                : isPassport
                                    ? false
                                    : doc.id !== firstNotConfirmed || !hasPassport;
                        let buttonText = "Подписать";
                        if (isBroker && isAnotherBroker) {
                            buttonText = "Ожидается подтверждение";
                        } else if (isBroker && brokersCount === 0) {
                            buttonText = brokerIds && brokerIds.length ? "Подписать" : "Заполнить";
                        } else if (isPassport) {
                            buttonText = isIdentityScanExist ? "Подписать" : "Заполнить";
                        } else if (doc.id === "type_doc_RP_questionnairy") {
                            buttonText = filledRiskProfileChapters.is_risk_profile_complete_final ? "Подписать" : "Заполнить";
                        } else if (isAdvisorAgreement) {
                            if (isAnotherBroker) {
                                if (hasTariffAttempt) {
                                    buttonText = 'Оплатить';
                                } else if (isTariffSigned) {
                                    // Если тариф уже подписан - показываем "Оплатить"
                                    buttonText = 'Оплатить';
                                } else {
                                    buttonText =
                                        !hasTariff
                                            ? 'Подключить'
                                            : 'Подписать';
                                }
                            } else {
                                if (hasTariffAttempt) {
                                    buttonText = 'Оплатить';
                                } else if (isTariffSigned) {
                                    // Если тариф уже подписан - показываем "Оплатить"
                                    buttonText = 'Оплатить';
                                } else {
                                    buttonText =
                                        !hasTariff && activeTariffs.length > 0
                                            ? 'Подписать'
                                            : 'Подключить';
                                }
                            }

                        }

                        const showSuccess =
                            (isPassport && isSigned && isIdentityScanExist) ||
                            (!isPassport && isSigned && !(isAdvisorAgreement && !hasTariff && !isSignedApp1WithActiveTariff) && !(isBroker && isAnotherBroker)); // Не показываем "Подписано" для брокера при isAnotherBroker
                        const shouldHideBrokerWhenBulk =
                            isBroker && buttonText === 'Подписать' && showBulkToolbar;

                        const shouldShowButton =
                            !isInBulk &&
                            !showSuccess &&
                            !shouldHideBrokerWhenBulk &&
                            !(isBroker && isAnotherBroker); // Не показываем кнопки для брокера при isAnotherBroker

                        // Показываем кнопку просмотра для подписанных документов, но не для брокера при isAnotherBroker
                        const shouldShowViewButton = isSigned && !doc.isPayment && !(isBroker && isAnotherBroker);




                        const showCheckbox = false; // убираем все чекбоксы
                        return (

                            <>
                                {device === 'mobile' ? (
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <div key={doc.id} className={`${styles.document__item} ${isBroker && isAnotherBroker ? styles.document__item_skeleton : ''}`}>
                                            <div>

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
                                                        {shouldShowViewButton && (
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
                                                                        {doc.id !== "type_doc_passport" && doc.id !== "type_doc_agreement_investment_advisor_app_1" && (
                                                                            <Icon
                                                                                Svg={DownloadIcon}
                                                                                onClick={() => handleDownloadPdf(doc.id)}
                                                                                width={33}
                                                                                height={33}
                                                                                pointer
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

                                                {doc.isPayment ? (
                                                    <div className={styles.document__paymentStatus}>Оплачено</div>
                                                ) : showSuccess ? (
                                                    <div className={styles.document__button_success}>
                                                        <Icon Svg={SuccessBlueIcon} width={24} height={24} />
                                                        <span>
                                                            {isPassport
                                                                ? "Подтверждено"
                                                                : isBroker && brokerIds[0] && isIdentityScanExist
                                                                    ? "Подтверждено"
                                                                    : "Подписано"}
                                                        </span>
                                                    </div>
                                                ) : shouldShowButton ? (
                                                    <Button
                                                        onClick={() => handleSignDocument(doc.id)}
                                                        disabled={doc.isDisabled}
                                                        className={`${doc.colorClass} ${styles.button}`}
                                                        theme={ButtonTheme.BLUE}
                                                    >
                                                        {buttonText}
                                                    </Button>
                                                ) : (isBroker && isAnotherBroker) ? (
                                                    <div className={styles.document__waitingStatus}>
                                                        <span>Ожидается подтверждение</span>
                                                    </div>
                                                ) : null}

                                            </div>
                                        </div></div>
                                ) : (

                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <div key={doc.id} className={`${styles.document__item} ${isBroker && isAnotherBroker ? styles.document__item_skeleton : ''}`}>
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
                                                    {shouldShowViewButton && (
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
                                                                            pointer
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

                                                {doc.isPayment ? (
                                                    <div className={styles.document__paymentStatus}>Оплачено</div>
                                                ) : showSuccess ? (
                                                    <div className={styles.document__button_success}>
                                                        <Icon Svg={SuccessBlueIcon} width={24} height={24} />
                                                        <span>
                                                            {isPassport
                                                                ? "Подтверждено"
                                                                : isBroker && brokerIds[0] && isIdentityScanExist
                                                                    ? "Подтверждено"
                                                                    : "Подписано"}
                                                        </span>
                                                    </div>
                                                ) : shouldShowButton ? (
                                                    <Button
                                                        onClick={() => handleSignDocument(doc.id)}
                                                        disabled={doc.isDisabled}
                                                        className={`${doc.colorClass} ${styles.button}`}
                                                        theme={ButtonTheme.BLUE}
                                                    >
                                                        {buttonText}
                                                    </Button>
                                                ) : (isBroker && isAnotherBroker) ? (
                                                    <div className={styles.document__waitingStatus}>
                                                        <span>Ожидается подтверждение</span>
                                                    </div>
                                                ) : null}

                                            </div>
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
            <ConfirmAllDocsOneCodeModal
                isOpen={modalState.confirmAllDocumentsOneCode.isOpen}
                onClose={() => {
                    dispatch(closeModal(ModalType.CONFIRM_ALL_DOCS_ONE_CODE));
                }}

            />
            <CheckPreviewModal
                isOpen={modalState.checksPreview.isOpen}
                checkId={modalState.checksPreview.docId}
                onClose={() => dispatch(closeModal(ModalType.CHECKS_PREVIEW))}
            />
            {bulkOpen && (
                <BulkSignModal
                    docs={documents.filter((d) => selectedDocs.includes(d.id))}
                    onClose={() => {
                        setSelectedDocs([])
                        setBulkOpen(false)
                    }}
                />
            )}
        </div>
    );
};

export default DocumentsPage;
