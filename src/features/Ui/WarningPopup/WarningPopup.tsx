// src/shared/ui/WarningPopup/WarningPopup.tsx
import { RootState } from "app/providers/store/config/store";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useAppDispatch } from "shared/hooks/useAppDispatch";
import styles from "./styles.module.scss";

import CloseIcon from "shared/assets/svg/close.svg";
import { setWarning } from "entities/ui/Ui/slice/uiSlice";
import { Icon } from "shared/ui/Icon/Icon";
import WarningIcon from 'shared/assets/svg/warningIcon.svg'
import { Button, ButtonTheme } from "shared/ui/Button/Button";

export const WarningPopup = () => {
    const dispatch = useAppDispatch();

    /* --- состояние из Redux --- */
    const warning = useSelector((s: RootState) => s.ui.warningPopup);

    /* --- локальная анимация видимости --- */
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (warning.active) {
            setVisible(true);

            const hide = setTimeout(() => setVisible(false), 10000);
            const reset = setTimeout(
                () => dispatch(setWarning({ ...warning, active: false })),
                10500,
            );

            return () => {
                clearTimeout(hide);
                clearTimeout(reset);
            };
        } else if (
            !warning.active
        ) {
            setVisible(false)
        }

    }, [warning.active]);

    /* --- закрыть по крестику --- */
    const handleClose = () => {
        setVisible(false);
        dispatch(setWarning({ ...warning, active: false }));
    };

    /* --- клик по кнопке предупреждения --- */
    const handleAction = () => {
        warning.action?.();           // колл-бэк
        dispatch(setWarning({ ...warning, active: false }));
    };

    return (
        <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={visible ? { y: 24, opacity: 1 } : { y: -124, opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className={styles.warningModal}
        >
            <div className={styles.warningModal__content}>
                <Icon
                    Svg={CloseIcon}
                    width={20}
                    height={20}
                    className={styles.closeIcon}
                    onClick={handleClose}
                />
                <Icon
                    Svg={WarningIcon}
                    width={20}
                    height={20}
                    onClick={handleClose}
                />
                <span>{warning.description}</span>

                {warning.buttonLabel && warning.action && (
                    <Button
                        theme={ButtonTheme.UNDERLINE}
                        padding="7px 14px"
                        onClick={handleAction}
                        className={styles.button}
                    >
                        {warning.buttonLabel}
                    </Button>
                )}
            </div>
        </motion.div>
    );
};
