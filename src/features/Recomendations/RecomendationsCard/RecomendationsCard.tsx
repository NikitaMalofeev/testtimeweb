import { Button, ButtonTheme } from 'shared/ui/Button/Button';
import styles from './styles.module.scss';
import { IirStatus } from 'entities/Recomendations/model/recomendationsTypes';

interface RecomendationsCardProps {
    uuid: string;
    title: string;
    created: string;          // ISO-строка
    status: IirStatus;
    onPreviewClick: (uuid: string, status: string) => void;
    onRejectClick: (uuid: string) => void;
}

export const RecomendationsCard = ({
    uuid,
    title,
    created,
    status,
    onPreviewClick,
    onRejectClick,
}: RecomendationsCardProps) => {
    /* ───── парсим дату/время ───── */
    const dateObj = new Date(created);
    const dateStr = dateObj.toLocaleDateString('ru-RU');
    const timeStr = dateObj.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

    const isWaiting = status === 'IIR_WAITING';
    const isRejected = status === 'IIR_REJECTED'

    return (
        <div className={styles.card}>
            <div className={styles.card__top}>
                <div className={styles.card__timing__container}>
                    <span className={styles.card__timing__date}>{dateStr}</span>
                    <span className={styles.card__timing__time}>{timeStr}</span>
                </div>
                <span
                    className={styles.card__status}
                    style={{ color: isRejected ? '#EA3C4E' : '#4CB913' }}
                >
                    {isWaiting
                        ? 'Ожидание'
                        : isRejected
                            ? 'Отклонено'
                            : 'Выполнено'}
                </span>
            </div>

            <span className={styles.card__recomendations}>{title}</span>

            <div className={styles.card__actions}>
                <Button
                    className={styles.card__button}
                    theme={ButtonTheme.UNDERLINE}
                    onClick={() => onPreviewClick(uuid, status)}
                    padding="8px 14px"
                >
                    Просмотр
                </Button>

                <Button
                    className={styles.card__button}
                    theme={ButtonTheme.REDUNDERLINE}
                    onClick={() => onRejectClick(uuid)}
                    padding="8px 14px"
                >
                    Отклонить ИИР
                </Button>
            </div>
        </div>
    );
};
