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

    sendEmailConfirmationCode,
    sendPhoneConfirmationCode
} from "entities/RiskProfile/slice/riskProfileSlice";
import { RootState } from "app/providers/store/config/store";
import {
    closeModal,
    openModal,
    setModalScrolled
} from "entities/ui/Modal/slice/modalSlice";
import {
    ModalAnimation,
    ModalSize,
    ModalType
} from "entities/ui/Modal/model/modalTypes";
import { selectModalState } from "entities/ui/Modal/selectors/selectorsModals";
import {
    nextStep,
    setTooltipActive,
    setConfirmationPhoneSuccess,
    setConfirmationEmailSuccess,
    setConfirmationWhatsappSuccess
} from "entities/ui/Ui/slice/uiSlice";

interface ConfirmInfoModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ConfirmInfoModal = memo(({ isOpen, onClose }: ConfirmInfoModalProps) => {
    const dispatch = useAppDispatch();
    const modalState = useSelector((state: RootState) => state.modal);

    // Состояния успеха/неуспеха подтверждения
    const phoneSuccess = useSelector((state: RootState) => state.ui.confirmationPhoneSuccess)
    const emailSuccess = useSelector((state: RootState) => state.ui.confirmationEmailSuccess);
    const whatsappSuccess = useSelector((state: RootState) => state.ui.confirmationWhatsappSuccess);

    const hasNoTryPhoneConfirm = phoneSuccess === 'не определено'
    const hasNoTryEmailConfirm = emailSuccess === 'не определено'
    const hasNoTryWhatsappConfirm = whatsappSuccess === 'не определено'
    // Определяем метод подтверждения
    const confirmationMethod = modalState.confirmationMethod;


    // Данные пользователя
    const { phone, email } = useSelector((state: RootState) => state.user.user);
    const userId = useSelector((state: RootState) => state.user.userId);

    // Флаг двойного подтверждения (телефон/whatsapp + email)
    const isDoubleConfirmationMethod =
        confirmationMethod === "phone" || confirmationMethod === "whatsapp";

    // --------------------- ТАЙМЕРЫ ---------------------
    const [phoneTimeLeft, setPhoneTimeLeft] = useState(60);
    const [phoneTimerActive, setPhoneTimerActive] = useState(false);

    const [emailTimeLeft, setEmailTimeLeft] = useState(60);
    const [emailTimerActive, setEmailTimerActive] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setPhoneTimeLeft(60);
            setPhoneTimerActive(true);

            if (isDoubleConfirmationMethod) {
                setEmailTimeLeft(60);
                setEmailTimerActive(true);
            }
        } else {
            setPhoneTimerActive(false);
            setEmailTimerActive(false);
        }
    }, [isOpen, isDoubleConfirmationMethod]);

    useEffect(() => {
        let timer: NodeJS.Timeout;
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

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (emailTimerActive) {
            timer = setInterval(() => {
                setEmailTimeLeft((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        setEmailTimerActive(false);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [emailTimerActive]);
    // -------------------------------------------------

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
    }, [dispatch]);

    const codeLength = 4;

    // Инпуты для формы (телефон/WhatsApp)
    const [smsCodeFirst, setSmsCodeFirst] = useState<string[]>(Array(codeLength).fill(""));
    const inputRefsFirst = useRef<(HTMLInputElement | null)[]>([]);

    // Инпуты для формы (email)
    const [smsCodeSecond, setSmsCodeSecond] = useState<string[]>(Array(codeLength).fill(""));
    const inputRefsSecond = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        setSmsCodeFirst(Array(codeLength).fill(""));
        setSmsCodeSecond(Array(codeLength).fill(""));
    }, [])

    // При смене метода подтверждения сбрасываем коды
    useEffect(() => {
        setSmsCodeFirst(Array(codeLength).fill(""));
        setSmsCodeSecond(Array(codeLength).fill(""));
    }, [confirmationMethod, codeLength]);

    // ---- Обработчики ввода для ПЕРВОЙ формы (телефон/WhatsApp) ----
    const handleInputChangeFirst = (value: string, index: number) => {
        const newCode = [...smsCodeFirst];
        newCode[index] = value.slice(0, 1);
        setSmsCodeFirst(newCode);
        if (value && index < inputRefsFirst.current.length - 1) {
            inputRefsFirst.current[index + 1]?.focus();
        }
    };

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

    // ---- Обработчики ввода для ВТОРОЙ формы (email) ----
    const handleInputChangeSecond = (value: string, index: number) => {
        const newCode = [...smsCodeSecond];
        newCode[index] = value.slice(0, 1);
        setSmsCodeSecond(newCode);
        if (value && index < inputRefsSecond.current.length - 1) {
            inputRefsSecond.current[index + 1]?.focus();
        }
    };

    const handleKeyDownSecond = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === "Backspace" && !smsCodeSecond[index] && index > 0) {
            const newCode = [...smsCodeSecond];
            newCode[index - 1] = "";
            setSmsCodeSecond(newCode);
            inputRefsSecond.current[index - 1]?.focus();
        }
    };

    const handlePasteSecond = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pasteData = e.clipboardData.getData("text");
        const pasteValue = pasteData.slice(0, codeLength).split("");
        const newCode = [...smsCodeSecond];
        for (let i = 0; i < codeLength; i++) {
            newCode[i] = pasteValue[i] || "";
        }
        setSmsCodeSecond(newCode);
        if (pasteValue.length < codeLength) {
            inputRefsSecond.current[pasteValue.length]?.focus();
        }
    };

    // ---- Повторная отправка кода (таймеры) ----
    const handleResetPhoneTimer = () => {
        if (!userId) return;
        dispatch(resendConfirmationCode({ user_id: userId, method: confirmationMethod }));
        setPhoneTimeLeft(60);
        setPhoneTimerActive(true);
    };

    const handleResetEmailTimer = () => {
        if (!userId) return;
        dispatch(resendConfirmationCode({ user_id: userId, method: "email" }));
        setEmailTimeLeft(60);
        setEmailTimerActive(true);
    };

    // Текст для ПЕРВОЙ формы (phone / whatsapp)
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


    // Автоотправка для первой формы (телефон/WhatsApp)
    useEffect(() => {
        const code = smsCodeFirst.join("");
        if (code.length === codeLength) {
            // setSubmittingFirst(true);
            dispatch(
                sendPhoneConfirmationCode({
                    user_id: userId ?? "",
                    codeFirst: code,
                    method: confirmationMethod,
                    onSuccess: (data: any) => {
                        // setSubmittingFirst(false);
                        // Обновляем статус для телефона или WhatsApp в зависимости от метода
                        dispatch(
                            setConfirmationPhoneSuccess(
                                data.is_confirmed_phone ? 'пройдено' : 'не пройдено'
                            )
                        );
                        dispatch(
                            setTooltipActive({
                                active: true,
                                message: "Данные успешно подтверждены",
                            })
                        );
                    },
                })
            );
        }
    }, [smsCodeFirst, userId, confirmationMethod]);

    useEffect(() => {
        const code = smsCodeSecond.join("");
        if (code.length === codeLength) {
            dispatch(
                sendEmailConfirmationCode({
                    user_id: userId ?? "",
                    codeSecond: code, // Теперь передается правильно
                    onSuccess: (data: any) => {
                        dispatch(
                            setConfirmationEmailSuccess(
                                data.is_confirmed_email ? "пройдено" : "не пройдено"
                            )
                        );
                        dispatch(
                            setTooltipActive({
                                active: true,
                                message: "Данные успешно подтверждены",
                            })
                        );
                    },
                })
            );
        }
    }, [smsCodeSecond, userId]);



    // Если необходимо закрыть модалку, когда оба запроса завершены
    useEffect(() => {
        if ((phoneSuccess === "пройдено" || whatsappSuccess === "пройдено") && emailSuccess === "пройдено") {
            dispatch(nextStep());
            onClose();
        }
    }, [phoneSuccess, whatsappSuccess, emailSuccess]);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            animation={modalState[ModalType.CONFIRM_CODE].animation}
            size={modalState[ModalType.CONFIRM_CODE].size}
            withCloseIcon
            withTitle="Подтверждение данных"
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
                {/* --- Форма для телефона / WhatsApp --- */}
                <div className={styles.modalContent__head}>
                    {renderFirstFormText()}

                    <Tooltip
                        positionBox={{ top: "26px", left: "-264px" }}
                        squerePosition={{ top: "15px", left: "241px" }}
                        topForCenteringIcons="24px"
                        className={styles.modalContent__tooltip}
                        description="Настройка параметров защиты цифрового профиля от несанкционированного доступа"
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
                                    borderColor: hasNoTryPhoneConfirm ? "#D4D4E8" : phoneSuccess === 'не пройдено' ? "#FF3C53" : "#1CC15A"
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
                            style={!phoneTimerActive ? { color: "#0666EB" } : {}}
                        >
                            {phoneTimerActive
                                ? `Отправить код снова через: 0${Math.floor(phoneTimeLeft / 60)}:${String(
                                    phoneTimeLeft % 60
                                ).padStart(2, "0")}`
                                : "Отправить код снова"}
                        </div>
                    </div>
                </div>

                {/* --- Форма для e-mail (только при двойном подтверждении) --- */}
                {isDoubleConfirmationMethod && (
                    <div className={styles.modalContent__head}>
                        <span className={styles.modalContent__description}>
                            Код направлен на <b>{email}</b>, указанный при идентификации
                        </span>

                        <Tooltip
                            positionBox={{ top: "26px", left: "-264px" }}
                            squerePosition={{ top: "15px", left: "241px" }}
                            topForCenteringIcons="24px"
                            className={styles.modalContent__tooltip}
                            description="Настройка параметров защиты цифрового профиля от несанкционированного доступа"
                        />

                        <div className={styles.codeInput__container}>
                            {smsCodeSecond.map((digit, index) => (
                                <input
                                    key={`second-form-${index}`}
                                    type="text"
                                    maxLength={1}
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    value={digit}
                                    autoComplete="one-time-code"
                                    name={`otp-second-${index}`}
                                    onChange={(e) => handleInputChangeSecond(e.target.value, index)}
                                    onKeyDown={(e) => handleKeyDownSecond(e, index)}
                                    onPaste={handlePasteSecond}
                                    ref={(el) => (inputRefsSecond.current[index] = el)}
                                    className={styles.codeInput__box}
                                    style={{
                                        borderColor: hasNoTryEmailConfirm ? "#D4D4E8" : emailSuccess === 'не пройдено' ? "#FF3C53" : "#1CC15A"
                                    }}
                                />
                            ))}
                        </div>

                        <div
                            className={styles.modalContent__problems}
                            onClick={() => {
                                if (!emailTimerActive) {
                                    handleResetEmailTimer();
                                }
                            }}
                        >
                            <div
                                className={styles.timer}
                                style={!emailTimerActive ? { color: "#0666EB" } : {}}
                            >
                                {emailTimerActive
                                    ? `Отправить код снова через: 0${Math.floor(emailTimeLeft / 60)}:${String(
                                        emailTimeLeft % 60
                                    ).padStart(2, "0")}`
                                    : "Отправить код снова"}
                            </div>
                        </div>
                    </div>
                )}

                {/* Кнопка "Проблемы с получением кода" */}
                <div className={styles.buttonGroup}>
                    <Button
                        theme={ButtonTheme.UNDERLINE}
                        onClick={() => {
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
});
