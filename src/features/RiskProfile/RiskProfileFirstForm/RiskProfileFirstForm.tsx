import React, { useEffect, useMemo, useState } from "react";
import { useFormik } from "formik";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "app/providers/store/config/store";
import {
    fetchAllSelects,
    nextRiskProfileStep,
    postFirstRiskProfileForm,
    postTrustedPersonInfo,
    prevRiskProfileStep,
    updateFieldValue,
} from "entities/RiskProfile/slice/riskProfileSlice";
import styles from "./styles.module.scss";
import { Button, ButtonTheme } from "shared/ui/Button/Button";
import { closeModal } from "entities/ui/Modal/slice/modalSlice";
import { ModalType } from "entities/ui/Modal/model/modalTypes";
import { CheckboxGroup } from "shared/ui/CheckboxGroup/CheckboxGroup";
import { Input } from "shared/ui/Input/Input";
import { Loader, LoaderTheme } from "shared/ui/Loader/Loader";
import { Select } from "shared/ui/Select/Select";
import { nextStep } from "entities/ui/Ui/slice/uiSlice";
import { useAppDispatch } from "shared/hooks/useAppDispatch";
import { TrustedPersonInfo } from "entities/RiskProfile/model/types";
import { setUserAllData, updateUserAllData } from "entities/User/slice/userSlice";

interface Question {
    name: string;
    label: string;
    placeholder?: string;
    needTextField?: boolean;
    options?: Record<string, string>;
    fieldType?: "text" | "textarea" | "checkboxGroup" | "customSelect" | "numberinput";
}

