// src/pages/LegalDataForm/LegalDataForm.tsx
import React, { useEffect, useRef, useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import ReCAPTCHA from "react-google-recaptcha";

import { useSelector } from "react-redux";
import { RootState } from "app/providers/store/config/store";
import { useAppDispatch } from "shared/hooks/useAppDispatch";

/* Redux actions (по аналогии с паспортной формой) */
import {
    postLegalInfoThunk,               // POST /legal-info
    updateLegalFormData          // записываем черновик в store
} from "entities/RiskProfile/slice/riskProfileSlice";
import { setError } from "entities/Error/slice/errorSlice";

/* UI-kit */
import { Input } from "shared/ui/Input/Input";
import { Checkbox } from "shared/ui/Checkbox/Checkbox";
import { CheckboxGroup } from "shared/ui/CheckboxGroup/CheckboxGroup";
import { Button, ButtonTheme } from "shared/ui/Button/Button";
import { Loader, LoaderSize, LoaderTheme } from "shared/ui/Loader/Loader";
import { useDevice } from "shared/hooks/useDevice";
import { useScrollShadow } from "shared/hooks/useScrollShadow";

/* Модалки */
import {
    closeModal,
    openModal
} from "entities/ui/Modal/slice/modalSlice";
import {
    ModalType,
    ModalSize,
    ModalAnimation
} from "entities/ui/Modal/model/modalTypes";
import { ConfirmDocsModal } from "../ConfirmDocsModal/ConfirmDocsModal";

/* ────────────────────────────────────────────────────────────── */

export const LegalDataForm: React.FC = () => {
    const dispatch = useAppDispatch();
    const recaptchaRef = useRef<ReCAPTCHA | null>(null);
    const formRef = useRef<HTMLFormElement>(null);
    const { isScrolled, isBottom } = useScrollShadow(formRef, true);
    const device = useDevice();

    /* env */
    const gcaptchaSiteKey = import.meta.env.VITE_RANKS_GRCAPTCHA_SITE_KEY;

    /* store selectors */
    const { loading } = useSelector((s: RootState) => s.user);
    const modalState = useSelector((s: RootState) => s.modal);
    const isBottomState = useSelector((s: RootState) => s.ui.isScrollToBottom);
    const { legalFormData } = useSelector((s: RootState) => s.riskProfile);

    /* captcha */
    const [captchaVerified, setCaptchaVerified] = useState(false);

    /* ──────── Yup Schema ──────── */
    const CYRILLIC_TEXT = /^[А-Яа-яЁё0-9\s\-.,"()]+$/;
    const PHONE_REGEX = /^\d{10,11}$/;

    const validationSchema = Yup.object().shape({
        company_name: Yup.string()
            .matches(CYRILLIC_TEXT, "Только кириллица, цифры и знаки ,.-")
            .min(2, "Минимум 2 символа")
            .required("Название компании обязательно"),

        ceo_fullname: Yup.string()
            .matches(/^[А-Яа-яЁё\s-]+$/, "Только кириллица, пробел и дефис")
            .min(5, "Минимум 5 символов")
            .required("ФИО руководителя обязательно"),

        inn: Yup.string()
            .matches(/^\d{10}$/, "ИНН юрлица — 10 цифр")
            .required("ИНН обязателен"),

        kpp: Yup.string()
            .matches(/^\d{9}$/, "КПП — 9 цифр")
            .required("КПП обязателен"),

        ogrn: Yup.string()
            .matches(/^\d{13}$/, "ОГРН — 13 цифр")
            .required("ОГРН обязателен"),

        checking_account: Yup.string()
            .matches(/^\d{20}$/, "Расчётный счёт — 20 цифр")
            .required("Расчётный счёт обязателен"),

        bank_name: Yup.string()
            .matches(CYRILLIC_TEXT, "Только кириллица, цифры и знаки ,.-")
            .min(2, "Минимум 2 символа")
            .required("Название банка обязательно"),

        bik: Yup.string()
            .matches(/^\d{9}$/, "БИК — 9 цифр")
            .required("БИК обязателен"),

        correspondent_account: Yup.string()
            .matches(/^\d{20}$/, "Корр. счёт — 20 цифр")
            .required("Корреспондентский счёт обязателен"),

        work_phone: Yup.string()
            .matches(PHONE_REGEX, "Телефон без +, 10-11 цифр")
            .required("Рабочий телефон обязателен"),

        work_email: Yup.string()
            .email("Неверный формат email")
            .required("Рабочий email обязателен"),

        /* Юр. адрес */
        legal_region: Yup.string().min(2).required("Регион обязателен"),
        legal_city: Yup.string().min(2).required("Город обязателен"),
        legal_street: Yup.string().min(2).required("Улица обязательна"),
        legal_house: Yup.string().min(1).required("Дом обязателен"),
        legal_apartment: Yup.string(),

        /* Чекбокс */
        is_receive_mail_this_address: Yup.boolean(),

        /* Почтовый адрес — обязателен, если не выбран чекбокс */
        postal_region: Yup.string().when("is_receive_mail_this_address", {
            is: false,
            then: s => s.min(2).required("Регион обязателен")
        }),
        postal_city: Yup.string().when("is_receive_mail_this_address", {
            is: false,
            then: s => s.min(2).required("Город обязателен")
        }),
        postal_street: Yup.string().when("is_receive_mail_this_address", {
            is: false,
            then: s => s.min(2).required("Улица обязательна")
        }),
        postal_house: Yup.string().when("is_receive_mail_this_address", {
            is: false,
            then: s => s.min(1).required("Дом обязателен")
        }),
        postal_apartment: Yup.string(),

        g_recaptcha: Yup.string().required("Пройдите проверку reCAPTCHA")
    });

    /* ──────── Formik ──────── */
    const formik = useFormik({
        initialValues: {
            /* captcha */
            g_recaptcha: "",
            /* company data */
            company_name: "",
            ceo_fullname: "",
            ...legalFormData
        },
        enableReinitialize: true,
        validationSchema,
        onSubmit: values => {
            dispatch(
                postLegalInfoThunk({
                    data: values,
                    onSuccess: () =>
                        dispatch(
                            openModal({
                                type: ModalType.CONFIRM_DOCS,
                                size: ModalSize.MIDDLE,
                                animation: ModalAnimation.LEFT
                            })
                        )
                })
            );
        }
    });

    /* ──────── helpers ──────── */
    const handleValidationFailure = () => {
        dispatch(setError("Не все поля заполнены корректно"));
        setCaptchaVerified(false);
        formik.setFieldValue("g_recaptcha", "");
        recaptchaRef.current?.reset();
    };

    const handleSubmitWrapper = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const errors = await formik.validateForm();
        formik.setTouched(
            Object.keys(formik.values).reduce(
                (acc, key) => ({ ...acc, [key]: true }),
                {}
            )
        );
        if (Object.keys(errors).length > 0) {
            handleValidationFailure();
        } else {
            formik.handleSubmit();
        }
    };

    const handleTextChange =
        (field: string) =>
            (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                formik.setFieldValue(field, e.target.value);
            };

    const handleCaptchaChange = (value: string | null) => {
        formik.setFieldValue("g_recaptcha", value || "");
        setCaptchaVerified(!!value);
    };

    /* сбрасываем CAPTCHA после закрытия модалки */
    useEffect(() => {
        if (!modalState.confirmDocsModal.isOpen) {
            setCaptchaVerified(false);
            formik.setFieldValue("g_recaptcha", "");
            recaptchaRef.current?.reset();
        }
    }, [modalState.confirmDocsModal]);

    /* сохраняем черновик при каждом изменении */
    useEffect(() => {
        dispatch(updateLegalFormData(formik.values));
    }, [formik.values]);

    if (loading) return <Loader />;

    /* ──────── Render ──────── */
    return (
        <>
            <form
                ref={formRef}
                className="form"
                onSubmit={handleSubmitWrapper}
                style={{ display: "flex", flexDirection: "column", gap: 16 }}
            >
                {/* верхний «теневой» див на десктопе */}
                <div className={`desktop__shadow ${isScrolled ? "shadowTop" : ""}`} />

                {/* 1. company block */}
                <Input
                    placeholder="Название организации"
                    name="company_name"
                    value={formik.values.company_name}
                    onChange={handleTextChange("company_name")}
                    onBlur={formik.handleBlur}
                    needValue
                    error={formik.touched.company_name && formik.errors.company_name}
                />
                <Input
                    placeholder="Генеральный директор"
                    name="ceo_fullname"
                    value={formik.values.ceo_fullname}
                    onChange={handleTextChange("ceo_fullname")}
                    onBlur={formik.handleBlur}
                    needValue
                    error={formik.touched.ceo_fullname && formik.errors.ceo_fullname}
                />

                <Input
                    placeholder="ИНН"
                    name="inn"
                    type="number"
                    inputMode="numeric"
                    value={formik.values.inn}
                    onChange={handleTextChange("inn")}
                    onBlur={formik.handleBlur}
                    needValue
                    error={formik.touched.inn && formik.errors.inn}
                />
                <Input
                    placeholder="КПП"
                    name="kpp"
                    type="number"
                    inputMode="numeric"
                    value={formik.values.kpp}
                    onChange={handleTextChange("kpp")}
                    onBlur={formik.handleBlur}
                    needValue
                    error={formik.touched.kpp && formik.errors.kpp}
                />
                <Input
                    placeholder="ОГРН"
                    name="ogrn"
                    type="number"
                    inputMode="numeric"
                    value={formik.values.ogrn}
                    onChange={handleTextChange("ogrn")}
                    onBlur={formik.handleBlur}
                    needValue
                    error={formik.touched.ogrn && formik.errors.ogrn}
                />

                <Input
                    placeholder="Расчётный счёт"
                    name="checking_account           "
                    type="number"
                    inputMode="numeric"
                    value={formik.values.checking_account}
                    onChange={handleTextChange("checking_account           ")}
                    onBlur={formik.handleBlur}
                    needValue
                    error={
                        formik.touched.checking_account &&
                        formik.errors.checking_account
                    }
                />
                <Input
                    placeholder="Банк, где открыт счёт"
                    name="bank_name"
                    value={formik.values.bank_name}
                    onChange={handleTextChange("bank_name")}
                    onBlur={formik.handleBlur}
                    needValue
                    error={formik.touched.bank_name && formik.errors.bank_name}
                />
                <Input
                    placeholder="БИК"
                    name="bik"
                    type="number"
                    inputMode="numeric"
                    value={formik.values.bik}
                    onChange={handleTextChange("bik")}
                    onBlur={formik.handleBlur}
                    needValue
                    error={formik.touched.bik && formik.errors.bik}
                />
                <Input
                    placeholder="Корреспондентский счёт"
                    name="correspondent_account"
                    type="number"
                    inputMode="numeric"
                    value={formik.values.correspondent_account}
                    onChange={handleTextChange("correspondent_account")}
                    onBlur={formik.handleBlur}
                    needValue
                    error={
                        formik.touched.correspondent_account &&
                        formik.errors.correspondent_account
                    }
                />

                <Input
                    placeholder="Рабочий телефон"
                    name="work_phone"
                    inputMode="tel"
                    value={formik.values.work_phone}
                    onChange={handleTextChange("work_phone")}
                    onBlur={formik.handleBlur}
                    needValue
                    error={formik.touched.work_phone && formik.errors.work_phone}
                />
                <Input
                    placeholder="Рабочий e-mail"
                    name="work_email"
                    value={formik.values.work_email}
                    onChange={handleTextChange("work_email")}
                    onBlur={formik.handleBlur}
                    needValue
                    error={formik.touched.work_email && formik.errors.work_email}
                />

                {/* 2. legal address */}
                <h2 className="form__subtitle">Юридический адрес</h2>
                <Input
                    placeholder="Регион/район"
                    name="legal_region"
                    value={formik.values.legal_region}
                    onChange={handleTextChange("legal_region")}
                    onBlur={formik.handleBlur}
                    needValue
                    error={formik.touched.legal_region && formik.errors.legal_region}
                />
                <Input
                    placeholder="Город/населённый пункт"
                    name="legal_city"
                    value={formik.values.legal_city}
                    onChange={handleTextChange("legal_city")}
                    onBlur={formik.handleBlur}
                    needValue
                    error={formik.touched.legal_city && formik.errors.legal_city}
                />
                <Input
                    placeholder="Улица"
                    name="legal_street"
                    value={formik.values.legal_street}
                    onChange={handleTextChange("legal_street")}
                    onBlur={formik.handleBlur}
                    needValue
                    error={formik.touched.legal_street && formik.errors.legal_street}
                />
                <div className="form__duoInputs">
                    <Input
                        placeholder="Дом/корпус"
                        name="legal_house"
                        value={formik.values.legal_house}
                        onChange={handleTextChange("legal_house")}
                        onBlur={formik.handleBlur}
                        needValue
                        error={formik.touched.legal_house && formik.errors.legal_house}
                    />
                    <Input
                        placeholder="Квартира"
                        name="legal_apartment"
                        value={formik.values.legal_apartment}
                        onChange={handleTextChange("legal_apartment")}
                        onBlur={formik.handleBlur}
                        error={
                            formik.touched.legal_apartment && formik.errors.legal_apartment
                        }
                    />
                </div>

                {/* чекбокс + почтовый адрес */}
                <Checkbox
                    name="is_receive_mail_this_address"
                    value={formik.values.is_receive_mail_this_address}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    label={
                        <span>
                            Получать почту по этому адресу
                        </span>
                    }
                    error={
                        formik.touched.is_receive_mail_this_address &&
                        formik.errors.is_receive_mail_this_address
                    }
                />

                {!formik.values.is_receive_mail_this_address && (
                    <>
                        <h2 className="form__subtitle">Почтовый адрес</h2>
                        <Input
                            placeholder="Регион/район"
                            name="postal_region"
                            value={formik.values.postal_region}
                            onChange={handleTextChange("postal_region")}
                            onBlur={formik.handleBlur}
                            needValue
                            error={
                                formik.touched.postal_region && formik.errors.postal_region
                            }
                        />
                        <Input
                            placeholder="Город/населённый пункт"
                            name="postal_city"
                            value={formik.values.postal_city}
                            onChange={handleTextChange("postal_city")}
                            onBlur={formik.handleBlur}
                            needValue
                            error={formik.touched.postal_city && formik.errors.postal_city}
                        />
                        <Input
                            placeholder="Улица"
                            name="postal_street"
                            value={formik.values.postal_street}
                            onChange={handleTextChange("postal_street")}
                            onBlur={formik.handleBlur}
                            needValue
                            error={
                                formik.touched.postal_street && formik.errors.postal_street
                            }
                        />
                        <div className="form__duoInputs">
                            <Input
                                placeholder="Дом/корпус"
                                name="postal_house"
                                value={formik.values.postal_house}
                                onChange={handleTextChange("postal_house")}
                                onBlur={formik.handleBlur}
                                needValue
                                error={
                                    formik.touched.postal_house && formik.errors.postal_house
                                }
                            />
                            <Input
                                placeholder="Квартира"
                                name="postal_apartment"
                                value={formik.values.postal_apartment}
                                onChange={handleTextChange("postal_apartment")}
                                onBlur={formik.handleBlur}
                                error={
                                    formik.touched.postal_apartment &&
                                    formik.errors.postal_apartment
                                }
                            />
                        </div>
                    </>
                )}

                {/* captcha */}
                <div className="captcha">
                    <ReCAPTCHA
                        ref={recaptchaRef}
                        sitekey={gcaptchaSiteKey}
                        onChange={handleCaptchaChange}
                    />
                </div>

                {/* submit */}
                {device === "mobile" ? (
                    <div className={`buttons ${!isBottomState ? "shadow" : ""}`}>
                        <Button
                            type="submit"
                            theme={ButtonTheme.BLUE}
                            disabled={!captchaVerified}
                        >
                            {loading ? (
                                <Loader theme={LoaderTheme.WHITE} size={LoaderSize.SMALL} />
                            ) : (
                                "Подтвердить данные"
                            )}
                        </Button>
                    </div>
                ) : (
                    <div className={`buttons__desktop ${!isBottom ? "shadow" : ""}`}>
                        <Button
                            type="submit"
                            theme={ButtonTheme.BLUE}
                            disabled={!captchaVerified}
                        >
                            {loading ? (
                                <Loader theme={LoaderTheme.WHITE} size={LoaderSize.SMALL} />
                            ) : (
                                "Подтвердить данные"
                            )}
                        </Button>
                    </div>
                )}
            </form>
        </>
    );
};