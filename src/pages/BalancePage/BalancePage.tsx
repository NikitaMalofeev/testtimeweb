import { de } from 'date-fns/locale';
import styles from './styles.module.scss';
import BackIcon from 'shared/assets/svg/ArrowBack.svg'
import { useNavigate } from 'react-router-dom';
import { Icon } from 'shared/ui/Icon/Icon';
import { RootState } from 'app/providers/store/config/store';
import { useSelector } from 'react-redux';
import RefillIcon from 'shared/assets/svg/RefillBalance.svg'
import WithdrawIcon from 'shared/assets/svg/WithdrawBalance.svg'
import { useEffect } from 'react';
import { useAppDispatch } from 'shared/hooks/useAppDispatch';
import { getBrokerBalanceThunk } from 'entities/Payments/slice/paymentsSlice';

const BalancePage = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const balance = useSelector((s: RootState) => s.payments.balance);
    const activeTariff = useSelector((s: RootState) => s.payments.activeTariffs[0])
    const brokerIds = useSelector((s: RootState) => s.documents.brokerIds)
    const isAnotherBroker = useSelector((s: RootState) => s.riskProfile.isAnotherBroker)

    useEffect(() => {
        if (brokerIds.length > 0 && !isAnotherBroker) {
            dispatch(getBrokerBalanceThunk({ broker_id: brokerIds[0] }));
        }
    }, [brokerIds])
    return (
        <div className={styles.page}>
            { }
            <div className={styles.header}> <Icon Svg={BackIcon} width={24} height={24} onClick={() => navigate(-1)} pointer /> <span>{!balance ? 'Вы пока не подключили брокерский счет или он не прошел проверку' : activeTariff ? 'Вы инвестируете с Ranks' : 'Для начала работы с вашим счетом оплатите тариф'}</span></div>
            <div className={styles.background}></div>
            <div className={styles.content}>
                <span className={styles.content__title}>Ваш баланс</span>
                <span className={styles.content__value}>{balance?.all_total} ₽</span>
                <div className={styles.content__actions}>
                    <div className={styles.content__actions__button} onClick={() => window.open("https://www.tbank.ru/", "_blank", "noopener,noreferrer")}
                    ><div className={styles.content__actions__button__icon}><Icon Svg={WithdrawIcon} width={11} height={11} pointer /></div><span>Пополнить</span></div>
                    <div className={styles.content__actions__button} onClick={() => window.open("https://www.tbank.ru/", "_blank", "noopener,noreferrer")}
                    ><div className={styles.content__actions__button__icon}><Icon Svg={RefillIcon} width={11} height={11} pointer /> </div><span>Вывести</span></div>
                </div>
            </div>

        </div>
    );
};

export default BalancePage