export const RiskProfileFirstForm: React.FC = () => {
    const dispatch = useAppDispatch();
    const { loading, error, riskProfileSelectors, formValues } = useSelector(
        (state: RootState) => state.riskProfile
    );
    const isBottom = useSelector((state: RootState) => state.ui.isScrollToBottom);
    const [currentStep, setCurrentStep] = useState(0);

    useEffect(() => {
        dispatch(fetchAllSelects() as any);
    }, []);

    useEffect(() => {
        console.log(riskProfileSelectors)
    }, [riskProfileSelectors])

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

        // 1) Вопрос про гражданство (customSelect)
        const citizenshipQuestion: Question = {
            name: "citizenship",
            label: "Гражданство, в том числе ВНЖ",
            placeholder: "Выберите страну",
            fieldType: "customSelect",
            options: riskProfileSelectors.countries,
        };

        // 2) Вопросы с сервера (кроме countries), обрабатываем как checkboxGroup
        const serverQuestions: Question[] = Object.entries(riskProfileSelectors)
            .filter(([key]) => key !== "countries")
            .map(([key, value]) => ({
                name: key,
                label: getLabelByKey(key),
                options: value,
                fieldType: "checkboxGroup",
            }));

        // 3) Дополнительные вопросы (trusted_person и т.д.)
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
                name: "is_qualified_investor_status",
                label: "Есть ли у Вас статус квалифицированного инвестора?",
                fieldType: "checkboxGroup",
                options: {
                    "true": 'Да',
                    "false": 'Нет',
                },
            },
        ];

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

    // Для чекбоксов
    const handleCheckboxGroupChange = (name: string, selectedValue: string) => {
        formik.setFieldValue(name, selectedValue);
        dispatch(updateFieldValue({ name, value: selectedValue }));
    };

    // Для остальных полей
    const handleTextInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        formik.setFieldValue(name, value);
        dispatch(updateFieldValue({ name, value }));
    };

    if (loading) return <Loader theme={LoaderTheme.BLUE}/>;
    if (error) return <p style={{ color: "red" }}>{error}</p>;
    if (!riskProfileSelectors || questions.length === 0) return null;

    const totalSteps = questions.length;
    const isLastStep = currentStep === totalSteps - 1;
    const currentQuestion = questions[currentStep];

    const checkTrustedPerson = () => {
        const { trusted_person_fio, trusted_person_phone, trusted_person_other_contact } = formik.values;

        const trustedPersonInfo: TrustedPersonInfo = {
            trusted_person_fio,
            trusted_person_phone,
            trusted_person_other_contact,
        };

        dispatch(postTrustedPersonInfo({ data: trustedPersonInfo, onSuccess: goNext }));
    };


    const goNext = () => {
        if (isLastStep) {
            dispatch(postFirstRiskProfileForm(formik.values))
            dispatch(updateUserAllData({ gender: `${formik.values.gender}` }))
            dispatch(nextStep())
        } else {
            setCurrentStep((prev) => prev + 1);
            dispatch(nextRiskProfileStep());
        }
    };

    const goBack = () => {
        if (currentStep === 0) {
            dispatch(closeModal(ModalType.IDENTIFICATION));
        } else {
            setCurrentStep((prev) => prev - 1);
            dispatch(prevRiskProfileStep());
        }
    };

    // Проверка, заполнен ли вопрос
    const isQuestionAnswered = (question: Question) => {
        // Если "trusted_person" — смотрим три вложенных поля
        if (question.name === "trusted_person") {
            return (
                formik.values.trusted_person_fio &&
                formik.values.trusted_person_phone &&
                formik.values.trusted_person_other_contact
            );
        }

        // Если чекбокс-группа — проверяем наличие выбранного значения
        if (question.fieldType === "checkboxGroup") {
            return (
                formik.values[question.name] &&
                formik.values[question.name].length > 0
            );
        }

        // Если кастомный селект
        if (question.fieldType === "customSelect") {
            return formik.values[question.name];
        }

        // Если numberinput
        if (question.fieldType === "numberinput") {
            return (
                formik.values[question.name] !== undefined &&
                formik.values[question.name] !== ""
            );
        }

        // Иначе — просто проверяем, что поле заполнено
        return !!formik.values[question.name];
    };

    // Рендер поля вопроса
    const renderQuestionField = (question: Question) => {
        // 1) Вопрос "trusted_person" => 3 инпута
        if (question.name === "trusted_person") {
            return (
                <>
                    <Input
                        placeholder="Введите ФИО"
                        name="trusted_person_fio"
                        type="text"
                        value={formik.values.trusted_person_fio || ""}
                        onChange={handleTextInputChange}
                        needValue
                    />
                    <Input
                        placeholder="Введите номер телефона"
                        name="trusted_person_phone"
                        type="text"
                        value={formik.values.trusted_person_phone || ""}
                        onChange={handleTextInputChange}
                        needValue
                    />
                    <Input
                        placeholder="Доп. контактная информация"
                        name="trusted_person_other_contact"
                        type="text"
                        value={formik.values.trusted_person_other_contact || ""}
                        onChange={handleTextInputChange}
                    />
                </>
            );
        }

        // 2) Вопрос гражданства (customSelect) => 2 селекта
        if (question.name === "citizenship") {
            const countryOptions = Object.entries(question.options || {}).map(
                ([key, value]) => ({
                    value: key,
                    label: value,
                })
            );

            return (
                <>
                    <Select
                        label="Гражданство"
                        needValue
                        value={formik.values.citizenship || ""}
                        title="Выберите страну"
                        items={countryOptions}
                        onChange={(selectedVal) => {
                            formik.setFieldValue("citizenship", selectedVal);
                            dispatch(
                                updateFieldValue({
                                    name: "citizenship",
                                    value: selectedVal,
                                })
                            );
                        }}
                    />
                    <Select
                        needValue={false}
                        label="Вид на жительство"
                        value={formik.values.citizenship_including_residence_permit || ""}
                        title="Выберите статус"
                        items={countryOptions}
                        onChange={(selectedVal) => {
                            formik.setFieldValue(
                                "citizenship_including_residence_permit",
                                selectedVal
                            );
                            dispatch(
                                updateFieldValue({
                                    name: "citizenship_including_residence_permit",
                                    value: selectedVal,
                                })
                            );
                        }}
                    />
                </>
            );
        }

        // 3) Если вопрос — чекбокс-группа
        if (question.fieldType === "checkboxGroup" && question.options) {
            return (
                <CheckboxGroup
                    name={question.name}
                    options={Object.entries(question.options).map(([value, label]) => ({
                        label,
                        value,
                    }))}
                    value={String(formik.values[question.name])}
                    onChange={(name, selectedValue) => {
                        formik.setFieldValue(name, selectedValue);
                        dispatch(updateFieldValue({ name, value: selectedValue }));
                    }}
                />
            );
        }




        // 4) Текстовое поле или textarea
        if (question.fieldType === "text" || question.fieldType === "textarea") {
            return (
                <Input
                    placeholder={question.placeholder}
                    name={question.name}
                    type={
                        question.fieldType === "textarea" ? "textarea" : "text"
                    }
                    value={formik.values[question.name] || ""}
                    onChange={handleTextInputChange}
                />
            );
        }

        // 5) Поле для ввода чисел (numberinput)
        if (question.fieldType === "numberinput") {
            return (
                <Input
                    placeholder={question.placeholder}
                    name={question.name}
                    type="number"
                    value={formik.values[question.name] || ""}
                    onChange={handleTextInputChange}
                />
            );
        }

        // 6) Фолбэк — обычный Input
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

                <div
                    className={`${styles.buttons} ${isBottom ? "" : styles.shadow
                        }`}
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
                        onClick={currentStep !== 1 ? goNext : checkTrustedPerson}
                        className={styles.button}
                        disabled={!isQuestionAnswered(currentQuestion) && questions[currentStep].name !== 'trusted_person'}
                    >
                        Продолжить
                    </Button>
                </div>
            </form>
        </div>
    );
};
