// TariffCalculator.tsx
import React, { useEffect, useMemo, useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import { debounce } from 'lodash';
import { RootState } from 'app/providers/store/config/store';
import { useAppDispatch } from 'shared/hooks/useAppDispatch';
import { Input } from 'shared/ui/Input/Input';
import { Loader } from 'shared/ui/Loader/Loader';
import { Tooltip } from 'shared/ui/Tooltip/Tooltip';
import { Skeleton } from 'shared/ui/Skeleton/Skeleton';
import styles from './styles.module.scss';
import { SWIPER_PARAM_VALUES, SwiperParametrValues } from 'features/RiskProfile/RiskProfileSecondForm/RiskProfileSecondForm';
import {
    calculateProfitabilityThunk,
    setCalculatorDeposit,
} from 'entities/Payments/slice/paymentsSlice';
import { fetchStepScrollAmount } from 'entities/RiskProfile/slice/riskProfileSlice';
import { CalculateProfitabilityPayload } from 'entities/Payments/types/paymentsTypes';
import { Select } from 'shared/ui/Select/Select';

interface Props {
    tariff_key?: string;
    min_deposit_value: number;
}

/** Формат/парс как в SecondRiskProfile (для инпута) */
const formatMoneyInput = (num: number) =>
    num ? String(num).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ₽' : '';

const parseMoneyStringToNumber = (str: string) => {
    const raw = str.replace(/\s/g, '').replace('₽', '').trim();
    const val = parseInt(raw, 10);
    return isNaN(val) ? 0 : val;
};

/** Формат для вывода результатов: 10 000 ₽, 400 000 ₽, 2 000 345 ₽ */
const formatMoneyOut = (value: number | string | null | undefined) => {
    if (value === null || value === undefined) return '';
    const n = typeof value === 'number'
        ? Math.round(value)
        : Math.round(Number(String(value).replace(/[^\d.-]/g, '')));
    if (!isFinite(n)) return '';
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ₽';
};

const MAX_DEPOSIT = 100_000_000;
const DEFAULT_STEP = 10_000;

export const TariffCalculator: React.FC<Props> = ({ tariff_key, min_deposit_value }) => {
    const dispatch = useAppDispatch();

    const { min_deposit, loading, error, result } = useSelector(
        (s: RootState) => s.payments.calculator
    );
    const riskProfileFromUser = useSelector(
        (s: RootState) => s.user.userPersonalAccountInfo?.risk_profiling_text
    );
    const stepScrollAmount = useSelector(
        (s: RootState) => s.riskProfile.stepScrollAmount
    );

    // Используем значение из сервера или дефолтное
    // Сервер возвращает объект {"step_scroll_amount": 10000}
    const STEP = stepScrollAmount?.step_scroll_amount || DEFAULT_STEP;

    const roundToStep = useCallback((v: number) => Math.round(v / STEP) * STEP, [STEP]);
    const clamp = useCallback(
        (v: number) => Math.min(MAX_DEPOSIT, Math.max(min_deposit_value, v)),
        [min_deposit_value]
    );

    // Опции риск-профилей как в RiskProfileSecondForm
    const profileKeys = Object.keys(SWIPER_PARAM_VALUES) as Array<keyof SwiperParametrValues>;
    const finalRiskProfileOptions = profileKeys.map((key) => ({
        value: key,
        label: SWIPER_PARAM_VALUES[key],
    }));

    // Локальный стейт выбранного риск-профиля
    const [selectedProfile, setSelectedProfile] = useState<string>(
        (riskProfileFromUser as string) || 'risk_prof_balanced'
    );

    // Если из стора пришёл профиль и локально ещё дефолт — синхроним
    useEffect(() => {
        if (riskProfileFromUser && selectedProfile === 'risk_prof_balanced') {
            setSelectedProfile(riskProfileFromUser);
        }
    }, [riskProfileFromUser, selectedProfile]);

    // Загрузка значения шага скролла с сервера
    useEffect(() => {
        if (!stepScrollAmount) {
            dispatch(fetchStepScrollAmount() as any);
        }
    }, [dispatch, stepScrollAmount]);

    // Дебаунс запроса расчёта
    const fire = useMemo(
        () =>
            debounce((sum: number, profile: string) => {
                const payload: CalculateProfitabilityPayload = {
                    min_deposit: sum,
                    risk_profile: profile,
                    tariff_key: tariff_key || '',
                };
                dispatch(calculateProfitabilityThunk(payload));
            }, 500),
        [dispatch, tariff_key]
    );

    // Инициализация депозита и первый расчёт
    useEffect(() => {
        const initial = clamp(roundToStep(min_deposit || min_deposit_value || 0));
        if (min_deposit !== initial) {
            dispatch(setCalculatorDeposit(initial));
            fire(initial, selectedProfile);
        } else if (min_deposit) {
            fire(min_deposit, selectedProfile);
        }
        return () => {
            if (typeof fire.cancel === 'function') fire.cancel();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [min_deposit_value]);

    // Пересчёт при смене риск-профиля
    useEffect(() => {
        const sum = clamp(roundToStep(min_deposit || min_deposit_value));
        fire(sum, selectedProfile);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedProfile]);

    return (
        <div className={styles.container}>
            {/* Левая карточка — ввод */}
            <div className={styles.card}>
                <div className={styles.cardHeader}>
                    <span className={styles.cardTitle}>Калькулятор комиссии</span>
                </div>

                <div className={styles.fieldBlock}>
                    <div className={styles.fieldLabel}>
                        <Tooltip
                            description="Сумма, от которой будет считаться доходность"
                            positionBox={{ top: '26px', left: '-264px' }}
                            squerePosition={{ top: '10px', left: '241px' }}
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
                        value={formatMoneyInput(clamp(roundToStep(min_deposit || min_deposit_value)))}
                        onChange={(e) => {
                            const num = parseMoneyStringToNumber(e.target.value);
                            const normalized = clamp(roundToStep(num));
                            dispatch(setCalculatorDeposit(normalized));
                            fire(normalized, selectedProfile);
                        }}
                        onBlur={(e) => {
                            const num = parseMoneyStringToNumber(e.target.value);
                            const normalized = clamp(roundToStep(num || min_deposit_value));
                            if (normalized !== min_deposit) {
                                dispatch(setCalculatorDeposit(normalized));
                                fire(normalized, selectedProfile);
                            }
                        }}
                    />
                </div>

                <div style={{ position: 'relative' }}>
                    <div className={styles.cardHeader}>
                        <span className={styles.cardTitle}>Риск-профиль</span>
                    </div>
                    <Tooltip
                        positionBox={{ top: '16px', left: '-264px' }}
                        squerePosition={{ top: '4px', left: '241px' }}
                        topForCenteringIcons="24px"
                        description={
                            riskProfileFromUser
                                ? 'Ваш текущий риск-профиль'
                                : 'Доходность и комиссия зависят напрямую от риск-профиля, который вы выберете'
                        }
                        className={styles.tooltip_rp}
                    />

                    {riskProfileFromUser ? (
                        <span>
                            {riskProfileFromUser
                                ? SWIPER_PARAM_VALUES[riskProfileFromUser as keyof typeof SWIPER_PARAM_VALUES]
                                : ''}
                        </span>
                    ) : (
                        <Select
                            value={selectedProfile}
                            title="Выберите риск профиль"
                            items={finalRiskProfileOptions}
                            onChange={(val: string) => setSelectedProfile(val)}
                        />
                    )}
                </div>
            </div>

            {/* Правая карточка — результат */}
            <div className={styles.card}>
                <div className={styles.cardHeader}>
                    <span className={styles.cardTitle}>Результат расчёта</span>
                    <Tooltip
                        positionBox={{ top: '26px', left: '-264px' }}
                        squerePosition={{ top: '15px', left: '241px' }}
                        topForCenteringIcons="24px"
                        description="Прогноз прибыли за год на основании заданного депозита и риск-профиля"
                        className={styles.tooltip}
                    />
                </div>

                <div className={styles.rows}>
                    <div className={styles.row}>
                        <span className={styles.label}>Годовая доходность</span>
                        {loading ? (
                            <Skeleton width="80px" height="16px" />
                        ) : (
                            <span className={styles.value}>{result ? `${result.year_per} %` : '—'}</span>
                        )}
                    </div>
                    <div className={styles.row}>
                        <span className={styles.label}>Доходность с учетом комиссии</span>
                        {loading ? (
                            <Skeleton width="80px" height="16px" />
                        ) : (
                            <span className={styles.value}>{result ? `${result.year_per_without_commission} %` : '—'}</span>
                        )}
                    </div>
                    <div className={styles.row}>
                        <span className={styles.label}>Годовой доход</span>
                        {loading ? (
                            <Skeleton width="100px" height="16px" />
                        ) : (
                            <span className={styles.value}>{result ? formatMoneyOut(result.year_money) : '—'}</span>
                        )}
                    </div>
                    <div className={styles.row}>
                        <span className={styles.label}>Комиссия за 365 дней</span>
                        {loading ? (
                            <Skeleton width="100px" height="16px" />
                        ) : (
                            <span className={styles.value}>{result ? formatMoneyOut(result.commission_365_days) : '—'}</span>
                        )}
                    </div>
                    <div className={styles.row}>
                        <span className={styles.label}>Годовой доход с учетом комиссии</span>
                        {loading ? (
                            <Skeleton width="100px" height="16px" />
                        ) : (
                            <span className={styles.value}>{result ? formatMoneyOut(result.year_money_without_commission) : '—'}</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
