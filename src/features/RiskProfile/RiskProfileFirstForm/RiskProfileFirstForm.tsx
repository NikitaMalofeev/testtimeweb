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
import { Select } from "shared/ui/Select/Select";
import { SelectModal } from "features/Ui/SelectModal/SelectModal";

interface Question {
    name: string;
    label: string;
    placeholder?: string;
    needTextField?: boolean;
    options?: Record<string, string>;
    fieldType?: "text" | "textarea" | "checkboxGroup" | "customSelect";
}

// ...

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

        /**
         * 1) Сначала вставим вопрос про гражданство (customSelect):
         *    - name: 'citizenship'
         *    - label: 'Гражданство, в том числе ВНЖ'
         *    - options: riskProfileSelectors.countries
         *    - fieldType: 'customSelect'
         */
        const citizenshipQuestion: Question = {
            name: "citizenship",
            label: "Гражданство, в том числе ВНЖ",
            placeholder: "Выберите страну",
            fieldType: "customSelect",
            options: riskProfileSelectors.countries,
        };

        /**
         * 2) Все остальные вопросы, идущие из объекта,
         *    кроме 'countries', нам нужно обработать как раньше.
         *    (Проверяем, что key !== 'countries', т.к. 'countries'
         *    мы используем только для гражданства.)
         */
        const serverQuestions: Question[] = Object.entries(riskProfileSelectors)
            .filter(([key]) => key !== "countries")
            .map(([key, value]) => ({
                name: key,
                label: getLabelByKey(key),
                options: value,
                fieldType: "checkboxGroup",
                // Для простоты считаем, что всё остальное — чекбокс-группа
            }));

        // Дополнительные текстовые вопросы
        const extraTextQuestions: Question[] = [
            {
                name: "trusted_person",
                label:
                    "Доверенное лицо. Пожалуйста, укажите:\n• ФИО \n• Контактные данные",
                needTextField: true,
                placeholder: "Ответ",
                fieldType: "textarea",
            },
            {
                name: "expected_return_investment",
                label:
                    "Ожидаемая доходность по результатам инвестирования (% годовых)",
                placeholder: "Укажите ожидаемую доходность, %",
                fieldType: "text",
            },
            {
                name: "max_allowable_drawdown",
                label: "Максимальная допустимая просадка",
                placeholder: "Укажите допустимую просадку, %",
                fieldType: "text",
            },
        ];

        // Формируем итоговый массив, где первым идёт вопрос о гражданстве
        return [
            citizenshipQuestion,
            ...extraTextQuestions,
            ...serverQuestions,
        ];
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

    const handleCheckboxGroupChange = (name: string, selectedValue: string) => {
        formik.setFieldValue(name, selectedValue);
        dispatch(updateFieldValue({ name, value: selectedValue }));
    };

    const handleTextInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
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
            dispatch(nextStep());
        }
    };

    const goBack = () => {
        if (currentStep === 0) {
            dispatch(closeModal(ModalType.IDENTIFICATION));
        } else {
            setCurrentStep((prev) => prev - 1);
            dispatch(prevStep());
        }
    };

    // Функция рендера поля вопроса
    const renderQuestionField = (question: Question) => {
        // 1. Если вопрос — кастомный селект (citizenship)
        if (question.fieldType === "customSelect" && question.options) {
            // Преобразуем { key: value } -> [{value: key, label: value}, ...]
            const selectItems = Object.entries(question.options).map(
                ([optKey, optLabel]) => ({
                    value: optKey,
                    label: optLabel,
                })
            );

            return (
                <Select
                    label={question.label}
                    value={formik.values[question.name] || ""}
                    title="Выберите страну"
                    needValue={question.name === 'citizenship'}
                    items={selectItems}
                    onChange={(selectedVal) => {
                        formik.setFieldValue(question.name, selectedVal);
                        dispatch(updateFieldValue({ name: question.name, value: selectedVal }));
                    }}
                />
            );
        }

        // 2. Если вопрос — группа чекбоксов (варианты)
        if (question.fieldType === "checkboxGroup" && question.options) {
            return (
                <CheckboxGroup
                    name={question.name}
                    options={Object.entries(question.options).map(
                        ([optValue, optLabel]) => ({
                            label: optLabel,
                            value: optValue,
                        })
                    )}
                    value={formik.values[question.name] || ""}
                    onChange={handleCheckboxGroupChange}
                />
            );
        }

        // 3. Если вопрос — текстовое поле/textarea
        if (question.fieldType === "text" || question.fieldType === "textarea") {
            return (
                <Input
                    placeholder={question.placeholder}
                    name={question.name}
                    type={question.fieldType === "textarea" ? "textarea" : "text"}
                    value={formik.values[question.name] || ""}
                    onChange={handleTextInputChange}
                />
            );
        }

        // Фолбэк — простой Input
        return (
            <Input
                placeholder={question.placeholder}
                name={question.name}
                type="text"
                value={formik.values[question.name] || ""}
                onChange={handleTextInputChange}
            />
        );
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

                    <div style={{ marginBottom: "32px" }}>
                        {renderQuestionField(currentQuestion)}
                    </div>
                </div>
                <div></div>

                <div
                    className={`${styles.buttons} ${isBottom ? "" : styles.shadow}`}
                >
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

