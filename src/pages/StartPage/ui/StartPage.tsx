import { Cover } from 'shared/ui/Cover/Cover';
import styles from './styles.module.scss';
import { Button } from 'shared/ui/Button/Button';
import { Icon } from 'shared/ui/Icon/Icon';
import ArrowIcon from 'shared/assets/svg/arrowTop-right.svg';
import { useState } from 'react';
import { RiskProfileModal } from 'features/RiskProfile/RiskProfileModal/RiskProfileModal';

function StartPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <div className={styles.page}>
                <div className={styles.page__container}>
                    <h1 className={styles.page__title}>Инновационный подход к инвестированию</h1>
                    <div className={styles.page__description}>
                        <span className={styles.page__ranks}>Ranks autopilot - </span>
                        <span className={styles.page__value}>сервис для оперативного допуска к уникальной стратегии</span>
                    </div>
                    <div className={styles.page__profitability}>
                        <div className={styles.profitability__container}>
                            <span className={styles.profitability__subtitle}>Максимальная историческая доходность</span>
                            <h3 className={styles.profitability__value}>67,2%</h3>
                        </div>
                    </div>
                    <div className={styles.page__subtitle}>
                        <span className={styles.page__subtitle__text}>
                            «Ranks autopilot» Высокая доходность, индивидуальный подход, минимальные риски
                        </span>
                        <Button className={styles.button} onClick={() => setIsModalOpen(true)}>
                            <h3 className={styles.button__text}>Начать инвестировать</h3>
                            <div className={styles.button__icon}>
                                <Icon Svg={ArrowIcon} width={16} height={16} />
                            </div>
                        </Button>
                    </div>
                </div>


            </div>
            <RiskProfileModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </>
    );
}

export default StartPage;
