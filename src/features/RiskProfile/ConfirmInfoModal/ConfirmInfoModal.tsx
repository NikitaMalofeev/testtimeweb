import React, { memo, useState, useRef, useEffect } from "react";
import { Modal } from "shared/ui/Modal/Modal";
import styles from "./styles.module.scss";
import { useSelector } from "react-redux";
import Tooltip from "shared/ui/Tooltip/Tooltip";
import { Button, ButtonTheme } from "shared/ui/Button/Button";
import { useAppDispatch } from "shared/hooks/useAppDispatch";
import { sendConfirmationCode } from "entities/RiskProfile/slice/riskProfileSlice";
import { RootState } from "app/providers/store/config/store";
import { openModal } from "entities/ui/Modal/slice/modalSlice";
import { ModalAnimation, ModalSize, ModalType } from "entities/ui/Modal/model/modalTypes";

interface ConfirmInfoModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ConfirmInfoModal = memo(({ isOpen, onClose }: ConfirmInfoModalProps) => {
    const modalState = useSelector((state: any) => state.modal);
    const [smsCode, setSmsCode] = useState(["", "", "", ""]);
    const [timeLeft, setTimeLeft] = useState(60);
    const [timerActive, setTimerActive] = useState(true);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const userId = useSelector((state: RootState) => state.user.userId);
    const dispatch = useAppDispatch();

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

    const handleInputChange = (value: string, index: number) => {
        const newCode = [...smsCode];
        // Берём только один символ из инпута
        newCode[index] = value.slice(0, 1);
        setSmsCode(newCode);

        // Если ввели символ — фокусируем следующий инпут
        if (value && index < inputRefs.current.length - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === "Backspace" && !smsCode[index] && index > 0) {
            const newCode = [...smsCode];
            newCode[index - 1] = "";
            setSmsCode(newCode);
            inputRefs.current[index - 1]?.focus();
        }
    };

    // Важно: реализуем handlePaste, чтобы "раскидать" скопированные 4 символа по разным инпутам
    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();

        // Получаем вставленный текст
        const pasteData = e.clipboardData.getData("text");

        // Берём максимум 4 символа
        const pasteValue = pasteData.slice(0, 4).split("");

        // Создаём копию текущего массива smsCode
        const newCode = [...smsCode];
        for (let i = 0; i < 4; i++) {
            newCode[i] = pasteValue[i] || "";
        }
        setSmsCode(newCode);

        // Если вставили меньше 4 символов, сфокусируемся на инпуте, где ещё пусто
        if (pasteValue.length < 4) {
            inputRefs.current[pasteValue.length]?.focus();
        }
    };

    const handleResetTimer = () => {
        setTimeLeft(60);
        setTimerActive(true);
    };

    const isCodeEntered = smsCode.every((digit) => digit !== "");

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            animation={modalState.confirmCodeModal.animation}
            size={modalState.confirmCodeModal.size}
            withCloseIcon
            withTitle="Подтверждение данных"
        >
            <div className={styles.modalContent}>
                <div className={styles.modalContent__head}>
                    <span className={styles.modalContent__description}>
                        Код направлен на номер, указанный при идентификации
                    </span>
                    <Tooltip />

                    <div className={styles.codeInput__container}>
                        {smsCode.map((digit, index) => (
                            <input
                                key={index}
                                type="text"
                                maxLength={1}
                                value={digit}
                                autoComplete="one-time-code"
                                name={`otp-${index}`}
                                onChange={(e) => handleInputChange(e.target.value, index)}
                                onKeyDown={(e) => handleKeyDown(e, index)}
                                // Добавляем handlePaste на каждый инпут
                                // или достаточно на первый, как вариант
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
                            theme={ButtonTheme.GREEN}
                            className={styles.button}
                            disabled={timerActive}
                        >
                            Отправить код в WhatsApp
                        </Button>
                        <Button
                            onClick={() => {
                                dispatch(sendConfirmationCode({
                                    user_id: userId ?? "",
                                    code: smsCode.join(""),
                                    type: 'phone'
                                }));
                                onClose();
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
