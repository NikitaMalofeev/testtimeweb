import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import styles from './styles.module.scss';
import { PaymentStatus } from 'entities/Payments/types/paymentsTypes';
import { Icon } from 'shared/ui/Icon/Icon';
import { useSelector } from 'react-redux';
import { RootState } from 'app/providers/store/config/store';
import { Button, ButtonTheme } from 'shared/ui/Button/Button';
import PaymentsBase from 'shared/assets/images/paymentsBase.png';
import PaymentsActive from 'shared/assets/images/paymentsActive.png';
import SuccessIcon from 'shared/assets/svg/SuccessLabel.svg';
import { Loader } from 'shared/ui/Loader/Loader';

interface PaymentsStatusProps {
    status: PaymentStatus;
    paymentId: string;
}

export const PaymentsStatus: React.FC<PaymentsStatusProps> = ({ status, paymentId }) => {
    // достаём список тарифов и текущий заказ
    const tariffs = useSelector((s: RootState) => s.payments.tariffs);

    // в зависимости от статуса подготавливаем title и subtitle
    const { title, subtitle, subtitleColor } = useMemo(() => {
        switch (status) {
            case 'success':
                return {
                    title: 'Вы успешно подключили тариф',
                    subtitle: 'Благодарим за оплату. Подписка активна. Услуги возобновлены.',
                    subtitleColor: '#DCF3D1'
                };
            case 'loading':
                return {
                    title: 'Ожидание оплаты тарифа',
                    subtitle: 'Пожалуйста, проведите оплату и вернитесь в ranks.autopilot',
                    subtitleColor: '#E1ECFB'
                };
            case 'failed':
                return {
                    title: 'Оплата не удалась',
                    subtitle: 'Произошла ошибка при проведении платежа. Попробуйте снова.',
                    subtitleColor: '#FF3C53'
                };
            default:
                return { title: '', subtitle: '' };
        }
    }, [status]);

    return (
        <div className={styles.status__wrapper}>
            {/* Иконка и заголовок */}
            <div className={styles.status__header}>
                <div className={styles.status__status}>
                    {status === 'success' ? (
                        <Icon Svg={SuccessIcon} width={36} height={36} />
                    ) : (
                        <Loader />
                    )}
                    <span className={styles.status__title}>{title}</span>
                </div>
                <div className={styles.status__subtitle} style={{ backgroundColor: subtitleColor }}>
                    <span>{subtitle}</span>
                </div>
            </div>

            {/* Детали выбранного тарифа */}
            <div className={styles.status__details}>
                {tariffs
                    .filter((t) => t.id === paymentId)
                    .map((t) => (
                        <div key={t.id} className={styles.status__card}>
                            <Icon
                                Svg={t.title === 'Долгосрочный инвестор' ? PaymentsBase : PaymentsActive}
                                width={40}
                                height={40}
                            />
                            <div className={styles.status__cardInfo}>
                                <span className={styles.status__cardStatus}>{status}</span>
                                <span className={styles.status__cardTitle}>{t.title}</span>
                            </div>
                        </div>
                    ))}
            </div>

            {/* Анимированный блок кнопок только при успехе */}
            {
                status === 'success' && (
                    <motion.div
                        className={styles.status__actions}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ duration: 0.5 }}
                    >
                        <span>Чек оплаты можно найти в разделе «Документы»</span>
                        <div className={styles.status__buttons}>
                            <Button
                                theme={ButtonTheme.UNDERLINE}
                                padding="10px 25px"
                                onClick={() => {
                                    /* перейти в документы */
                                }}
                            >
                                Перейти в документы
                            </Button>
                            <Button
                                theme={ButtonTheme.BLUE}
                                padding="10px 25px"
                                onClick={() => {
                                    /* вернуться в учётную запись */
                                }}
                            >
                                Вернуться в учётную запись
                            </Button>
                        </div>
                    </motion.div>
                )
            }
        </div >
    );
};
