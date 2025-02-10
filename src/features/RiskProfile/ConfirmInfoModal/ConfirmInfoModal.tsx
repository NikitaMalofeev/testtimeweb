import React, { memo, useState, useRef, useEffect, useLayoutEffect } from "react";
import { Modal } from "shared/ui/Modal/Modal";
import styles from "./styles.module.scss";
import { useSelector } from "react-redux";
import { Tooltip } from "shared/ui/Tooltip/Tooltip";
import { Button, ButtonTheme } from "shared/ui/Button/Button";
import { useAppDispatch } from "shared/hooks/useAppDispatch";
import { sendConfirmationCode } from "entities/RiskProfile/slice/riskProfileSlice";
import { RootState } from "app/providers/store/config/store";
import { openModal, setModalScrolled } from "entities/ui/Modal/slice/modalSlice";
import { ModalAnimation, ModalSize, ModalType } from "entities/ui/Modal/model/modalTypes";
import { selectModalState } from "entities/ui/Modal/selectors/selectorsModals";

interface ConfirmInfoModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ConfirmInfoModal = memo(({ isOpen, onClose }: ConfirmInfoModalProps) => {
    const modalState = useSelector((state: any) => state.modal);
    const [smsCode, setSmsCode] = useState(["", "", "", ""]);
    const [timeLeft, setTimeLeft] = useState(60);
    const [timerActive, setTimerActive] = useState(true);
    // Локальное состояние для вычисления наличия нижней тени
    const [hasBottomShadow, setHasBottomShadow] = useState(false);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const userId = useSelector((state: RootState) => state.user.userId);
    const dispatch = useAppDispatch();
    const contentRef = useRef<HTMLDivElement>(null);
    const isScrolled = useSelector((state: RootState) => selectModalState(state, ModalType.CONFIRM_CODE)?.isScrolled);

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

    // Обрабатываем вставку, чтобы распределить скопированные символы по инпутам
    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();

        const pasteData = e.clipboardData.getData("text");
        const pasteValue = pasteData.slice(0, 4).split("");
        const newCode = [...smsCode];
        for (let i = 0; i < 4; i++) {
            newCode[i] = pasteValue[i] || "";
        }
        setSmsCode(newCode);

        if (pasteValue.length < 4) {
            inputRefs.current[pasteValue.length]?.focus();
        }
    };

    // Отслеживаем скролл в контейнере, чтобы установить тень сверху (через redux) и снизу (локально)
    useLayoutEffect(() => {
        const handleScroll = () => {
            if (contentRef.current) {
                const { scrollTop } = contentRef.current;
                dispatch(setModalScrolled({
                    type: ModalType.CONFIRM_CODE,
                    isScrolled: scrollTop > 0
                }));
                // Если нижняя граница не достигнута – показываем нижнюю тень
                // setHasBottomShadow(scrollTop + clientHeight < scrollHeight);
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

    useLayoutEffect(() => {
        if (contentRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
            setHasBottomShadow(scrollTop + clientHeight < scrollHeight);
        }
    });

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
            type={ModalType.CONFIRM_CODE}
        >
            <div
                className={`
                    ${styles.modalContent} 
                    ${isScrolled && styles.modalContent__shadow_top} 
                    ${hasBottomShadow && styles.modalContent__shadow_bottom}
                `}
                ref={contentRef}
                style={{ overflow: 'auto' }}
            >
                <div className={styles.modalContent__head}>
                    <span className={styles.modalContent__description}>
                        Код направлен на номер, указанный при идентификации
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
                                    type: "email"
                                }));
                                onClose();
                            }}
                            theme={ButtonTheme.UNDERLINE}
                            className={styles.button}
                            disabled={timerActive}
                        >
                            Отправить на e-mail
                        </Button>
                        <Button
                            onClick={() => {
                                dispatch(sendConfirmationCode({
                                    user_id: userId ?? "",
                                    code: smsCode.join(""),
                                    type: "phone"
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
