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

export const PasportDataForm: React.FC = () => {
    const dispatch = useAppDispatch();
    const recaptchaRef = useRef<ReCAPTCHA | null>(null);
    const gcaptchaSiteKey = import.meta.env.VITE_RANKS_GRCAPTCHA_SITE_KEY;
    const [captchaVerified, setCaptchaVerified] = useState(false);
    const userPersonalAccount = useSelector((state: RootState) => state.user.userForPersonalAccount);
    const isBottom = useSelector((state: RootState) => state.ui.isScrollToBottom);
    const modalState = useSelector((state: RootState) => state.modal);

    const formik = useFormik({
        initialValues: {
            g_recaptcha: "",
            type_message: "EMAIL",
            gender: userPersonalAccount?.gender,
            first_name: userPersonalAccount?.first_name,
            last_name: userPersonalAccount?.last_name,
            patronymic: userPersonalAccount?.patronymic,
            birth_date: "",
            birth_place: "",
            passport_series: "",
            passport_number: "",
            department_code: "",
            issue_date: "",
            issue_whom: "",
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
        onSubmit: (values) => {
        },
    });

    const messageTypeOptions = {
        "SMS": 'SMS',
        "EMAIL": 'Email',
        "WHATSAPP": 'Whatsapp'
    }

    const GenderOptions = {
        "gender_male": 'Мужчина',
        "gender_female": 'Женщина',
    }

    const handleSubmit = () => {
        dispatch(postPasportInfo({
            data: formik.values, onSuccess: () => {
                dispatch(openModal({ type: ModalType.CONFIRM_DOCS, size: ModalSize.MIDDLE, animation: ModalAnimation.LEFT }))
            }
        }))
    }

    useEffect(() => {
        console.log(userPersonalAccount)
    }, [userPersonalAccount])


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

        // Если цифр 3 или меньше – просто возвращаем
        if (value.length <= 3) {
            return value;
        }

        // Если цифр больше 3, вставляем дефис после 3-й
        return value.slice(0, 3) + "-" + value.slice(3);
    };

    const handleDepartmentCodeChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        let rawValue = e.target.value.replace(/\D/g, ""); // Убираем всё, кроме цифр

        // Если хотите ограничить 6ю цифрами – обрезаем
        if (rawValue.length > 6) {
            rawValue = rawValue.slice(0, 6);
        }

        // Сохраняем "чистую" строку без дефисов во Formik
        formik.setFieldValue("department_code", rawValue);
    };



    // const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    //     let { name, value } = e.target;
    //     value = value.replace(/\D/g, "");
    //     if (value.length > 2) value = value.slice(0, 2) + "." + value.slice(2);
    //     if (value.length > 5) value = value.slice(0, 5) + "." + value.slice(5);
    //     formik.setFieldValue(name, value);
    //     dispatch(updateFieldValue({ name, value }));
    // };

    const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        let { name, value } = e.target;
        value = value.replace(/\D/g, ""); // Удаляем все нецифровые символы

        // Форматируем в YYYY-MM-DD
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
        formik.setFieldValue("type_message", `${method}`)
        dispatch(setCurrentConfirmModalType2(method))
        // Сбрасываем капчу и статус верификации
        setCaptchaVerified(false);
        formik.setFieldValue("g_recaptcha", "");
        recaptchaRef.current?.reset();
    };


    return (
        <>
            <form className={styles.form}>
                <Input placeholder="Фамилия" name="last_name" type="text" value={formik.values.last_name || ''} onChange={handleTextInputChange} needValue />
                <Input placeholder="Имя" name="first_name" type="text" value={formik.values.first_name || ''} onChange={handleTextInputChange} needValue />

                <Input placeholder="Отчество" name="patronymic" type="text" value={formik.values.patronymic || ''} onChange={handleTextInputChange} needValue />
                <CheckboxGroup
                    name='gender'
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
                <Input placeholder="Дата рождения" name="birth_date" type="text" value={formik.values.birth_date} onChange={handleDateInputChange} needValue />
                <Input placeholder="Место рождения" name="birth_place" type="text" value={formik.values.birth_place} onChange={handleTextInputChange} needValue />
                <div className={styles.form__duoInputs}>
                    <Input placeholder="Серия паспорта" type="number" maxLength={4} name="passport_series" value={formik.values.passport_series} onChange={handleTextInputChange} needValue />
                    <Input placeholder="Номер паспорта" type="number" maxLength={6} name="passport_number" value={formik.values.passport_number} onChange={handleTextInputChange} needValue />
                </div>

                <Input
                    placeholder="Код подразделения"
                    name="department_code"
                    type="text"
                    value={maskDepartmentCode(formik.values.department_code)}
                    onChange={handleDepartmentCodeChange}
                    needValue
                />



                <Input placeholder="Кем выдан" name="issue_whom" type="text" value={formik.values.issue_whom} onChange={handleTextInputChange} needValue />
                <div className={styles.form__duoInputs}>
                    <Input placeholder="ИНН" name="inn" type="number" maxLength={12} value={formik.values.inn} onChange={handleTextInputChange} needValue />
                    <Input placeholder="Дата выдачи" name="issue_date" type="text" value={formik.values.issue_date} onChange={handleDateInputChange} needValue />
                </div>
                <div>
                    <h2 className={styles.form__subtitle}>Адрес регистрации</h2>

                    <Input placeholder="Регион/район" name="region" type="text" value={formik.values.region} onChange={handleTextInputChange} needValue />
                    <Input placeholder="Город/населенный пункт" name="city" type="text" value={formik.values.city} onChange={handleTextInputChange} needValue />
                    <Input placeholder="Улица" name="street" type="text" value={formik.values.street} onChange={handleTextInputChange} needValue />
                    <div className={styles.form__duoInputs}>
                        <Input placeholder="Дом" name="house" type="text" value={formik.values.house} onChange={handleTextInputChange} needValue />
                        <Input placeholder="Квартира" name="apartment" type="text" value={formik.values.apartment} onChange={handleTextInputChange} needValue />
                    </div>
                    <Checkbox
                        name="is_live_this_address"
                        value={formik.values.is_live_this_address}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        label={
                            <span className={styles.checkbox__text}>
                                Живу по этому адресу
                            </span>
                        }
                        error={formik.touched.is_live_this_address && formik.errors.is_live_this_address}
                    />
                    <Checkbox
                        name="is_receive_mail_this_address"
                        value={formik.values.is_receive_mail_this_address}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        label={
                            <span className={styles.checkbox__text}>
                                Получать почту по этому адресу
                            </span>
                        }
                        error={formik.touched.is_receive_mail_this_address && formik.errors.is_receive_mail_this_address}
                    />

                    <div>
                        <h2 className={styles.form__subtitle}>Адрес проживания</h2>
                        <Input placeholder="Регион/район" name="address_residential_region" type="text" value={formik.values.address_residential_region} onChange={handleTextInputChange} needValue />
                        <Input placeholder="Город/населенный пункт" name="address_residential_city" type="text" value={formik.values.address_residential_city} onChange={handleTextInputChange} needValue />
                        <Input placeholder="Улица" name="address_residential_street" type="text" value={formik.values.address_residential_street} onChange={handleTextInputChange} needValue />
                        <div className={styles.form__duoInputs}>
                            <Input placeholder="Дом" name="address_residential_house" type="text" value={formik.values.address_residential_house} onChange={handleTextInputChange} needValue />
                            <Input placeholder="Квартира" name="address_residential_apartment" type="text" value={formik.values.address_residential_apartment} onChange={handleTextInputChange} needValue />
                        </div>
                    </div>
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

                    <div className={`${styles.buttons} ${!isBottom ? styles.shadow : ""
                        }`}>
                        <Button onClick={handleSubmit} theme={ButtonTheme.BLUE} className={styles.button} disabled={!(formik.isValid && formik.dirty && captchaVerified)}>
                            Подтвердить данные
                        </Button>
                    </div>
                </div>
            </form >
            <ConfirmDocsModal isOpen={modalState.confirmDocsModal.isOpen} onClose={() => { dispatch(closeModal(ModalType.CONFIRM_DOCS)) }} docsType="type_doc_passport" />
        </>
    );
};
