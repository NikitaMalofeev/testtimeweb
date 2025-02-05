import React, { memo, useState, useRef, useEffect } from "react";
import { Modal } from "shared/ui/Modal/Modal";
import styles from "./styles.module.scss";
import { useSelector } from "react-redux";
import Tooltip from "shared/ui/Tooltip/Tooltip";
import { Button, ButtonTheme } from "shared/ui/Button/Button";

interface ConfirmInfoModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ConfirmInfoModal = memo(({ isOpen, onClose }: ConfirmInfoModalProps) => {
    const modalState = useSelector((state: any) => state.modal);
    const [smsCode, setSmsCode] = useState(["", "", "", ""]);
    const [timeLeft, setTimeLeft] = useState(60); // Таймер в секундах
    const [timerActive, setTimerActive] = useState(true);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (isOpen && timerActive) {
            setTimeLeft(60); // Сброс таймера при открытии модального окна
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
        newCode[index] = value.slice(0, 1);
        setSmsCode(newCode);
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

    const handleResetTimer = () => {
        setTimeLeft(60)
        setTimerActive(true)
    }

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
                        Код направлен на номер указанный при идентификации
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
                                name="otp"
                                onChange={(e) => handleInputChange(e.target.value, index)}
                                onKeyDown={(e) => handleKeyDown(e, index)}
                                ref={(el) => (inputRefs.current[index] = el)}
                                className={styles.codeInput__box}
                            />
                        ))}
                    </div>
                    <span className={styles.modalContent__problems}>Проблемы с получением кода</span>
                </div>
                <div>
                    {timerActive && (
                        <div className={styles.timer}>Будет активна через: {`0${Math.floor(timeLeft / 60)}`}:{String(timeLeft % 60).padStart(2, "0")}</div>
                    )}
                    <div className={styles.buttonGroup}>
                        <Button theme={ButtonTheme.UNDERLINE} onClick={handleResetTimer} className={styles.button} disabled={timerActive}>
                            Отправить код снова
                        </Button>
                        <Button theme={ButtonTheme.GREEN} className={styles.button} disabled={timerActive}>
                            Отправить код в WhatsApp
                        </Button>
                        <Button theme={ButtonTheme.BLUE} className={styles.button} disabled={!isCodeEntered}>
                            Подтвердить код
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
});
