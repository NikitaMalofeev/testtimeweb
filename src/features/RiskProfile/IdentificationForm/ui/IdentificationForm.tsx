import React, { useState, useEffect, useRef, useMemo } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import ReCAPTCHA from "react-google-recaptcha";
import styles from "./styles.module.scss";

import { createRiskProfile } from "entities/RiskProfile/slice/riskProfileSlice";
import { IdentificationProfileData } from "entities/RiskProfile/model/types";
import { Input } from "shared/ui/Input/Input";
import { PhoneInput } from "shared/ui/PhoneInput/PhoneInput";
import { useAppDispatch } from "shared/hooks/useAppDispatch";
import { Checkbox } from "shared/ui/Checkbox/Checkbox";
import { Button, ButtonTheme } from "shared/ui/Button/Button";
import {
    closeModal,
    openModal,
    setCurrentConfirmModalType,
} from "entities/ui/Modal/slice/modalSlice";
import {
    ModalAnimation,
    ModalSize,
    ModalType,
} from "entities/ui/Modal/model/modalTypes";
import { useSelector } from "react-redux";
import { RootState } from "app/providers/store/config/store";
import { userType } from "entities/User/types/userTypes";
import { setUserData } from "entities/User/slice/userSlice";
import { Loader, LoaderSize, LoaderTheme } from "shared/ui/Loader/Loader";
import { DocumentPreviewModal } from "features/Documents/DocumentsPreviewModal/DocumentPreviewModal";
import PrivacyPdf from "shared/assets/documents/PersonalPolicy.pdf";
import { CheckboxGroup } from "shared/ui/CheckboxGroup/CheckboxGroup";
import { useScrollShadow } from "shared/hooks/useScrollShadow";
import { useCapitalizeName } from "shared/hooks/useCapitalizeName";
import { usePhoneFormat } from "shared/hooks/usePhoneFormat";
import BooleanTabs from "shared/ui/BooleanTabs/BooleanTabs";
import { DocumentsPreviewPdfModal } from "features/Documents/DocumentsPreviewPdfModal/DocumentsPreviewPdfModal";
import { resetBrokerIds, setBrokerIds } from "entities/Documents/slice/documentsSlice";
import { setActiveTariffs } from "entities/Payments/slice/paymentsSlice";
import { Select } from "shared/ui/Select/Select";

interface IdentificationProfileFormProps {
    partnerLink?: string;
}

