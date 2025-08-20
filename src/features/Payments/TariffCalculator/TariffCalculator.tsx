// TariffCalculator.tsx
import React, { useEffect, useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { debounce } from 'lodash';
import { RootState } from 'app/providers/store/config/store';
import { useAppDispatch } from 'shared/hooks/useAppDispatch';
import { Input } from 'shared/ui/Input/Input';
import { Loader } from 'shared/ui/Loader/Loader';
import { Tooltip } from 'shared/ui/Tooltip/Tooltip';
import styles from './styles.module.scss';
import { SWIPER_PARAM_VALUES } from 'features/RiskProfile/RiskProfileSecondForm/RiskProfileSecondForm';
import {
    calculateProfitabilityThunk,
    setCalculatorDeposit,
} from 'entities/Payments/slice/paymentsSlice';
import { CalculateProfitabilityPayload } from 'entities/Payments/types/paymentsTypes';

interface Props {
    tariff_key?: string;
    min_deposit_value: number;
}

/** Формат/парс как в SecondRiskProfile */
const formatMoney = (num: number) =>
    num ? String(num).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ₽' : '';

const parseMoneyStringToNumber = (str: string) => {
    const raw = str.replace(/\s/g, '').replace('₽', '').trim();
    const val = parseInt(raw, 10);
    return isNaN(val) ? 0 : val;
};

const STEP = 10_000;
const MAX_DEPOSIT = 100_000_000;

export const TariffCalculator: React.FC<Props> = ({ tariff_key, min_deposit_value }) => {
    const dispatch = useAppDispatch();

    const { min_deposit, loading, error, result } = useSelector(
        (s: RootState) => s.payments.calculator
    );
    const riskProfile = useSelector(
        (s: RootState) => s.user.userPersonalAccountInfo?.risk_profiling_text
    );

    const roundToStep = useCallback((v: number) => Math.round(v / STEP) * STEP, []);
    const clamp = useCallback(
        (v: number) => Math.min(MAX_DEPOSIT, Math.max(min_deposit_value, v)),
        [min_deposit_value]
    );

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
        [dispatch, tariff_key]
    );

    // Инициализация значения и запрос расчёта при маунте / смене минималки
    useEffect(() => {
        const initial = clamp(roundToStep(min_deposit || min_deposit_value || 0));
        if (min_deposit !== initial) {
            dispatch(setCalculatorDeposit(initial));
            fire(initial);
        } else if (min_deposit) {
            fire(min_deposit);
        }
        // очищаем дебаунс при размонтировании
        return () => {

            if (typeof fire.cancel === 'function') fire.cancel();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [min_deposit_value]); // намеренно не включаем min_deposit, чтобы не зациклить

    return (
        <div className={styles.container}>
            {/* Левая карточка — ввод */}
            <div className={styles.card}>
                <div className={styles.cardHeader}>
                    <span className={styles.cardTitle}>Калькулятор расчёта комиссии</span>
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
                        min={min_deposit_value}
                        max={MAX_DEPOSIT}
                        step={STEP}
                        needShowInput
                        value={formatMoney(clamp(roundToStep(min_deposit || min_deposit_value)))}
                        onChange={(e) => {
                            const num = parseMoneyStringToNumber(e.target.value);
                            const normalized = clamp(roundToStep(num));
                            dispatch(setCalculatorDeposit(normalized));
                            fire(normalized);
                        }}
                        onBlur={(e) => {
                            const num = parseMoneyStringToNumber(e.target.value);
                            const normalized = clamp(roundToStep(num || min_deposit_value));
                            if (normalized !== min_deposit) {
                                dispatch(setCalculatorDeposit(normalized));
                                fire(normalized);
                            }
                        }}
                    />
                </div>

                <div className={styles.cardHeader}>
                    <span className={styles.cardTitle}>Риск-профиль</span>
                </div>
                <span>
                    {riskProfile && SWIPER_PARAM_VALUES[riskProfile as keyof typeof SWIPER_PARAM_VALUES]}
                </span>
            </div>

            {/* Правая карточка — результат */}
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
