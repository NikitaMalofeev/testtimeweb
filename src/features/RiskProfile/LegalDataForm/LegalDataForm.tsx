import React, { useEffect, useMemo, useRef, useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import ReCAPTCHA from "react-google-recaptcha";

import { useSelector } from "react-redux";
import { RootState } from "app/providers/store/config/store";
import { useAppDispatch } from "shared/hooks/useAppDispatch";

// import {
//     initialLegalFormData,
//     postLegalInfoThunk, 
//     updateLegalFormData 
// } from "entities/RiskProfile/slice/riskProfileSlice";
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
import { closeModal, openModal } from "entities/ui/Modal/slice/modalSlice";
import {
    ModalType,
    ModalSize,
    ModalAnimation
} from "entities/ui/Modal/model/modalTypes";
import { ConfirmDocsModal } from "../ConfirmDocsModal/ConfirmDocsModal";
import { isEqual } from "lodash";
import { toLegalDataRequest } from "shared/lib/utils/toLegalDataRequest";
import { postLegalInfoThunk, setLegalConfirmData, updateLegalFormData } from "entities/RiskProfile/slice/riskProfileSlice";
import styles from './styles.module.scss'
import { LegalDataFormRequest, LegalFormData } from "entities/RiskProfile/model/types";
import { setCurrentConfirmationMethod } from "entities/Documents/slice/documentsSlice";
import { ConfirmContactsModal } from "../ConfirmContactsModal/ConfirmContactsModal";
/* ────────────────────────────────────────────────────────────── */

/**
 * Обновлённая форма юридических данных.
 * Помимо схемы Yup мы ограничиваем ввод символов прямо в инпутах
 * (как сделано в PasportDataForm.tsx) и выводим тип сообщения чекбоксами.
 */
export const LegalDataForm: React.FC = () => {
    const dispatch = useAppDispatch();
    const recaptchaRef = useRef<ReCAPTCHA | null>(null);
    const formRef = useRef<HTMLFormElement>(null);
    const { isScrolled, isBottom } = useScrollShadow(formRef, true);
    const device = useDevice();

    /* env */
    const gcaptchaSiteKey = import.meta.env.VITE_RANKS_GRCAPTCHA_SITE_KEY;

    /* store selectors */
    const { loading, userPersonalAccountInfo } = useSelector((s: RootState) => s.user);
    const modalState = useSelector((s: RootState) => s.modal);
    const isBottomState = useSelector((s: RootState) => s.ui.isScrollToBottom);
    const { legalFormData } = useSelector((s: RootState) => s.riskProfile);

    /* captcha */
    const [captchaVerified, setCaptchaVerified] = useState(false);

    /* ──────── Yup Schema ──────── */
    const CYRILLIC_TEXT = /^[А-Яа-яЁё0-9\s\-.",()]+$/;
    const CYRILLIC_NAME = /^[А-Яа-яЁё\s-]+$/;
    const PHONE_REGEX = /^\d{10,11}$/;

    const validationSchema = Yup.object().shape({
        company_name: Yup.string()
            .matches(CYRILLIC_TEXT, "Только кириллица, цифры и знаки ,.-")
            .min(2, "Минимум 2 символа")
            .required("Полное наименование организации обязательно"),

        /* ФИО руководителя */
        first_name: Yup.string()
            .matches(CYRILLIC_NAME, "Только кириллица, пробел и дефис")
            .min(2, "Минимум 2 символа")
            .required("Имя обязательно"),
        last_name: Yup.string()
            .matches(CYRILLIC_NAME, "Только кириллица, пробел и дефис")
            .min(2, "Минимум 2 символа")
            .required("Фамилия обязательна"),

        /* Тип сообщения (ENUM, выводится чекбоксами) */
        type_message: Yup.string()
            .oneOf(["SMS", "EMAIL", "WHATSAPP"], "Неверный тип сообщения")
            .required("Тип сообщения обязателен"),

        company_inn: Yup.string()
            .matches(/^\d{10}$/, "ИНН юрлица — 10 цифр")
            .required("ИНН обязателен"),

        company_kpp: Yup.string()
            .matches(/^\d{9}$/, "КПП — 9 цифр")
            .required("КПП обязателен"),

        company_ogrn: Yup.string()
            .matches(/^\d{13}$/, "ОГРН — 13 цифр")
            .required("ОГРН обязателен"),

        company_payment_account: Yup.string()
            .matches(/^\d{20}$/, "Расчётный счёт — 20 цифр")
            .required("Расчётный счёт обязателен"),

        company_bank_payment_account: Yup.string()
            .matches(CYRILLIC_TEXT, "Только кириллица, цифры и знаки ,.-")
            .min(2, "Минимум 2 символа")
            .required("Название банка обязательно"),

        company_bank_bik: Yup.string()
            .matches(/^\d{9}$/, "БИК — 9 цифр")
            .required("БИК обязателен"),

        company_bank_correspondent_account: Yup.string()
            .matches(/^\d{20}$/, "Корр. счёт — 20 цифр")
            .required("Корреспондентский счёт обязателен"),

        phone: Yup.string()
            .matches(PHONE_REGEX, "Телефон без +, 10-11 цифр")
            .required("Рабочий телефон обязателен"),

        email: Yup.string()
            .email("Неверный формат email")
            .required("Рабочий email обязателен"),

        /* Юр. адрес */
        company_region: Yup.string().min(2).required("Регион обязателен"),
        company_city: Yup.string().min(2).required("Город обязателен"),
        company_street: Yup.string().min(2).required("Улица обязательна"),
        company_house: Yup.string().min(1).required("Дом обязателен"),
        company_apartment: Yup.string(),

        /* Чекбокс */
        is_receive_mail_this_address: Yup.boolean(),

        /* Почтовый адрес — обязателен, если не выбран чекбокс */
        company_mailing_region: Yup.string().when(
            "is_receive_mail_this_address",
            {
                is: false,
                then: s => s.min(2).required("Регион обязателен")
            }
        ),
        company_mailing_city: Yup.string().when(
            "is_receive_mail_this_address",
            {
                is: false,
                then: s => s.min(2).required("Город обязателен")
            }
        ),
        company_mailing_street: Yup.string().when(
            "is_receive_mail_this_address",
            {
                is: false,
                then: s => s.min(2).required("Улица обязательна")
            }
        ),
        company_mailing_house: Yup.string().when(
            "is_receive_mail_this_address",
            {
                is: false,
                then: s => s.min(1).required("Дом обязателен")
            }
        ),
        company_mailing_apartment: Yup.string(),

        g_recaptcha: Yup.string().required("Пройдите проверку reCAPTCHA")
    });

    const handleSubmit = () => {

    }

    useEffect(() => {
        dispatch(setCurrentConfirmationMethod('EMAIL'))
    }, [])

    useEffect(() => {
        if (!userPersonalAccountInfo) return;

        const patch: Partial<LegalFormData> = {};

        // if (!legalFormData.phone && userPersonalAccountInfo.phone)
        if (userPersonalAccountInfo.phone)
            patch.phone = userPersonalAccountInfo.phone.replace(/\D/g, '');
        if (userPersonalAccountInfo.email)
            // if (!legalFormData.email && userPersonalAccountInfo.email)

            patch.email = userPersonalAccountInfo.email;

        // если есть что патчить – обновляем store
        if (Object.keys(patch).length) {
            dispatch(updateLegalFormData(patch));
        }
    }, [
        legalFormData.phone,
        legalFormData.email,
        userPersonalAccountInfo?.phone,
        userPersonalAccountInfo?.email,
    ]);

    const initialValues = useMemo(() => ({
        ...legalFormData,
        first_name: userPersonalAccountInfo?.first_name,
        last_name: userPersonalAccountInfo?.last_name,
        patronymic: userPersonalAccountInfo?.patronymic,
        type_message: 'EMAIL',
    }), [legalFormData]);

    /* ──────── Formik ──────── */
    const formik = useFormik({
        initialValues,
        enableReinitialize: true,
        validationSchema,
        onSubmit: values => {
            //@ts-ignore
            dispatch(updateLegalFormData(values));
            console.log('отправляю фанк')
            dispatch(
                postLegalInfoThunk(
                    //@ts-ignore
                    toLegalDataRequest(values)   // payload
                )
            )
        },

    });

    /* ──────── helpers ──────── */
    const handleValidationFailure = () => {
        dispatch(setError("Не все поля заполнены корректно"));
        setCaptchaVerified(false);
        formik.setFieldValue("g_recaptcha", "");
        recaptchaRef.current?.reset();
    };

    useEffect(() => {
        console.log(formik.errors)
    }, [formik.errors])



    /* ─── helper ─── */
    const handleReceiveMailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const checked = e.target.checked;

        // обновляем сам чекбокс
        formik.setFieldValue("is_receive_mail_this_address", checked);

        if (checked) {
            // копируем юр-адрес → почтовый
            formik.setFieldValue("company_mailing_region", formik.values.company_region);
            formik.setFieldValue("company_mailing_city", formik.values.company_city);
            formik.setFieldValue("company_mailing_street", formik.values.company_street);
            formik.setFieldValue("company_mailing_house", formik.values.company_house);
            formik.setFieldValue("company_mailing_apartment", formik.values.company_apartment);
        } else {
            // очищаем почтовые поля
            formik.setFieldValue("company_mailing_region", "");
            formik.setFieldValue("company_mailing_city", "");
            formik.setFieldValue("company_mailing_street", "");
            formik.setFieldValue("company_mailing_house", "");
            formik.setFieldValue("company_mailing_apartment", "");
        }
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

    /* sanitizers / onChange */
    const handleNameChange = (field: keyof typeof formik.values) =>
        (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
            const sanitized = e.target.value.replace(/[^А-Яа-яЁё\s-]/g, "");
            formik.setFieldValue(field, sanitized);
        };

    const handleTextChange = (field: keyof typeof formik.values) =>
        (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
            formik.setFieldValue(field, e.target.value);
        };

    const handleNumericChange = (field: keyof typeof formik.values, max: number) =>
        (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
            let value = e.target.value.replace(/\D/g, "");
            if (value.length > max) value = value.slice(0, max);
            formik.setFieldValue(field, value);
        };

    /* reCAPTCHA */
    const handleCaptchaChange = (value: string | null) => {
        formik.setFieldValue("g_recaptcha", value || "");
        setCaptchaVerified(!!value);
    };

    /* тип сообщения */
    const handleMethodChange = (method: "SMS" | "EMAIL" | "WHATSAPP") => {
        formik.setFieldValue("type_message", method);
        // сбрасываем captcha при смене метода
        setCaptchaVerified(false);
        dispatch(setCurrentConfirmationMethod(method));
        formik.setFieldValue("g_recaptcha", "");
        recaptchaRef.current?.reset();
    };

    /* сбрасываем CAPTCHA после закрытия модалки */
    useEffect(() => {
        if (!modalState.confirmDocsModal.isOpen) {
            setCaptchaVerified(false);
            formik.setFieldValue("g_recaptcha", "");
            recaptchaRef.current?.reset();
        }
    }, [modalState.confirmDocsModal]);


    if (loading) return <Loader />;

    /* ──────── Render ──────── */
    const messageTypeOptions = {
        SMS: "SMS",
        EMAIL: "Email",
        WHATSAPP: "Whatsapp"
    } as const;

    return (
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
                placeholder="Полное наименование организации"
                name="company_name"
                value={formik.values.company_name || ''}
                onChange={handleTextChange("company_name")}
                onBlur={formik.handleBlur}
                needValue
                error={formik.touched.company_name && formik.errors.company_name}
            />
            {/* ФИО директора */}
            <Input
                placeholder="Фамилия руководителя"
                name="last_name"
                value={formik.values.last_name || ''}
                onChange={handleNameChange("last_name")}
                onBlur={formik.handleBlur}
                needValue
                error={formik.touched.last_name && formik.errors.last_name}
            />
            <Input
                placeholder="Имя руководителя"
                name="first_name"
                value={formik.values.first_name || ''}
                onChange={handleNameChange("first_name")}
                onBlur={formik.handleBlur}
                needValue
                error={formik.touched.first_name && formik.errors.first_name}
            />
            <Input
                placeholder="Отчество (при наличии)"
                name="patronymic"
                value={formik.values.patronymic || ''}
                onChange={handleNameChange("patronymic")}
                onBlur={formik.handleBlur}
                error={formik.touched.patronymic && formik.errors.patronymic}
            />


            <Input
                placeholder="ИНН"
                name="company_inn"
                type="number"
                inputMode="numeric"
                max={9999999999}
                maxLength={10}
                value={formik.values.company_inn || ''}
                onChange={handleNumericChange("company_inn", 10)}
                onBlur={formik.handleBlur}
                needValue
                error={formik.touched.company_inn && formik.errors.company_inn}
            />
            <Input
                placeholder="КПП"
                name="company_kpp"
                type="number"
                inputMode="numeric"
                maxLength={9}
                max={999999999}
                value={formik.values.company_kpp || ''}
                onChange={handleNumericChange("company_kpp", 9)}
                onBlur={formik.handleBlur}
                needValue
                error={formik.touched.company_kpp && formik.errors.company_kpp}
            />
            <Input
                placeholder="ОГРН"
                name="company_ogrn"
                type="number"
                inputMode="numeric"
                maxLength={13}
                max={9999999999999}
                value={formik.values.company_ogrn || ''}
                onChange={handleNumericChange("company_ogrn", 13)}
                onBlur={formik.handleBlur}
                needValue
                error={formik.touched.company_ogrn && formik.errors.company_ogrn}
            />
            <Input
                placeholder="Расчётный счёт"
                name="company_payment_account"
                type="number"
                inputMode="numeric"
                maxLength={20}
                max={99999999999999999999}
                value={formik.values.company_payment_account || ''}
                onChange={handleNumericChange("company_payment_account", 20)}
                onBlur={formik.handleBlur}
                needValue
                error={
                    formik.touched.company_payment_account &&
                    formik.errors.company_payment_account
                }
            />
            <Input
                placeholder="Банк, где открыт счёт"
                name="company_bank_payment_account"
                value={formik.values.company_bank_payment_account || ''}
                onChange={handleTextChange("company_bank_payment_account")}
                onBlur={formik.handleBlur}
                needValue
                error={
                    formik.touched.company_bank_payment_account &&
                    formik.errors.company_bank_payment_account
                }
            />
            <Input
                placeholder="БИК"
                name="company_bank_bik"
                type="number"
                inputMode="numeric"
                maxLength={9}
                max={999999999}
                value={formik.values.company_bank_bik || ''}
                onChange={handleNumericChange("company_bank_bik", 9)}
                onBlur={formik.handleBlur}
                needValue
                error={formik.touched.company_bank_bik && formik.errors.company_bank_bik}
            />
            <Input
                placeholder="Корреспондентский счёт"
                name="company_bank_correspondent_account"
                type="number"
                inputMode="numeric"
                maxLength={20}
                max={99999999999999999999}
                value={formik.values.company_bank_correspondent_account || ''}
                onChange={handleNumericChange("company_bank_correspondent_account", 20)}
                onBlur={formik.handleBlur}
                needValue
                error={
                    formik.touched.company_bank_correspondent_account &&
                    formik.errors.company_bank_correspondent_account
                }
            />

            <Input
                placeholder="Рабочий телефон"
                name="phone"
                inputMode="tel"
                maxLength={11}

                value={formik.values.phone || ''}
                onChange={handleNumericChange("phone", 11)}
                onBlur={formik.handleBlur}
                needValue
                error={formik.touched.phone && formik.errors.phone}
            />
            <Input
                placeholder="Рабочий e-mail"
                name="email"
                value={formik.values.email || ''}
                onChange={handleTextChange("email")}
                onBlur={formik.handleBlur}
                needValue
                error={formik.touched.email && formik.errors.email}
            />

            {/* 2. legal address */}
            <h2 className="form__subtitle">Адрес организации</h2>
            <Input
                placeholder="Регион/район"
                name="company_region"
                value={formik.values.company_region || ''}
                onChange={handleTextChange("company_region")}
                onBlur={formik.handleBlur}
                needValue
                error={formik.touched.company_region && formik.errors.company_region}
            />
            <Input
                placeholder="Город/населённый пункт"
                name="company_city"
                value={formik.values.company_city || ''}
                onChange={handleTextChange("company_city")}
                onBlur={formik.handleBlur}
                needValue
                error={formik.touched.company_city && formik.errors.company_city}
            />
            <Input
                placeholder="Улица"
                name="company_street"
                value={formik.values.company_street || ''}
                onChange={handleTextChange("company_street")}
                onBlur={formik.handleBlur}
                needValue
                error={formik.touched.company_street && formik.errors.company_street}
            />
            <div className="form__duoInputs">
                <Input
                    placeholder="Дом/корпус"
                    name="company_house"
                    value={formik.values.company_house || ''}
                    onChange={handleTextChange("company_house")}
                    onBlur={formik.handleBlur}
                    needValue
                    error={formik.touched.company_house && formik.errors.company_house}
                />
                <Input
                    placeholder="Квартира"
                    name="company_apartment"
                    value={formik.values.company_apartment || ''}
                    onChange={handleTextChange("company_apartment")}
                    onBlur={formik.handleBlur}
                    error={
                        formik.touched.company_apartment &&
                        formik.errors.company_apartment
                    }
                />
            </div>

            {/* чекбокс + почтовый адрес */}
            <Checkbox
                name="is_receive_mail_this_address"
                value={formik.values.is_receive_mail_this_address}
                onChange={handleReceiveMailChange}
                onBlur={formik.handleBlur}
                label={<span>Получать почту по этому адресу</span>}
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
                        name="company_mailing_region"
                        value={formik.values.company_mailing_region || ''}
                        onChange={handleTextChange("company_mailing_region")}
                        onBlur={formik.handleBlur}
                        needValue
                        error={
                            formik.touched.company_mailing_region &&
                            formik.errors.company_mailing_region
                        }
                    />
                    <Input
                        placeholder="Город/населённый пункт"
                        name="company_mailing_city"
                        value={formik.values.company_mailing_city || ''}
                        onChange={handleTextChange("company_mailing_city")}
                        onBlur={formik.handleBlur}
                        needValue
                        error={
                            formik.touched.company_mailing_city &&
                            formik.errors.company_mailing_city
                        }
                    />
                    <Input
                        placeholder="Улица"
                        name="company_mailing_street"
                        value={formik.values.company_mailing_street || ''}
                        onChange={handleTextChange("company_mailing_street")}
                        onBlur={formik.handleBlur}
                        needValue
                        error={
                            formik.touched.company_mailing_street &&
                            formik.errors.company_mailing_street
                        }
                    />
                    <div className="form__duoInputs">
                        <Input
                            placeholder="Дом/корпус"
                            name="company_mailing_house"
                            value={formik.values.company_mailing_house || ''}
                            onChange={handleTextChange("company_mailing_house")}
                            onBlur={formik.handleBlur}
                            needValue
                            error={
                                formik.touched.company_mailing_house &&
                                formik.errors.company_mailing_house
                            }
                        />
                        <Input
                            placeholder="Квартира"
                            name="company_mailing_apartment"
                            value={formik.values.company_mailing_apartment || ''}
                            onChange={handleTextChange("company_mailing_apartment")}
                            onBlur={formik.handleBlur}
                            error={
                                formik.touched.company_mailing_apartment &&
                                formik.errors.company_mailing_apartment
                            }
                        />
                    </div>
                </>
            )}

            {/* Тип сообщения */}
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
                <span className="method__title">Куда отправить код</span>
                <CheckboxGroup
                    greedOrFlex="flex"
                    name="type_message"
                    label=""
                    direction="row"
                    options={Object.entries(messageTypeOptions).map(([value, label]) => ({ label, value }))}
                    value={formik.values.type_message}
                    onChange={(name, v) => handleMethodChange(v as "SMS" | "EMAIL" | "WHATSAPP")}
                />

            </div>
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
                        padding="16px"
                    >
                        {loading ? (
                            <Loader theme={LoaderTheme.WHITE} size={LoaderSize.SMALL} />
                        ) : (
                            "Подтвердить данные"
                        )}
                    </Button>
                </div>
            ) : (
                <div className={styles.buttons__desktop}>
                    <Button
                        type="submit"
                        theme={ButtonTheme.BLUE}
                        disabled={!captchaVerified}
                        padding="16px"
                    >
                        {loading ? (
                            <Loader theme={LoaderTheme.WHITE} size={LoaderSize.SMALL} />
                        ) : (
                            "Подтвердить данные"
                        )}
                    </Button>
                </div>
            )}
            {/* модалка подтверждения */}
            <ConfirmDocsModal
                lastData={{
                    type_message: formik.values.type_message || '',
                    type_document: "type_doc_person_legal",
                    is_agree: formik.values.g_recaptcha.length > 0
                }}
                isOpen={modalState.confirmDocsModal.isOpen}
                onClose={() => dispatch(closeModal(ModalType.CONFIRM_DOCS))}
                docsType="type_doc_person_legal"
            />
            <ConfirmContactsModal onClose={() => {
                formik.setFieldValue("g_recaptcha", "");
            }}

            />
        </form>
    );
};
