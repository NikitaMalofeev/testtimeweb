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
    sendConfirmationCode
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
import { nextStep, setTooltipActive } from "entities/ui/Ui/slice/uiSlice";

/**
 * Интерфейс для пропсов модального окна
 */
interface ConfirmInfoModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ConfirmInfoModal = memo(({ isOpen, onClose }: ConfirmInfoModalProps) => {
    const modalState = useSelector((state: RootState) => state.modal);
    const codeError = useSelector((state: RootState) => state.error.error);

    // Состояния успеха/неуспеха подтверждения
    const phoneSuccess = useSelector((state: RootState) => state.ui.confirmationPhoneSuccess);
    const emailSuccess = useSelector((state: RootState) => state.ui.confirmationEmailSuccess);
    const whatsappSuccess = useSelector((state: RootState) => state.ui.confirmationWhatsappSuccess);

    // Определяем метод подтверждения
    const confirmationMethod = modalState.confirmationMethod;

    // Проверяем флаги (ошибка / успех)
    const hasEmailConfirmationError = emailSuccess === "не пройдено";
    const hasWhatsAppConfirmationError = whatsappSuccess === "не пройдено";
    const hasPhoneConfirmationError = phoneSuccess === "не пройдено";

    const noEmailConfirmationError = emailSuccess === "пройдено";
    const noWhatsAppConfirmationError = whatsappSuccess === "пройдено";
    const noPhoneConfirmationError = phoneSuccess === "пройдено";

    // Данные пользователя
    const { phone, email } = useSelector((state: RootState) => state.user.user);
    const userId = useSelector((state: RootState) => state.user.userId);

    // Флаги о двойном подтверждении (телефон/whatsapp + email)
    const isDoubleConfirmationMethod =
        confirmationMethod === "phone" || confirmationMethod === "whatsapp";

    // --------------------- 2 ТАЙМЕРА ---------------------
    // 1) Таймер для телефона / WhatsApp
    const [phoneTimeLeft, setPhoneTimeLeft] = useState(60);
    const [phoneTimerActive, setPhoneTimerActive] = useState(false);

    // 2) Таймер для e-mail
    const [emailTimeLeft, setEmailTimeLeft] = useState(60);
    const [emailTimerActive, setEmailTimerActive] = useState(false);

    // При открытии модалки — запускаем нужные таймеры
    useEffect(() => {
        if (isOpen) {
            // Запускаем таймер для телефона/WhatsApp
            setPhoneTimeLeft(60);
            setPhoneTimerActive(true);

            // Если метод двойной, сразу запускаем и таймер e-mail
            if (isDoubleConfirmationMethod) {
                setEmailTimeLeft(60);
                setEmailTimerActive(true);
            }
        } else {
            // Если модалка закрылась — обнуляем
            setPhoneTimerActive(false);
            setEmailTimerActive(false);
        }
    }, [isOpen, isDoubleConfirmationMethod]);

    // Отсчитываем для телефона / WhatsApp
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

    // Отсчитываем для email
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
    // -----------------------------------------------------

    // Реф для скролла внутри модалки
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

    // Хук для экшенов
    const dispatch = useAppDispatch();

    // Длина кода
    const codeLength = 4;

    // Инпуты для первой формы (телефон/WhatsApp)
    const [smsCodeFirst, setSmsCodeFirst] = useState<string[]>(Array(codeLength).fill(""));
    const inputRefsFirst = useRef<(HTMLInputElement | null)[]>([]);

    // Инпуты для второй формы (email)
    const [smsCodeSecond, setSmsCodeSecond] = useState<string[]>(Array(codeLength).fill(""));
    const inputRefsSecond = useRef<(HTMLInputElement | null)[]>([]);

    // При смене метода подтверждения сбрасываем коды
    useEffect(() => {
        setSmsCodeFirst(Array(codeLength).fill(""));
        setSmsCodeSecond(Array(codeLength).fill(""));
    }, [confirmationMethod, codeLength]);

    // ---- Обработчики ввода для ПЕРВОЙ формы (телефон/whatsapp) ----
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

    // ---- Повторная отправка кода для телефона / WhatsApp ----
    const handleResetPhoneTimer = () => {
        if (!userId) return;
        // Отправляем код заново, метод берем из confirmationMethod (phone или whatsapp)
        dispatch(resendConfirmationCode({ user_id: userId, method: confirmationMethod }));

        setPhoneTimeLeft(60);
        setPhoneTimerActive(true);
    };

    // ---- Повторная отправка кода для e-mail ----
    const handleResetEmailTimer = () => {
        if (!userId) return;
        dispatch(resendConfirmationCode({ user_id: userId, method: "email" }));

        setEmailTimeLeft(60);
        setEmailTimerActive(true);
    };

    // Проверяем заполненность форм
    const isFirstFormFilled = smsCodeFirst.every((digit) => digit !== "");
    const isSecondFormFilled = smsCodeSecond.every((digit) => digit !== "");

    // Можно ли нажать «Подтвердить»?
    const canSubmit = isDoubleConfirmationMethod
        ? (isFirstFormFilled && isSecondFormFilled)
        : isFirstFormFilled;

    // Определяем, есть ли ошибка для ПЕРВОЙ формы
    const hasFirstFormError =
        confirmationMethod === "whatsapp"
            ? hasWhatsAppConfirmationError
            : hasPhoneConfirmationError;

    const noFirstFormError =
        confirmationMethod === "whatsapp"
            ? noWhatsAppConfirmationError
            : noPhoneConfirmationError;

    // Успешная отправка => закрываем модалку, шаг + тултип
    const handleSuccessConfirmation = () => {
        onClose();
        dispatch(setTooltipActive({ active: true, message: "Данные успешно подтверждены" }));
        dispatch(nextStep());
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
        // Иначе (phone)
        return (
            <span className={styles.modalContent__description}>
                Код направлен на телефон <b>{phone}</b>, указанный при идентификации
            </span>
        );
    };

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
                {/* --- ПЕРВАЯ ФОРМА (телефон / WhatsApp) --- */}
                <div className={styles.modalContent__head}>
                    {renderFirstFormText()}

                    <Tooltip
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
                                    ...(hasFirstFormError && { borderColor: "#FF3C53" }),
                                    ...(noFirstFormError && { borderColor: "#1CC15A" }),
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
                        {/* Если таймер активен, показываем отсчет, иначе активная ссылка */}
                        <div
                            className={styles.timer}
                            style={!phoneTimerActive ? { color: "#0666EB" } : {}}
                        >
                            {phoneTimerActive
                                ? `Отправить код снова через: 0${Math.floor(
                                    phoneTimeLeft / 60
                                )}:${String(phoneTimeLeft % 60).padStart(2, "0")}`
                                : "Отправить код снова"}
                        </div>
                    </div>
                </div>

                {/* --- ВТОРАЯ ФОРМА (email) --- */}
                {isDoubleConfirmationMethod && (
                    <div className={styles.modalContent__head}>
                        <span className={styles.modalContent__description}>
                            Код направлен на <b>{email}</b>, указанный при идентификации
                        </span>

                        <Tooltip
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
                                        ...(hasEmailConfirmationError && { borderColor: "#FF3C53" }),
                                        ...(noEmailConfirmationError && { borderColor: "#1CC15A" }),
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
                                    ? `Отправить код снова через: 0${Math.floor(
                                        emailTimeLeft / 60
                                    )}:${String(emailTimeLeft % 60).padStart(2, "0")}`
                                    : "Отправить код снова"}
                            </div>
                        </div>
                    </div>
                )}

                {/* --- Кнопки внизу --- */}
                <div>
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

                        <Button
                            onClick={() => {
                                dispatch(
                                    sendConfirmationCode({
                                        user_id: userId ?? "",
                                        codeFirst: smsCodeFirst.join(""),
                                        codeSecond: isDoubleConfirmationMethod
                                            ? smsCodeSecond.join("")
                                            : undefined,
                                        method: confirmationMethod,
                                        onSuccess: handleSuccessConfirmation
                                    })
                                );
                            }}
                            theme={ButtonTheme.BLUE}
                            className={styles.button}
                            disabled={!canSubmit}
                        >
                            Подтвердить код
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
});
