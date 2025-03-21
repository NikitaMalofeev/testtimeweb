import React, { useEffect, useRef, useState } from "react";
import { useFormik } from "formik";
import ReCAPTCHA from "react-google-recaptcha";
import { postPasportInfo, updateFieldValue } from "entities/RiskProfile/slice/riskProfileSlice";
import { Input } from "shared/ui/Input/Input";
import { Button, ButtonTheme } from "shared/ui/Button/Button";
import styles from "./styles.module.scss";
import { useSelector } from "react-redux";
import { RootState } from "app/providers/store/config/store";
import { CheckboxGroup } from "shared/ui/CheckboxGroup/CheckboxGroup";
import { Checkbox } from "shared/ui/Checkbox/Checkbox";
import { useAppDispatch } from "shared/hooks/useAppDispatch";
import { closeModal, openModal, setCurrentConfirmModalType, setCurrentConfirmModalType2 } from "entities/ui/Modal/slice/modalSlice";
import { ModalAnimation, ModalSize, ModalType } from "entities/ui/Modal/model/modalTypes";
import { ConfirmDocsModal } from "../ConfirmDocsModal/ConfirmDocsModal";
import * as Yup from "yup";
import { Datepicker } from "shared/ui/DatePicker/DatePicker";
import { format } from "date-fns";
import { getAllUserInfoThunk, getUserPersonalAccountInfoThunk } from "entities/User/slice/userSlice";
import { Loader, LoaderSize, LoaderTheme } from "shared/ui/Loader/Loader";
import { setError } from "entities/Error/slice/errorSlice";
import { getUserDocumentsInfoThunk, getUserDocumentsStateThunk } from "entities/Documents/slice/documentsSlice";

