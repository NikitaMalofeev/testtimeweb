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
import { userLoginThunk } from "entities/User/slice/userSlice";
import { Loader, LoaderSize, LoaderTheme } from "shared/ui/Loader/Loader";
import { RootState } from "app/providers/store/config/store";

const AuthorizationPage = () => {
    const dispatch = useAppDispatch();
    const location = useLocation();

    const modalState = useSelector((state: StateSchema) => state.modal);
    const { loading } = useSelector((state: RootState) => state.user);
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
                    "Введите корректные данные"
                )
                .required("Введите почту/телефон"),
            password: Yup.string()
                .min(8, "Минимум 8 символов")
                .required("Введите пароль"),
        }),
        onSubmit: async (values) => {
        },
    });

    const handleSubmit = () => {
        const { identifier, password } = formik.values;
        const isEmail = identifier.includes("@");
        if (isEmail) {
            dispatch(userLoginThunk({
                email: identifier,
                password
            }));
        } else {
            dispatch(userLoginThunk({
                phone: identifier,
                password
            }));
        }

    };

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

                    <form onSubmit={formik.handleSubmit} className={styles.auth__form}>
                        <Input
                            autoComplete="new-password"
                            placeholder="Email/телефон"
                            name="identifier"
                            type="text"
                            value={formik.values.identifier}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={formik.touched.identifier && formik.errors.identifier}
                            needValue
                        />
                        <Input
                            autoComplete="new-password"
                            placeholder="Пароль"
                            name="password"
                            type="password"
                            value={formik.values.password}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={formik.touched.password && formik.errors.password}
                            needValue
                        />

                        {/* <span className={styles.forgotPassword}>Не помню пароль</span> */}

                        <Button
                            type="button"
                            onClick={handleSubmit}
                            theme={ButtonTheme.BLUE}
                            className={styles.button}
                            disabled={!(formik.isValid && formik.dirty)}
                        >
                            {loading ? <Loader theme={LoaderTheme.WHITE} size={LoaderSize.SMALL} /> : 'Войти'}
                        </Button>
                    </form>
                </div>
            </div>
        </>
    );
};

export default AuthorizationPage