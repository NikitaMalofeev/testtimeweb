import React, { memo, useState, useRef, useEffect, useLayoutEffect } from "react";
import { Modal } from "shared/ui/Modal/Modal";
import styles from "./styles.module.scss";
import { useSelector } from "react-redux";
import { Tooltip } from "shared/ui/Tooltip/Tooltip";
import { Button, ButtonTheme } from "shared/ui/Button/Button";
import { useAppDispatch } from "shared/hooks/useAppDispatch";
import { sendConfirmationCode } from "entities/RiskProfile/slice/riskProfileSlice";
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

interface ConfirmInfoModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ConfirmInfoModal = memo(({ isOpen, onClose }: ConfirmInfoModalProps) => {
    // Достаем состояние модалки
    const modalState = useSelector((state: RootState) => state.modal);

    // Отслеживаем, какой метод подтверждения выбрал пользователь (phone, email, whatsapp).
    const confirmationMethod = modalState.confirmationMethod;

    const [timeLeft, setTimeLeft] = useState(60);
    const [timerActive, setTimerActive] = useState(true);

    const userId = useSelector((state: RootState) => state.user.userId);
    const dispatch = useAppDispatch();
    const contentRef = useRef<HTMLDivElement>(null);

    const isScrolled = useSelector((state: RootState) =>
        selectModalState(state, ModalType.CONFIRM_CODE)?.isScrolled
    );

    /**
     * Определяем, сколько полей для ввода кода нужно показать.
     * Если phone или whatsapp - 2 поля, иначе (например, email) - 4.
     * пока оставляю 4 4
     */
    const codeLength = confirmationMethod === 'phone' || confirmationMethod === 'whatsapp' ? 4 : 4;
    const [smsCode, setSmsCode] = useState<string[]>(Array(codeLength).fill(""));

    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Сброс кода при смене метода подтверждения
    useEffect(() => {
        setSmsCode(Array(codeLength).fill(""));
    }, [confirmationMethod, codeLength]);

    // Таймер
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

    // Обработка ввода по одному символу
    const handleInputChange = (value: string, index: number) => {
        const newCode = [...smsCode];
        newCode[index] = value.slice(0, 1);
        setSmsCode(newCode);

        // Если ввели символ — фокус на следующий
        if (value && index < inputRefs.current.length - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    // Обработка Backspace
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === "Backspace" && !smsCode[index] && index > 0) {
            const newCode = [...smsCode];
            newCode[index - 1] = "";
            setSmsCode(newCode);
            inputRefs.current[index - 1]?.focus();
        }
    };

    // Обработка "Вставить" (paste)
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

    // Отслеживание скролла, чтобы добавить тень сверху
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

    // Сброс таймера
    const handleResetTimer = () => {
        setTimeLeft(60);
        setTimerActive(true);
    };

    // Проверяем, все ли поля заполнены
    const isCodeEntered = smsCode.every((digit) => digit !== "");

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
                style={{ overflow: 'auto' }}
            >
                <div className={styles.modalContent__head}>
                    <span className={styles.modalContent__description}>
                        Код направлен на{" "}
                        {confirmationMethod === 'email'
                            ? 'E-mail'
                            : 'номер, указанный при идентификации'}
                    </span>
                    <Tooltip
                        className={styles.modalContent__tooltip}
                        description="Настройка параметров защиты цифрового профиля от несанкционированного доступа"
                    />

                    <div className={styles.codeInput__container}>
                        {smsCode.map((digit, index) => (
                            <input
                                key={index}
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

                <div>
                    {timerActive && (
                        <div className={styles.timer}>
                            Будет активна через: {`0${Math.floor(timeLeft / 60)}`}:
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
                                dispatch(sendConfirmationCode({
                                    user_id: userId ?? "",
                                    code: smsCode.join(""),
                                    /**
                                     * Если выбраны phone или whatsapp — отправляем тип "phone",
                                     * иначе (email) — "email"
                                     */
                                    type: confirmationMethod === 'phone' || confirmationMethod === 'whatsapp'
                                        ? 'phone'
                                        : 'email',
                                    onSuccess: onClose,
                                }));
                            }}
                            theme={ButtonTheme.BLUE}
                            className={styles.button}
                            disabled={!isCodeEntered}
                        >
                            Подтвердить код
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
});
