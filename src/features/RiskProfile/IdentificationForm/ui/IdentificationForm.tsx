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
import { Button, ButtonForm, ButtonTheme } from "shared/ui/Button/Button";
import {
    openModal,
    setCurrentConfirmModalType
} from "entities/ui/Modal/slice/modalSlice";
import {
    ModalAnimation,
    ModalSize,
    ModalType
} from "entities/ui/Modal/model/modalTypes";
import { useSelector } from "react-redux";
import { RootState } from "app/providers/store/config/store";
import { nextStep } from "entities/ui/Ui/slice/uiSlice";
import { Icon } from "shared/ui/Icon/Icon";
import SuccessIcon from 'shared/assets/svg/success.svg';
import { userType } from "entities/User/types/userTypes";
import { setUserData } from "entities/User/slice/userSlice";

const IdentificationProfileForm: React.FC = () => {
    const dispatch = useAppDispatch();
    const gcaptchaSiteKey = import.meta.env.VITE_RANKS_GRCAPTCHA_SITE_KEY;

    const [selectedMethod, setSelectedMethod] = useState<'phone' | 'email' | 'whatsapp' | ''>('phone');
    const [isButtonDisabled, setIsButtonDisabled] = useState(true);
    const recaptchaRef = useRef<ReCAPTCHA | null>(null);
    const [captchaVerified, setCaptchaVerified] = useState(false);

    const checkConfirmmationSuccess = useSelector((state: RootState) => state.ui.confirmationStatusSuccess);

    const formik = useFormik({
        initialValues: {
            lastName: "",
            firstName: "",
            middleName: "",
            phone: "",
            email: "",
            password: "",
            password2: "",
            is_agreement: false,
            g_recaptcha: "",
            type_sms_message: "",
        },
        validationSchema: Yup.object({
            lastName: Yup.string().required("Фамилия обязательна"),
            firstName: Yup.string().required("Имя обязательно"),
            middleName: Yup.string().required("Отчество обязательно"),
            email: Yup.string().required("E-mail обязательно"),
            phone: Yup.string()
                .matches(/^\+7 \d{3} \d{3} \d{2} \d{2}$/, "Некорректный номер телефона")
                .required("Телефон обязателен"),
            password: Yup.string()
                .min(8, "Пароль минимум 8 символов")
                .required("Пароль обязателен"),
            password2: Yup.string()
                .oneOf([Yup.ref("password")], "Пароли не совпадают")
                .required("Подтверждение обязательно"),
            is_agreement: Yup.boolean().oneOf([true], "Необходимо согласиться с условиями"),
            g_recaptcha: Yup.string().required("Подтвердите, что вы не робот"),
        }),
        validateOnMount: true,
        onSubmit: () => { },
    });

    useEffect(() => {
        setIsButtonDisabled(!(formik.isValid && formik.dirty && captchaVerified));
    }, [formik.isValid, formik.dirty, formik.values, captchaVerified]);

    const handleCaptchaChange = (value: string | null) => {
        formik.setFieldValue("g_recaptcha", value || "");
        setCaptchaVerified(!!value);
    };

    /**
     * Устанавливаем локальное состояние выбранного метода (whatsapp, phone, email).
     * Одновременно диспатчим экшен setCurrentConfirmModalType для записи
     * в Redux, чтобы ConfirmInfoModal знал, какой тип показывать.
     */
    const handleMethodChange = (method: 'phone' | 'email' | 'whatsapp') => {
        if (selectedMethod === method) {
            setSelectedMethod("");
            dispatch(setCurrentConfirmModalType(""));
            formik.setFieldValue("type_sms_message", "");
        } else {
            setSelectedMethod(method);
            dispatch(setCurrentConfirmModalType(method));
            formik.setFieldValue("type_sms_message", method === 'whatsapp' ? "WHATSAPP" : "");
        }

        // Сбрасываем капчу и статус верификации
        setCaptchaVerified(false);
        formik.setFieldValue("g_recaptcha", "");
        recaptchaRef.current?.reset();
    };

    const openNextModal = () => {
        dispatch(openModal({
            type: ModalType.CONFIRM_CODE,
            size: ModalSize.MIDDLE,
            animation: ModalAnimation.BOTTOM
        }));
    };

    const handleSubmitForm = async () => {
        if (isButtonDisabled) return;

        const payload: IdentificationProfileData = {
            phone: formik.values.phone,
            email: formik.values.email,
            first_name: formik.values.firstName,
            middle_name: formik.values.middleName,
            last_name: formik.values.lastName,
            password: formik.values.password,
            password2: formik.values.password2,
            is_agreement: formik.values.is_agreement,
            g_recaptcha: formik.values.g_recaptcha,
            type_sms_message: formik.values.type_sms_message || undefined,
        };

        const userForRedux: userType = {
            phone: formik.values.phone,
            email: formik.values.email,
            first_name: formik.values.firstName,
            middle_name: formik.values.middleName,
            last_name: formik.values.lastName,
            is_agreement: formik.values.is_agreement,
        }

        dispatch(setUserData(userForRedux))

        try {
            // Если все данные верны, сервер вернёт результат без ошибок
            await dispatch(createRiskProfile(payload)).unwrap();

            // Открываем модалку с подтверждением кода
            openNextModal();
        } catch (error) {
            // Обработка ошибки
        }
    };

    return (
        <form onSubmit={formik.handleSubmit} className={styles.form}>
            <div>
                <Input
                    name="lastName"
                    value={formik.values.lastName}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="Фамилия"
                    needValue
                    type="text"
                />
                <Input
                    name="firstName"
                    value={formik.values.firstName}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="Имя"
                    needValue
                    type="text"
                />
                <Input
                    name="middleName"
                    value={formik.values.middleName}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="Отчество"
                    needValue
                    type="text"
                />
                <Input
                    name="phone"
                    value={formik.values.phone}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    placeholder="Номер телефона"
                    needValue
                    type="phone"
                    error={formik.errors.phone}
                />
                <Input
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
                                onClick={(e) => e.preventDefault()}
                            >
                                Условиями использования и Политикой конфиденциальности
                            </a>
                        </span>
                    }
                    error={formik.touched.is_agreement && formik.errors.is_agreement}
                />
            </div>

            <div>
                <span className={styles.buttons__title}>Отправить на:</span>
                <div className={styles.buttons}>
                    <Button
                        theme={selectedMethod === 'whatsapp' ? ButtonTheme.GREEN : ButtonTheme.GREENuNDERLINE}
                        className={styles.button_select}
                        onClick={() => handleMethodChange('whatsapp')}
                    >
                        WhatsApp
                    </Button>
                    <Button
                        theme={selectedMethod === 'phone' ? ButtonTheme.BLUE : ButtonTheme.UNDERLINE}
                        className={styles.button_select}
                        onClick={() => handleMethodChange('phone')}
                    >
                        телефон и email
                    </Button>
                </div>
            </div>

            <div style={{ minHeight: '74px' }}>
                <ReCAPTCHA
                    ref={recaptchaRef}
                    sitekey={`${gcaptchaSiteKey}`}
                    onChange={handleCaptchaChange}
                />
            </div>
            {formik.touched.g_recaptcha && formik.errors.g_recaptcha && (
                <div className={styles.error}>{formik.errors.g_recaptcha}</div>
            )}

            {checkConfirmmationSuccess ? (
                <div className={styles.form__success}>
                    <div className={styles.form__success__container}>
                        <Icon Svg={SuccessIcon} width={16} height={16} />
                        <span className={styles.form__success__description}>
                            Данные подтверждены
                        </span>
                    </div>
                    <Button
                        onClick={() => {
                            dispatch(nextStep());
                        }}
                        theme={ButtonTheme.BLUE}
                        form={ButtonForm.CIRCLE}
                        className={styles.button}
                    >
                        Продолжить
                    </Button>
                </div>
            ) : (
                <Button
                    onClick={handleSubmitForm}
                    theme={ButtonTheme.BLUE}
                    form={ButtonForm.CIRCLE}
                    disabled={isButtonDisabled}
                    className={styles.button}
                >
                    Подтвердить данные
                </Button>
            )}
        </form>
    );
};

export default IdentificationProfileForm;
