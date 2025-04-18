import React, { useEffect, useState } from "react";
import { Header } from "widgets/Header/ui/Header";
import styles from "./styles.module.scss";
import { Icon } from "shared/ui/Icon/Icon";
import ErrorIcon from "shared/assets/svg/Error.svg";
import CopyIcon from "shared/assets/svg/Copy.svg";
import SuccessIcon from "shared/assets/svg/SuccessLabel.svg";
import { Button, ButtonTheme } from "shared/ui/Button/Button";
import { ErrorInfo } from "react";
import { motion } from "framer-motion";
import { useAppDispatch } from "shared/hooks/useAppDispatch";
import { closeAllModals } from "entities/ui/Modal/slice/modalSlice";

interface ErrorPageProps {
    error: Error;
    errorInfo: ErrorInfo;
    resetErrorBoundary: () => void;
}

export const ErrorPage: React.FC<ErrorPageProps> = ({ error, errorInfo, resetErrorBoundary }) => {
    const [copyNotification, setCopyNotification] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const dispatch = useAppDispatch()

    const handleCopy = (e: React.MouseEvent<HTMLButtonElement>) => {

        navigator.clipboard.writeText(error.message)
            .then(() => {
                setCopyNotification(true);
            })
            .catch((err) => {
                console.error("Ошибка при копировании текста:", err);
            });
    };

    useEffect(() => {
        if (copyNotification) {
            setTimeout(() => {
                setShowSuccess(true)
            }, 500)
        }
    }, [copyNotification])

    return (
        <div className={styles.page}>
            <Header variant="fallback" />
            <div className={styles.page__container}>
                <div className={styles.page__message}>
                    <Icon width={36} height={36} Svg={ErrorIcon} className={styles.page__icon} />
                    <h1 className={styles.page__title}>Что-то пошло не так</h1>
                </div>
                <div className={styles.page__copy}>
                    <p className={styles.page__description}>
                        {error.message || "Произошла неизвестная ошибка."}
                    </p>
                    <button className={styles.page__copy__button} onClick={handleCopy}>
                        {!showSuccess && (
                            <motion.div
                                initial={{ y: 0, opacity: 1 }}
                                animate={copyNotification ? { y: -20, opacity: 0 } : { y: 0, opacity: 1 }}
                                transition={{ duration: 0.5 }}
                            >
                                <Icon Svg={CopyIcon} width={24} height={24} />
                            </motion.div>
                        )}
                        {showSuccess && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={copyNotification ? { opacity: 1 } : { opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className={styles.successIcon}
                            >
                                <Icon Svg={SuccessIcon} width={18} height={18} className={styles.successIcon__icon} />
                            </motion.div>
                        )}
                        <span style={{ marginLeft: 8 }}>Скопировать текст ошибки</span>
                    </button>
                </div>
                <div className={styles.page__buttons}>
                    <Button
                        theme={ButtonTheme.UNDERLINE}
                        onClick={() => {
                            dispatch(closeAllModals())
                            window.location.href = "/lk";
                        }}
                        padding="19px 26px"
                        children="Перейти в личный кабинет"
                    />
                    <Button
                        theme={ButtonTheme.BLUE}
                        onClick={() => {
                            window.location.href = "/support";
                        }}
                        padding="19px 26px"
                        children="Отправить отчет об ошибке"
                    />
                </div>
            </div>
        </div>
    );
};
