import React, { useEffect, useMemo } from 'react';
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
import ErrorIcon from 'shared/assets/svg/errorCircle.svg'
import { Loader } from 'shared/ui/Loader/Loader';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from 'shared/hooks/useAppDispatch';
import { setCurrentOrderStatus } from 'entities/Payments/slice/paymentsSlice';

interface PaymentsStatusProps {
    status: PaymentStatus;
    paymentId: string;
    payAction: () => void;
}

export const PaymentsStatus: React.FC<PaymentsStatusProps> = ({ status, paymentId, payAction }) => {
    // достаём список тарифов и текущий заказ
    const activeTariffs = useSelector((s: RootState) => s.payments.activeTariffs);
    const currentUserTariffIdForPayments = useSelector((s: RootState) => s.payments.currentUserTariffIdForPayments);
    const navigate = useNavigate()
    const dispatch = useAppDispatch()
    const targetTariffId = paymentId || currentUserTariffIdForPayments || '';

    const normalize = (id: string) => id.replace(/-/g, '');

    const activePaidTariffs = useMemo(
        () => activeTariffs.filter(t => normalize(t.id) === normalize(targetTariffId)),
        [activeTariffs, targetTariffId]
    );

    useEffect(() => {
        console.log(activePaidTariffs)
        console.log(activeTariffs)
        console.log(currentUserTariffIdForPayments)
        console.log('targetTariffId:', targetTariffId);
        console.log('activePaidTariffs:', activePaidTariffs);
    }, [])


    const { title, subtitle, subtitleColor, statusColor, statusName, icon } = useMemo(() => {
        switch (status) {
            case 'success':
                return {
                    title: 'Вы успешно подключили тариф',
                    subtitle: 'Благодарим за оплату. Подписка активна. Услуги возобновлены.',
                    subtitleColor: '#DCF3D1',
                    statusColor: '#52C417',
                    statusName: 'подключен',
                    icon: SuccessIcon
                };
            case 'loading':
                return {
                    title: 'Ожидание оплаты тарифа',
                    subtitle: 'Пожалуйста, проведите оплату и вернитесь в ranks.autopilot',
                    subtitleColor: '#E1ECFB',
                    statusColor: '#0666EB',
                    statusName: 'ожидание',
                    icon: 'loader'
                };
            case 'failed':
                return {
                    title: 'Оплата не удалась',
                    subtitle: 'Произошла ошибка при проведении платежа. Попробуйте снова.',
                    subtitleColor: '#FF3C53',
                    statusColor: '#EA3C4E',
                    statusName: 'ошибка',
                    icon: ErrorIcon
                };
            default:
                return { title: '', subtitle: '', subtitleColor: 'transparent' };
        }
    }, [status]);


    return (
        <div className={styles.status__wrapper}>
            {/* Иконка и заголовок */}
            <div className={styles.status__header}>
                <div className={styles.status__status}>
                    {icon === 'loader' ? (
                        <Loader />
                    ) : (
                        <Icon Svg={icon} width={36} height={36} />
                    )}
                    <span className={styles.status__title}>{title}</span>
                </div>
                <div
                    className={styles.status__subtitle}
                    style={status === 'failed' ? { backgroundColor: subtitleColor, color: 'white' } : { backgroundColor: subtitleColor }}
                >
                    <span>{subtitle}</span>
                </div>
            </div>

            {activePaidTariffs
                .map((t) => (
                    <div key={t.id} className={styles.status__details}>
                        <Icon
                            Svg={t.title === 'Долгосрочный инвестор' ? PaymentsBase : PaymentsActive}
                            width={64}
                            height={46}
                        />
                        <div className={styles.status__cardInfo}>
                            <span className={styles.status__cardStatus} style={{ backgroundColor: statusColor }}>{statusName}</span>
                            <span className={styles.status__cardTitle}>{t.title}</span>
                        </div>
                    </div>
                ))}

            {/* Анимированный блок кнопок только при успехе */}
            {status === 'success' && (
                <motion.div
                    className={styles.status__actions}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.5 }}
                >
                    <span className={styles.status__actionsTitle}>Чек оплаты можно найти в разделе «Документы»</span>
                    <div className={styles.status__buttons}>
                        <Button
                            theme={ButtonTheme.UNDERLINE}
                            padding="20px 25px"
                            onClick={() => {
                                navigate('/documents')
                                dispatch(setCurrentOrderStatus(''))
                            }}
                        >
                            Перейти в документы
                        </Button>
                        <Button
                            theme={ButtonTheme.BLUE}
                            padding="20px 25px"
                            onClick={() => {
                                navigate('/lk')
                                dispatch(setCurrentOrderStatus(''))
                            }}
                        >
                            Вернуться в учётную запись
                        </Button>
                    </div>
                </motion.div>
            )}
            {status === 'loading' && (
                <motion.div
                    className={styles.status__actions}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className={styles.status__buttons}>
                        <Button
                            theme={ButtonTheme.UNDERLINE}
                            padding="20px 25px"
                            onClick={() => {
                                payAction()
                            }}
                        >
                            Перейти к оплате
                        </Button>
                        <Button
                            theme={ButtonTheme.BLUE}
                            padding="20px 25px"
                            onClick={() => {
                                navigate('/lk')
                            }}
                        >
                            Вернуться в учётную запись
                        </Button>
                    </div>
                </motion.div>
            )}
            {status === 'failed' && (
                <motion.div
                    className={styles.status__actions}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className={styles.status__buttons}>
                        <span className={styles.status__actionsTitle}>Что-то пошло не так, пожалуйста попробуйте оплатить снова</span>
                        <div className={styles.status__buttons}>
                            <Button
                                theme={ButtonTheme.UNDERLINE}
                                padding="20px 25px"
                                onClick={() => {
                                    navigate('/payments')
                                    dispatch(setCurrentOrderStatus(''))
                                }}
                            >
                                Перейти к тарифам
                            </Button>
                            <Button
                                theme={ButtonTheme.BLUE}
                                padding="20px 25px"
                                onClick={() => {
                                    navigate('/lk')
                                    dispatch(setCurrentOrderStatus(''))
                                }}
                            >
                                Вернуться в учётную запись
                            </Button>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
};
