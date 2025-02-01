import React, { useState, useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import styles from "./styles.module.scss";
import { createRiskProfile } from "entities/RiskProfile/slice/riskProfileSlice";
import { Input } from "shared/ui/Input/Input";
import { useAppDispatch } from "shared/hooks/useAppDispatch";
import { Checkbox } from "shared/ui/Checkbox/Checkbox";
import { nextStep } from "entities/ui/Ui/slice/uiSlice";
import { Button, ButtonForm, ButtonTheme } from "shared/ui/Button/Button";
import { RootState } from "app/providers/store/config/store";
import { useSelector } from "react-redux";

const IdentificationProfileForm: React.FC = () => {
    const dispatch = useAppDispatch();
    const currentStep = useSelector((state: RootState) => state.ui.additionalMenu.currentStep);

    const [isButtonDisabled, setIsButtonDisabled] = useState(true);

    const formik = useFormik({
        initialValues: {
            lastName: "",
            firstName: "",
            middleName: "",
            phone: "",
            password: "",
            password2: "",
            agreement: false,
        },
        validationSchema: Yup.object({
            lastName: Yup.string().required("Фамилия обязательна"),
            firstName: Yup.string().required("Имя обязательно"),
            middleName: Yup.string().required("Отчество обязательно"),
            phone: Yup.string()
                .matches(/^\+7 \d{3} \d{3} \d{2} \d{2}$/, "Некорректный номер телефона")
                .required("Телефон обязателен"),
            password: Yup.string()
                .min(6, "Пароль минимум 6 символов")
                .required("Пароль обязателен"),
            password2: Yup.string()
                .oneOf([Yup.ref("password")], "Пароли не совпадают")
                .required("Подтверждение обязательно"),
            agreement: Yup.boolean().oneOf([true], "Необходимо согласиться с условиями"),
        }),
        validateOnMount: true,
        onSubmit: (values) => {
            dispatch(
                createRiskProfile({
                    phone: values.phone,
                    first_name: values.firstName,
                    middle_name: values.middleName,
                    last_name: values.lastName,
                    password: values.password,
                    password2: values.password2,
                    agreement: values.agreement,
                })
            );
        },
    });

    useEffect(() => {
        setIsButtonDisabled(!(formik.isValid && formik.dirty));
        console.log("Formik State:", {
            isValid: formik.isValid,
            dirty: formik.dirty,
            errors: formik.errors,
            values: formik.values,
        });
    }, [formik.isValid, formik.dirty, formik.values]);

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
                    name="agreement"
                    value={formik.values.agreement}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    label={
                        <span className={styles.checkbox__text}>
                            Вы соглашаетесь с{" "}
                            <a className={styles.checkbox__link} href="#" onClick={(e) => e.preventDefault()}>
                                Условиями использования и Политикой конфиденциальности
                            </a>
                        </span>
                    }
                    error={formik.touched.agreement && formik.errors.agreement}
                />
            </div>
            <Button
                onClick={() => dispatch(nextStep())}
                theme={ButtonTheme.BLUE}
                form={ButtonForm.CIRCLE}
                disabled={isButtonDisabled} // Используем состояние
                className={styles.button}
            >
                Подтвердить данные
            </Button>
        </form>
    );
};

export default IdentificationProfileForm;
