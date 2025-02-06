import React, { useEffect, useMemo, useState } from "react";
import { useFormik } from "formik";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "app/providers/store/config/store";
import { fetchAllSelects, updateFieldValue } from "entities/RiskProfile/slice/riskProfileSlice";
import styles from './styles.module.scss'
import { Button, ButtonTheme } from "shared/ui/Button/Button";
import { closeModal } from "entities/ui/Modal/slice/modalSlice";
import { ModalType } from "entities/ui/Modal/model/modalTypes";

interface Question {
    name: string;
    label: string;
    options?: Record<string, string>;
}

export const RiskProfileFirstForm: React.FC = () => {
    const dispatch = useDispatch();
    const { loading, error, riskProfileSelectors, formValues } = useSelector(
        (state: RootState) => state.riskProfile
    );
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        dispatch(fetchAllSelects() as any);
    }, [dispatch]);

    /**
     * Функция, которая для каждого ключа возвращает 
     * более «читаемую» подпись вопроса.
     */
    const getLabelByKey = (key: string) => {
        const map: Record<string, string> = {
            age_parameters: "Ваш возраст",
            currency_investment: "Валюта инвестиций",
            current_loans: "Ваши текущие кредиты",
            education: "Ваше образование",
            gender: "Ваш пол",
            income_investments_intended: "Доход от Ваших инвестиций предназначен для",
            invest_target: "Цель инвестирования",
            investment_experience: "Как Вы оцениваете свой опыт (знания) в области инвестирования?",
            investment_period: "Срок инвестирования",
            monthly_expense: "Информация о Ваших среднемесячных расходах (за последние 12 месяцев)",
            monthly_income: "Объём Ваших среднемесячных доходов (за последние 12 месяцев)",
            obligations_invest_horizon: "Ваши обязательства на период инвестирования",
            planned_future_income: "Планируемые будущие изменения дохода",
            practical_investment_experience: "Практический опыт в области инвестирования",
            profit_expect: "Желаемая доходность и допустимые риски",
            question_assets_losing_value: "Как Вы поступите, если активы потеряют более 20% стоимости?",
            risk_profiling_int: "Результирующий риск-профиль",
            savings_level: "Информация о наличии и сумме сбережений",
        };
        return map[key] || key;
    };

    useEffect(() => {
        console.log(riskProfileSelectors);
    }, [riskProfileSelectors]);

    const questions: Question[] = useMemo(() => {
        if (!riskProfileSelectors) return [];

        // Генерируем вопросы из полученных с сервера селектов
        const serverQuestions: Question[] = Object.entries(riskProfileSelectors).map(
            ([key, value]) => ({
                name: key,
                label: getLabelByKey(key),
                options: value,
            })
        );

        // Дополнительные (текстовые) вопросы
        const extraTextQuestions: Question[] = [
            { name: "extraField1", label: "Введите ваш адрес" },
            { name: "extraField2", label: "Укажите место работы" },
            { name: "extraField3", label: "Дополнительная информация" },
            { name: "extraField4", label: "Уточните, при необходимости, ваши комментарии" },
        ];

        return [
            ...extraTextQuestions,
            ...serverQuestions,
        ];
    }, [riskProfileSelectors]);

    const formik = useFormik({
        enableReinitialize: true,
        initialValues: formValues,
        onSubmit: async (values) => {
            alert("Данные отправлены");
        },
    });

    const handleChange = (e: React.ChangeEvent<any>) => {
        formik.handleChange(e);
        dispatch(updateFieldValue({ name: e.target.name, value: e.target.value }));
    };

    if (loading) return <p>Загрузка...</p>;
    if (error) return <p style={{ color: "red" }}>{error}</p>;
    if (!riskProfileSelectors || questions.length === 0) return null;

    const totalSteps = questions.length;
    const isLastStep = currentStep === totalSteps - 1;
    const currentQuestion = questions[currentStep];

    const goNext = () => {
        if (isLastStep) {
            formik.handleSubmit();
        } else {
            setCurrentStep((prev) => prev + 1);
        }
    };

    const goBack = () => {
        if (currentStep === 0) {
            // Если находимся на первом шаге, то закрываем модалку
            dispatch(closeModal(ModalType.IDENTIFICATION));
        } else {
            setCurrentStep((prev) => prev - 1);
        }
    };

    return (
        <div className={styles.form}>
            <p className={styles.form__steps}>
                Вопрос {currentStep + 1} из {totalSteps}
            </p>
            <form onSubmit={formik.handleSubmit} className={styles.form__form}>
                <div className={styles.form__container}>
                    <label htmlFor={currentQuestion.name} className={styles.form__question}>
                        {currentQuestion.label}
                    </label>
                    {currentQuestion.options ? (
                        <select
                            id={currentQuestion.name}
                            name={currentQuestion.name}
                            value={formik.values[currentQuestion.name] || ""}
                            onChange={handleChange}
                        >
                            <option value="">— Выберите —</option>
                            {Object.entries(currentQuestion.options).map(
                                ([optValue, optLabel]) => (
                                    <option key={optValue} value={optValue}>
                                        {optLabel}
                                    </option>
                                )
                            )}
                        </select>
                    ) : (
                        <input
                            id={currentQuestion.name}
                            name={currentQuestion.name}
                            type="text"
                            value={formik.values[currentQuestion.name] || ""}
                            onChange={handleChange}
                        />
                    )}
                </div>

                <div className={styles.buttons}>
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
                        onClick={goNext}
                        className={styles.button}
                    >
                        {isLastStep ? "Продолжить" : "Далее"}
                    </Button>
                </div>
            </form>
        </div>
    );
};
