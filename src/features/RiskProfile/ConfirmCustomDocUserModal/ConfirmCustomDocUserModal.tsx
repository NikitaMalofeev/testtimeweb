import React, { memo, useState, useRef, useEffect, useLayoutEffect } from "react";
import { Modal } from "shared/ui/Modal/Modal";
import styles from "./styles.module.scss";
import { useSelector } from "react-redux";
import { Button, ButtonTheme } from "shared/ui/Button/Button";
import { useAppDispatch } from "shared/hooks/useAppDispatch";
import { RootState } from "app/providers/store/config/store";
import {
    closeModal,
    openModal,
    setCurrentProblemScreen,
    setModalScrolled
} from "entities/ui/Modal/slice/modalSlice";
import { ModalAnimation, ModalSize, ModalType } from "entities/ui/Modal/model/modalTypes";
import { selectModalState } from "entities/ui/Modal/selectors/selectorsModals";
import { setConfirmationDocsSuccess } from "entities/ui/Ui/slice/uiSlice";
import { checkConfirmationCodeUserThunk } from "entities/Documents/slice/documentsSlice";
import { setError } from "entities/Error/slice/errorSlice";

interface ConfirmCustomDocUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    documentId: string;
    openSuccessModal?: () => void;
}

export const ConfirmCustomDocUserModal = memo(
    ({ isOpen, onClose, documentId, openSuccessModal }: ConfirmCustomDocUserModalProps) => {
        const dispatch = useAppDispatch();
        const modalState = useSelector((state: RootState) => state.modal);
        const { confirmationMethod } = useSelector((state: RootState) => state.documents);
        const docsSuccess = useSelector((state: RootState) => state.ui.confirmationDocs);
        const hasNoTryPhoneConfirm = docsSuccess === "не определено";
        const userInfo = useSelector((state: RootState) => state.user.userPersonalAccountInfo);
        const [phoneTimeLeft, setPhoneTimeLeft] = useState(60);
        const [phoneTimerActive, setPhoneTimerActive] = useState(false);
        const [isCodeSubmitting, setIsCodeSubmitting] = useState(false);

        useEffect(() => {
            if (isOpen) {
                setPhoneTimeLeft(60);
                setPhoneTimerActive(true);
                setIsCodeSubmitting(false); // сбрасываем флаг при открытии модала
            } else {
                setPhoneTimerActive(false);
                setIsCodeSubmitting(false);
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
        const [smsCode, setSmsCode] = useState<string[]>(Array(codeLength).fill(""));
        const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

        useEffect(() => {
            setSmsCode(Array(codeLength).fill(""));
        }, [confirmationMethod, codeLength]);

        const handleInputChange = (value: string, index: number) => {
            if (value.length > 1) {
                const digits = value.slice(0, codeLength).split('');
                const newCode = Array(codeLength).fill("");
                for (let i = 0; i < codeLength; i++) {
                    newCode[i] = digits[i] || "";
                }
                setSmsCode(newCode);
                if (digits.length < codeLength) {
                    inputRefs.current[digits.length]?.focus();
                } else {
                    inputRefs.current[codeLength - 1]?.blur();
                }
            } else {
                const newCode = [...smsCode];
                newCode[index] = value.slice(0, 1);
                setSmsCode(newCode);
                if (value && index < inputRefs.current.length - 1) {
                    inputRefs.current[index + 1]?.focus();
                }
            }
        };

        useEffect(() => {
            dispatch(setConfirmationDocsSuccess("не определено"));
        }, [documentId]);

        const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
            if (e.key === "Backspace" && !smsCode[index] && index > 0) {
                const newCode = [...smsCode];
                newCode[index - 1] = "";
                setSmsCode(newCode);
                inputRefs.current[index - 1]?.focus();
            }
        };

        const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
            e.preventDefault();
            const pasteData = e.clipboardData.getData("text");
            const pasteValue = pasteData.slice(0, codeLength).split("");
            const newCode = [...smsCode];
            for (let i = 0; i < codeLength; i++) {
                newCode[i] = pasteValue[i] || "";
            }
            setSmsCode(newCode);
            if (pasteValue.length < codeLength) {
                inputRefs.current[pasteValue.length]?.focus();
            }
        };

        const handleResetPhoneTimer = () => {
            setPhoneTimeLeft(60);
            setPhoneTimerActive(true);
        };

        const renderFormText = () => {
            if (confirmationMethod === "WHATSAPP") {
                return (
                    <span className={styles.modalContent__description}>
                        Код направлен в WhatsApp <b>{userInfo?.phone || ''}</b>
                    </span>
                );
            } else if (confirmationMethod === "EMAIL") {
                return (
                    <span className={styles.modalContent__description}>
                        Код направлен на почту <b>{userInfo?.email || ''}</b>
                    </span>
                );
            }
            return (
                <span className={styles.modalContent__description}>
                    Код направлен на телефон <b>{userInfo?.phone || ''}</b>
                </span>
            );
        };

        // При полном вводе кода отправляем запрос на подтверждение
        useEffect(() => {
            if (smsCode.every(digit => digit !== "") && documentId && !isCodeSubmitting) {
                setIsCodeSubmitting(true);
                const code = smsCode.join("");
                dispatch(checkConfirmationCodeUserThunk({
                    data: { id: documentId, code },
                    onSuccess: (data: any) => {
                        setSmsCode(Array(codeLength).fill(""));
                        setIsCodeSubmitting(false);
                        if (openSuccessModal) {
                            openSuccessModal();
                        } else {
                            onClose();
                        }
                    },

                }));
            }
        }, [smsCode, documentId, dispatch, openSuccessModal, onClose, codeLength, isCodeSubmitting]);

        return (
            <Modal
                isOpen={isOpen}
                onClose={onClose}
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
                        {renderFormText()}
                        <div className={styles.codeInput__container}>
                            {smsCode.map((digit, index) => {
                                const inputBorderColor =
                                    docsSuccess === "не пройдено"
                                        ? "#FF3C53"
                                        : digit
                                            ? "#2977E2"
                                            : (hasNoTryPhoneConfirm ? "#D4D4E8" : "#1CC15A");
                                return (
                                    <input
                                        key={`user-form-${index}`}
                                        type="text"
                                        maxLength={1}
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        value={digit}
                                        autoComplete="one-time-code"
                                        name={`otp-${index}`}
                                        onChange={(e) => handleInputChange(e.target.value, index)}
                                        onKeyDown={(e) => handleKeyDown(e, index)}
                                        onPaste={handlePaste}
                                        ref={(el) => (inputRefs.current[index] = el)}
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
                                dispatch(setCurrentProblemScreen(`custom_doc_user_${documentId}`));
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