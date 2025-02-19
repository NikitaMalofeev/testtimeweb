import React, { useEffect, useRef, useState } from "react";
import { useFormik } from "formik";
import { useDispatch } from "react-redux";
import ReCAPTCHA from "react-google-recaptcha";
import { updateFieldValue } from "entities/RiskProfile/slice/riskProfileSlice";
import { Input } from "shared/ui/Input/Input";
import { Button, ButtonTheme } from "shared/ui/Button/Button";
import styles from "./styles.module.scss";
import { useSelector } from "react-redux";
import { RootState } from "app/providers/store/config/store";
import { CheckboxGroup } from "shared/ui/CheckboxGroup/CheckboxGroup";
import { Checkbox } from "shared/ui/Checkbox/Checkbox";

export const PasportDataForm: React.FC = () => {
    const dispatch = useDispatch();
    const recaptchaRef = useRef(null);
    const gcaptchaSiteKey = import.meta.env.VITE_RANKS_GRCAPTCHA_SITE_KEY;
    const [captchaVerified, setCaptchaVerified] = useState(false);
    const userPersonalAccount = useSelector((state: RootState) => state.user.userForPersonalAccount)
    const isBottom = useSelector((state: RootState) => state.ui.isScrollToBottom);

    const formik = useFormik({
        initialValues: {
            g_recaptcha: "",
            type_sms_message: "",
            gender: userPersonalAccount?.gender,
            first_name: userPersonalAccount?.first_name,
            middle_name: userPersonalAccount?.middle_name,
            last_name: userPersonalAccount?.last_name,
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
            alert("Данные отправлены");
        },
    });

    const GenderOptions = {
        "male": 'Мужчина',
        "female": 'Женщина',
    }


    const handleTextInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        formik.setFieldValue(name, value);
        dispatch(updateFieldValue({ name, value }));
    };

    const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        let { name, value } = e.target;
        value = value.replace(/\D/g, "");
        if (value.length > 2) value = value.slice(0, 2) + "." + value.slice(2);
        if (value.length > 5) value = value.slice(0, 5) + "." + value.slice(5);
        formik.setFieldValue(name, value);
        dispatch(updateFieldValue({ name, value }));
    };


    const handleCaptchaChange = (value: string | null) => {
        formik.setFieldValue("g_recaptcha", value || "");
        setCaptchaVerified(!!value);
    };

    return (
        <form onSubmit={formik.handleSubmit} className={styles.form}>
            <Input placeholder="Фамилия" name="middle_name" type="text" value={formik.values.middle_name || ''} onChange={handleTextInputChange} needValue />
            <Input placeholder="Имя" name="first_name" type="text" value={formik.values.first_name || ''} onChange={handleDateInputChange} needValue />

            <Input placeholder="Отчество" name="last_name" type="text" value={formik.values.last_name || ''} onChange={handleTextInputChange} needValue />
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
                <Input placeholder="Серия паспорта" name="passport_series" type="text" value={formik.values.passport_series} onChange={handleTextInputChange} needValue />
                <Input placeholder="Номер паспорта" name="passport_number" type="text" value={formik.values.passport_number} onChange={handleTextInputChange} needValue />
            </div>
            <div className={styles.form__duoInputs}>
                <Input placeholder="Код подразделения" name="department_code" type="text" value={formik.values.department_code} onChange={handleTextInputChange} needValue />
                <Input placeholder="Дата выдачи паспорта" name="issue_date" type="text" value={formik.values.issue_date} onChange={handleDateInputChange} needValue />
            </div>
            <Input placeholder="Кем выдан" name="issue_whom" type="text" value={formik.values.issue_whom} onChange={handleTextInputChange} needValue />
            <Input placeholder="ИНН" name="inn" type="text" value={formik.values.inn} onChange={handleTextInputChange} needValue />

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
                    <Input placeholder="Регион/район" name="region" type="text" value={formik.values.address_residential_region} onChange={handleTextInputChange} needValue />
                    <Input placeholder="Город/населенный пункт" name="city" type="text" value={formik.values.address_residential_city} onChange={handleTextInputChange} needValue />
                    <Input placeholder="Улица" name="street" type="text" value={formik.values.address_residential_street} onChange={handleTextInputChange} needValue />
                    <div>
                        <Input placeholder="Дом" name="house" type="text" value={formik.values.address_residential_house} onChange={handleTextInputChange} needValue />
                        <Input placeholder="Квартира" name="apartment" type="text" value={formik.values.address_residential_apartment} onChange={handleTextInputChange} needValue />
                    </div>
                </div>


                <div style={{ minHeight: "74px" }}>
                    <ReCAPTCHA ref={recaptchaRef} sitekey={gcaptchaSiteKey} onChange={handleCaptchaChange} />
                </div>
                <Input placeholder="Тип SMS-сообщения" name="type_sms_message" type="text" value={formik.values.type_sms_message} onChange={handleTextInputChange} />
                <div className={`${styles.buttons} ${!isBottom ? styles.shadow : ""
                    }`}>
                    <Button type="submit" theme={ButtonTheme.BLUE} className={styles.button}>
                        Подтвердить данные
                    </Button>
                </div>
            </div>
        </form>
    );
};
