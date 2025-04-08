import React, { useCallback, useEffect, useRef } from "react";
import { useFormik } from "formik";
import { useSelector } from "react-redux";
import { RootState } from "app/providers/store/config/store";
import styles from "./styles.module.scss";
import { Button, ButtonTheme } from "shared/ui/Button/Button";
import { prevStep, setStepAdditionalMenuUI } from "entities/ui/Ui/slice/uiSlice";
import { useAppDispatch } from "shared/hooks/useAppDispatch";
import { Tooltip } from "shared/ui/Tooltip/Tooltip";
import { Input } from "shared/ui/Input/Input";
import { postFirstRiskProfileForm, postSecondRiskProfileForm, postSecondRiskProfileFormFinal } from "entities/RiskProfile/slice/riskProfileSlice";
import { debounce } from "lodash";
import { SecondRiskProfilePayload } from "entities/RiskProfile/model/types";
import { Select } from "shared/ui/Select/Select";
import { Loader } from "shared/ui/Loader/Loader";

interface SwiperParametrValues {
    risk_prof_conservative: string;
    risk_prof_conservative_moderately: string;
    risk_prof_balanced: string;
    risk_prof_aggressive_moderately: string;
    risk_prof_aggressive: string;
    risk_prof_aggressive_super: string;
}
const SWIPER_PARAM_VALUES: SwiperParametrValues = {
    risk_prof_conservative: 'Консервативный',
    risk_prof_conservative_moderately: 'Умеренно-консервативный',
    risk_prof_balanced: 'Сбалансированный',
    risk_prof_aggressive_moderately: 'Умеренно-агрессивный',
    risk_prof_aggressive: 'Агрессивный',
    risk_prof_aggressive_super: 'Супер-агрессивный',
};
const RISK_PROFILE_DESCRIPTIONS: { [key: string]: string } = {
    risk_prof_conservative: "Главная цель — сохранение и защита капитала. Инвесторам с таким профилем подходят наиболее безопасные финансовые инструменты: депозиты и государственные облигации. До 100% - государственные облигации.",
    risk_prof_conservative_moderately: "Подразумевает готовность принять разумный уровень риска в обмен на потенциальную возможность получить доход на уровне существующих процентных ставок по депозитам. До 100% портфеля — корпоративные, муниципальные и государственные облигации.",
    risk_prof_balanced: "Это золотая середина. Инвесторы с таким профилем распределяют активы между стабильными облигациями и более рискованными акциями. 50% портфеля занимают облигации. 50% акции.",
    risk_prof_aggressive_moderately: "Повышенный уровень риска и повышенная волатильность стоимости портфеля в обмен на повышенный доход. Портфель на 75% состоит из акций, на 25% облигаций.",
    risk_prof_aggressive: "Высокую склонность к риску и большой опыт самостоятельной торговли на бирже. Агрессивный инвестор допускает сильную просадку портфеля в обмен на высокую потенциальную доходность. 100% - портфеля в акциях.",
    risk_prof_aggressive_super: "Максимально агрессивная стратегия с низкой диверсификацией, с высоким риском и с максимальным потенциалом доходности. 100% портфеля в акциях. Сильная концентрация (низкая диверсификация)"
};

