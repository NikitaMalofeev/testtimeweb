import React, { useEffect, useState } from "react";
import { useFormik } from "formik";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "app/providers/store/config/store";
import {
    fetchAllSelects,
    nextRiskProfileStep,
    prevRiskProfileStep,
    postFirstRiskProfileForm,
    postTrustedPersonInfo,
    updateFieldValue,
    updateRiskProfileForm,
    setStep,
} from "entities/RiskProfile/slice/riskProfileSlice";
import * as Yup from "yup";
import styles from "./styles.module.scss";
import { Button, ButtonTheme } from "shared/ui/Button/Button";
import { closeModal } from "entities/ui/Modal/slice/modalSlice";
import { ModalType } from "entities/ui/Modal/model/modalTypes";
import { CheckboxGroup } from "shared/ui/CheckboxGroup/CheckboxGroup";
import { Input } from "shared/ui/Input/Input";
import { Loader, LoaderTheme } from "shared/ui/Loader/Loader";
import { Select } from "shared/ui/Select/Select";
import { setStepAdditionalMenuUI } from "entities/ui/Ui/slice/uiSlice";
import { useAppDispatch } from "shared/hooks/useAppDispatch";
import { TrustedPersonInfo } from "entities/RiskProfile/model/types";
import { updateUserAllData } from "entities/User/slice/userSlice";
import { useNavigate } from "react-router-dom";

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
    const navigate = useNavigate();

    // ============ REDUX STATE ============
    const {
        loading,
        error,
        riskProfileSelectors,
        formValues,
        stepsFirstForm: { currentStep },
    } = useSelector((state: RootState) => state.riskProfile);
    const isBottom = useSelector((state: RootState) => state.ui.isScrollToBottom);

    // Локальный флаг, сигнализирующий, что localStorage уже загружен
    const [isLSLoaded, setIsLSLoaded] = useState(false);

    // ========================= 1. Загрузка данных из localStorage =========================
    useEffect(() => {
        const savedData = localStorage.getItem("riskProfileFormData");
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                // Ожидается структура: { step: number; data: Record<string, any> }
                if (typeof parsed.step === "number" && parsed.data) {
                    // Обновляем Redux-стейт значениями из localStorage
                    dispatch(setStep(parsed.step));
                    dispatch(updateRiskProfileForm(parsed.data));
                }
            } catch (error) {
                console.error("Ошибка парсинга из localStorage: ", error);
            }
        }
        // Устанавливаем флаг, что загрузка из localStorage завершена
        setIsLSLoaded(true);
    }, []);

    // ========================= 2. Получение селекторов =========================
    useEffect(() => {
        dispatch(fetchAllSelects() as any);
    }, []);

    // ========================= 3. Синхронизация Redux → localStorage (только после загрузки LS) =========================
    useEffect(() => {
        if (!isLSLoaded) return;
        const dataToSave = {
            step: currentStep,
            data: formValues,
        };
        localStorage.setItem("riskProfileFormData", JSON.stringify(dataToSave));
    }, [currentStep, formValues, isLSLoaded]);

    // ========================= 4. Вспомогательная функция для меток вопросов =========================
    const getLabelByKey = (key: string) => {
        const map: Record<string, string> = {
            age_parameters: "Ваш возраст",
            currency_investment: "Валюта инвестиций",
            current_loans: "Ваши текущие кредиты",
            education: "Ваше образование",
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

    // ========================= 5. Построение вопросов =========================
    const questions: Question[] = React.useMemo(() => {
        if (!riskProfileSelectors) return [];

        // (1) Вопрос о гражданстве
        const citizenshipQuestion: Question = {
            name: "citizenship",
            label: "Гражданство, в том числе ВНЖ",
            placeholder: "Выберите страну",
            fieldType: "customSelect",
            options: riskProfileSelectors.countries,
        };

        // (2) Вопросы с сервера
        const serverQuestions: Question[] = Object.entries(riskProfileSelectors)
            .filter(([key]) => key !== "countries")
            .map(([key, value]) => ({
                name: key,
                label: getLabelByKey(key),
                options: value,
                fieldType: "checkboxGroup",
            }));

        // (3) Дополнительные вопросы
        const extraTextQuestions: Question[] = [
            {
                name: "trusted_person",
                label: `Доверенное лицо. Укажите, пожалуйста, при наличии:\n• ФИО\n• Контактные данные`,
                needTextField: true,
                placeholder: "Ответ",
                fieldType: "textarea",
            },
            {
                name: "is_qualified_investor_status",
                label: "Есть ли у Вас статус квалифицированного инвестора?",
                fieldType: "checkboxGroup",
                options: {
                    true: "Да",
                    false: "Нет",
                },
            },
        ];

        return [citizenshipQuestion, ...extraTextQuestions, ...serverQuestions];
    }, [riskProfileSelectors]);

    // enableReinitialize: true позволит обновлять форму, когда Redux-стейт меняется (например, после загрузки LS)
    const formik = useFormik({
        enableReinitialize: true,
        initialValues: formValues,
        validationSchema: Yup.object({
            // Условная валидация для phone: правило применяется только если trusted_person_fio заполнено
            phone: Yup.string()
                .matches(/^\+\d{11}$/, "Неверный формат номера телефона")
                .when(
                    ["trusted_person_fio"],
                    ([trustedPersonFio], schema) =>
                        trustedPersonFio && trustedPersonFio.trim().length > 0
                            ? schema.required("Номер телефона обязателен")
                            : schema
                ),
        }),
        onSubmit: async (values) => {

        },
    });


    useEffect(() => {
        console.log(formik.values)
    }, [])

    const handleChangeAndDispatch =
        (fieldName: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
            formik.handleChange(e);
            dispatch(updateFieldValue({ name: fieldName, value: e.target.value }));
        };

    const handleSelectChange = (fieldName: string, value: any) => {
        formik.setFieldValue(fieldName, value);
        dispatch(updateFieldValue({ name: fieldName, value }));
    };

    // ========================= 7. Условия рендера =========================
    if (loading) return <Loader theme={LoaderTheme.BLUE} />;
    if (error) return <p style={{ color: "red" }}>{error}</p>;
    if (!riskProfileSelectors || questions.length === 0) return null;

    const totalSteps = questions.length - 1;
    const isLastStep = currentStep === totalSteps - 1;
    const currentQuestion = questions[currentStep];

    // ========================= 8. Обработка доверенного лица =========================
    const checkTrustedPerson = () => {
        const { trusted_person_fio, trusted_person_phone, trusted_person_other_contact } = formik.values;
        const trustedPersonInfo: TrustedPersonInfo = {
            trusted_person_fio,
            trusted_person_phone,
            trusted_person_other_contact,
        };

        dispatch(
            postTrustedPersonInfo({
                data: trustedPersonInfo,
                onSuccess: goNext,
            }) as any
        );
    };

    // ========================= 9. Навигация =========================
    const goNext = () => {
        if (isLastStep) {
            dispatch(postFirstRiskProfileForm(formik.values));
            dispatch(updateUserAllData({ gender: String(formik.values.gender) }));
            dispatch(setStepAdditionalMenuUI(3));
        } else {
            dispatch(updateRiskProfileForm(formik.values));
            dispatch(nextRiskProfileStep());
        }
    };

    const goBack = () => {
        if (currentStep === 0) {
            dispatch(closeModal(ModalType.IDENTIFICATION));
            document.body.style.overflow = "";
            document.body.style.position = "";
            document.body.style.width = "";
            document.documentElement.style.overflow = "";
            navigate("/lk");
        } else {
            dispatch(prevRiskProfileStep());
        }
    };

    // ========================= 10. Проверка заполненности вопроса =========================
    const isQuestionAnswered = (question: Question) => {
        if (question.name === "trusted_person") {
            return (
                formik.values.trusted_person_fio &&
                formik.values.trusted_person_phone &&
                formik.values.trusted_person_other_contact
            );
        }
        if (question.fieldType === "checkboxGroup") {
            return formik.values[question.name] && formik.values[question.name].length > 0;
        }
        if (question.fieldType === "customSelect") {
            return !!formik.values[question.name];
        }
        if (question.fieldType === "numberinput") {
            return formik.values[question.name] !== undefined && formik.values[question.name] !== "";
        }
        return !!formik.values[question.name];
    };

    // ========================= 11. Рендеринг полей вопросов =========================
    const renderQuestionField = (question: Question) => {
        if (question.name === "trusted_person") {
            return (
                <>
                    <Input
                        placeholder="Введите ФИО"
                        name="trusted_person_fio"
                        type="text"
                        value={formik.values.trusted_person_fio || ""}
                        onChange={handleChangeAndDispatch("trusted_person_fio")}
                        needValue={formik.values?.trusted_person_phone?.length > 0}
                    />
                    <Input
                        placeholder="Введите номер телефона"
                        name="trusted_person_phone"
                        type="text"
                        value={formik.values.trusted_person_phone || ""}
                        onChange={(e) => {
                            let inputVal = e.target.value;
                            // Убираем все символы, кроме цифр
                            const onlyDigits = inputVal.replace(/\D/g, "");

                            // Если остались цифры — формируем "+{цифры}", иначе пустая строка
                            const formatted = onlyDigits.length > 0 ? "+" + onlyDigits : "";

                            formik.setFieldValue("trusted_person_phone", formatted);
                        }}
                        needValue={formik.values?.trusted_person_fio?.length > 0}
                    />

                    <Input
                        placeholder="Доп. контактная информация"
                        name="trusted_person_other_contact"
                        type="text"
                        value={formik.values.trusted_person_other_contact || ""}
                        onChange={handleChangeAndDispatch("trusted_person_other_contact")}
                    />
                </>
            );
        }

        if (question.name === "citizenship") {
            const countryOptions = Object.entries(question.options || {}).map(([key, val]) => ({
                value: key,
                label: val,
            }));

            return (
                <>
                    <Select
                        label="Гражданство"
                        needValue
                        value={formik.values.citizenship || ""}
                        title="Выберите страну"
                        items={countryOptions}
                        onChange={(selectedVal) => handleSelectChange("citizenship", selectedVal)}
                    />
                    <Select
                        label="Вид на жительство"
                        needValue={false}
                        value={formik.values.citizenship_including_residence_permit || ""}
                        title="Выберите страну"
                        items={countryOptions}
                        onChange={(selectedVal) => handleSelectChange("citizenship_including_residence_permit", selectedVal)}
                    />
                </>
            );
        }

        if (question.fieldType === "checkboxGroup" && question.options) {
            return (
                <CheckboxGroup
                    name={question.name}
                    options={Object.entries(question.options).map(([value, label]) => ({ label, value }))}
                    value={String(formik.values[question.name])}
                    onChange={(name, selectedValue) => {
                        formik.setFieldValue(name, selectedValue);
                        dispatch(updateFieldValue({ name, value: selectedValue }));
                    }}
                />
            );
        }

        if (question.fieldType === "textarea") {
            return (
                <Input
                    placeholder={question.placeholder}
                    name={question.name}
                    type="textarea"
                    value={formik.values[question.name] || ""}
                    onChange={handleChangeAndDispatch(question.name)}
                />
            );
        }

        if (question.fieldType === "numberinput") {
            return (
                <Input
                    placeholder={question.placeholder}
                    name={question.name}
                    type="number"
                    value={formik.values[question.name] || ""}
                    onChange={handleChangeAndDispatch(question.name)}
                />
            );
        }

        return (
            <Input
                placeholder={question.placeholder}
                name={question.name}
                type="text"
                value={formik.values[question.name] || ""}
                onChange={handleChangeAndDispatch(question.name)}
            />
        );
    };

    // ========================= 12. Рендер компонента =========================
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

                    <div style={{ marginBottom: "32px" }}>
                        {renderQuestionField(currentQuestion)}
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
                        onClick={currentStep !== 1 ? goNext : checkTrustedPerson}
                        className={styles.button}
                        disabled={!isQuestionAnswered(currentQuestion) && currentQuestion.name !== "trusted_person"}
                    >
                        Продолжить
                    </Button>
                </div>
            </form>
        </div>
    );
};
