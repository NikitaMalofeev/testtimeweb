// ConfirmDocsModal.tsx
import React, {
    memo,
    useState,
    useRef,
    useEffect,
    useLayoutEffect
} from "react";
import { Modal } from "shared/ui/Modal/Modal";
import styles from "./styles.module.scss";
import { useSelector } from "react-redux";
import { Tooltip } from "shared/ui/Tooltip/Tooltip";
import { Button, ButtonTheme } from "shared/ui/Button/Button";
import { useAppDispatch } from "shared/hooks/useAppDispatch";
import {
    resendConfirmationCode,
} from "entities/RiskProfile/slice/riskProfileSlice";
import { RootState } from "app/providers/store/config/store";
import {
    closeModal,
    openModal,
    setCurrentProblemScreen,
    setModalScrolled
} from "entities/ui/Modal/slice/modalSlice";
import {
    ModalAnimation,
    ModalSize,
    ModalType
} from "entities/ui/Modal/model/modalTypes";
import { selectModalState } from "entities/ui/Modal/selectors/selectorsModals";
import {
    setTooltipActive,
    setConfirmationDocsSuccess,
    setStepAdditionalMenuUI
} from "entities/ui/Ui/slice/uiSlice";
import { confirmDocsRequestThunk, docTypes, nextDocType, sendDocsConfirmationCode } from "entities/Documents/slice/documentsSlice";
import { ConfirmDocsPayload } from "entities/Documents/types/documentsTypes";

interface ConfirmInfoModalProps {
    isOpen: boolean;
    onClose: () => void;
    docsType?: string;
    lastData: ConfirmDocsPayload;
}

export const ConfirmDocsModal = memo(
    ({ isOpen, onClose, docsType, lastData }: ConfirmInfoModalProps) => {
        const dispatch = useAppDispatch();
        const modalState = useSelector((state: RootState) => state.modal);

        // Состояние успеха/неуспеха подтверждения
        const docsSuccess = useSelector(
            (state: RootState) => state.ui.confirmationDocs
        );

        const hasNoTryPhoneConfirm = docsSuccess === "не определено";
        const confirmationMethod = modalState.confirmationMethod;

        const { phone } = useSelector((state: RootState) => state.user.user);
        const userId = useSelector((state: RootState) => state.user.userId);

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

        // Инпуты для формы (телефон/WhatsApp)
        const [smsCodeFirst, setSmsCodeFirst] = useState<string[]>(
            Array(codeLength).fill("")
        );
        const inputRefsFirst = useRef<(HTMLInputElement | null)[]>([]);

        useEffect(() => {
            setSmsCodeFirst(Array(codeLength).fill(""));
        }, [confirmationMethod, codeLength]);

        const handleInputChangeFirst = (value: string, index: number) => {
            const newCode = [...smsCodeFirst];
            newCode[index] = value.slice(0, 1);
            setSmsCodeFirst(newCode);
            if (value && index < inputRefsFirst.current.length - 1) {
                inputRefsFirst.current[index + 1]?.focus();
            }
        };

        useEffect(() => {
            dispatch(setConfirmationDocsSuccess("не определено"));
        }, [docsType]);

        const handleKeyDownFirst = (
            e: React.KeyboardEvent<HTMLInputElement>,
            index: number
        ) => {
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

        // Повторная отправка кода
        const handleResetPhoneTimer = () => {
            dispatch(
                confirmDocsRequestThunk({ data: lastData, onSuccess: () => { } })
            );
            setPhoneTimeLeft(60);
            setPhoneTimerActive(true);
        };

        const renderFirstFormText = () => {
            if (confirmationMethod === "whatsapp") {
                return (
                    <span className={styles.modalContent__description}>
                        Код направлен в WhatsApp <b>{phone}</b>, указанный при идентификации
                    </span>
                );
            }
            return (
                <span className={styles.modalContent__description}>
                    Код направлен на телефон <b>{phone}</b>, указанный при идентификации
                </span>
            );
        };

        // При изменении smsCodeFirst проверяем, введён ли код полностью
        useEffect(() => {
            const code = smsCodeFirst.join("");
            if (code.length === codeLength) {
                // Отправляем запрос на подтверждение
                dispatch(
                    sendDocsConfirmationCode({
                        codeFirst: code,
                        docs: docsType || "",
                        onSuccess: (data: any) => {
                            // Обновляем статус
                            // dispatch(
                            //     setConfirmationDocsSuccess(
                            //         data.is_confirmed_phone ? "пройдено" : "не пройдено"
                            //     )
                            // );
                            dispatch(
                                setTooltipActive({
                                    active: true,
                                    message: "Данные успешно подтверждены"
                                })
                            );
                            if (docsType === 'type_doc_passport') {
                                dispatch(setStepAdditionalMenuUI(3))
                            }

                            if (docsType === 'type_doc_investment_profile_certificate') {
                                dispatch(setStepAdditionalMenuUI(5))
                            }
                            // dispatch(nextDocType());
                            setSmsCodeFirst(Array(codeLength).fill(""));
                            onClose();
                        },
                        onClose: () => onClose()
                    })
                );
            }
        }, [smsCodeFirst]);

        // ===============================================

        return (
            <Modal
                isOpen={isOpen}
                onClose={onClose}
                animation={modalState[ModalType.CONFIRM_CODE].animation}
                size={modalState[ModalType.CONFIRM_CODE].size}
                withCloseIcon
                withTitle="Подтверждение документов"
                type={ModalType.CONFIRM_CODE}
            >
                <div
                    className={`
              ${styles.modalContent} 
              ${isScrolled && styles.modalContent__shadow_top}
            `}
                    ref={contentRef}
                    style={{ overflow: "auto" }}
                >
                    {/* ====== Блок ввода кода (телефон/WhatsApp) ====== */}
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
                            {smsCodeFirst.map((digit, index) => (
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
                                    style={{
                                        borderColor: hasNoTryPhoneConfirm
                                            ? "#D4D4E8"
                                            : docsSuccess === "не пройдено"
                                                ? "#FF3C53"
                                                : "#1CC15A"
                                    }}
                                />
                            ))}
                        </div>

                        <div
                            className={styles.modalContent__problems}
                            onClick={() => {
                                if (!phoneTimerActive) {
                                    handleResetPhoneTimer();
                                }
                            }}
                        >
                            <div
                                className={styles.timer}
                                style={!phoneTimerActive ? { color: "#045FDD" } : {}}
                            >
                                {phoneTimerActive
                                    ? `Отправить код снова через: 0${Math.floor(
                                        phoneTimeLeft / 60
                                    )}:${String(phoneTimeLeft % 60).padStart(2, "0")}`
                                    : "Отправить код снова"}
                            </div>
                        </div>
                    </div>

                    {/* Кнопка "Проблемы с получением кода" */}
                    <div className={styles.buttonGroup}>
                        <Button
                            theme={ButtonTheme.UNDERLINE}
                            onClick={() => {
                                dispatch(setCurrentProblemScreen(docsType))
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
