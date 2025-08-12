// src/shared/ui/WarningPopup/WarningPopup.tsx
import { RootState } from "app/providers/store/config/store";
import { motion } from "framer-motion";
import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useAppDispatch } from "shared/hooks/useAppDispatch";
import styles from "./styles.module.scss";

import CloseIcon from "shared/assets/svg/close.svg";
import { Icon } from "shared/ui/Icon/Icon";
import WarningIcon from "shared/assets/svg/warningIcon.svg";
import { updateNotificationStatus } from "entities/Notification/slice/notificationSlice";

export const NotificationPopup: React.FC = () => {
    const dispatch = useAppDispatch();

    // Берём массив уведомлений из слайса
    const notifications = useSelector(
        (s: RootState) => s.notifications.notifications
    );

    // Текущее показываемое уведомление: первое "unread"
    const current = useMemo(
        () => notifications.find((n) => n.status === "unread") ?? null,
        [notifications]
    );

    const [visible, setVisible] = useState(false);
    const autoHideMs = 10000;

    // Автопоказ/автоскрытие при смене текущего уведомления
    useEffect(() => {
        if (!current) {
            setVisible(false);
            return;
        }

        setVisible(true);

        const hideId = window.setTimeout(() => {
            setVisible(false);
            // optimistic локально -> затем на бэк
            dispatch(updateNotificationStatus({ id: current.id, status: "read" }));
            // dispatch(
            //     updateNotificationThunk({ id: current.id, patch: { status: "read" } })
            // );
        }, autoHideMs);

        return () => {
            window.clearTimeout(hideId);
        };
    }, [current?.id]); // важно — зависим от id, чтобы корректно перезапускать таймер

    // Закрыть по крестику — архивируем
    const handleClose = () => {
        if (!current) return;
        setVisible(false);
        dispatch(updateNotificationStatus({ id: current.id, status: "archived" }));
        // dispatch(
        //     updateNotificationThunk({ id: current.id, patch: { status: "archived" } })
        // );
    };

    // Если нет уведомлений для показа — ничего не рендерим
    if (!current) return null;

    return (
        <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={visible ? { y: 24, opacity: 1 } : { y: -124, opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className={styles.warningModal}
            style={{ background: current.color === 'blue' ? "#C3D7F5" : current.color === 'green' ? "#dcf3d1" : "#ffd9dd" }}
            role="alert"
            aria-live="polite"
        >
            <div className={styles.warningModal__content}>
                <Icon
                    Svg={CloseIcon}
                    width={20}
                    height={20}
                    className={styles.closeIcon}
                    onClick={handleClose}
                    pointer
                />
                <div className={styles.header}><Icon Svg={WarningIcon} width={20} height={20} /> {current.title && <strong>{current.title}</strong>}</div>

                <div className={styles.text}>

                    <span>{current.description}</span>
                </div>
            </div>
        </motion.div>
    );
};
