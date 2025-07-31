import React, { memo, useState, useRef, useEffect, useLayoutEffect } from "react";
import { Modal } from "shared/ui/Modal/Modal";
import styles from "./styles.module.scss";
import { useSelector } from "react-redux";
import { Tooltip } from "shared/ui/Tooltip/Tooltip";
import { Button, ButtonTheme } from "shared/ui/Button/Button";
import { useAppDispatch } from "shared/hooks/useAppDispatch";
import { resendConfirmationCode } from "entities/RiskProfile/slice/riskProfileSlice";
import { RootState } from "app/providers/store/config/store";
import {
    closeAllModals,
    closeModal,
    openModal,
    setCurrentProblemScreen,
    setModalScrolled
} from "entities/ui/Modal/slice/modalSlice";
import { ModalAnimation, ModalSize, ModalType } from "entities/ui/Modal/model/modalTypes";
import { selectModalState } from "entities/ui/Modal/selectors/selectorsModals";
import { setTooltipActive, setConfirmationDocsSuccess, setStepAdditionalMenuUI, nextStep } from "entities/ui/Ui/slice/uiSlice";
import { clearDocumentTimeout, confirmDocsRequestThunk, getUserDocumentsStateThunk, sendDocsConfirmationCode, setCurrentConfirmableDoc, setDocumentTimeoutPending } from "entities/Documents/slice/documentsSlice";
import { ConfirmDocsPayload } from "entities/Documents/types/documentsTypes";
import { checkConfirmationCodeTariffThunk, setCurrentOrderStatus, createOrderThunk } from "entities/Payments/slice/paymentsSlice";
import { useNavigate } from "react-router-dom";

interface ConfirmInfoModalProps {
    isOpen: boolean;
    onClose: () => void;
    docsType?: string;
    lastData: ConfirmDocsPayload;
    confirmationPurpose?: string;
    title?: string;
    openSuccessModal?: (docsType?: string) => void;
}

