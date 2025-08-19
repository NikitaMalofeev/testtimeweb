import { de } from 'date-fns/locale';
import styles from './styles.module.scss';
import BackIcon from 'shared/assets/svg/ArrowBack.svg'
import { useNavigate } from 'react-router-dom';
import { Icon } from 'shared/ui/Icon/Icon';
import { RootState } from 'app/providers/store/config/store';
import { useSelector } from 'react-redux';
import RefillIcon from 'shared/assets/svg/RefillBalance.svg'
import WithdrawIcon from 'shared/assets/svg/WithdrawBalance.svg'


const BalancePage = () => {
    const navigate = useNavigate();
    const balance = useSelector((s: RootState) => s.payments.currentBalance)
    const activeTariff = useSelector((s: RootState) => s.payments.activeTariffs[0])
    return (
        <div className={styles.page}>
            { }
            <div className={styles.header}> <Icon Svg={BackIcon} width={24} height={24} onClick={() => navigate(-1)} pointer /> <span>{activeTariff ? 'Вы инвестируете с Ranks' : 'Вы пока не подключили брокерский счет или он не прошел проверку'}</span></div>
            <div className={styles.background}></div>
            <div className={styles.content}>
                <span>Ваш баланс</span>
                {balance} ₽
            </div>
            <div>
                <div><div><Icon Svg={WithdrawIcon} width={24} height={24} onClick={() => navigate(-1)} pointer /></div><span></span></div>
                <div><div><Icon Svg={RefillIcon} width={24} height={24} onClick={() => navigate(-1)} pointer /> </div><span></span></div>
            </div>
        </div>
    );
};

export default BalancePage