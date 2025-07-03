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
    postFirstRiskProfileLegalForm,
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
    const {
        type_person,
    } = useSelector((state: RootState) => state.user.user);
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
    // Question[] для юр. лиц (сопоставлено со схемой backend)
    const legalQuestionsTemplate: Question[] = [
        {
            name: "currency_investment",
            label: "Валюта инвестирования",
            fieldType: "checkboxGroup",
            options: {
                RUR: "Рубли",
                USD: "Доллары",
            },
        },
        {
            name: "invest_goal",
            label: "Предполагаемая цель инвестирования",
            fieldType: "checkboxGroup",
            options: {
                person_legal_invest_goal_safe: "Сохранение капитала и поддержание высокой ликвидности",
                person_legal_invest_goal_profit: "Планомерное наращивание капитала (доход выше депозитов)",
                person_legal_invest_goal_high: "Получение существенного дохода, спокойное отношение к рискам",
                person_legal_invest_goal_max_high: "Максимальный доход при готовности к значительным рискам",
            },
        },
        {
            name: "invest_period",
            label: "Срок инвестирования без существенных изменений портфеля",
            fieldType: "checkboxGroup",
            options: {
                person_legal_invest_period_before_1_year: "до 1 года",
                person_legal_invest_period_1_3_year: "от 1 до 3 лет",
                person_legal_invest_period_3_5_year: "от 3 до 5 лет",
                person_legal_invest_period_5_10_year: "от 5 до 10 лет",
                person_legal_invest_period_10_year_plas: "более 10 лет",
            },
        },
        {
            name: "qualification",
            label: "Наличие и квалификация специалистов по инвестициям",
            fieldType: "checkboxGroup",
            options: {
                person_legal_qualification_none: "Специалисты и подразделение отсутствуют",
                person_legal_qualification_edu: "Есть профильное (экономическое/финансовое) высшее образование",
                person_legal_qualification_edu_exp: "Профильное образование + опыт инвестирования",
                person_legal_qualification_edu_exp_1y: "Профильное образование + опыт инвестирования больше 1 года", // дублирует exp; если в схеме два разных ключа — оставляем оба
            },
        },
        {
            name: "operations",
            label: "Операции с фин. инструментами за последний отчётный год",
            fieldType: "checkboxGroup",
            options: {
                person_legal_operations_none: "Операции не осуществлялись",
                person_legal_operations_less_10_under_50m: "Менее 10 операций, оборот до 50 млн ₽",
                person_legal_operations_more_10_over_50m: "Более 10 операций, оборот свыше 50 млн ₽",
            },
        },
        {
            name: "assets",
            label: "Размер активов юр. лица (последний отч. год)",
            fieldType: "checkboxGroup",
            options: {
                person_legal_assets_under_20m: "до 20 млн ₽",
                person_legal_assets_20m_50m: "от 20 млн ₽ до 50 млн ₽",
                person_legal_assets_50m_100m: "от 50 млн ₽ до 100 млн ₽",
                person_legal_assets_over_100m: "свыше 100 млн ₽",
            },
        },
        {
            name: "net_assets",
            label: "Отношение чистых активов к объёму предполагаемых инвестиций",
            fieldType: "checkboxGroup",
            options: {
                person_legal_net_assets_over_1: "Больше 1",
                person_legal_net_assets_under_1: "Меньше 1",
            },
        },
        {
            name: "volatility",
            label: "Допустимый уровень колебаний стоимости инвестиций",
            fieldType: "checkboxGroup",
            options: {
                person_legal_volatility_none: "Не допускается даже временное снижение стоимости",
                person_legal_volatility_10p: "Допустимо кратковременное снижение до 10 %",
                person_legal_volatility_some: "Допустимы колебания, возможное временное падение ниже первоначальных вложений",
                person_legal_volatility_high: "Допустимо значительное падение в расчёте на последующий рост",
            },
        },
        {
            name: "additional",
            label: "Дополнительные существенные условия и ограничения",
            fieldType: "checkboxGroup",
            options: {
                person_legal_additional_none: "Отсутствуют",
                person_legal_additional_yes: "Есть дополнительные условия/ограничения",
            },
        },
    ];



    /* ──────────────────────────── окончательный список вопросов ──────────────────────────── */
    const questions: Question[] = useMemo(() => {
        const isLegal = type_person === "type_doc_person_legal";
        const branch = isLegal ? legalQuestionsTemplate : buildNaturalQuestions();
        return branch
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [type_person, riskProfileSelectors]);


    /* ──────────────────────────── навигация ──────────────────────────── */
    const totalSteps = questions.length;
    const isLastStep = currentStep === totalSteps - 1;
    const currentQuestion = questions[currentStep];


    /* ──────────────────────────── навигация ──────────────────────────── */
    /* ──────────────────────────── навигация ──────────────────────────── */
    const goNext = () => {
        const isLegal = type_person === "type_doc_person_legal";

        /* ---------------- последний вопрос ---------------- */
        if (isLastStep) {
            /* промежуточное сохранение в Redux/LS */
            dispatch(updateRiskProfileForm(formik.values));



            /* --------- ФИЗ. ЛИЦО: очищаем payload --------- */
            const filteredPayload = Object.fromEntries(
                Object.entries(formik.values).filter(([key]) =>
                    /* всё, что НЕ начинается на 'legal_' и НЕ входит в «чёрный список» */
                    !key.startsWith("legal_") &&
                    ![
                        // поля, которые бэкенду не нужны
                        "address_residential_apartment",
                        "address_residential_city",
                        "address_residential_house",
                        "address_residential_street",
                        "issue_whom",
                        "passport_series",
                        "region",
                        "city",
                        "apartment",
                        "street",
                        "passport_number",
                        "house",
                        "inn",
                        "birth_place",
                    ].includes(key)
                )
            ) as RiskProfileFormValues;

            /* по-прежнему конвертируем статус инвестора в boolean */
            const cleanedPayload: RiskProfileFormValues = {
                ...filteredPayload,

                is_qualified_investor_status: !!filteredPayload.is_qualified_investor_status,
            };

            /* --------- ЮР. ЛИЦО: запросов пока нет --------- */
            if (isLegal) {
                dispatch(postFirstRiskProfileLegalForm(cleanedPayload))
                dispatch(setStepAdditionalMenuUI(1));
                return;
            } else {
                /* старый thunk остаётся */
                dispatch(postFirstRiskProfileForm(cleanedPayload));

                /* gender идёт отдельным PATCH’ем, как и было */
                dispatch(updateUserAllData({ gender: String(formik.values.gender) }));

                dispatch(setStepAdditionalMenuUI(1));
                return;
            }


        }

        /* ---------------- не последний вопрос ---------------- */
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
