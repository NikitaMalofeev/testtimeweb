import React, { useState, useEffect, useRef } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import ReCAPTCHA from "react-google-recaptcha";
import styles from "./styles.module.scss";

import { createRiskProfile } from "entities/RiskProfile/slice/riskProfileSlice";
import { IdentificationProfileData } from "entities/RiskProfile/model/types";
import { Input } from "shared/ui/Input/Input";
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
import BooleanTabs from "shared/ui/BooleanTabs/BooleanTabs";
import { DocumentsPreviewPdfModal } from "features/Documents/DocumentsPreviewPdfModal/DocumentsPreviewPdfModal";

const IdentificationProfileForm: React.FC = () => {
    const dispatch = useAppDispatch();
    const gcaptchaSiteKey = import.meta.env.VITE_RANKS_GRCAPTCHA_SITE_KEY;

    /* ───────────── вкладка «Физ/Юр лицо» ───────────── */
    const [personTab, setPersonTab] = useState<boolean>(false);

    /* ───────────── капча ───────────── */
    const recaptchaRef = useRef<ReCAPTCHA | null>(null);
    const [captchaVerified, setCaptchaVerified] = useState(false);

    /* ───────────── скролл-тень формы ───────────── */
    const formContentRef = useRef<HTMLFormElement>(null);
    const { isScrolled, isBottom } = useScrollShadow(formContentRef, true);

    const { loading } = useSelector((s: RootState) => s.riskProfile);
    const modalState = useSelector((s: RootState) => s.modal);
    const systemError = useSelector((s: RootState) => s.error.error);
    const modalConfirmOpen = useSelector(
        (s: RootState) => s.modal.confirmCodeModal.isOpen
    );

    const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@([A-Za-z0-9-]+\.)+[A-Za-z]{2,}$/;
    const NAME_REGEX = /^[А-Яа-яЁё\s-]+$/;

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
        },
        validationSchema: Yup.object({
            lastName: Yup.string()
                .matches(NAME_REGEX, "Допустимы только буквы, пробел и дефис")
                .min(2, "Минимум 2 символа")
                .required("Фамилия обязательна"),
            firstName: Yup.string()
                .matches(NAME_REGEX, "Допустимы только буквы, пробел и дефис")
                .min(2, "Минимум 2 символа")
                .required("Имя обязательно"),
            patronymic: Yup.string()
                .matches(NAME_REGEX, "Допустимы только буквы, пробел и дефис")
                .min(2, "Минимум 2 символа")
                .nullable(),
            email: Yup.string()
                .required("E-mail обязательно")
                .matches(EMAIL_REGEX, "Некорректный email"),
            phone: Yup.string()
                .matches(/^\+\d{11}$/, "Неверный формат номера телефона")
                .required("Номер телефона обязателен"),
            password: Yup.string()
                .min(8, "Пароль минимум 8 символов")
                .required("Пароль обязателен"),
            password2: Yup.string()
                .oneOf([Yup.ref("password")], "Пароли не совпадают")
                .required("Подтверждение обязательно"),
            g_recaptcha: Yup.string().required("Подтвердите, что вы не робот"),
        }),
        validateOnMount: true,
        onSubmit: () => { },
    });

    /* ───────────── разблокировка кнопки ───────────── */
    const [isButtonDisabled, setIsButtonDisabled] = useState(true);
    useEffect(() => {
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

    /* ───────────── ввод ФИО только кириллицей ───────────── */
    const handleNameChange =
        (field: string) =>
            (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                const sanitized = e.target.value.replace(/[^А-Яа-яЁё\s-]/g, "");
                formik.setFieldValue(field, sanitized);
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
                        leftTitle="ИП"
                        rightTitle="Физ.лицо"
                        active={personTab === false ? "right" : "left"}
                        onLeftClick={() => handlePersonTabChange(true)}
                        onRightClick={() => handlePersonTabChange(false)}
                    />
                    <Input
                        name="lastName"
                        value={formik.values.lastName}
                        onChange={handleNameChange("lastName")}
                        onBlur={formik.handleBlur}
                        placeholder="Фамилия"
                        needValue
                        type="text"
                        error={formik.touched.lastName && formik.errors.lastName}
                    />
                    <Input
                        name="firstName"
                        value={formik.values.firstName}
                        onChange={handleNameChange("firstName")}
                        onBlur={formik.handleBlur}
                        placeholder="Имя"
                        needValue
                        type="text"
                        error={formik.touched.firstName && formik.errors.firstName}
                    />
                    <Input
                        name="patronymic"
                        value={formik.values.patronymic}
                        onChange={handleNameChange("patronymic")}
                        onBlur={formik.handleBlur}
                        placeholder="Отчество (при наличии)"
                        type="text"
                        error={formik.touched.patronymic && formik.errors.patronymic}
                    />
                    <Input
                        name="phone"
                        value={formik.values.phone}
                        onChange={(e) => {
                            let value = e.target.value.replace(/[^\d+]/g, "");
                            if (!value.startsWith("+")) value = "+" + value;
                            formik.setFieldValue("phone", value);
                        }}
                        onBlur={formik.handleBlur}
                        placeholder="Номер телефона +7"
                        needValue
                        type="text"
                        error={formik.touched.phone && formik.errors.phone}
                    />
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
                        Отправить код подтверждения на:
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

