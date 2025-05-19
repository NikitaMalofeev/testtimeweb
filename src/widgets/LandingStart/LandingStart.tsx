import styles from './styles.module.scss';
import { Button } from 'shared/ui/Button/Button';
import { Icon } from 'shared/ui/Icon/Icon';
import ArrowIcon from 'shared/assets/svg/arrowTop-right.svg';
import { ModalAnimation, ModalSize, ModalType } from 'entities/ui/Modal/model/modalTypes';
import { useAppDispatch } from 'shared/hooks/useAppDispatch';
import { openModal } from 'entities/ui/Modal/slice/modalSlice';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from 'app/providers/store/config/store';

export const LandingStart = () => {
    const dispatch = useAppDispatch()
    const isDesktop = window.innerWidth > 650
    const navigate = useNavigate()
    const user = useSelector((s: RootState) => s.user.token)

    return (
        <>
            <div className={styles.page}>
                <div className={styles.page__container}>
                    <div className={styles.page__content}>
                        <div className={styles.page__main}>
                            <h1 className={styles.page__title}>Инновационный подход к инвестированию</h1>
                            <div className={styles.page__description}>
                                <span className={styles.page__ranks}>Ranks autopilot - </span>
                                <span className={styles.page__value}>сервис для оперативного допуска к уникальной стратегии</span>
                            </div>
                            {isDesktop && <div className={styles.page__subtitle}>
                                <span className={styles.page__subtitle__text}>
                                    «Ranks autopilot» Высокая доходность, индивидуальный подход, минимальные риски
                                </span>
                                <Button className={styles.button} onClick={() => {
                                    if (user) {
                                        navigate('/lk')
                                    } else {
                                        navigate('/')
                                    }
                                }}>
                                    <h3 className={styles.button__text}>Начать инвестировать</h3>
                                    <div className={styles.button__icon}>
                                        <Icon Svg={ArrowIcon} width={16} height={16} />
                                    </div>
                                </Button>
                            </div>}
                        </div>
                        <div className={styles.page__profitability}>
                            <div className={styles.profitability__container}>
                                <span className={styles.profitability__subtitle}>Максимальная историческая доходность</span>
                                <h3 className={styles.profitability__value}>67,2%</h3>
                            </div>
                        </div>
                        {!isDesktop && <div className={styles.page__subtitle}>
                            <span className={styles.page__subtitle__text}>
                                «Ranks autopilot» Высокая доходность, индивидуальный подход, минимальные риски
                            </span>
                            <Button className={styles.button} onClick={() => {
                                dispatch(openModal({
                                    type: ModalType.IDENTIFICATION,
                                    size: ModalSize.FULL,
                                    animation: ModalAnimation.LEFT
                                }));
                            }}>
                                <h3 className={styles.button__text}>Начать инвестировать</h3>
                                <div className={styles.button__icon}>
                                    <Icon Svg={ArrowIcon} width={16} height={16} />
                                </div>
                            </Button>
                        </div>}
                    </div>
                </div>
            </div>

        </>
    );
}
