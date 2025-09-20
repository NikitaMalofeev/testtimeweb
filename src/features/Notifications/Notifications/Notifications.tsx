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
    // Используем unreadAnswersCount напрямую из чата (он учитывает локальный статус)
    const allNotificationsCount = unreadAnswersCount + unreadCount;

    // Получаем последние ответы поддержки для отображения уведомлений
    const supportAnswers = messages.filter(m => m.is_answer && m.id !== -1).slice(0, unreadAnswersCount);

    const handleMarkAllRead = () => {
        const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
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
        dispatch(updateAllNotificationsThunk({ is_read: false, id: id, edit_is_read: true }));
        // Запроса на бэк нет — эндпоинт одиночные не поддерживает
    };

    const handleChatNotificationClick = () => {
        // Переход в чат поддержки (unreadAnswersCount сбросится автоматически через 2 сек в чате)
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
                    disabled={unreadCount === 0}
                >
                    Прочитать все
                </Button>
            </div>

            <div className={styles.notifications__content}>
                {/* Уведомления чата */}
                {supportAnswers.map((chatMsg) => (
                    <NotificationCard
                        key={`chat-${chatMsg.id}`}
                        id={chatMsg.id?.toString() || ''}
                        title={'Получено новое сообщение от службы поддержки'}
                        text={chatMsg.text || chatMsg.text_for_files || 'Получено новое сообщение от службы поддержки'}
                        color="blue"
                        date={chatMsg.created || ''}
                        isActive={true}
                        isRead={false} // Всегда false, так как это непрочитанные
                        onClick={handleChatNotificationClick}
                    />
                ))}

                {/* Обычные уведомления */}
                {notifications.map((n) => (
                    <NotificationCard
                        key={n.id}
                        id={n.id}
                        title={n.title || ''}
                        text={n.text}
                        color={n.color || 'blue'}
                        date={n.created}
                        isActive={n.is_active}   // кружок только от локального флага
                        isRead={n.is_read}
                        onClick={handleCardClick}
                    />
                ))}
            </div>
        </div>
    );
};
