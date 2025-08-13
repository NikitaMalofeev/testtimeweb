import { Icon } from 'shared/ui/Icon/Icon';
import styles from './styles.module.scss';
import BackIcon from 'shared/assets/svg/ArrowBack.svg';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from 'shared/hooks/useAppDispatch';
import { openModal } from 'entities/ui/Modal/slice/modalSlice';
import { ModalAnimation, ModalSize, ModalType } from 'entities/ui/Modal/model/modalTypes';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from 'app/providers/store/config/store';

import { markManyAsRead, selectNotifications } from 'entities/Notification/slice/notificationSlice';
import { NotificationCard } from '../NotificationCard/NotificationCard';

export const Notifications = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const { unreadAnswersCount } = useSelector(
        (state: RootState) => state.supportChat
    );
    const notifications = useSelector((state: RootState) => selectNotifications(state));
    const allNotificationsCount = unreadAnswersCount + notifications.filter((item) => item.status === "unread").length;;

    useEffect(() => {
        const unreadIds = notifications.filter(n => n.status === 'unread').map(n => n.id);
        if (unreadIds.length === 0) return;

        const t = setTimeout(() => {
            dispatch(markManyAsRead(unreadIds));
            // тут же можно дернуть thunk для бэка, если нужен
            // dispatch(updateNotificationThunk(...))
        }, 3000);

        return () => clearTimeout(t);
    }, [dispatch]);

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
                <h2 className={styles.notifications__title__title}>
                    Уведомления
                </h2>
                <span className={styles.notifications__title__count}>{allNotificationsCount}</span>
                {/* <Tooltip
                    positionBox={{ top: '68px', left: '-224px' }}
                    squerePosition={{ top: '-4px', left: '228px' }}
                    boxWidth={{ width: '280px' }}
                    topForCenteringIcons="24px"
                    className={styles.notifications__tooltip}
                    description="Если ИИР не отклонено в течение суток,
                то считается исполненным"
                /> */}
            </div>

            <div className={styles.notifications__content}>
                {notifications.map((n) => (
                    <NotificationCard
                        key={n.id}
                        id={n.id}
                        title={n.title || ''}
                        description={n.description}
                        status={n.status}
                        color={n.color}
                        date={n.createdAt}
                    />
                ))}
            </div>




        </div>
    );
};
