import React, { useEffect, useRef, useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useSelector } from "react-redux";
import { Input } from "shared/ui/Input/Input";
import { Button, ButtonTheme } from "shared/ui/Button/Button";
import styles from "./styles.module.scss";
import { useAppDispatch } from "shared/hooks/useAppDispatch";
import { Icon } from "shared/ui/Icon/Icon";
import WhiteLogo from 'shared/assets/svg/WhiteLogo.svg';
import { RootState } from "app/providers/store/config/store";
import { Loader, LoaderSize, LoaderTheme } from "shared/ui/Loader/Loader";
import { userLoginThunk } from "entities/User/slice/userSlice";
import IdentificationProfileForm from "features/RiskProfile/IdentificationForm/ui/IdentificationForm";

import { motion } from "framer-motion";
import AnimateHeightWrapper from "shared/lib/helpers/animation/AnimateHeightWrapper";


const AuthorizationPage = () => {
    const dispatch = useAppDispatch();
    const { loading } = useSelector((state: RootState) => state.user);

    const [activeTab, setActiveTab] = useState<"login" | "registration">("login");

    // Форма для авторизации
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
            // Логику отправки можно разместить здесь или вызвать handleSubmit напрямую
        },
    });

    // Обработка сабмита для авторизации
    const handleSubmit = () => {
        const { identifier, password } = formik.values;
        const isEmail = identifier.includes("@");
        if (isEmail) {
            dispatch(userLoginThunk({ email: identifier, password }));
        } else {
            dispatch(userLoginThunk({ phone: identifier, password }));
        }
    };

    const [showCrutch, setShowCrutch] = useState(true);

    useEffect(() => {
        if (activeTab === 'login') {
            setTimeout(() => setShowCrutch(false), 300); // Через 0.4s скрываем crutch
        } else {
            setShowCrutch(true); // Показываем при открытии
        }
    }, [activeTab]);



    return (
        <div className={styles.auth}>
            <AnimateHeightWrapper isOpen={activeTab === 'registration'}>
                <div className={styles.auth__wrapper}>
                    <div
                        className={`${styles.auth__container} ${activeTab === 'registration' ? styles.auth__container_extended : ''
                            }`}

                    >

                        <Icon Svg={WhiteLogo} width={73} height={73} className={styles.auth__icon} />
                        {/* Вкладки */}
                        <div className={styles.auth__tabs} >
                            {/* Анимированный «хайлайт» (чёрный фон) */}
                            <motion.div
                                className={styles.auth__activeBg}
                                // При переключении вкладок двигаем фон на 0% или 50%
                                animate={{ x: activeTab === "login" ? "0%" : "100%" }}
                                transition={{ duration: 0.4 }}
                            />
                            <div
                                className={`${styles.auth__tab} ${activeTab === 'login' ? styles.auth__tab_active : ""
                                    }`}
                                onClick={() => setActiveTab('login')}
                            >
                                Авторизация
                            </div>
                            <div
                                className={`${styles.auth__tab} ${activeTab === 'registration' ? styles.auth__tab_active : ""
                                    }`}
                                onClick={() => setActiveTab('registration')}
                            >
                                Регистрация
                            </div>
                        </div>

                        {/* Контент в зависимости от вкладки */}
                        {activeTab === 'login' && (
                            <form onSubmit={formik.handleSubmit} className={styles.auth__form}>
                                <div style={{ position: 'relative', zIndex: '5' }}>
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

                                    <Button
                                        type="button"
                                        onClick={handleSubmit}
                                        theme={ButtonTheme.BLUE}
                                        className={styles.button}
                                        disabled={!(formik.isValid && formik.dirty)}
                                    >
                                        {loading ? <Loader theme={LoaderTheme.WHITE} size={LoaderSize.SMALL} /> : 'Войти'}
                                    </Button>
                                </div>
                                {showCrutch && <div className={styles.crutch}></div>}
                            </form>
                        )}

                        {activeTab === 'registration' && (
                            <IdentificationProfileForm />
                        )}
                    </div>
                </div>
            </AnimateHeightWrapper>

        </div>
    );
};

export default AuthorizationPage;