    import React from 'react';
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
        updateAllNotificationsThunk,
    } from 'entities/Notification/slice/notificationSlice';

    import { NotificationCard } from '../NotificationCard/NotificationCard';

    export const Notifications: React.FC = () => {
        const navigate = useNavigate();
        const dispatch = useAppDispatch();

        const { unreadAnswersCount } = useSelector((s: RootState) => s.supportChat);
        const notifications = useSelector((state: RootState) => selectNotifications(state));

        // кол-во «непрочитанных»: серверное поле is_read
        const unreadCount = notifications.filter((n) => !n.isRead).length;
        const allNotificationsCount = unreadAnswersCount + unreadCount;

        const handleMarkAllRead = () => {
            const unreadIds = notifications.filter((n) => !n.isRead).map((n) => n.id);

            if (unreadIds.length) {
                // оптимистично отмечаем в Redux:
                //  - is_read = true (серверное «прочитано»)
                //  - isActive = false (локально выключаем показ в popup)
                dispatch(markManyAsRead(unreadIds));
                // синхронизируем с бэком; если ваш бэкенд принимает ids — передайте их:
                dispatch(updateAllNotificationsThunk({ edit_is_read: true }));
                // если бэку ids не нужны (массовая операция), можно оставить:
                // dispatch(updateAllNotificationsThunk({ edit_is_read: true }));
            }
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
                            color={n.color || 'blue'}
                            date={n.created}
                            // локальный флаг «показывать в попапе»
                            isActive={(n as any).isActive}
                            // серверное «прочитано»
                            isRead={n.isRead}
                        />
                    ))}
                </div>
            </div>
        );
    };
