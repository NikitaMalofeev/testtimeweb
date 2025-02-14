import React from "react";
import { useFormik } from "formik";
import { useSelector } from "react-redux";
import { RootState } from "app/providers/store/config/store";
import styles from "./styles.module.scss";
import { Button, ButtonTheme } from "shared/ui/Button/Button";
import { nextStep, prevStep } from "entities/ui/Ui/slice/uiSlice";
import { useAppDispatch } from "shared/hooks/useAppDispatch";
import { Tooltip } from "shared/ui/Tooltip/Tooltip";
import { Input } from "shared/ui/Input/Input";

export const RiskProfileSecondForm: React.FC = () => {
    const dispatch = useAppDispatch();
    const isBottom = useSelector((state: RootState) => state.ui.isScrollToBottom);

    const goNext = () => dispatch(nextStep());
    const goBack = () => dispatch(prevStep());

    const formik = useFormik({
        enableReinitialize: true,
        initialValues: {
            // Храним именно число!
            amount_expected_replenishment: 10000000,
            portfolio_parameters: "",
        },
        onSubmit: async (values) => {
            alert("Данные отправлены: " + JSON.stringify(values));
        },
    });

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
                        type="submit"
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