export const ConfirmDocsModal = memo(
    ({ isOpen, onClose, docsType, lastData, confirmationPurpose, title, openSuccessModal }: ConfirmInfoModalProps) => {
        const dispatch = useAppDispatch();
        const navigate = useNavigate()
        const modalState = useSelector((state: RootState) => state.modal);
        const { confirmationMethod } = useSelector((state: RootState) => state.documents);
        const confirmOneCode = useSelector((state: RootState) => state.user.userPersonalAccountInfo?.is_confirm_all_documents_one_code);
        const docsSuccess = useSelector((state: RootState) => state.ui.confirmationDocs);
        const isRPFilled = useSelector((state: RootState) => state.documents.filledRiskProfileChapters.is_risk_profile_complete);
        const isRPFinalFilled = useSelector((state: RootState) => state.documents.filledRiskProfileChapters.is_risk_profile_complete);
        const hasNoTryPhoneConfirm = docsSuccess === "не определено";
        const userInfo = useSelector((state: RootState) => state.user.userPersonalAccountInfo);
        const paymentsTariffId = useSelector((state: RootState) => state.payments.currentUserTariffIdForPayments);
        const [phoneTimeLeft, setPhoneTimeLeft] = useState(60);
        const [phoneTimerActive, setPhoneTimerActive] = useState(false);

        useEffect(() => {
            if (isOpen) {
                setPhoneTimeLeft(60);
                setPhoneTimerActive(true);
            } else {
                setPhoneTimerActive(false);
            }
        }, [isOpen]);

        const handleModalClose = () => {
            // 1. Сбрасываем код
            setSmsCodeFirst(Array(codeLength).fill(""));
            // 2. Сбрасываем статус подтверждения, чтобы borderColor перешёл в исходный
            dispatch(setConfirmationDocsSuccess("не определено"));
            // 3. Вызываем переданный коллбэк закрытия
            onClose();
        };

        useEffect(() => {
            let timer: ReturnType<typeof setInterval>;
            if (phoneTimerActive) {
                timer = setInterval(() => {
                    setPhoneTimeLeft((prev) => {
                        if (prev <= 1) {
                            clearInterval(timer);
                            setPhoneTimerActive(false);
                            return 0;
                        }
                        return prev - 1;
                    });
                }, 1000);
            }
            return () => clearInterval(timer);
        }, [phoneTimerActive]);

        const contentRef = useRef<HTMLDivElement>(null);
        const isScrolled = useSelector((state: RootState) =>
            selectModalState(state, ModalType.CONFIRM_CODE)?.isScrolled
        );

        useLayoutEffect(() => {
            const handleScroll = () => {
                if (contentRef.current) {
                    const { scrollTop } = contentRef.current;
                    dispatch(
                        setModalScrolled({
                            type: ModalType.CONFIRM_CODE,
                            isScrolled: scrollTop > 0
                        })
                    );
                }
            };
            const content = contentRef.current;
            if (content) {
                content.addEventListener("scroll", handleScroll);
                handleScroll();
            }
            return () => {
                if (content) {
                    content.removeEventListener("scroll", handleScroll);
                }
            };
        }, []);

        const codeLength = 4;
        const [smsCodeFirst, setSmsCodeFirst] = useState<string[]>(Array(codeLength).fill(""));
        const inputRefsFirst = useRef<(HTMLInputElement | null)[]>([]);

        useEffect(() => {
            setSmsCodeFirst(Array(codeLength).fill(""));
        }, [confirmationMethod, codeLength]);

        const handleInputChangeFirst = (value: string, index: number) => {
            if (value.length > 1) {
                const digits = value.slice(0, codeLength).split('');
                const newCode = Array(codeLength).fill("");
                for (let i = 0; i < codeLength; i++) {
                    newCode[i] = digits[i] || "";
                }
                setSmsCodeFirst(newCode);
                if (digits.length < codeLength) {
                    inputRefsFirst.current[digits.length]?.focus();
                } else {
                    inputRefsFirst.current[codeLength - 1]?.blur();
                }
            } else {
                const newCode = [...smsCodeFirst];
                newCode[index] = value.slice(0, 1);
                setSmsCodeFirst(newCode);
                if (value && index < inputRefsFirst.current.length - 1) {
                    inputRefsFirst.current[index + 1]?.focus();
                }
            }
        };

        useEffect(() => {
            dispatch(setConfirmationDocsSuccess("не определено"));
        }, [docsType]);

        const handleKeyDownFirst = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
            if (e.key === "Backspace" && !smsCodeFirst[index] && index > 0) {
                const newCode = [...smsCodeFirst];
                newCode[index - 1] = "";
                setSmsCodeFirst(newCode);
                inputRefsFirst.current[index - 1]?.focus();
            }
        };

        const handlePasteFirst = (e: React.ClipboardEvent<HTMLInputElement>) => {
            e.preventDefault();
            const pasteData = e.clipboardData.getData("text");
            const pasteValue = pasteData.slice(0, codeLength).split("");
            const newCode = [...smsCodeFirst];
            for (let i = 0; i < codeLength; i++) {
                newCode[i] = pasteValue[i] || "";
            }
            setSmsCodeFirst(newCode);
            if (pasteValue.length < codeLength) {
                inputRefsFirst.current[pasteValue.length]?.focus();
            }
        };

        const handleResetPhoneTimer = () => {
            dispatch(
                confirmDocsRequestThunk({ data: lastData, onSuccess: () => { } })
            );
            setPhoneTimeLeft(60);
            setPhoneTimerActive(true);
        };

        const renderFirstFormText = () => {
            if (confirmationMethod === "WHATSAPP") {
                return (
                    <span className={styles.modalContent__description}>
                        Код направлен в WhatsApp <b>{userInfo?.phone}</b>, указанный при регистрации
                    </span>
                );
            } else if (confirmationMethod === "EMAIL") {
                return (
                    <span className={styles.modalContent__description}>
                        Код направлен на почту <b>{userInfo?.email}</b>, указанную при регистрации
                    </span>
                );
            }
            return (
                <span className={styles.modalContent__description}>
                    Код направлен на телефон <b>{userInfo?.phone}</b>, указанный при регистрации
                </span>
            );
        };

        // При полном вводе кода отправляем запрос на подтверждение
        useEffect(() => {
            const code = smsCodeFirst.join("");
            if (code.length === codeLength) {
                if (confirmationPurpose === 'payments') {
                    dispatch(checkConfirmationCodeTariffThunk({
                        tariff_id: paymentsTariffId,
                        code,
                        onSuccess: () => {
                            dispatch(createOrderThunk({
                                payload: {
                                    tariff_id: paymentsTariffId,
                                    payment_system: 'ROBOKASSA',
                                    payment_type: 'TARIFF_ACTIVATION',
                                    currency: 'RUB'
                                },
                                onSuccess: () => {
                                    dispatch(closeModal(ModalType.CONFIRM_DOCS))
                                    dispatch(setConfirmationDocsSuccess("пройдено"));
                                    dispatch(setCurrentOrderStatus('loading'))
                                    navigate('/payments/loading')
                                    dispatch(closeModal(ModalType.CONFIRM_DOCS))
                                }
                            }))
                        }
                    }))
                } if (docsType === 'type_doc_agreement_investment_advisor_app_1' && confirmationPurpose != 'payments') {
                    dispatch(checkConfirmationCodeTariffThunk({
                        tariff_id: paymentsTariffId,
                        code,
                        onSuccess: () => {
                            dispatch(createOrderThunk({
                                payload: {
                                    // tariff_id: paymentsTariffId,
                                    tariff_id: paymentsTariffId,
                                    payment_system: 'ROBOKASSA',
                                    payment_type: 'TARIFF_ACTIVATION',
                                    currency: 'RUB'
                                },
                                onSuccess: () => {
                                    dispatch(setConfirmationDocsSuccess("пройдено"));
                                    dispatch(setCurrentOrderStatus('loading'))
                                    navigate('/payments/loading')
                                    dispatch(closeModal(ModalType.CONFIRM_DOCS))
                                }
                            }))
                        }
                    }))
                } else {
                    console.log('отправляю код' + code)
                    dispatch(
                        sendDocsConfirmationCode({
                            codeFirst: code,
                            docs: docsType || "",
                            onSuccessLegal: () => {
                                dispatch(nextStep())
                                dispatch(nextStep())

                                if ((docsType === 'type_doc_EDS_agreement' || docsType === 'type_doc_person_legal') && confirmOneCode) {
                                    dispatch(closeModal(ModalType.IDENTIFICATION))

                                }
                            },
                            onSuccess: (data: any) => {

                                //бек не отправляет next_document на эти 2
                                if (docsType === 'type_doc_agreement_account_maintenance') {
                                    dispatch(setCurrentConfirmableDoc('type_doc_broker_api_token'));
                                }
                                if (docsType === 'type_doc_broker_api_token') {
                                    dispatch(setCurrentConfirmableDoc('type_doc_agreement_investment_advisor_app_1'));
                                }
                                //бек не отправляет next_document на эти 2


                                if ((docsType === 'type_doc_EDS_agreement' || docsType === 'type_doc_person_legal') && confirmOneCode) {
                                    dispatch(closeModal(ModalType.IDENTIFICATION))
                                }
                                dispatch(getUserDocumentsStateThunk());
                                if (docsType === 'type_doc_passport') {
                                    dispatch(setStepAdditionalMenuUI(3));
                                    console.log(1 + 'пробую перевести сразу в документы 4')
                                }

                                if (docsType === 'type_doc_EDS_agreement' && (isRPFilled && isRPFinalFilled)) {
                                    dispatch(setStepAdditionalMenuUI(4));
                                }
                                if (docsType === 'type_doc_broker_api_token') {
                                    dispatch(closeAllModals());
                                    document.body.style.overflow = '';
                                    document.body.style.position = '';
                                    document.body.style.width = '';
                                    document.documentElement.style.overflow = '';
                                }
                                setSmsCodeFirst(Array(codeLength).fill(""));

                                if (docsType) {
                                    dispatch(setDocumentTimeoutPending({ docKey: docsType, timeout: 10000 }));
                                }
                                if (openSuccessModal) {
                                    openSuccessModal(docsType);
                                } else {
                                    onClose();
                                }
                            },
                            onClose: () => onClose()
                        })
                    );
                }
            }
        }, [smsCodeFirst, isRPFilled, isRPFinalFilled]);


        return (
            <Modal
                isOpen={isOpen}
                onClose={handleModalClose}
                animation={modalState[ModalType.CONFIRM_CODE].animation}
                size={modalState[ModalType.CONFIRM_CODE].size}
                withCloseIcon
                withTitle={<span>Подтверждение документа: {title}</span>}
                type={ModalType.CONFIRM_CODE}
            >
                <div
                    className={`${styles.modalContent} ${isScrolled && styles.modalContent__shadow_top}`}
                    ref={contentRef}
                    style={{ overflow: "auto" }}
                >
                    <div className={styles.modalContent__head}>
                        {renderFirstFormText()}
                        <Tooltip
                            positionBox={{ top: "26px", left: "-264px" }}
                            squerePosition={{ top: "15px", left: "241px" }}
                            topForCenteringIcons="24px"
                            className={styles.modalContent__tooltip}
                            description="Настройка параметров защиты цифрового профиля"
                        />
                        <div className={styles.codeInput__container}>
                            {smsCodeFirst.map((digit, index) => {
                                const inputBorderColor =
                                    docsSuccess === "не пройдено"
                                        ? "#FF3C53"
                                        : digit
                                            ? "#2977E2"
                                            : (hasNoTryPhoneConfirm ? "#D4D4E8" : "#1CC15A");


                                return (
                                    <input
                                        key={`first-form-${index}`}
                                        type="text"
                                        maxLength={1}
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        value={digit}
                                        autoComplete="one-time-code"
                                        name={`otp-${index}`}
                                        onChange={(e) => handleInputChangeFirst(e.target.value, index)}
                                        onKeyDown={(e) => handleKeyDownFirst(e, index)}
                                        onPaste={handlePasteFirst}
                                        ref={(el) => (inputRefsFirst.current[index] = el)}
                                        className={styles.codeInput__box}
                                        style={{ borderColor: inputBorderColor }}
                                    />
                                );
                            })}
                        </div>
                        <div
                            className={styles.modalContent__problems}
                            onClick={() => {
                                if (!phoneTimerActive) {
                                    handleResetPhoneTimer();
                                }
                            }}
                        >
                            <div className={styles.timer} style={!phoneTimerActive ? { color: "#045FDD" } : {}}>
                                {phoneTimerActive
                                    ? `Отправить код снова через: 0${Math.floor(phoneTimeLeft / 60)}:${String(phoneTimeLeft % 60).padStart(2, "0")}`
                                    : "Отправить код снова"}
                            </div>
                        </div>
                    </div>
                    <div className={styles.buttonGroup}>
                        <Button
                            theme={ButtonTheme.UNDERLINE}
                            onClick={() => {
                                dispatch(setCurrentProblemScreen(docsType));
                                dispatch(
                                    openModal({
                                        type: ModalType.PROBLEM_WITH_CODE,
                                        size: ModalSize.MINI,
                                        animation: ModalAnimation.BOTTOM
                                    })
                                );
                            }}
                            className={styles.button}
                        >
                            Проблемы с получением кода
                        </Button>
                    </div>
                </div>
            </Modal>
        );
    }
);
