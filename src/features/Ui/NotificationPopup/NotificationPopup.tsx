import { RootState } from "app/providers/store/config/store";
import { motion } from "framer-motion";
import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useAppDispatch } from "shared/hooks/useAppDispatch";
import styles from "./styles.module.scss";

import CloseIcon from "shared/assets/svg/close.svg";
import { Icon } from "shared/ui/Icon/Icon";
import WarningIcon from "shared/assets/svg/warningIcon.svg";
import {
    markNotificationShown,
    selectFirstActiveUnshown,
    selectFirstUnreadUnshown,
    updateNotificationStatus, // используется только для архивирования крестиком
} from "entities/Notification/slice/notificationSlice";
import { updateAllNotificationsThunk } from "entities/Notification/slice/notificationSlice";

export const NotificationPopup: React.FC = () => {
    const dispatch = useAppDispatch();
    const current = useSelector(selectFirstActiveUnshown); // <— вот тут
    const notifications = useSelector((s: RootState) => s.notifications.notifications)

    const [visible, setVisible] = useState(false);
    const autoHideMs = 10000;

    useEffect(() => {
        console.log('sfssdfds')

    }, [])

    useEffect(() => {
        if (!current) {
            setVisible(false);
            return;
        }

        // Помечаем показанным
        dispatch(markNotificationShown({ id: current.id }));
        setVisible(true);

        const hideId = window.setTimeout(() => {
            setVisible(false);
            // Через 10 секунд деактивируем на бэке
            dispatch(updateAllNotificationsThunk({
                edit_status: 'notif_info',
                edit_is_active: false,
            }));
        }, autoHideMs);

        return () => window.clearTimeout(hideId);
    }, [current?.id]);


    const handleClose = () => {
        if (!current) return;
        setVisible(false);
        // Если нужно деактивировать и при ручном закрытии — раскомментируй:
        // dispatch(updateAllNotificationsThunk({ edit_status: 'notif_info', edit_is_active: false }));
    };

    if (!current) return null;

    return (
        <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={visible ? { y: 24, opacity: 1 } : { y: -124, opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className={styles.warningModal}
            style={{
                background:
                    current.color === "blue"
                        ? "#C3D7F5"
                        : current.color === "green"
                            ? "#dcf3d1"
                            : "#ffd9dd",
            }}
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
                <div className={styles.header}>
                    <Icon Svg={WarningIcon} width={20} height={20} />{" "}
                    {current.title && <strong>{current.title}</strong>}
                </div>

                <div className={styles.text}>
                    <span>{current.text}</span>
                </div>
            </div>
        </motion.div>
    );
};