export const RiskProfileSecondForm: React.FC = () => {
    const dispatch = useAppDispatch();
    const isBottom = useSelector((state: RootState) => state.ui.isScrollToBottom);
    const secondRiskProfileData = useSelector((state: RootState) => state.riskProfile.secondRiskProfileData);
    const { loading } = useSelector((state: RootState) => state.riskProfile);
    const thirdRiskProfileResponse = useSelector((state: RootState) => state.riskProfile.thirdRiskProfileResponse);

    const goBack = () => dispatch(prevStep());



    const formik = useFormik({
        enableReinitialize: true,
        initialValues: {
            amount_expected_replenishment: secondRiskProfileData?.min_amount_expected_replenishment ?? 0,
            portfolio_parameters: secondRiskProfileData?.recommended_risk_profiles
                ? Object.keys(secondRiskProfileData.recommended_risk_profiles)[Object.keys(secondRiskProfileData.recommended_risk_profiles).length - 1]
                : '',
            risk_profiling_final: ''
        },
        onSubmit: async (values) => {

        },
    });

    const debouncedPostForm = useCallback(
        debounce((values) => {
            handleGetNewPercentage(values)
        }, 500),
        []
    );

    useEffect(() => {
        const riskProfileDataLS = localStorage.getItem('riskProfileFormData');
        if (riskProfileDataLS) {
            const parsedData = JSON.parse(riskProfileDataLS);
            dispatch(postFirstRiskProfileForm({ ...parsedData.data }));
        }
    }, []);

    useEffect(() => {
        if (formik.values.amount_expected_replenishment && formik.values.portfolio_parameters) {
            debouncedPostForm({
                amount_expected_replenishment: formik.values.amount_expected_replenishment,
                portfolio_parameters: formik.values.portfolio_parameters
            });
        }
    }, [formik.values.amount_expected_replenishment, formik.values.portfolio_parameters, debouncedPostForm]);

    useEffect(() => {
        if (!formik.values.portfolio_parameters && secondRiskProfileData?.recommended_risk_profiles) {
            const firstKey = Object.keys(secondRiskProfileData.recommended_risk_profiles)[Object.keys(secondRiskProfileData.recommended_risk_profiles).length - 1] || '';
            formik.setFieldValue('portfolio_parameters', firstKey);
        }
    }, [secondRiskProfileData]);

    const finalRiskProfileOptions = Object.entries(secondRiskProfileData?.recommended_risk_profiles || {}).map(
        ([key, value]) => ({
            value: key,
            label: value,
        })
    );

    const handleGetNewPercentage = (values: SecondRiskProfilePayload) => {
        dispatch(postSecondRiskProfileForm({
            amount_expected_replenishment: values.amount_expected_replenishment,
            portfolio_parameters: values.portfolio_parameters,
        }));
    };

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

    const handlePostRiskProfileDetailedInfo = async () => {
        try {
            await dispatch(postSecondRiskProfileFormFinal(formik.values)).unwrap();
            dispatch(setStepAdditionalMenuUI(4));
        } catch (error) {

        }
    };


    if (loading || !thirdRiskProfileResponse) {
        return <Loader />;
    } else {
        return (
            <div className={styles.form}>
                <form onSubmit={formik.handleSubmit} className={styles.form__form}>
                    <div className={styles.form__container}>
                        <div className={styles.form__item}>
                            <div className={styles.form__item__balans}>
                                <span className={styles.balans}>Баланс портфеля</span>
                                <Tooltip
                                    className={styles.form__item__tooltip}
                                    description="Средства на счете"
                                    topForCenteringIcons="24px"
                                    direction='top'
                                    squerePosition={{ bottom: '-4px' }}
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
                                min={secondRiskProfileData?.min_amount_expected_replenishment}
                                max={100000000}
                                step={secondRiskProfileData?.step_scroll_amount_expected_replenishment}
                                // Передаём уже ОТФОРМАТИРОВАННУЮ строку,
                                // чтобы пользователь видел "3 000 000 ₽"
                                value={formatMoney(
                                    formik.values.amount_expected_replenishment || 200000
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
                                    className={styles.form__item__tooltip_specified}
                                    description='Сумма предполагаемого пополнения счета'
                                    topForCenteringIcons="24px"
                                    direction='left'
                                    positionBox={{ top: '12px', right: '32px' }}
                                    squerePosition={{ right: '-4px' }}
                                />
                            </div>
                        </div>
                    </div>
                    <div className={styles.form__container}>
                        <div className={styles.form__item}>
                            <span className={styles.parametrs}>Параметры портфеля</span>
                            <span className={styles.parametrs__value}>
                                {SWIPER_PARAM_VALUES[formik.values.portfolio_parameters as keyof SwiperParametrValues]}
                            </span>
                        </div>

                        <div className={styles.form__item}>
                            <Input
                                swiperDiscreteSubtitles={['меньше риск', 'меньше доход', 'больше риск', 'больше доход']}
                                type="swiperDiscrete"
                                theme="gradient"                // чтобы ползунок был с градиентной обводкой
                                name="portfolio_parameters"
                                discreteValues={[
                                    "risk_prof_conservative",
                                    "risk_prof_conservative_moderately",
                                    "risk_prof_balanced",
                                    "risk_prof_aggressive_moderately",
                                    "risk_prof_aggressive",
                                    "risk_prof_aggressive_super"
                                ]}
                                customSliderDivisions={5}
                                value={formik.values.portfolio_parameters}
                                onChange={(e) => {
                                    // e.target.value здесь будет строка из массива discreteValues
                                    formik.setFieldValue("portfolio_parameters", e.target.value);
                                }}
                                onBlur={formik.handleBlur}
                            />
                        </div>
                    </div>
                    <div className={styles.form__container} style={{ minHeight: '74px' }}>
                        <div className={styles.form__item_potintial}>
                            <div className={styles.form__item_potintial__container} >
                                <span className={styles.form__item__potintial__title}>Потенциальный доход</span>
                                <Tooltip
                                    className={styles.form__item__tooltip}
                                    description="Потенциальный доход. Складывается из потенциального роста цены бумаг, входящих в портфель, прогнозных дивидендов и купонного дохода от облигаций"
                                    topForCenteringIcons="24px"
                                    direction='top'
                                    squerePosition={{ bottom: '-4px' }}
                                />
                            </div>
                            <span className={styles.form__item__potintial__title_green}>{thirdRiskProfileResponse ? thirdRiskProfileResponse.risk_profiling_potential_income_percent : secondRiskProfileData?.risk_profiling_potential_income_percent}%</span>
                        </div>
                        <div className={styles.potential__capital__change}>
                            {thirdRiskProfileResponse ? thirdRiskProfileResponse.potential_income : secondRiskProfileData?.potential_income} ₽
                        </div>
                    </div>
                    <div className={styles.form__container} style={{ minHeight: '74px' }}>
                        <div className={styles.form__item_potintial}>
                            <div className={styles.form__item_potintial__container} >
                                <span className={styles.form__item__potintial__title}>Возможный убыток</span>
                                <Tooltip
                                    className={styles.form__item__tooltip}
                                    description="Возможное снижение цены портфеля в моменте с учетом действующих на рынке факторов"
                                    topForCenteringIcons="24px"
                                    direction='top'
                                    squerePosition={{ bottom: '-4px' }}
                                />
                            </div>
                            <span className={styles.form__item__potintial__title_red}>{thirdRiskProfileResponse ? thirdRiskProfileResponse.risk_profiling_possible_loss_percent : secondRiskProfileData?.risk_profiling_possible_loss_percent}%</span>
                        </div>
                        <div className={styles.potential__capital__change}>
                            {thirdRiskProfileResponse ? thirdRiskProfileResponse.possible_loss : secondRiskProfileData?.possible_loss} ₽
                        </div>
                    </div>
                    {/* <h4 className={styles.title}>Завершение настроек риск профиля</h4> */}
                    <div className={styles.form__container} style={{ minHeight: '180px' }}>

                        {secondRiskProfileData && (
                            <div className={styles.form__final}>

                                <Tooltip
                                    className={styles.form__item__tooltip_report}
                                    description={
                                        RISK_PROFILE_DESCRIPTIONS[
                                        Object.keys(secondRiskProfileData.recommended_risk_profiles)[Object.keys(secondRiskProfileData.recommended_risk_profiles).length - 1]
                                        ]
                                    }
                                    topForCenteringIcons="24px"
                                    direction='left'
                                    positionBox={{ top: '12px', right: '32px' }}
                                    squerePosition={{ right: '-4px' }}
                                />
                                <div className={styles.report__container}>
                                    <p className={styles.report}>Рекомендуемый риск-профиль по результатам риск-профилирования </p>
                                    <b className={styles.report__value}>{Object.values(secondRiskProfileData.recommended_risk_profiles)[Object.keys(secondRiskProfileData.recommended_risk_profiles).length - 1]}</b>
                                </div>
                                <Select
                                    label="Подтвердить выбор риск профиля"
                                    needValue
                                    value={formik.values.risk_profiling_final || ""}
                                    title="Выберите риск профиль"
                                    items={finalRiskProfileOptions}
                                    onChange={(selectedVal) => {
                                        formik.setFieldValue("risk_profiling_final", selectedVal);
                                        // Если выбрано "не выбрано" (пустая строка), сбрасываем touched,
                                        // чтобы placeholder отобразился сразу
                                        if (selectedVal === "") {
                                            formik.setFieldTouched("risk_profiling_final", false);
                                        }
                                    }}
                                />
                            </div>
                        )}
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
                            disabled={!(formik.isValid && formik.dirty)}
                            onClick={handlePostRiskProfileDetailedInfo}
                        >
                            Продолжить
                        </Button>
                    </div>
                </form>
            </div>
        );
    }
};
