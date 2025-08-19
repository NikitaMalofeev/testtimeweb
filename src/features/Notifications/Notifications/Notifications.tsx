import { Icon } from 'shared/ui/Icon/Icon';
import styles from './styles.module.scss';
import BackIcon from 'shared/assets/svg/ArrowBack.svg';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from 'shared/hooks/useAppDispatch';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from 'app/providers/store/config/store';

import {
    markManyAsRead,
    selectNotifications,
} from 'entities/Notification/slice/notificationSlice';
import { updateAllNotificationsThunk } from 'entities/Notification/slice/notificationSlice';
import { NotificationCard } from '../NotificationCard/NotificationCard';
import { current } from '@reduxjs/toolkit';
import { Button, ButtonTheme } from 'shared/ui/Button/Button';

export const Notifications = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const { unreadAnswersCount } = useSelector(
        (state: RootState) => state.supportChat
    );
    const notifications = useSelector((state: RootState) => selectNotifications(state));

    const allNotificationsCount =
        unreadAnswersCount + notifications.filter((item) => !item.isRead).length;

    // Notifications.tsx
    const handleMarkAllRead = () => {
        const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id);

        if (unreadIds.length) {
            dispatch(markManyAsRead(unreadIds)); // оптимистично меняем Redux
        }

        // запрос к бэку только для синхронизации; ответ игнорируем
        dispatch(updateAllNotificationsThunk({ edit_is_read: true }));
    };


    /* ----------------- render ----------------- */

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

                {/* Кнопка "Просмотреть все" */}
                <Button
                    theme={ButtonTheme.UNDERLINE}
                    type="button"
                    className={styles.notifications__viewAllBtn}
                    onClick={handleMarkAllRead}
                >
                    Просмотреть все
                </Button>
            </div>

            <div className={styles.notifications__content}>
                {notifications.map((n) => (
                    <NotificationCard
                        key={n.id}
                        id={n.id}
                        title={n.title || ''}
                        text={n.text}
                        isActive={n.isActive}
                        isRead={n.isRead}
                        color={n.color}
                        date={n.created}
                    />
                ))}
            </div>
        </div>
    );
};
