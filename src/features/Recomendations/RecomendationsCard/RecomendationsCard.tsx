import { Button, ButtonTheme } from 'shared/ui/Button/Button';
import styles from './styles.module.scss';

interface RecomendationsCardProps {
    onPreviewClick: () => void;
    onRejectClick: () => void;
}

export const RecomendationsCard = ({ onPreviewClick, onRejectClick }: RecomendationsCardProps) => {
    return (
        <div className={styles.card}>
            <div className={styles.card__top}>
                <div className={styles.card__timing__container}>
                    <span className={styles.card__timing__date}> 24.06.2025</span>
                    <span className={styles.card__timing__time}>15:34</span>
                </div>
                <span className={styles.card__status} style={true ? { color: '#EA3C4E' } : { color: '#4CB913' }}>Не выполнено</span>
            </div>
            <span className={styles.card__recomendations}>Индивидуальная инвестиционная рекомендация (ИИР) # 13</span>
            <div className={styles.card__actions}>
                <Button
                    className={styles.card__button}
                    theme={ButtonTheme.UNDERLINE}
                    onClick={onPreviewClick}
                    padding='8px 14px'
                >
                    Просмотр
                </Button>
                <Button
                    className={styles.card__button}
                    theme={ButtonTheme.REDUNDERLINE}
                    onClick={onRejectClick}
                    padding='8px 14px'
                >
                    Отклонить ИИР
                </Button>
            </div>
        </div>
    );
};