const IdentificationProfileForm: React.FC<IdentificationProfileFormProps> = ({ partnerLink }) => {
    const dispatch = useAppDispatch();
    const gcaptchaSiteKey = import.meta.env.VITE_RANKS_GRCAPTCHA_SITE_KEY;
    const [numberPlaceholder, setNumberPlaceholder] = useState('Введите номер телефона')

    /* ───────────── вкладка «Физ/Юр лицо» ───────────── */
    const [personTab, setPersonTab] = useState<boolean>(false);

    /* ───────────── капча ───────────── */
    const recaptchaRef = useRef<ReCAPTCHA | null>(null);
    const [captchaVerified, setCaptchaVerified] = useState(false);

    /* ───────────── скролл-тень формы ───────────── */
    const formContentRef = useRef<HTMLFormElement>(null);
    const { isScrolled, isBottom } = useScrollShadow(formContentRef, true);

    /* ───────────── хук для капитализации ФИО ───────────── */
    const { handleNameChange: handleCapitalizedNameChange } = useCapitalizeName();

    /* ───────────── хук для форматирования телефона ───────────── */
    const { handlePhoneChange, getPhoneValidationRegex } = usePhoneFormat();

    /* ───────────── состояния для отслеживания ошибок ввода кириллицы ───────────── */
    const [cyrillicErrors, setCyrillicErrors] = useState({
        lastName: false,
        firstName: false,
        patronymic: false,
    });

    /* ───────────── автоматическое скрытие ошибок кириллицы через 3 секунды ───────────── */
    useEffect(() => {
        const timers: NodeJS.Timeout[] = [];

        Object.entries(cyrillicErrors).forEach(([field, hasError]) => {
            if (hasError) {
                const timer = setTimeout(() => {
                    setCyrillicErrors(prev => ({ ...prev, [field]: false }));
                }, 3000);
                timers.push(timer);
            }
        });

        return () => timers.forEach(timer => clearTimeout(timer));
    }, [cyrillicErrors]);

    /* ───────────── простая валидация телефона ───────────── */
    const validatePhoneNumber = (value: string | undefined) => {
        if (!value) return false;
        // Простая проверка: начинается с + и содержит не менее 10 цифр
        const phoneRegex = /^\+\d{10,15}$/;
        const isValid = phoneRegex.test(value);
        console.log('Phone validation:', { value, isValid });
        return isValid;
    };
    //деплой timeweb

    const { loading } = useSelector((s: RootState) => s.riskProfile);
    const modalState = useSelector((s: RootState) => s.modal);
    const systemError = useSelector((s: RootState) => s.error.error);
    const modalConfirmOpen = useSelector(
        (s: RootState) => s.modal.confirmCodeModal.isOpen
    );

    const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@([A-Za-z0-9-]+\.)+[A-Za-z]{2,}$/;
    const NAME_REGEX = /^[А-Яа-яЁё\s-]+$/;

    /* ───────────── схема валидации с доступом к validatePhoneNumber ───────────── */
    const validationSchema = useMemo(() => Yup.object({
        lastName: Yup.string()
            .matches(NAME_REGEX, "Ввод только кириллицей")
            .min(2, "Минимум 2 символа")
            .required("Фамилия обязательна"),
        firstName: Yup.string()
            .matches(NAME_REGEX, "Ввод только кириллицей")
            .min(2, "Минимум 2 символа")
            .required("Имя обязательно"),
        patronymic: Yup.string()
            .matches(NAME_REGEX, "Ввод только кириллицей")
            .min(2, "Минимум 2 символа")
            .nullable(),
        email: Yup.string()
            .required("E-mail обязательно")
            .matches(EMAIL_REGEX, "Некорректный email"),
        phone: Yup.string()
            .test('phone-format', 'Неверный формат номера телефона', validatePhoneNumber)
            .required("Номер телефона обязателен"),
        password: Yup.string()
            .min(8, "Пароль минимум 8 символов")
            .required("Пароль обязателен"),
        password2: Yup.string()
            .oneOf([Yup.ref("password")], "Пароли не совпадают")
            .required("Подтверждение обязательно"),
        g_recaptcha: Yup.string().required("Подтвердите, что вы не робот"),
        contact_communication_type: Yup.string()
            .oneOf(['contact_communication_telegram', 'contact_communication_whatsapp', 'contact_communication_max', 'contact_communication_other'], "Выберите тип контакта")
            .required("Тип контакта обязателен"),
        contact_communication_telegram: Yup.string().when('contact_communication_type', {
            is: 'contact_communication_telegram',
            then: (schema) => schema.required("Telegram обязателен для выбранного типа"),
            otherwise: (schema) => schema.nullable()
        }),
        contact_communication_whatsapp: Yup.string().when('contact_communication_type', {
            is: 'contact_communication_whatsapp',
            then: (schema) => schema.test('phone-format', 'Неверный формат номера телефона', validatePhoneNumber).required("WhatsApp номер обязателен для выбранного типа"),
            otherwise: (schema) => schema.nullable()
        }),
        contact_communication_max: Yup.string().when('contact_communication_type', {
            is: 'contact_communication_max',
            then: (schema) => schema.required("Max контакт обязателен для выбранного типа"),
            otherwise: (schema) => schema.nullable()
        }),
        contact_communication_other: Yup.string().when('contact_communication_type', {
            is: 'contact_communication_other',
            then: (schema) => schema.required("Другой контакт обязателен для выбранного типа"),
            otherwise: (schema) => schema.nullable()
        }),
    }), [validatePhoneNumber]);

    const formik = useFormik({
        initialValues: {
            lastName: "",
            firstName: "",
            patronymic: "",
            phone: "",
            email: "",
            password: "",
            password2: "",
            is_agreement: false,
            g_recaptcha: "",
            is_individual_entrepreneur: false,
            type_sms_message: "SMS",
            contact_communication_type: "",
            contact_communication_telegram: "",
            contact_communication_whatsapp: "",
            contact_communication_max: "",
            contact_communication_other: "",
        },
        validationSchema: validationSchema,
        validateOnMount: true,
        validateOnChange: true, // Включаем валидацию при изменении
        onSubmit: () => { },
    });

    /* ───────────── разблокировка кнопки ───────────── */
    const [isButtonDisabled, setIsButtonDisabled] = useState(true);
    useEffect(() => {
        console.log('Button disabled check:', {
            isValid: formik.isValid,
            dirty: formik.dirty,
            captchaVerified,
            agreement: formik.values.is_agreement,
            errors: formik.errors
        });
        setIsButtonDisabled(
            !(
                formik.isValid &&
                formik.dirty &&
                captchaVerified &&
                formik.values.is_agreement
            )
        );
    }, [formik.isValid, formik.dirty, formik.values, captchaVerified]);

    /* ───────────── смена капчи ───────────── */
    const handleCaptchaChange = (value: string | null) => {
        formik.setFieldValue("g_recaptcha", value || "");
        setCaptchaVerified(!!value);
    };

    /* ───────────── тип получения кода ───────────── */
    const messageTypeOptions = {
        SMS: "SMS",
        WHATSAPP: "Whatsapp",
    };

    const handleMethodChange = (method: "SMS" | "WHATSAPP") => {
        dispatch(setCurrentConfirmModalType(method));
        formik.setFieldValue("type_sms_message", method);
        setCaptchaVerified(false);
        formik.setFieldValue("g_recaptcha", "");
        recaptchaRef.current?.reset();
    };

    /* ───────────── ввод ФИО только кириллицей с капитализацией ───────────── */
    const handleNameChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const inputValue = e.target.value;
        const currentValue = formik.values[field as keyof typeof formik.values] as string;

        // Проверяем есть ли не-кириллические символы в новом вводе
        const nonCyrillicRegex = /[^А-Яа-яЁё\s-]/;
        const hasNonCyrillic = nonCyrillicRegex.test(inputValue);

        // Если есть попытка ввода не-кириллических символов
        if (hasNonCyrillic && inputValue.length > currentValue.length) {
            setCyrillicErrors(prev => ({ ...prev, [field]: true }));
            formik.setFieldTouched(field, true, false);
        }

        // Применяем капитализацию и фильтрацию
        handleCapitalizedNameChange(
            (value: string) => {
                formik.setFieldValue(field, value);
                // Если после фильтрации значение не изменилось и нет ошибки, сбрасываем ошибку
                if (!hasNonCyrillic) {
                    setCyrillicErrors(prev => ({ ...prev, [field]: false }));
                }
            },
            /[^А-Яа-яЁё\s-]/g
        )(e);
    };

    /* ───────────── открыть политику конфиденциальности ───────────── */
    const handleOpenPrivacy = (e: React.MouseEvent) => {
        e.preventDefault();
        dispatch(
            openModal({
                type: ModalType.DOCUMENTS_PREVIEW_PDF,
                animation: ModalAnimation.LEFT,
                size: ModalSize.FULL,
            })
        );
    };

    /* ───────────── обновление капчи при ошибке ───────────── */
    useEffect(() => {
        if (!modalConfirmOpen) {
            formik.setFieldValue("g_recaptcha", "");
            recaptchaRef.current?.reset();
        }
    }, [systemError, modalConfirmOpen]);

    /* ───────────── отправка формы ───────────── */
    const handleSubmitForm = () => {
        const payload: IdentificationProfileData = {
            phone: formik.values.phone,
            email: formik.values.email,
            first_name: formik.values.firstName,
            patronymic: formik.values.patronymic,
            last_name: formik.values.lastName,
            password: formik.values.password,
            password2: formik.values.password2,
            is_agreement: formik.values.is_agreement,
            g_recaptcha: formik.values.g_recaptcha,
            is_individual_entrepreneur: formik.values.is_individual_entrepreneur,
            type_sms_message: formik.values.type_sms_message,
            contact_communication_type: formik.values.contact_communication_type as 'contact_communication_telegram' | 'contact_communication_whatsapp' | 'contact_communication_max' | 'contact_communication_other',
            contact_communication_telegram: formik.values.contact_communication_telegram,
            contact_communication_whatsapp: formik.values.contact_communication_whatsapp,
            contact_communication_max: formik.values.contact_communication_max,
            contact_communication_other: formik.values.contact_communication_other,
            ...(partnerLink && { partner_link: partnerLink }),
        };

        const userForRedux: userType = {
            phone: formik.values.phone,
            email: formik.values.email,
            first_name: formik.values.firstName,
            patronymic: formik.values.patronymic,
            last_name: formik.values.lastName,
            is_individual_entrepreneur: formik.values.is_individual_entrepreneur,
            is_agreement: formik.values.is_agreement,
        };

        dispatch(setUserData(userForRedux));
        dispatch(
            createRiskProfile({
                data: payload,
                onError: () => {
                    setCaptchaVerified(false);
                    formik.setFieldValue("g_recaptcha", "");
                    recaptchaRef.current?.reset();
                },
                onSuccess: () => {
                    // НОВАЯ ЛОГИКА: сбрасываем confirmationMethod обратно к SMS после отправки
                    dispatch(setCurrentConfirmModalType('SMS'));
                    // Также сбрасываем значение в форме обратно к SMS для следующего использования
                    formik.setFieldValue("type_sms_message", "SMS");
                    dispatch(
                        openModal({
                            type: ModalType.CONFIRM_CODE,
                            size: ModalSize.MIDDLE,
                            animation: ModalAnimation.BOTTOM,
                        })
                    );
                },
            })
        );

        //FIXME 
        //сбрасываю id брокера 
        dispatch(resetBrokerIds())
        dispatch(setActiveTariffs([]))
    };

    /* ───────────── обработка клика по вкладкам ───────────── */
    const handlePersonTabChange = (tab: boolean) => {
        setPersonTab(tab);
        formik.setFieldValue("is_individual_entrepreneur", tab);
    };

    return (
        <>
            <form
                onSubmit={formik.handleSubmit}
                ref={formContentRef}
                className={`
          ${styles.form}
          ${isScrolled && !isBottom ? styles.shadowBoth
                        : isScrolled ? styles.shadowTop
                            : !isBottom ? styles.shadowBottom
                                : ""}
        `}
            >
                {/* ───────────── ФИЗ / ЮР лицо ───────────── */}
                <div style={{ paddingTop: "8px" }} className={styles.form__grid}>
                    {/* ───────────── поля формы ───────────── */}

                    <BooleanTabs
                        leftTitle="Физ.лицо"
                        rightTitle="ИП"
                        size="small"
                        description="выберите ваш тип клиента"
                        active={personTab !== false ? "right" : "left"}
                        onLeftClick={() => handlePersonTabChange(false)}
                        onRightClick={() => handlePersonTabChange(true)}
                    />
                    <Input
                        name="lastName"
                        value={formik.values.lastName}
                        onChange={handleNameChange("lastName")}
                        onBlur={formik.handleBlur}
                        placeholder="Фамилия"
                        needValue
                        type="text"
                        error={
                            cyrillicErrors.lastName
                                ? "Ввод только кириллицей"
                                : (formik.touched.lastName && formik.errors.lastName)
                        }
                    />
                    <Input
                        name="firstName"
                        value={formik.values.firstName}
                        onChange={handleNameChange("firstName")}
                        onBlur={formik.handleBlur}
                        placeholder="Имя"
                        needValue
                        type="text"
                        error={
                            cyrillicErrors.firstName
                                ? "Ввод только кириллицей"
                                : (formik.touched.firstName && formik.errors.firstName)
                        }
                    />
                    <Input
                        name="patronymic"
                        value={formik.values.patronymic}
                        onChange={handleNameChange("patronymic")}
                        onBlur={formik.handleBlur}
                        placeholder="Отчество (при наличии)"
                        type="text"
                        error={
                            cyrillicErrors.patronymic
                                ? "Ввод только кириллицей"
                                : (formik.touched.patronymic && formik.errors.patronymic)
                        }
                    />
                    <PhoneInput
                        name="phone"
                        value={formik.values.phone}
                        onChange={(value) => formik.setFieldValue("phone", value)}
                        onBlur={formik.handleBlur}
                        placeholder={numberPlaceholder}
                        onFocus={() => setNumberPlaceholder('+7 (___) ___-____')}
                        withoutCloudyLabel
                        needValue
                        error={formik.touched.phone && formik.errors.phone}
                    />
                    {/* ───────────── дополнительные контакты ───────────── */}
                    <Select
                        items={[
                            { value: 'contact_communication_telegram', label: 'Telegram' },
                            { value: 'contact_communication_whatsapp', label: 'WhatsApp' },
                            { value: 'contact_communication_max', label: 'Max' },
                            { value: 'contact_communication_other', label: 'Другое' },
                        ]}
                        value={formik.values.contact_communication_type}
                        onChange={(value) => {
                            formik.setFieldValue('contact_communication_type', value);
                            // Очищаем все поля при смене типа
                            formik.setFieldValue('contact_communication_telegram', '');
                            formik.setFieldValue('contact_communication_whatsapp', '');
                            formik.setFieldValue('contact_communication_max', '');
                            formik.setFieldValue('contact_communication_other', '');
                        }}

                        title="Тип дополнительного контакта"
                        label="Доп. контакт (мессенджер)"
                        needValue
                        error={formik.touched.contact_communication_type && formik.errors.contact_communication_type}
                    />
                    {/* Условно отображаемые поля в зависимости от выбранного типа */}
                    {formik.values.contact_communication_type === 'contact_communication_telegram' && (
                        <Input
                            name="contact_communication_telegram"
                            value={formik.values.contact_communication_telegram}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            placeholder="@username или ссылка на Telegram"
                            needValue
                            type="text"
                            error={formik.touched.contact_communication_telegram && formik.errors.contact_communication_telegram}
                        />
                    )}

                    {formik.values.contact_communication_type === 'contact_communication_whatsapp' && (
                        <PhoneInput
                            name="contact_communication_whatsapp"
                            value={formik.values.contact_communication_whatsapp}
                            onChange={(value) => formik.setFieldValue("contact_communication_whatsapp", value)}
                            onBlur={formik.handleBlur}
                            placeholder="Номер телефона WhatsApp"
                            withoutCloudyLabel
                            needValue
                            error={formik.touched.contact_communication_whatsapp && formik.errors.contact_communication_whatsapp}
                        />
                    )}

                    {formik.values.contact_communication_type === 'contact_communication_max' && (
                        <Input
                            name="contact_communication_max"
                            value={formik.values.contact_communication_max}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            placeholder="Max контакт"
                            needValue
                            type="text"
                            error={formik.touched.contact_communication_max && formik.errors.contact_communication_max}
                        />
                    )}

                    {formik.values.contact_communication_type === 'contact_communication_other' && (
                        <Input
                            name="contact_communication_other"
                            value={formik.values.contact_communication_other}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            placeholder="Другой способ связи"
                            needValue
                            type="text"
                            error={formik.touched.contact_communication_other && formik.errors.contact_communication_other}
                        />
                    )}
                    <Input
                        autoComplete="new-password"
                        name="email"
                        value={formik.values.email}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        placeholder="E-mail"
                        needValue
                        type="text"
                        error={formik.touched.email && formik.errors.email}
                    />
                    <Input
                        autoComplete="new-password"
                        name="password"
                        value={formik.values.password}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        placeholder="Пароль"
                        needValue
                        type="password"
                        error={formik.touched.password && formik.errors.password}
                    />
                    <Input
                        name="password2"
                        value={formik.values.password2}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        placeholder="Повтор пароля"
                        needValue
                        type="password"
                        error={formik.touched.password2 && formik.errors.password2}
                    />





                    <Checkbox
                        name="is_agreement"
                        value={formik.values.is_agreement}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        label={
                            <span className={styles.checkbox__text}>
                                Вы соглашаетесь с{" "}
                                <a
                                    className={styles.checkbox__link}
                                    href="#"
                                    onClick={handleOpenPrivacy}
                                >
                                    Условиями использования и Политикой конфиденциальности
                                </a>
                            </span>
                        }
                        error={formik.touched.is_agreement && formik.errors.is_agreement}
                    />
                </div>

                {/* ───────────── выбор метода подтверждения ───────────── */}
                <div>
                    <span className={styles.buttons__method__title}>
                        отправить код подтверждения номера в:
                    </span>
                    <div className={styles.buttons__method}>
                        <CheckboxGroup
                            name="type_sms_message"
                            label=""
                            greedOrFlex="flex"
                            direction="row"
                            options={Object.entries(messageTypeOptions).map(
                                ([value, label]) => ({
                                    label,
                                    value,
                                })
                            )}
                            value={formik.values.type_sms_message}
                            onChange={(_, v) => handleMethodChange(v as "SMS" | "WHATSAPP")}
                        />
                    </div>
                </div>

                {/* ───────────── капча ───────────── */}
                <div style={{ minHeight: "74px" }} className={styles.captcha}>
                    <ReCAPTCHA
                        ref={recaptchaRef}
                        sitekey={`${gcaptchaSiteKey}`}
                        onChange={handleCaptchaChange}
                    />
                </div>
                {formik.touched.g_recaptcha && formik.errors.g_recaptcha && (
                    <div className={styles.error}>{formik.errors.g_recaptcha}</div>
                )}

                {/* ───────────── кнопка ───────────── */}
                <div className={styles.buttons}>
                    <Button
                        onClick={handleSubmitForm}
                        theme={ButtonTheme.BLUE}
                        className={styles.button}
                        disabled={isButtonDisabled}
                    >
                        {loading ? (
                            <Loader theme={LoaderTheme.WHITE} size={LoaderSize.SMALL} />
                        ) : (
                            "Подтвердить данные"
                        )}
                    </Button>
                </div>
            </form>

            {/* ───────────── модалка превью документов ───────────── */}
            <DocumentsPreviewPdfModal
                pdfUrl={PrivacyPdf}
                isOpen={modalState.documentsPreviewPdf.isOpen}
                onClose={() => dispatch(closeModal(ModalType.DOCUMENTS_PREVIEW_PDF))}
            />
        </>
    );
};

export default IdentificationProfileForm;

