import React, { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from 'app/providers/store/config/store';
import { useAppDispatch } from 'shared/hooks/useAppDispatch';
import { Input } from 'shared/ui/Input/Input';
import { Loader } from 'shared/ui/Loader/Loader';
import { debounce } from 'lodash';
import {
    calculateProfitabilityThunk,
    setCalculatorDeposit,
} from 'entities/Payments/slice/paymentsSlice';
import { CalculateProfitabilityPayload } from 'entities/Payments/types/paymentsTypes';
import { Tooltip } from 'shared/ui/Tooltip/Tooltip';
import styles from './styles.module.scss';

/** Формат/парс как в SecondRiskProfile */
const formatMoney = (num: number) => (num ? String(num).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ₽' : '');
const parseMoneyStringToNumber = (str: string) => {
    const raw = str.replace(/\s/g, '').replace('₽', '').trim();
    const val = parseInt(raw, 10);
    return isNaN(val) ? 0 : val;
};

interface Props {
    tariff_key?: string;
}

/** Два «окна»: слева инпут депозита, справа — результаты расчёта */
export const TariffCalculator: React.FC<Props> = ({ tariff_key }) => {
    const dispatch = useAppDispatch();
    const { min_deposit, loading, error, result } = useSelector(
        (s: RootState) => s.payments.calculator
    );

    // дебаунс-запрос
    const fire = useMemo(
        () =>
            debounce((sum: number) => {
                const payload: CalculateProfitabilityPayload = {
                    min_deposit: sum,
                    risk_profile: 'risk_prof_balanced',
                    tariff_key: tariff_key || '',
                };
                dispatch(calculateProfitabilityThunk(payload));
            }, 500),
        [, tariff_key]
    );

    useEffect(() => {
        if (min_deposit) fire(min_deposit);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className={styles.container}>
            {/* Левое окно — инпут */}
            <div className={styles.card}>
                <div className={styles.cardHeader}>
                    <span className={styles.cardTitle}>Калькулятор расчёта доходности</span>
                </div>

                <div className={styles.fieldBlock}>
                    <div className={styles.fieldLabel}>
                        <Tooltip
                            description="Сумма, от которой будет считаться доходность"
                            positionBox={{ top: '26px', left: '-264px' }}
                            squerePosition={{ top: '15px', left: '241px' }}
                            topForCenteringIcons="24px"
                            className={styles.tooltip}
                        />
                    </div>

                    <Input
                        name="deposit"
                        type="swiper"
                        placeholder="Депозит, ₽"
                        min={0}
                        max={100_000_000}
                        step={10_000}
                        needShowInput
                        value={formatMoney(min_deposit || 0)}
                        onChange={(e) => {
                            const num = parseMoneyStringToNumber(e.target.value);
                            dispatch(setCalculatorDeposit(num));
                            fire(num);
                        }}
                    />
                </div>
            </div>

            {/* Правое окно — результат */}
            <div className={styles.card}>
                <div className={styles.cardHeader}>
                    <span className={styles.cardTitle}>Результат расчёта</span>
                    <Tooltip
                        positionBox={{ top: '26px', left: '-264px' }}
                        squerePosition={{ top: '15px', left: '241px' }}
                        topForCenteringIcons="24px"
                        description="Показывает прогноз прибыли за год на основании заданного депозита и риск-профиля"
                        className={styles.tooltip}
                    />
                </div>

                {loading && <Loader />}

                {!loading && error && <div className={styles.error}>{error}</div>}

                {!loading && !error && result && (
                    <div className={styles.rows}>
                        <div className={styles.row}>
                            <span className={styles.label}>Годовая доходность, %</span>
                            <span className={styles.value}>{`${result.year_per} %`}</span>
                        </div>
                        <div className={styles.row}>
                            <span className={styles.label}>Годовой доход, ₽</span>
                            <span className={styles.value}>{`${result.year_money} ₽`}</span>
                        </div>
                        <div className={styles.row}>
                            <span className={styles.label}>Комиссия за 365 дней, ₽</span>
                            <span className={styles.value}>{`${result.commission_365_days} ₽`}</span>
                        </div>
                        <div className={styles.row}>
                            <span className={styles.label}>Доходность без комиссии, %</span>
                            <span className={styles.value}>{`${result.year_per_without_commission} %`}</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
