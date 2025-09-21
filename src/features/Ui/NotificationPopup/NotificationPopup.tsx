import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import styles from './styles.module.scss';

import CloseIcon from 'shared/assets/svg/close.svg';
import WarningIcon from 'shared/assets/svg/warningIcon.svg';
import { Icon } from 'shared/ui/Icon/Icon';
import { renderParsedText } from 'shared/lib/parseHtmlLinks';

import { useSelector } from 'react-redux';
import { useAppDispatch } from 'shared/hooks/useAppDispatch';
import {
    deactivateNotification,
    selectFirstActive,
} from 'entities/Notification/slice/notificationSlice';

/**
 * Попап показывает по одному уведомлению:
 * критерий: is_active === true && is_read === false
 *
 * Автозакрытие/крестик:
 *  - is_active = false (локально, чтобы не повторялся показ)
 *  - бэку ничего не отправляем
 *  - is_read не трогаем (при желании можешь пометить прочитанным)
 */
export const NotificationPopup: React.FC = () => {
    const dispatch = useAppDispatch();
    const current = useSelector(selectFirstActive);

    // есть ли что показать
    const hasContent = Boolean(current?.title?.trim()) || Boolean(current?.text?.trim());

    // показываем только синие уведомления
    const isBlueNotification = current?.color === 'blue';

    // попап показываем только если есть уведомление, есть title || text, и это синее уведомление
    const isOpen = Boolean(current && hasContent && isBlueNotification);

    const autoHideMs = 6000;

    // если уведомление пустое или не синее — сразу выключаем его
    useEffect(() => {
        if (current && (!hasContent || !isBlueNotification)) {
            dispatch(deactivateNotification({ id: current.id }));
        }
    }, [current, hasContent, isBlueNotification, dispatch]);

    // автозакрытие только когда реально открыт
    useEffect(() => {
        if (!isOpen || !current) return;
        const id = current.id;
        const t = window.setTimeout(() => {
            dispatch(deactivateNotification({ id }));
        }, autoHideMs);
        return () => window.clearTimeout(t);
    }, [isOpen, current?.id, dispatch]);

    const handleClose = () => {
        if (!current) return;
        dispatch(deactivateNotification({ id: current.id }));
    };


    const bg =
        (current?.color === 'blue' && '#C3D7F5') ||
        (current?.color === 'green' && '#dcf3d1') ||
        '#ffd9dd';

    return (
        <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={isOpen ? { y: 24, opacity: 1 } : { y: -124, opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            className={styles.warningModal}
            style={{ background: bg, pointerEvents: isOpen ? 'auto' : 'none' }}
            role="alert"
            aria-live="polite"
            aria-hidden={!isOpen}
        >
            {isOpen && (
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
                        {current?.title && <strong>{current.title}</strong>}
                    </div>

                    {/* Показать текст, если есть */}
                    {current?.text?.trim() && (
                        <div className={styles.text}>
                            {renderParsedText(current.text, {
                                color: '#1890ff',
                                textDecoration: 'underline'
                            })}
                        </div>
                    )}
                </div>
            )}
        </motion.div>
    );
};
