import React, { useEffect } from "react";
import { useFormik } from "formik";
import { useSelector } from "react-redux";
import { RootState } from "app/providers/store/config/store";
import styles from "./styles.module.scss";
import { Button, ButtonTheme } from "shared/ui/Button/Button";
import { nextStep, prevStep } from "entities/ui/Ui/slice/uiSlice";
import { useAppDispatch } from "shared/hooks/useAppDispatch";
import { Tooltip } from "shared/ui/Tooltip/Tooltip";
import { Input } from "shared/ui/Input/Input";
import { postSecondRiskProfileForm } from "entities/RiskProfile/slice/riskProfileSlice";

interface SwiperParametrValues {
    "risk_prof_conservative": 'Консервативный',
    "risk_prof_moderate": 'Умеренный',
    "risk_prof_aggressive": 'Агрессивный'
}

// Словарь: ключ → человекочитаемое название
const SWIPER_PARAM_VALUES: SwiperParametrValues = {
    risk_prof_conservative: 'Консервативный',
    risk_prof_moderate: 'Умеренный',
    risk_prof_aggressive: 'Агрессивный',
};


export const RiskProfileSecondForm: React.FC = () => {
    const dispatch = useAppDispatch();
    const isBottom = useSelector((state: RootState) => state.ui.isScrollToBottom);
    const initialValuesFromRedux = useSelector((state: RootState) => state.riskProfile.secondForm);

    const goNext = () => dispatch(nextStep());
    const goBack = () => dispatch(prevStep());

    const formik = useFormik({
        enableReinitialize: true,
        initialValues: {
            // Храним именно число!
            amount_expected_replenishment: initialValuesFromRedux.amount_expected_replenishment,
            portfolio_parameters: initialValuesFromRedux.portfolio_parameters,
        },
        onSubmit: async (values) => {
            alert("Данные отправлены: " + JSON.stringify(values));
        },
    });

    useEffect(() => {
        handleGetNewPercentage()
    }, [formik.values])

    const handleGetNewPercentage = () => {
        dispatch(postSecondRiskProfileForm(formik.values))
    }

    // Функция для форматирования числа: 3000000 → "3 000 000 ₽"
    const formatMoney = (num: number) => {
        if (num === 0) return "";
        return String(num)
            .replace(/\B(?=(\d{3})+(?!\d))/g, " ")
            .concat(" ₽");
    };

    // Функция для парсинга форматированной строки: "3 000 000 ₽" → 3000000
    const parseMoneyStringToNumber = (str: string) => {
        const raw = str.replace(/\s/g, "").replace("₽", "").trim();
        const val = parseInt(raw, 10);
        return isNaN(val) ? 0 : val;
    };

    return (
        <div className={styles.form}>
            <form onSubmit={formik.handleSubmit} className={styles.form__form}>
                <div className={styles.form__container}>
                    <div className={styles.form__item}>
                        <div>
                            <span className={styles.balans}>Баланс портфеля</span>
                            <Tooltip
                                positionBox={{ top: "8px", left: "34px" }}
                                squerePosition={{ top: "15px", left: "-5px" }}
                                topForCenteringIcons="8px"
                                description="Средства на счете"
                            />
                        </div>
                        <span>0 ₽</span>
                    </div>

                    <div className={styles.form__item}>
                        <Input
                            name="amount_expected_replenishment"
                            type="swiper"
                            placeholder="Деньги"
                            // Пределы для ползунка:
                            min={500000}
                            max={100000000}
                            step={5000}
                            // Передаём уже ОТФОРМАТИРОВАННУЮ строку,
                            // чтобы пользователь видел "3 000 000 ₽"
                            value={formatMoney(
                                formik.values.amount_expected_replenishment
                            )}
                            onChange={(e) => {
                                // Парсим обратно в число,
                                // кладём это число в Formik
                                const numeric = parseMoneyStringToNumber(e.target.value);
                                formik.setFieldValue(
                                    "amount_expected_replenishment",
                                    numeric
                                );
                            }}
                            onBlur={formik.handleBlur}
                        />
                        <div className={styles.form__item__tooltip}>
                            <Tooltip
                                topForCenteringIcons='20px'
                                description='Сумма предполагаемого пополнения счета'
                                positionBox={{ top: '26px', left: '-264px' }}
                                squerePosition={{ top: '15px', left: '241px' }}
                            />
                        </div>
                    </div>
                </div>
                <div className={styles.form__container}>
                    <div className={styles.form__item}>
                        <span className={styles.parametrs}>Параметры портфеля</span>
                        <span className={styles.parametrs__value}>
                            {
                                SWIPER_PARAM_VALUES[
                                formik.values.portfolio_parameters as keyof SwiperParametrValues
                                ] || 'значение'
                            }
                        </span>
                    </div>

                    <div className={styles.form__item}>
                        <Input
                            swiperDiscreteSubtitles={['меньше риск', 'меньше доход', 'больше риск', 'больше доход']}
                            type="swiperDiscrete"
                            theme="gradient"                // чтобы ползунок был с градиентной обводкой
                            name="portfolio_parameters"
                            discreteValues={["risk_prof_conservative", "risk_prof_moderate", "risk_prof_aggressive"]}
                            value={formik.values.portfolio_parameters}
                            onChange={(e) => {
                                // e.target.value здесь будет строка из массива discreteValues
                                formik.setFieldValue("portfolio_parameters", e.target.value);
                            }}
                        />
                    </div>
                </div>
                <div className={styles.form__container}>
                    <div className={styles.form__item_potintial}>
                        <div className={styles.form__item__potintial}>
                            <span className={styles.form__item__potintial__title}>Возможный убыток</span>
                            <Tooltip
                                className={styles.form__item__tooltip}
                                description='Возможный потенциальный убыток'
                                positionBox={{ top: '26px', left: '-264px' }}
                                squerePosition={{ top: '15px', left: '241px' }}
                                topForCenteringIcons="24px"
                            />
                        </div>
                        <span className={styles.form__item__potintial}>3%</span>
                    </div>
                    <div className={styles.form__item}>
                        <div className={styles.form__item__potintial}></div>
                    </div>
                </div>

                <div className={`${styles.buttons} ${isBottom ? "" : styles.shadow}`}>
                    <Button
                        type="button"
                        theme={ButtonTheme.EMPTYBLUE}
                        onClick={goBack}
                        className={styles.button_back}
                    >
                        Вернуться
                    </Button>
                    <Button
                        type="button"
                        theme={ButtonTheme.BLUE}
                        className={styles.button}
                        disabled={false}
                    >
                        Продолжить
                    </Button>
                </div>
            </form>
        </div>
    );
};
