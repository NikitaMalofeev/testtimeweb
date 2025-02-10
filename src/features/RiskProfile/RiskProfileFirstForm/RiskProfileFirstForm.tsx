import React, { useEffect, useMemo, useState } from "react";
import { useFormik } from "formik";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "app/providers/store/config/store";
import {
    fetchAllSelects,
    nextStep,
    prevStep,
    updateFieldValue,
} from "entities/RiskProfile/slice/riskProfileSlice";
import styles from "./styles.module.scss";
import { Button, ButtonTheme } from "shared/ui/Button/Button";
import { closeModal } from "entities/ui/Modal/slice/modalSlice";
import { ModalType } from "entities/ui/Modal/model/modalTypes";
import { CheckboxGroup } from "shared/ui/CheckboxGroup/CheckboxGroup";
import { Input } from "shared/ui/Input/Input";
import { Loader } from "shared/ui/Loader/Loader";

interface Question {
    name: string;
    label: string;
    placeholder?: string;
    needTextField?: boolean;
    /**
     * Если вопрос подразумевает выбор из вариантов,
     * тут лежит объект { [value]: label }
     */
    options?: Record<string, string>;
}

export const RiskProfileFirstForm: React.FC = () => {
    const dispatch = useDispatch();
    const { loading, error, riskProfileSelectors, formValues } = useSelector(
        (state: RootState) => state.riskProfile
    );
    const isBottom = useSelector(
        (state: RootState) => state.ui.isScrollToBottom
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
            investment_experience:
                "Как Вы оцениваете свой опыт (знания) в области инвестирования?",
            investment_period: "Срок инвестирования",
            monthly_expense:
                "Информация о Ваших среднемесячных расходах (за последние 12 месяцев)",
            monthly_income:
                "Объём Ваших среднемесячных доходов (за последние 12 месяцев)",
            obligations_invest_horizon: "Ваши обязательства на период инвестирования",
            planned_future_income: "Планируемые будущие изменения дохода",
            practical_investment_experience:
                "Практический опыт в области инвестирования",
            profit_expect: "Желаемая доходность и допустимые риски",
            question_assets_losing_value:
                "Как Вы поступите, если активы потеряют более 20% стоимости?",
            risk_profiling_int: "Результирующий риск-профиль",
            savings_level: "Информация о наличии и сумме сбережений",
        };
        return map[key] || key;
    };

    // Генерация списка вопросов
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
            {
                name: "citizenship",
                label: "Гражданство, в том числе ВНЖ",
                needTextField: true,
                placeholder: "Ответ",
            },
            {
                name: "trusted_person",
                label:
                    "Доверенное лицо. Пожалуйста, укажите:\n• ФИО \n• Контактные данные",
                needTextField: true,
                placeholder: "Ответ",
            },
            {
                name: "expected_return_investment",
                label:
                    "Ожидаемая доходность по результатам инвестирования( % годовых)",
                placeholder: "Укажите ожидаемую доходность, %",
                needTextField: false
            },
            {
                name: "max_allowable_drawdown",
                label: "Максимальная допустимая просадка",
                placeholder: "Укажите допустимую просадку, %",
                needTextField: false
            },
        ];

        return [...extraTextQuestions, ...serverQuestions];
    }, [riskProfileSelectors]);

    // Инициализация формы (Formik)
    const formik = useFormik({
        enableReinitialize: true,
        initialValues: formValues,
        onSubmit: async (values) => {
            alert("Данные отправлены");
        },
    });

    useEffect(() => {
        if (formik.values) {
            console.log("Formik Values: ", formik.values);
        }
    }, [formik.values]);

    // Обработчик изменения для single choice (CheckboxGroup)
    const handleCheckboxGroupChange = (name: string, selectedValue: string) => {
        formik.setFieldValue(name, selectedValue);
        dispatch(updateFieldValue({ name, value: selectedValue }));
    };

    // Обработчик для обычных текстовых инпутов
    const handleTextInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        formik.handleChange(e);
        dispatch(updateFieldValue({ name: e.target.name, value: e.target.value }));
    };

    if (loading) return <Loader />;
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
            dispatch(nextStep())
        }
    };

    const goBack = () => {
        if (currentStep === 0) {
            // Если находимся на первом шаге, то закрываем модалку
            dispatch(closeModal(ModalType.IDENTIFICATION));
        } else {
            setCurrentStep((prev) => prev - 1);
            dispatch(prevStep())
        }
    };

    return (
        <div className={styles.form}>
            <p className={styles.form__steps}>
                Вопрос {currentStep + 1} из {totalSteps}
            </p>

            <form onSubmit={formik.handleSubmit} className={styles.form__form}>
                <div className={styles.form__container}>
                    <label
                        htmlFor={currentQuestion.name}
                        className={styles.form__question}
                    >
                        {currentQuestion.label}
                    </label>

                    <div style={{ marginBottom: '32px' }}>
                        {currentQuestion.options ? (
                            // Если есть варианты ответа, показываем CheckboxGroup (одиночный выбор)
                            <CheckboxGroup
                                name={currentQuestion.name}
                                options={Object.entries(currentQuestion.options).map(
                                    ([optValue, optLabel]) => ({
                                        label: optLabel,
                                        value: optValue,
                                    })
                                )}
                                // Здесь в formValues для этого поля у нас лежит одна строка
                                value={formik.values[currentQuestion.name] || ""}
                                onChange={handleCheckboxGroupChange}
                            />
                        ) : (
                            // Если вариантов нет, значит это просто текстовый вопрос
                            <Input
                                placeholder={currentQuestion.placeholder}
                                name={currentQuestion.name}
                                type={currentQuestion.needTextField ? "textarea" : "text"}
                                value={formik.values[currentQuestion.name] || ""}
                                onChange={handleTextInputChange}
                            />
                        )}
                    </div>
                </div>
                <div></div>

                <div className={`${styles.buttons} ${isBottom ? '' : styles.shadow}`}>
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
                        disabled={!formik.values[currentQuestion.name]}
                    >
                        {isLastStep ? "Продолжить" : "Продолжить"}
                    </Button>
                </div>
            </form>
        </div>
    );
};
