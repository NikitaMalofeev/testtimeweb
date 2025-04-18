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
import { setTooltipActive, setConfirmationDocsSuccess, setStepAdditionalMenuUI } from "entities/ui/Ui/slice/uiSlice";
import { clearDocumentTimeout, confirmDocsRequestThunk, getUserDocumentsStateThunk, sendDocsConfirmationCode, setDocumentTimeoutPending } from "entities/Documents/slice/documentsSlice";
import { ConfirmDocsPayload } from "entities/Documents/types/documentsTypes";

interface ConfirmCustomDocsModalProps {
    isOpen: boolean;
    onClose: () => void;
    docsType?: string;
    openSuccessModal?: (docsType?: string) => void;
}

export const ConfirmCustomDocsModal = memo(
    ({ isOpen, onClose, docsType, openSuccessModal }: ConfirmCustomDocsModalProps) => {
        const dispatch = useAppDispatch();
        const modalState = useSelector((state: RootState) => state.modal);
        const { confirmationMethod } = useSelector((state: RootState) => state.documents);
        const docsSuccess = useSelector((state: RootState) => state.ui.confirmationDocs);
        const hasNoTryPhoneConfirm = docsSuccess === "не определено";
        const userInfo = useSelector((state: RootState) => state.user.userPersonalAccountInfo);
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
            // dispatch(
            //     //FIX
            //     confirmDocsRequestThunk({ data: lastData, onSuccess: () => { } })
            // );
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
                dispatch(
                    //FIX
                    sendDocsConfirmationCode({
                        codeFirst: code,
                        docs: docsType || "",
                        onSuccess: (data: any) => {
                            setSmsCodeFirst(Array(codeLength).fill(""));


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
        }, [smsCodeFirst]);


        return (
            <Modal
                isOpen={isOpen}
                onClose={onClose}
                // FIX
                animation={modalState[ModalType.CONFIRM_CODE].animation}
                size={modalState[ModalType.CONFIRM_CODE].size}
                withCloseIcon
                withTitle={<span>Подтверждение документов</span>}
                type={ModalType.CONFIRM_CODE}
            >
                <div
                    className={`${styles.modalContent} ${isScrolled && styles.modalContent__shadow_top}`}
                    ref={contentRef}
                    style={{ overflow: "auto" }}
                >
                    <div className={styles.modalContent__head}>
                        {renderFirstFormText()}
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
