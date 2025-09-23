import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

import { Icon } from 'shared/ui/Icon/Icon';
import { Button, ButtonTheme } from 'shared/ui/Button/Button';
import BackIcon from 'shared/assets/svg/ArrowBack.svg';

import styles from './styles.module.scss';

import { RootState } from 'app/providers/store/config/store';
import { useAppDispatch } from 'shared/hooks/useAppDispatch';

import {
    selectNotifications,
    markManyAsRead,
    markAsRead,
    deactivateNotification,
    deactivateMany,
    updateAllNotificationsThunk,
} from 'entities/Notification/slice/notificationSlice';


import { NotificationCard } from '../NotificationCard/NotificationCard';

export const Notifications: React.FC = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const { unreadAnswersCount, messages } = useSelector((s: RootState) => s.supportChat);
    const notifications = useSelector((state: RootState) => selectNotifications(state));

    const unreadCount = notifications.filter((n) => !n.is_read).length;
    const unreadNonChatCount = notifications.filter((n) => !n.is_read && !(typeof n.id === 'string' && n.id.startsWith('chat-'))).length;
    // Теперь unreadAnswersCount не нужен для подсчета, так как чат-уведомления идут через notifications
    const allNotificationsCount = unreadCount;

    // Больше не нужно отображать supportAnswers отдельно, так как они теперь идут через notifications

    const handleMarkAllRead = () => {
        // Исключаем чат-уведомления, так как их статус управляется через логику чата
        const unreadIds = notifications
            .filter((n) => !n.is_read && !(typeof n.id === 'string' && n.id.startsWith('chat-')))
            .map((n) => n.id);
        if (!unreadIds.length) return;

        // 1) Оптимистично локально
        dispatch(markManyAsRead(unreadIds));
        dispatch(deactivateMany(unreadIds));

        // 2) Сервер: МАССОВО (без id) — пометить все непрочитанные как прочитанные
        dispatch(updateAllNotificationsThunk({ is_read: false, edit_is_read: true }));
    };

    const handleCardClick = (id: string) => {
        // ОДНА карточка: только локально
        dispatch(markAsRead({ id }));
        dispatch(deactivateNotification({ id }));

        // Для чат-уведомлений не отправляем запрос на сервер
        if (!(typeof id === 'string' && id.startsWith('chat-'))) {
            dispatch(updateAllNotificationsThunk({ is_read: false, id: id, edit_is_read: true }));
        }
        // Запроса на бэк нет — эндпоинт одиночные не поддерживает
    };

    const handleChatNotificationClick = (id: string) => {
        // Сначала помечаем уведомление как прочитанное и деактивируем его
        dispatch(markAsRead({ id }));
        dispatch(deactivateNotification({ id }));
        // Переход в чат поддержки
        navigate('/support');
    };

    return (
        <div className={styles.notifications}>
            <div className={styles.notifications__title}>
                <Icon
                    className={styles.notifications__title__icon}
                    Svg={BackIcon}
                    width={24}
                    height={24}
                    onClick={() => navigate(-1)}
                    pointer
                />
                <h2 className={styles.notifications__title__title}>Уведомления</h2>
                <span className={styles.notifications__title__count}>{allNotificationsCount}</span>

                <Button
                    theme={ButtonTheme.UNDERLINE}
                    type="button"
                    className={styles.notifications__viewAllBtn}
                    onClick={handleMarkAllRead}
                    disabled={unreadNonChatCount === 0}
                >
                    Прочитать все
                </Button>
            </div>

            <div className={styles.notifications__content}>
                {/* Все уведомления (включая чат-уведомления) */}
                {notifications.map((n) => {
                    // Определяем, это чат-уведомление или обычное
                    const isChatNotification = typeof n.id === 'string' && n.id.startsWith('chat-');
                    const handleClick = isChatNotification
                        ? () => handleChatNotificationClick(n.id || '')
                        : () => handleCardClick(n.id || '');

                    return (
                        <NotificationCard
                            key={n.id}
                            id={n.id}
                            title={n.title || ''}
                            text={n.text}
                            color={n.color || 'blue'}
                            date={n.created}
                            isActive={n.is_active}   // кружок только от локального флага
                            isRead={n.is_read}
                            onClick={handleClick}
                        />
                    );
                })}
            </div>
        </div>
    );
};
