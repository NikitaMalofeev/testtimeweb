import React, { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useSelector } from "react-redux";
import { Input } from "shared/ui/Input/Input";
import { Button, ButtonTheme } from "shared/ui/Button/Button";
import styles from "./styles.module.scss";
import { useAppDispatch } from "shared/hooks/useAppDispatch";
import { openModal, closeModal } from "entities/ui/Modal/slice/modalSlice";
import { ModalAnimation, ModalSize, ModalType } from "entities/ui/Modal/model/modalTypes";
import { Icon } from "shared/ui/Icon/Icon";
import WhiteLogo from 'shared/assets/svg/WhiteLogo.svg';
import { useLocation } from "react-router-dom";
import { StateSchema } from "app/providers/store/config/StateSchema";
import { RiskProfileModal } from "features/RiskProfile/RiskProfileModal/RiskProfileModal";

const AuthorizationPage = () => {
    const dispatch = useAppDispatch();
    const location = useLocation();
    const [loginError, setLoginError] = useState("");

    const modalState = useSelector((state: StateSchema) => state.modal);
    const isAuthPath = location.pathname === "/auth";

    const formik = useFormik({
        initialValues: {
            identifier: "",
            password: "",
        },
        validationSchema: Yup.object({
            identifier: Yup.string()
                .matches(
                    /^(\+?[1-9]\d{1,14}|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})$/,
                    "Введите корректный email или номер телефона"
                )
                .required("Обязательное поле"),
            password: Yup.string()
                .min(6, "Минимум 6 символов")
                .required("Обязательное поле"),
        }),
        onSubmit: async (values) => {
            try {
                console.log("Авторизация", values);
            } catch (error) {
                setLoginError("Ошибка авторизации. Проверьте данные");
            }
        },
    });

    return (
        <>
            <div className={styles.auth}>
                <div className={styles.auth__container}>
                    <Icon Svg={WhiteLogo} width={73} height={73} className={styles.auth__icon} />
                    <div className={styles.auth__tabs}>
                        <div className={`${styles.auth__tab} ${isAuthPath ? styles.auth__tab_active : ""}`}>
                            Авторизация
                        </div>
                        <div
                            className={styles.auth__tab}
                            onClick={() => {
                                dispatch(openModal({
                                    type: ModalType.IDENTIFICATION,
                                    size: ModalSize.FULL,
                                    animation: ModalAnimation.LEFT
                                }));
                            }}
                        >
                            Регистрация
                        </div>
                    </div>

                    <form onSubmit={formik.handleSubmit} className={styles.authForm}>
                        <Input
                            placeholder="Email или телефон"
                            name="identifier"
                            type="text"
                            value={formik.values.identifier}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={formik.touched.identifier && formik.errors.identifier}
                            needValue
                        />
                        <Input
                            placeholder="Пароль"
                            name="password"
                            type="password"
                            value={formik.values.password}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={formik.touched.password && formik.errors.password}
                            needValue
                        />
                        {loginError && <div className={styles.errorText}>{loginError}</div>}

                        <span className={styles.forgotPassword}>Не помню пароль</span>

                        <Button
                            type="submit"
                            theme={ButtonTheme.BLUE}
                            className={styles.button}
                            disabled={!(formik.isValid && formik.dirty)}
                        >
                            Войти
                        </Button>
                    </form>
                </div>
            </div>

            {/* Модальное окно идентификации */}
            <RiskProfileModal
                isOpen={modalState.identificationModal.isOpen}
                onClose={() => dispatch(closeModal(ModalType.IDENTIFICATION))}
            />
        </>
    );
};

export default AuthorizationPage