export const PasportDataForm: React.FC = () => {
    const dispatch = useAppDispatch();
    const recaptchaRef = useRef<ReCAPTCHA | null>(null);
    const gcaptchaSiteKey = import.meta.env.VITE_RANKS_GRCAPTCHA_SITE_KEY;
    const [captchaVerified, setCaptchaVerified] = useState(false);
    const { loading, userPersonalAccountInfo } = useSelector((state: RootState) => state.user);
    const isBottom = useSelector((state: RootState) => state.ui.isScrollToBottom);
    const modalState = useSelector((state: RootState) => state.modal);
    const token = useSelector((state: RootState) => state.user.token);
    const NAME_REGEX = /^[А-Яа-яЁё\s-]+$/;

    useEffect(() => {
        dispatch(getUserPersonalAccountInfoThunk());
        dispatch(getUserDocumentsStateThunk());
        dispatch(getUserDocumentsInfoThunk());
        dispatch(getAllUserInfoThunk());
    }, []);


    // Yup-схема валидации
    const passportValidationSchema = Yup.object().shape({
        last_name: Yup.string()
            .matches(NAME_REGEX, "Только буквы, пробел и дефис")
            .min(2, "Минимум 2 символа")
            .required("Фамилия обязательна"),
        first_name: Yup.string()
            .matches(NAME_REGEX, "Только буквы, пробел и дефис")
            .min(2, "Минимум 2 символа")
            .required("Имя обязательно"),
        patronymic: Yup.string()
            .matches(NAME_REGEX, "Только буквы, пробел и дефис")
            .min(2, "Минимум 2 символа")
            .required("Отчество обязательно"),
        birth_date: Yup.date()
            .typeError("Некорректная дата")
            .required("Дата рождения обязательна"),
        birth_place: Yup.string()
            .min(2, "Минимум 2 символа")
            .required("Место рождения обязательно"),
        passport_series: Yup.string()
            .matches(/^\d{4}$/, "Серия паспорта должна содержать 4 цифры")
            .required("Серия паспорта обязательна"),
        passport_number: Yup.string()
            .matches(/^\d{6}$/, "Номер паспорта должен содержать 6 цифр")
            .required("Номер паспорта обязателен"),
        department_code: Yup.string()
            .matches(/^\d{6}$/, "Код подразделения должен содержать 6 цифр")
            .required("Код подразделения обязателен"),
        issue_date: Yup.date()
            .typeError("Некорректная дата")
            .required("Дата выдачи паспорта обязательна"),
        issue_whom: Yup.string()
            .min(2, "Минимум 2 символа")
            .required("Кем выдан паспорт обязательно"),
        inn: Yup.string()
            .matches(/^\d{12}$/, "ИНН должен содержать 12 цифр")
            .required("ИНН обязателен"),
        region: Yup.string()
            .min(2, "Минимум 2 символа")
            .required("Регион/район обязателен"),
        city: Yup.string()
            .min(2, "Минимум 2 символа")
            .required("Город/населенный пункт обязателен"),
        street: Yup.string()
            .min(2, "Минимум 2 символа")
            .required("Улица обязательна"),
        house: Yup.string()
            .required("Дом обязателен"),
        apartment: Yup.string()
            .required("Квартира обязательна"),
        type_message: Yup.string()
            .oneOf(["SMS", "EMAIL", "WHATSAPP"], "Выберите способ отправки кода")
            .required("Способ отправки кода обязателен"),
        is_receive_mail_this_address: Yup.boolean()
            .oneOf([true], "Этот пункт обязателен к соглашению"),
        g_recaptcha: Yup.string()
            .required("Пройдите проверку reCAPTCHA"),
    });

    const formik = useFormik({
        initialValues: {
            g_recaptcha: "",
            type_message: "EMAIL",
            gender: userPersonalAccountInfo?.gender || '',
            first_name: userPersonalAccountInfo?.first_name,
            last_name: userPersonalAccountInfo?.last_name,
            patronymic: userPersonalAccountInfo?.patronymic,
            birth_date: null,
            birth_place: "",
            passport_series: "",
            passport_number: "",
            department_code: "",
            issue_date: null,
            issue_whom: '',
            inn: "",
            region: "",
            city: "",
            street: "",
            house: "",
            apartment: "",
            is_live_this_address: false,
            is_receive_mail_this_address: false,
            address_residential_region: "",
            address_residential_city: "",
            address_residential_street: "",
            address_residential_house: "",
            address_residential_apartment: "",
        },
        enableReinitialize: true,
        validationSchema: passportValidationSchema,
        onSubmit: (values) => {
            dispatch(postPasportInfo({
                data: values,
                onSuccess: () => {
                    dispatch(openModal({
                        type: ModalType.CONFIRM_DOCS,
                        size: ModalSize.MIDDLE,
                        animation: ModalAnimation.LEFT
                    }));
                }
            }));
        },
    });

    const messageTypeOptions = {
        "SMS": 'SMS',
        "EMAIL": 'Email',
        "WHATSAPP": 'Whatsapp'
    };

    const GenderOptions = {
        "gender_male": 'Мужчина',
        "gender_female": 'Женщина',
    };

    // Функция, которая вызывается, если валидация не прошла
    const handleValidationFailure = () => {
        dispatch(setError('Не все поля заполнены корректно'))
        setCaptchaVerified(false);
        formik.setFieldValue("g_recaptcha", "");
        recaptchaRef.current?.reset();
    };

    // Обёртка для сабмита формы: если валидация не проходит, вызываем handleValidationFailure,
    // иначе передаём данные в onSubmit.
    const handleSubmitWrapper = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const errors = await formik.validateForm();
        // Отмечаем все поля как touched, чтобы ошибки отобразились
        formik.setTouched(
            Object.keys(formik.values).reduce((acc, key) => ({ ...acc, [key]: true }), {})
        );
        if (Object.keys(errors).length > 0) {
            handleValidationFailure();
        } else {
            formik.handleSubmit();
        }
    };

    const handleNameChange = (fieldName: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const rawValue = e.target.value;
        const sanitizedValue = rawValue.replace(/[^А-Яа-яЁё\s-]/g, "");
        formik.setFieldValue(fieldName, sanitizedValue);
    };

    const handleTextInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        formik.setFieldValue(name, value);
        dispatch(updateFieldValue({ name, value }));
    };

    /**
     * Возвращает строку в формате 'XXX-XXX'.
     * Если цифр меньше 3, возвращается как есть.
     */
    const maskDepartmentCode = (value: string) => {
        if (!value) return "";
        if (value.length <= 3) {
            return value;
        }
        return value.slice(0, 3) + "-" + value.slice(3);
    };

    const handleDepartmentCodeChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        let rawValue = e.target.value.replace(/\D/g, "");
        if (rawValue.length > 6) {
            rawValue = rawValue.slice(0, 6);
        }
        formik.setFieldValue("department_code", rawValue);
    };

    const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        let { name, value } = e.target;
        value = value.replace(/\D/g, "");
        if (value.length >= 4) value = value.slice(0, 4) + "-" + value.slice(4);
        if (value.length >= 6) value = value.slice(0, 7) + "-" + value.slice(7);
        formik.setFieldValue(name, value);
        dispatch(updateFieldValue({ name, value }));
    };




    const handleCaptchaChange = (value: string | null) => {
        formik.setFieldValue("g_recaptcha", value || "");
        setCaptchaVerified(!!value);
    };

    const handleMethodChange = (method: 'SMS' | 'EMAIL' | 'WHATSAPP') => {
        formik.setFieldValue("type_message", method);
        dispatch(setCurrentConfirmModalType2(method));
        setCaptchaVerified(false);
        formik.setFieldValue("g_recaptcha", "");
        recaptchaRef.current?.reset();
    };

    if (loading) {
        return <Loader />;
    } else {
        return (
            <>
                {/* Форма использует onSubmit={handleSubmitWrapper} */}
                <form className={styles.form} onSubmit={handleSubmitWrapper}>
                    <Input
                        placeholder="Фамилия"
                        name="last_name"
                        type="text"
                        value={formik.values.last_name || ''}
                        onChange={handleNameChange("last_name")}
                        onBlur={formik.handleBlur}
                        needValue
                        error={formik.touched.last_name && formik.errors.last_name}
                    />

                    <Input
                        placeholder="Имя"
                        name="first_name"
                        type="text"
                        value={formik.values.first_name || ''}
                        onChange={handleNameChange("first_name")}
                        onBlur={formik.handleBlur}
                        needValue
                        error={formik.touched.first_name && formik.errors.first_name}
                    />

                    <Input
                        placeholder="Отчество"
                        name="patronymic"
                        type="text"
                        value={formik.values.patronymic || ''}
                        onChange={handleNameChange("patronymic")}
                        onBlur={formik.handleBlur}
                        needValue
                        error={formik.touched.patronymic && formik.errors.patronymic}
                    />

                    <CheckboxGroup
                        name="gender"
                        label="Пол"
                        direction="row"
                        options={Object.entries(GenderOptions).map(([value, label]) => ({
                            label,
                            value,
                        }))}
                        value={formik.values.gender}
                        onChange={(name, selectedValue) => {
                            formik.setFieldValue(name, selectedValue);
                            dispatch(updateFieldValue({ name, value: selectedValue }));
                        }}
                    />

                    <Datepicker
                        value={formik.values.birth_date}
                        onChange={(date) => date && formik.setFieldValue("birth_date", format(date, 'yyyy-MM-dd'))}
                        placeholder="Дата рождения"
                        maxDate={new Date()}
                        needValue={true}
                        error={formik.touched.birth_date && formik.errors.birth_date}
                    />

                    <Input
                        placeholder="Место рождения"
                        name="birth_place"
                        type="text"
                        value={formik.values.birth_place}
                        onChange={handleTextInputChange}
                        onBlur={formik.handleBlur}
                        needValue
                        error={formik.touched.birth_place && formik.errors.birth_place}
                    />

                    <Input
                        placeholder="Серия паспорта"
                        type="number"
                        min={0}
                        max={9999}
                        maxLength={4}
                        name="passport_series"
                        value={formik.values.passport_series}
                        onChange={handleTextInputChange}
                        onBlur={formik.handleBlur}
                        needValue
                        error={formik.touched.passport_series && formik.errors.passport_series}
                    />

                    <Input
                        placeholder="Номер паспорта"
                        type="number"
                        maxLength={6}
                        min={0}
                        max={999999}
                        name="passport_number"
                        value={formik.values.passport_number}
                        onChange={handleTextInputChange}
                        onBlur={formik.handleBlur}
                        needValue
                        error={formik.touched.passport_number && formik.errors.passport_number}
                    />

                    <Input
                        placeholder="Код подразделения"
                        name="department_code"
                        type="text"
                        value={maskDepartmentCode(formik.values.department_code)}
                        onChange={handleDepartmentCodeChange}
                        onBlur={formik.handleBlur}
                        needValue
                        error={formik.touched.department_code && formik.errors.department_code}
                    />

                    <Input
                        placeholder="Кем выдан"
                        name="issue_whom"
                        type="text"
                        value={formik.values.issue_whom}
                        onChange={handleTextInputChange}
                        onBlur={formik.handleBlur}
                        needValue
                        error={formik.touched.issue_whom && formik.errors.issue_whom}
                    />

                    <Input
                        placeholder="ИНН"
                        name="inn"
                        type="number"
                        min={0}
                        max={999999999999}
                        maxLength={12}
                        value={formik.values.inn}
                        onChange={handleTextInputChange}
                        onBlur={formik.handleBlur}
                        needValue
                        error={formik.touched.inn && formik.errors.inn}
                    />

                    <Datepicker
                        value={formik.values.issue_date}
                        onChange={(date) => date && formik.setFieldValue("issue_date", format(date, 'yyyy-MM-dd'))}
                        needValue={true}
                        placeholder="Дата выдачи"
                        maxDate={new Date()}
                        error={formik.touched.issue_date && formik.errors.issue_date}
                    />

                    <div>
                        <h2 className={styles.form__subtitle}>Адрес регистрации</h2>

                        <Input
                            placeholder="Регион/район"
                            name="region"
                            type="text"
                            value={formik.values.region}
                            onChange={handleTextInputChange}
                            onBlur={formik.handleBlur}
                            needValue
                            error={formik.touched.region && formik.errors.region}
                        />
                        <Input
                            placeholder="Город/населенный пункт"
                            name="city"
                            type="text"
                            value={formik.values.city}
                            onChange={handleTextInputChange}
                            onBlur={formik.handleBlur}
                            needValue
                            error={formik.touched.city && formik.errors.city}
                        />
                        <Input
                            placeholder="Улица"
                            name="street"
                            type="text"
                            value={formik.values.street}
                            onChange={handleTextInputChange}
                            onBlur={formik.handleBlur}
                            needValue
                            error={formik.touched.street && formik.errors.street}
                        />
                        <div className={styles.form__duoInputs}>
                            <Input
                                placeholder="Дом/корпус"
                                name="house"
                                type="text"
                                value={formik.values.house}
                                onChange={handleTextInputChange}
                                onBlur={formik.handleBlur}
                                needValue
                                error={formik.touched.house && formik.errors.house}
                            />
                            <Input
                                placeholder="Квартира"
                                name="apartment"
                                type="text"
                                value={formik.values.apartment}
                                onChange={handleTextInputChange}
                                onBlur={formik.handleBlur}
                                needValue
                                error={formik.touched.apartment && formik.errors.apartment}
                            />
                        </div>
                    </div>

                    <Checkbox
                        name="is_live_this_address"
                        value={formik.values.is_live_this_address}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        label={<span className={styles.checkbox__text}>Живу по этому адресу</span>}
                        error={formik.touched.is_live_this_address && formik.errors.is_live_this_address}
                    />
                    <Checkbox
                        name="is_receive_mail_this_address"
                        value={formik.values.is_receive_mail_this_address}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        label={<span className={styles.checkbox__text}>Получать почту по этому адресу</span>}
                        error={formik.touched.is_receive_mail_this_address && formik.errors.is_receive_mail_this_address}
                    />

                    {!formik.values.is_live_this_address && (
                        <div>
                            <h2 className={styles.form__subtitle}>Адрес проживания</h2>
                            <Input
                                placeholder="Регион/район"
                                name="address_residential_region"
                                type="text"
                                value={formik.values.address_residential_region}
                                onChange={handleTextInputChange}
                                onBlur={formik.handleBlur}
                                error={formik.touched.address_residential_region && formik.errors.address_residential_region}
                            />
                            <Input
                                placeholder="Город/населенный пункт"
                                name="address_residential_city"
                                type="text"
                                value={formik.values.address_residential_city}
                                onChange={handleTextInputChange}
                                onBlur={formik.handleBlur}
                                error={formik.touched.address_residential_city && formik.errors.address_residential_city}
                            />
                            <Input
                                placeholder="Улица"
                                name="address_residential_street"
                                type="text"
                                value={formik.values.address_residential_street}
                                onChange={handleTextInputChange}
                                onBlur={formik.handleBlur}
                                error={formik.touched.address_residential_street && formik.errors.address_residential_street}
                            />
                            <div className={styles.form__duoInputs}>
                                <Input
                                    placeholder="Дом/корпус"
                                    name="address_residential_house"
                                    type="text"
                                    value={formik.values.address_residential_house}
                                    onChange={handleTextInputChange}
                                    onBlur={formik.handleBlur}
                                    error={formik.touched.address_residential_house && formik.errors.address_residential_house}
                                />
                                <Input
                                    placeholder="Квартира"
                                    name="address_residential_apartment"
                                    type="text"
                                    value={formik.values.address_residential_apartment}
                                    onChange={handleTextInputChange}
                                    onBlur={formik.handleBlur}
                                    error={formik.touched.address_residential_apartment && formik.errors.address_residential_apartment}
                                />
                            </div>
                        </div>
                    )}

                    {formik.values.is_live_this_address && !formik.values.is_receive_mail_this_address && (
                        <div>
                            <h2 className={styles.form__subtitle}>Почтовый адрес</h2>
                            <Input
                                placeholder="Регион/район"
                                name="address_residential_region"
                                type="text"
                                value={formik.values.address_residential_region}
                                onChange={handleTextInputChange}
                                onBlur={formik.handleBlur}
                                error={formik.touched.address_residential_region && formik.errors.address_residential_region}
                            />
                            <Input
                                placeholder="Город/населенный пункт"
                                name="address_residential_city"
                                type="text"
                                value={formik.values.address_residential_city}
                                onChange={handleTextInputChange}
                                onBlur={formik.handleBlur}
                                error={formik.touched.address_residential_city && formik.errors.address_residential_city}
                            />
                            <Input
                                placeholder="Улица"
                                name="address_residential_street"
                                type="text"
                                value={formik.values.address_residential_street}
                                onChange={handleTextInputChange}
                                onBlur={formik.handleBlur}
                                error={formik.touched.address_residential_street && formik.errors.address_residential_street}
                            />
                            <div className={styles.form__duoInputs}>
                                <Input
                                    placeholder="Дом/корпус"
                                    name="address_residential_house"
                                    type="text"
                                    value={formik.values.address_residential_house}
                                    onChange={handleTextInputChange}
                                    onBlur={formik.handleBlur}
                                    error={formik.touched.address_residential_house && formik.errors.address_residential_house}
                                />
                                <Input
                                    placeholder="Квартира"
                                    name="address_residential_apartment"
                                    type="text"
                                    value={formik.values.address_residential_apartment}
                                    onChange={handleTextInputChange}
                                    onBlur={formik.handleBlur}
                                    error={formik.touched.address_residential_apartment && formik.errors.address_residential_apartment}
                                />
                            </div>
                        </div>
                    )}

                    <span className={styles.method__title}>Куда отправить код</span>
                    <div className={styles.method}>
                        <CheckboxGroup
                            name="type_message"
                            label=""
                            direction="row"
                            options={Object.entries(messageTypeOptions).map(([value, label]) => ({
                                label,
                                value,
                            }))}
                            value={formik.values.type_message}
                            onChange={(name, selectedValue) => {
                                handleMethodChange(selectedValue as 'SMS' | 'EMAIL' | 'WHATSAPP');
                            }}
                        />
                    </div>

                    <div style={{ minHeight: "74px", marginTop: '20px' }}>
                        <ReCAPTCHA ref={recaptchaRef} sitekey={gcaptchaSiteKey} onChange={handleCaptchaChange} />
                    </div>

                    <div className={`${styles.buttons} ${!isBottom ? styles.shadow : ""}`}>
                        <Button type="submit" theme={ButtonTheme.BLUE} className={styles.button} disabled={!captchaVerified}>
                            {loading ? <Loader theme={LoaderTheme.WHITE} size={LoaderSize.SMALL} /> : 'Подтвердить данные'}
                        </Button>
                    </div>
                </form>
                <ConfirmDocsModal
                    lastData={{ type_message: formik.values.type_message, type_document: 'type_doc_passport', is_agree: formik.values.g_recaptcha.length > 0 }}
                    isOpen={modalState.confirmDocsModal.isOpen}
                    onClose={() => {
                        dispatch(closeModal(ModalType.CONFIRM_DOCS));
                    }}
                    docsType="type_doc_passport"
                />
            </>
        );
    }
};
