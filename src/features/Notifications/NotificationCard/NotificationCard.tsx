import React from 'react';
import styles from './styles.module.scss';

export type NotificationStatus = 'unread' | 'read' | 'archived';
export type NotificationColor = 'red' | 'blue' | 'green';

export interface NotificationCardProps {
    id: string;
    title: string;
    text?: string;
    status?: NotificationStatus;
    isActive: boolean;  // локальный флаг участия во всплывающем попапе
    isRead: boolean;    // серверное "прочитано"
    color: NotificationColor;
    date?: string | number | Date;
    className?: string;
    onClick?: (id: string) => void; // клик по карточке = «прочитать одно»
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
    isRead,    // true = прочитано (точки не должно быть)
    isActive,  // локальный попап-флаг (в списке не влияет на рендер)
    className,
    onClick,
}) => {
    // точка показывается только если уведомление НЕ прочитано
    const showDot = !isRead;

    return (
        <div
            className={`${styles.card} ${className ?? ''}`}
            role="button"
            tabIndex={0}
            onClick={() => onClick?.(id)}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick?.(id)}
        >
            <div className={styles.header}>
                {date && <span className={styles.date}>{formatDate(date)}</span>}
                {showDot && <span className={styles.dot} aria-label="Непрочитано" />}
            </div>

            <div className={styles.title} style={isRead ? { color: '#464646' } : {}}>{title || ''}</div>

            {/* {text && (
                <div
                    className={styles.description}
                    style={{
                        background:
                            color === 'blue' ? '' : color === 'green' ? '#52C41733' : '#FF405333',
                    }}
                >
                    {text}
                </div>
            )} */}
        </div >
    );
};
