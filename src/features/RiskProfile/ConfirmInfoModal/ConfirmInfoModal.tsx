import React, { memo, useState, useRef, useEffect, useLayoutEffect } from "react";
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
    openModal,
    setModalScrolled
} from "entities/ui/Modal/slice/modalSlice";
import {
    ModalAnimation,
    ModalSize,
    ModalType
} from "entities/ui/Modal/model/modalTypes";
import { selectModalState } from "entities/ui/Modal/selectors/selectorsModals";

/**
 * Интерфейс для пропсов модального окна
 */
interface ConfirmInfoModalProps {
    isOpen: boolean;
    onClose: () => void;
}

/**
 * Компонент модального окна подтверждения данных.
 * 
 * Теперь:
 * - И при `whatsapp`, и при `phone` показываем две формы
 *   (первая: код по телефону/WhatsApp, вторая: код по e-mail).
 */
export const ConfirmInfoModal = memo(({ isOpen, onClose }: ConfirmInfoModalProps) => {
    // Достаем из Redux состояние модалки
    const modalState = useSelector((state: RootState) => state.modal);
    const codeError = useSelector((state: RootState) => state.error.error);
    const phoneSuccess = useSelector((state: RootState) => state.ui.confirmationPhoneSuccess);
    const emailSuccess = useSelector((state: RootState) => state.ui.confirmationEmailSuccess);
    const whatsappSuccess = useSelector((state: RootState) => state.ui.confirmationWhatsappSuccess);
    const [loadingConfirmationCode, setLoadingConfirmationCode] = useState(false);

    // Определяем, каким методом пользователь подтверждает данные: 'whatsapp' или 'phone'
    const confirmationMethod = modalState.confirmationMethod;

    // Проверяем ошибки
    const hasEmailConfirmationError = emailSuccess === "не пройдено";
    const hasWhatsAppConfirmationError = whatsappSuccess === "не пройдено";
    const hasPhoneConfirmationError = phoneSuccess === "не пройдено";

    // Данные пользователя (номер телефона и e-mail)
    const { phone, email } = useSelector((state: RootState) => state.user.user);

    // Состояние таймера и оставшегося времени
    const [timeLeft, setTimeLeft] = useState(60);
    const [timerActive, setTimerActive] = useState(true);

    // ID пользователя
    const userId = useSelector((state: RootState) => state.user.userId);

    // Хук для отправки экшенов
    const dispatch = useAppDispatch();

    // Реф-контейнер для отслеживания скролла внутри модалки
    const contentRef = useRef<HTMLDivElement>(null);

    // Смотрим, заскроллена ли модалка (для теней сверху/снизу)
    const isScrolled = useSelector((state: RootState) =>
        selectModalState(state, ModalType.CONFIRM_CODE)?.isScrolled
    );

    // Длина кода — в данном случае фиксированная (4)
    const codeLength = 4;

    // Две формы: первая — для телефона/WhatsApp, вторая — для e-mail
    const [smsCodeFirst, setSmsCodeFirst] = useState<string[]>(Array(codeLength).fill(""));
    const [smsCodeSecond, setSmsCodeSecond] = useState<string[]>(Array(codeLength).fill(""));

    // Рефы на инпуты, чтобы управлять фокусом
    const inputRefsFirst = useRef<(HTMLInputElement | null)[]>([]);
    const inputRefsSecond = useRef<(HTMLInputElement | null)[]>([]);

    // Сброс содержимого инпутов при смене метода подтверждения
    useEffect(() => {
        setSmsCodeFirst(Array(codeLength).fill(""));
        setSmsCodeSecond(Array(codeLength).fill(""));
    }, [confirmationMethod, codeLength]);

    // Таймер, который отсчитывает 60 секунд
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (isOpen && timerActive) {
            setTimeLeft(60);
            timer = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        setTimerActive(false);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [isOpen, timerActive]);

    /**
     * Обработчики для первой формы
     */
    const handleInputChangeFirst = (value: string, index: number) => {
        const newCode = [...smsCodeFirst];
        newCode[index] = value.slice(0, 1);
        setSmsCodeFirst(newCode);

        // Фокус на следующий инпут, если ввели символ
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

    /**
     * Обработчики для второй формы (почта)
     */
    const handleInputChangeSecond = (value: string, index: number) => {
        const newCode = [...smsCodeSecond];
        newCode[index] = value.slice(0, 1);
        setSmsCodeSecond(newCode);

        // Фокус на следующий инпут, если ввели символ
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

    // Отслеживание скролла внутри модалки, чтобы поднимать/убирать тень
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

    /**
     * Обработчик повторной отправки кода.
     */
    const handleResetTimer = () => {
        if (userId && confirmationMethod) {
            dispatch(resendConfirmationCode({ user_id: userId, method: confirmationMethod }));
        }
        setTimeLeft(60);
        setTimerActive(true);
    };

    // Проверяем заполненность форм
    const isFirstFormFilled = smsCodeFirst.every((digit) => digit !== "");
    const isSecondFormFilled = smsCodeSecond.every((digit) => digit !== "");

    // И 'phone', и 'whatsapp' требуют два кода
    const isDoubleConfirmationMethod = confirmationMethod === "phone" || confirmationMethod === "whatsapp";

    // Можем ли нажать "Подтвердить"
    const canSubmit = isDoubleConfirmationMethod
        ? (isFirstFormFilled && isSecondFormFilled)
        : isFirstFormFilled;

    // Для первой формы при `whatsapp` считаем ошибку в whatsappSuccess, при `phone` — phoneSuccess
    const hasFirstFormError =
        confirmationMethod === "whatsapp"
            ? hasWhatsAppConfirmationError
            : hasPhoneConfirmationError;

    // Генерация текста для первой формы
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
                {/** --- ПЕРВАЯ ФОРМА (телефон / WhatsApp) --- */}
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
                                style={hasFirstFormError ? { borderColor: "#FF3C53" } : {}}
                            />
                        ))}
                    </div>

                    <span
                        className={styles.modalContent__problems}
                        onClick={() => {
                            dispatch(openModal({
                                type: ModalType.PROBLEM_WITH_CODE,
                                size: ModalSize.MINI,
                                animation: ModalAnimation.BOTTOM
                            }));
                        }}
                    >
                        Проблемы с получением кода
                    </span>
                </div>

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
                                    style={hasEmailConfirmationError ? { borderColor: "#FF3C53" } : {}}
                                />
                            ))}
                        </div>

                        <span
                            className={styles.modalContent__problems}
                            onClick={() => {
                                dispatch(openModal({
                                    type: ModalType.PROBLEM_WITH_CODE,
                                    size: ModalSize.MINI,
                                    animation: ModalAnimation.BOTTOM
                                }));
                            }}
                        >
                            Проблемы с получением кода
                        </span>
                    </div>
                )}

                {/** --- НИЖНЯЯ ЧАСТЬ: таймер и кнопки --- */}
                <div>
                    {timerActive && (
                        <div className={styles.timer}>
                            Будет активна через: 0{Math.floor(timeLeft / 60)}:
                            {String(timeLeft % 60).padStart(2, "0")}
                        </div>
                    )}
                    <div className={styles.buttonGroup}>
                        <Button
                            theme={ButtonTheme.UNDERLINE}
                            onClick={handleResetTimer}
                            className={styles.button}
                            disabled={timerActive}
                        >
                            Отправить код снова
                        </Button>

                        <Button
                            onClick={() => {
                                dispatch(
                                    sendConfirmationCode({
                                        user_id: userId ?? "",
                                        codeFirst: smsCodeFirst.join(""),
                                        codeSecond: isDoubleConfirmationMethod ? smsCodeSecond.join("") : undefined,
                                        method: confirmationMethod,
                                        onSuccess: onClose
                                    })
                                );
                                setLoadingConfirmationCode(true);
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
