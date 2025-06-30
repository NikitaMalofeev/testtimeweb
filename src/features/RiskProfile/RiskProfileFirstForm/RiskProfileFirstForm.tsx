import React, { useEffect, useMemo, useState } from "react";
import { useFormik } from "formik";
import { useSelector } from "react-redux";
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
import { RiskProfileFormValues, TrustedPersonInfo } from "entities/RiskProfile/model/types";
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

    /* ──────────────────────────── redux state ──────────────────────────── */
    const {
        loading,
        error,
        riskProfileSelectors,
        formValues,
        stepsFirstForm: { currentStep },
    } = useSelector((state: RootState) => state.riskProfile);
    const isBottom = useSelector((state: RootState) => state.ui.isScrollToBottom);

    /* ──────────────────────────── flags ──────────────────────────── */
    const [isLSLoaded, setIsLSLoaded] = useState(false);

    /* ──────────────────────────── LS → redux on mount ──────────────────────────── */
    useEffect(() => {
        const savedData = localStorage.getItem("riskProfileFormData");
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                if (typeof parsed.step === "number" && parsed.data) {
                    dispatch(setStep(parsed.step));
                    dispatch(updateRiskProfileForm(parsed.data));
                }
            } catch (err) {
                console.error("Ошибка парсинга из localStorage:", err);
            }
        }
        setIsLSLoaded(true);
    }, []);

    /* ──────────────────────────── fetch selects ──────────────────────────── */
    useEffect(() => {
        dispatch(fetchAllSelects() as any);
    }, []);

    /* ──────────────────────────── redux → LS (после инициализации) ──────────────────────────── */
    useEffect(() => {
        if (!isLSLoaded) return;
        localStorage.setItem(
            "riskProfileFormData",
            JSON.stringify({ step: currentStep, data: formValues })
        );
    }, [currentStep, formValues, isLSLoaded]);

    /* ──────────────────────────── helpers ──────────────────────────── */
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
            gender: "Пол",
        };
        return map[key] || key;
    };

    /* ──────────────────────────── formik ──────────────────────────── */
    const formik = useFormik({
        enableReinitialize: true,
        initialValues: {

            ...formValues,
            person_type: formValues.person_type ?? "",
        } as RiskProfileFormValues,
        validationSchema: Yup.object({
            trusted_person_fio: Yup.string().min(3, "Минимум 3 символа"),
            trusted_person_phone: Yup.string()
                .matches(/^\+\d{11}$/, "Неверный формат")
                .when(
                    ["trusted_person_fio"],
                    ([fio], schema) => (fio ? schema.required("Телефон обязателен") : schema)
                ),
        }),
        onSubmit: () => { },
    });

    /* ──────────────────────────── base questions ──────────────────────────── */
    /*  0. Обязательный вопрос о типе лица  */
    const personTypeQuestion: Question = {
        name: "person_type",
        label: "Тип лица",
        fieldType: "checkboxGroup",
        options: {
            natural: "Физ. лицо",
            legal: "Юр. лицо",
        },
    };

    /* 1. «Натуральные» (физ. лицо) */
    const buildNaturalQuestions = (): Question[] => {
        if (!riskProfileSelectors) return [];

        /* (1) Гражданство и ВНЖ */
        const citizenshipQuestion: Question = {
            name: "citizenship",
            label: "Гражданство, в том числе ВНЖ",
            placeholder: "Выберите страну",
            fieldType: "customSelect",
            options: riskProfileSelectors.countries,
        };

        /* (2) Остальные селекторы, пришедшие с сервера */
        const serverQuestions: Question[] = Object.entries(riskProfileSelectors)
            .filter(([k]) => k !== "countries")
            .map(([key, val]) => ({
                name: key,
                label: getLabelByKey(key),
                options: val,
                fieldType: "checkboxGroup",
            }));

        /* (3) Доверенное лицо + квалификация */
        const extra: Question[] = [
            {
                name: "trusted_person",
                label:
                    "Доверенное лицо.\nУкажите, пожалуйста, при наличии:\n• ФИО\n• Контактные данные",
                needTextField: true,
                placeholder: "Ответ",
                fieldType: "textarea",
            },
            {
                name: "is_qualified_investor_status",
                label: "Есть ли у Вас статус квалифицированного инвестора?",
                fieldType: "checkboxGroup",
                options: { true: "Да", false: "Нет" },
            },
        ];

        return [citizenshipQuestion, ...extra, ...serverQuestions];
    };

    /* 2. «Юр. лицо»: заготовка из 7 вопросов, оставь как пример */
    const legalQuestionsTemplate: Question[] = [
        {
            name: "legal_invest_target",
            label: "Предполагаемая цель инвестирования",
            fieldType: "checkboxGroup",
            options: {
                preserve_capital: "Сохранение капитала и поддержание высокой ликвидности",
                steady_growth: "Планомерное наращивание капитала путем получения дохода выше банковских ставок по депозитам",
                significant_income: "Получение существенного дохода. Спокойное отношение к рискам",
                max_income: "Получение максимального дохода. Готовность мириться со значительными рисками",
            },
        },
        {
            name: "legal_investment_period",
            label:
                "Срок инвестирования, в течение которого не планируется вносить существенные изменения в свой инвестиционный портфель",
            fieldType: "checkboxGroup",
            options: {
                up_to_1_year: "до 1 года",
                from_1_to_3_years: "от 1-го до 3-х лет",
                from_3_to_5_years: "от 3-х до 5 лет",
                from_5_to_10_years: "От 5 до 10 лет",
                over_10_years: "Более 10 лет",
            },
        },
        {
            name: "legal_specialist_qualification",
            label:
                "Наличие специалистов или подразделения, отвечающих за инвестиционную деятельность в юридическом лице. Квалификация специалистов, отвечающих за инвестиционную деятельность",
            fieldType: "checkboxGroup",
            options: {
                no_specialists: "Специалисты и подразделение отсутствуют",
                finance_education_only: "Высшее экономическое/финансовое образование",
                education_and_experience:
                    "Высшее экономическое/финансовое образование и опыт работы на финансовом рынке более 1 года в должности, напрямую связанной с инвестированием активов",
            },
        },
        {
            name: "legal_operations_volume",
            label:
                "Наличие, количество и объем операций с различными финансовыми инструментами за последний отчетный год",
            fieldType: "checkboxGroup",
            options: {
                no_operations: "Операции с финансовыми инструментами не осуществлялись",
                under_10_ops: "Совершалось менее 10 операций совокупным оборотом до 50 000 000 рублей",
                over_10_ops: "Более 10 операций совокупным оборотом более 50 000 000 рублей",
            },
        },
        {
            name: "legal_assets_size",
            label:
                "Размер активов юридического лица за последний завершенный отчетный год по данным бухгалтерского учета",
            fieldType: "checkboxGroup",
            options: {
                up_to_20m: "до 20 000 000 рублей",
                from_20m_to_50m: "от 20 000 000 до 50 000 000 рублей",
                from_50m_to_100m: "от 50 000 000 до 100 000 000 рублей",
                over_100m: "от 100 000 000 рублей",
            },
        },
        {
            name: "legal_net_assets_ratio",
            label:
                "Соотношение чистых активов (активы за вычетом обязательств) к объему средств, предполагаемых к инвестированию",
            fieldType: "checkboxGroup",
            options: {
                greater_than_1: "Больше 1",
                less_than_1: "Меньше 1",
            },
        },
        {
            name: "legal_risk_tolerance",
            label: "Какой уровень изменений стоимости инвестиционных активов допускает юридическое лицо",
            fieldType: "checkboxGroup",
            options: {
                no_drop_allowed:
                    "не допускается даже временное снижение суммы инвестиционных вложений компании",
                small_drop_allowed:
                    "допускается возможность небольшого снижения стоимости первоначальных инвестиций до 10% в краткосрочной перспективе",
                temporary_drop_allowed:
                    "допускается возможность того, что стоимость инвестиций может колебаться, а также упасть ниже стоимости первоначальных инвестиций на некоторый период времени",
                significant_drop_allowed:
                    "допускается возможность того, что стоимость инвестиций может колебаться, а также упасть значительно ниже суммы первоначальных инвестиций в течение некоторого периода времени в расчете на последующий рост",
            },
        },
        {
            name: "legal_additional_conditions",
            label:
                "Дополнительные существенные условия и ограничения, которые необходимо будет учитывать",
            fieldType: "checkboxGroup",
            options: {
                no_additional_conditions:
                    "Дополнительных существенных условий или ограничений нет",
                have_additional_conditions: "Дополнительные условия или ограничения есть",
            },
        },
    ];


    /* ──────────────────────────── окончательный список вопросов ──────────────────────────── */
    const questions: Question[] = useMemo(() => {
        const isLegal = formik.values.person_type === "legal";
        const branch = isLegal ? legalQuestionsTemplate : buildNaturalQuestions();
        return [personTypeQuestion, ...branch];
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formik.values.person_type, riskProfileSelectors]);


    const LEGAL_FIELD_NAMES = [
        "person_type",
        ...legalQuestionsTemplate.map(q => q.name as keyof RiskProfileFormValues),
    ] as const satisfies readonly (keyof RiskProfileFormValues)[];
    type LegalKey = (typeof LEGAL_FIELD_NAMES)[number];

    /* ──────────────────────────── навигация ──────────────────────────── */
    const totalSteps = questions.length;
    const isLastStep = currentStep === totalSteps - 1;
    const currentQuestion = questions[currentStep];


    const goNext = () => {
        const { person_type } = formik.values;

        if (isLastStep) {
            /* -------------------- формируем payload -------------------- */
            const payload: Partial<RiskProfileFormValues> =
                person_type === "legal"
                    ? Object.fromEntries(
                        Object.entries(formik.values).filter(([k]) =>
                            LEGAL_FIELD_NAMES.includes(k as LegalKey),
                        ),
                    )
                    : formik.values;

            /* -------------------- отправляем -------------------- */
            dispatch(postFirstRiskProfileForm(payload as RiskProfileFormValues));

            if (person_type !== "legal") {
                // gender нужен только физ. лицу
                dispatch(updateUserAllData({ gender: String(formik.values.gender) }));
            }

            dispatch(setStepAdditionalMenuUI(1));
            return;
        }

        /* промежуточный шаг */
        dispatch(updateRiskProfileForm(formik.values));
        dispatch(nextRiskProfileStep());
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

    /* ──────────────────────────── trusted person ──────────────────────────── */
    const checkTrustedPerson = () => {
        const { trusted_person_fio, trusted_person_phone, trusted_person_other_contact } =
            formik.values;
        if (trusted_person_fio && trusted_person_other_contact && trusted_person_phone) {
            const info: TrustedPersonInfo = {
                trusted_person_fio,
                trusted_person_phone,
                trusted_person_other_contact,
            };
            dispatch(postTrustedPersonInfo({ data: info, onSuccess: goNext }) as any);
        } else {
            goNext()
        }
    };

    /* ──────────────────────────── helpers ──────────────────────────── */
    const isQuestionAnswered = (q: Question) => {
        if (q.name === "person_type") return !!formik.values.person_type;

        if (q.name === "trusted_person")
            return (
                formik.values.trusted_person_fio &&
                formik.values.trusted_person_phone &&
                formik.values.trusted_person_other_contact
            );

        if (q.fieldType === "checkboxGroup") return !!formik.values[q.name];
        if (q.fieldType === "customSelect") return !!formik.values[q.name];
        if (q.fieldType === "numberinput") return formik.values[q.name] !== "";
        return !!formik.values[q.name];
    };

    const handleChangeAndDispatch =
        (field: string) =>
            (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                formik.handleChange(e);
                dispatch(updateFieldValue({ name: field, value: e.target.value }));
            };

    const handleSelectChange = (field: string, value: any) => {
        formik.setFieldValue(field, value);
        dispatch(updateFieldValue({ name: field, value }));
    };

    /* ──────────────────────────── ui states ──────────────────────────── */
    if (loading) return <Loader theme={LoaderTheme.BLUE} />;
    if (error) return <p style={{ color: "red" }}>{error}</p>;
    if (!questions.length) return null;

    /* ──────────────────────────── render field ──────────────────────────── */
    const renderQuestionField = (q: Question) => {
        if (q.name === "trusted_person") {
            return (
                <>
                    <Input
                        placeholder="Введите ФИО"
                        name="trusted_person_fio"
                        value={formik.values.trusted_person_fio || ""}
                        onChange={(e) => {
                            const v = e.target.value.replace(/[^A-Za-zА-Яа-яЁё\s-]/g, "");
                            handleChangeAndDispatch("trusted_person_fio")({
                                ...e,
                                target: { ...e.target, value: v },
                            } as any);
                        }}
                        onBlur={formik.handleBlur}
                        needValue={!!formik.values.trusted_person_phone}
                        error={
                            formik.touched.trusted_person_fio && formik.errors.trusted_person_fio
                        }
                    />
                    <Input
                        placeholder="Введите номер телефона"
                        name="trusted_person_phone"
                        inputMode="numeric"
                        value={formik.values.trusted_person_phone || ""}
                        onChange={(e) => {
                            const digits = e.target.value.replace(/\D/g, "").slice(0, 14);
                            formik.setFieldValue(
                                "trusted_person_phone",
                                digits.length ? "+" + digits : ""
                            );
                        }}
                        onBlur={formik.handleBlur}
                        needValue={!!formik.values.trusted_person_fio}
                        error={
                            formik.touched.trusted_person_phone &&
                            formik.errors.trusted_person_phone
                        }
                    />
                    <Input
                        placeholder="Доп. контактная информация"
                        name="trusted_person_other_contact"
                        value={formik.values.trusted_person_other_contact || ""}
                        onChange={handleChangeAndDispatch("trusted_person_other_contact")}
                    />
                </>
            );
        }

        if (q.name === "citizenship") {
            const countryOpts = Object.entries(q.options || {}).map(([v, l]) => ({
                value: v,
                label: l,
            }));
            return (
                <>
                    <Select
                        label="Гражданство"
                        needValue
                        value={formik.values.citizenship || ""}
                        title="Выберите страну"
                        items={countryOpts}
                        onChange={(v) => handleSelectChange("citizenship", v)}
                    />
                    <Select
                        label="Вид на жительство"
                        needValue={false}
                        value={formik.values.citizenship_including_residence_permit as any || ""}

                        title="Выберите страну"
                        items={countryOpts}
                        onChange={(v) =>
                            handleSelectChange("citizenship_including_residence_permit", v)
                        }
                    />
                </>
            );
        }

        if (q.fieldType === "checkboxGroup" && q.options) {
            return (
                <CheckboxGroup
                    name={q.name}
                    options={Object.entries(q.options).map(([v, l]) => ({ value: v, label: l }))}
                    value={String(formik.values[q.name])}
                    onChange={(name, v) => {
                        formik.setFieldValue(name, v);
                        dispatch(updateFieldValue({ name, value: v }));
                    }}
                />
            );
        }

        if (q.fieldType === "textarea")
            return (
                <Input
                    type="textarea"
                    placeholder={q.placeholder}
                    name={q.name}
                    value={(formik.values as any)[q.name] || ""}
                    onChange={handleChangeAndDispatch(q.name)}
                />
            );

        if (q.fieldType === "numberinput")
            return (
                <Input
                    type="number"
                    placeholder={q.placeholder}
                    name={q.name}
                    value={(formik.values as any)[q.name] || ""}
                    onChange={handleChangeAndDispatch(q.name)}
                />
            );

        if (q.fieldType === "customSelect" && q.options) {
            const items = Object.entries(q.options).map(([v, l]) => ({ value: v, label: l }));
            return (
                <Select
                    label=""
                    value={(formik.values as any)[q.name] || ""}
                    title={q.placeholder || q.label}
                    items={items}
                    needValue
                    onChange={(v) => handleSelectChange(q.name, v)}
                />
            );
        }

        return (
            <Input
                placeholder={q.placeholder}
                name={q.name}
                value={(formik.values as any)[q.name] || ""}
                onChange={handleChangeAndDispatch(q.name)}
            />
        );
    };

    /* ──────────────────────────── JSX ──────────────────────────── */
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

                    <div style={{ marginBottom: 32 }}>{renderQuestionField(currentQuestion)}</div>
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
                        onClick={
                            currentQuestion.name === "trusted_person" ? checkTrustedPerson : goNext
                        }
                        className={styles.button}
                        disabled={
                            !isQuestionAnswered(currentQuestion) &&
                            currentQuestion.name !== "trusted_person"
                        }
                    >
                        Продолжить
                    </Button>
                </div>
            </form>
        </div>
    );
};
