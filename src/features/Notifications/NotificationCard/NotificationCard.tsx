import React, { useEffect } from 'react';
import styles from './styles.module.scss';

export type NotificationStatus = 'unread' | 'read' | 'archived';
export type NotificationColor = 'red' | 'blue' | 'green';

export interface NotificationCardProps {
    id: string;
    title: string;
    text?: string;
    status?: NotificationStatus;
    isActive: boolean;
    isRead: boolean;
    color: NotificationColor;
    date?: string | number | Date;
    className?: string;
}

function formatDate(d?: string | number | Date) {
    if (!d) return '';
    const date = new Date(d);
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${dd}.${mm}.${yyyy}`;
}

export const NotificationCard: React.FC<NotificationCardProps> = ({
    id,
    title,
    text,
    status,
    color,
    date,
    isRead,
    isActive,
    className,
}) => {

    useEffect(() => {
        console.log(date)
    }, [])
    return (
        <div className={styles.card}>
            <div className={styles.header}>
                {date && <span className={styles.date}>{formatDate(date)}</span>}
                {!isRead && <span className={styles.dot} aria-label="Непрочитано" />}
            </div>
            <div className={styles.title}>{title && title}</div>

            {text && <div className={styles.description} style={{ background: color === 'blue' ? '' : color === 'green' ? '#52C41733' : '#FF405333' }}>{text}</div>}


        </div>
    );
};
