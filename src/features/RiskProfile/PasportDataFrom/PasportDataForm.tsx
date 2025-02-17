import React, { useRef, useState } from "react";
import { useFormik } from "formik";
import { useDispatch } from "react-redux";
import ReCAPTCHA from "react-google-recaptcha";
import { updateFieldValue } from "entities/RiskProfile/slice/riskProfileSlice";
import { Input } from "shared/ui/Input/Input";
import { Button, ButtonTheme } from "shared/ui/Button/Button";
import styles from "./styles.module.scss";

export const PasportDataForm: React.FC = () => {
    const dispatch = useDispatch();
    const recaptchaRef = useRef(null);
    const gcaptchaSiteKey = import.meta.env.VITE_RANKS_GRCAPTCHA_SITE_KEY;
    const [captchaVerified, setCaptchaVerified] = useState(false);

    const formik = useFormik({
        initialValues: {
            g_recaptcha: "",
            type_sms_message: "",
            gender: "",
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
            address_residential: "",
        },
        onSubmit: (values) => {
            alert("Данные отправлены");
        },
    });

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

            {/* <Input placeholder="Пол" name="gender" type="text" value={formik.values.gender} onChange={handleTextInputChange} /> */}
            <Input placeholder="Дата рождения" name="birth_date" type="text" value={formik.values.birth_date} onChange={handleDateInputChange} />
            <Input placeholder="Место рождения" name="birth_place" type="text" value={formik.values.birth_place} onChange={handleTextInputChange} />
            <Input placeholder="Серия паспорта" name="passport_series" type="text" value={formik.values.passport_series} onChange={handleTextInputChange} />
            <Input placeholder="Номер паспорта" name="passport_number" type="text" value={formik.values.passport_number} onChange={handleTextInputChange} />
            <Input placeholder="Код подразделения" name="department_code" type="text" value={formik.values.department_code} onChange={handleTextInputChange} />
            <Input placeholder="Дата выдачи паспорта" name="issue_date" type="text" value={formik.values.issue_date} onChange={handleDateInputChange} />
            <Input placeholder="Кем выдан" name="issue_whom" type="text" value={formik.values.issue_whom} onChange={handleTextInputChange} />
            <Input placeholder="ИНН" name="inn" type="text" value={formik.values.inn} onChange={handleTextInputChange} />
            <Input placeholder="Регион" name="region" type="text" value={formik.values.region} onChange={handleTextInputChange} />
            <Input placeholder="Город" name="city" type="text" value={formik.values.city} onChange={handleTextInputChange} />
            <Input placeholder="Улица" name="street" type="text" value={formik.values.street} onChange={handleTextInputChange} />
            <Input placeholder="Дом" name="house" type="text" value={formik.values.house} onChange={handleTextInputChange} />
            <Input placeholder="Квартира" name="apartment" type="text" value={formik.values.apartment} onChange={handleTextInputChange} />
            <Input placeholder="Фактический адрес проживания" name="address_residential" type="text" value={formik.values.address_residential} onChange={handleTextInputChange} />
            <div style={{ minHeight: "74px" }}>
                <ReCAPTCHA ref={recaptchaRef} sitekey={gcaptchaSiteKey} onChange={handleCaptchaChange} />
            </div>
            <Input placeholder="Тип SMS-сообщения" name="type_sms_message" type="text" value={formik.values.type_sms_message} onChange={handleTextInputChange} />
            <Button type="submit" theme={ButtonTheme.BLUE} className={styles.button}>
                Отправить
            </Button>
        </form>
    );
};
