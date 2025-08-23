import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import styles from './styles.module.scss';

import CloseIcon from 'shared/assets/svg/close.svg';
import WarningIcon from 'shared/assets/svg/warningIcon.svg';
import { Icon } from 'shared/ui/Icon/Icon';

import { useSelector } from 'react-redux';
import { useAppDispatch } from 'shared/hooks/useAppDispatch';
import {
    markNotificationShown,
    selectFirstActiveUnshown,
} from 'entities/Notification/slice/notificationSlice';

/**
 * Popup показывает по одному уведомлению за раз.
 * Критерии показа:
 *  - локальный флаг `isActive === true`
 *  - локальный флаг `shown === false` (значит ещё не показывали в этой сессии)
 *
 * При автозакрытии/крестике:
 *  - `isActive` выключается локально (что исключает повторный показ)
 *  - бэку ничего не отправляем
 */
export const NotificationPopup: React.FC = () => {
    const dispatch = useAppDispatch();
    const current = useSelector(selectFirstActiveUnshown);

    const [visible, setVisible] = useState(false);
    const autoHideMs = 10000;

    useEffect(() => {
        if (!current) {
            setVisible(false);
            return;
        }

        // Помечаем как показанное (чтобы не дёргалось повторно в эту же сессию)
        dispatch(markNotificationShown({ id: current.id }));
        setVisible(true);

        const hideId = window.setTimeout(() => {
            setVisible(false);
            // Локально выключаем показ этого уведомления в popup
            // dispatch(setLocalActive({ id: current.id, isActive: false }));
        }, autoHideMs);

        return () => window.clearTimeout(hideId);
    }, [current?.id, dispatch]);

    const handleClose = () => {
        if (!current) return;
        setVisible(false);
        // Локально выключаем показ в popup
        // dispatch(setLocalActive({ id: current.id, isActive: false }));
    };

    if (!current) return null;

    return (
        <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={visible ? { y: 24, opacity: 1 } : { y: -124, opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            className={styles.warningModal}
            style={{
                background:
                    current.color === 'blue'
                        ? '#C3D7F5'
                        : current.color === 'green'
                            ? '#dcf3d1'
                            : '#ffd9dd',
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
                    <Icon Svg={WarningIcon} width={20} height={20} />
                    {current.title && <strong>{current.title}</strong>}
                </div>

                <div className={styles.text}>
                    <span>{current.text}</span>
                </div>
            </div>
        </motion.div>
    );
};
