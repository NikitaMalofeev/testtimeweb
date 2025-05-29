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
import { ResetPasswordModal } from "features/Account/ResetPasswordModal/ResetPasswordModal";
import { closeModal, openModal } from "entities/ui/Modal/slice/modalSlice";
import { ModalAnimation, ModalSize, ModalType } from "entities/ui/Modal/model/modalTypes";
import { useNavigate } from "react-router-dom";
import { useDevice } from "shared/hooks/useDevice";

const AuthorizationPage = () => {
    const dispatch = useAppDispatch();
    const { loading } = useSelector((state: RootState) => state.user);
    const [activeTab, setActiveTab] = useState<"login" | "registration">("login");
    const ModalState = useSelector((state: RootState) => state.modal.resetPassword)
    const navigate = useNavigate()
    const deviceSize = useDevice();

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
            dispatch(userLoginThunk({ data: { email: identifier, password }, onSuccess: () => navigate('/lk') }));
        } else {
            dispatch(userLoginThunk({ data: { phone: identifier, password }, onSuccess: () => navigate('/lk') }));
        }
    };

    // Используем ref для управления видимостью элемента "crutch"
    const crutchRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (activeTab === 'login') {
            if (crutchRef.current) {
                // Сразу показываем элемент без задержки
                crutchRef.current.style.display = "block";
            }
            setTimeout(() => {
                if (crutchRef.current) {
                    crutchRef.current.style.display = "none";
                }
            }, 400); // скрыть через 400 мс
        } else {
            if (crutchRef.current) {
                crutchRef.current.style.display = "none";
            }
        }
    }, [activeTab]);

    return (
        <>
            <div className={styles.auth}>
                <AnimateHeightWrapper isOpen={activeTab === 'registration'} minHeight={deviceSize === 'desktop' ? '662px' : '500px'}>
                    <div className={styles.auth__wrapper}>
                        <div
                            className={`${styles.auth__container} ${activeTab === 'registration' ? styles.auth__container_extended : ''}`}
                        >
                            <Icon Svg={WhiteLogo} width={73} height={73} className={styles.auth__icon} />
                            {/* Вкладки */}
                            <div className={styles.auth__tabs}>
                                {/* Анимированный «хайлайт» (чёрный фон) */}
                                <motion.div
                                    className={styles.auth__activeBg}
                                    animate={{ x: activeTab === "login" ? "0%" : "100%" }}
                                    transition={{ duration: 0.4 }}
                                />
                                <div
                                    className={`${styles.auth__tab} ${activeTab === 'login' ? styles.auth__tab_active : ""}`}
                                    onClick={() => setActiveTab('login')}
                                >
                                    Авторизация
                                </div>
                                <div
                                    className={`${styles.auth__tab} ${activeTab === 'registration' ? styles.auth__tab_active : ""}`}
                                    onClick={() => setActiveTab('registration')}
                                >
                                    Регистрация
                                </div>

                            </div>

                            {/* Контент в зависимости от вкладки */}
                            {activeTab === 'login' && (
                                <form onSubmit={formik.handleSubmit} className={styles.auth__form}>
                                    <div className={styles.auth__form__container}>
                                        <div>
                                            <Input
                                                autoComplete="new-password"
                                                placeholder="Email/телефон +7"
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
                                        </div>

                                        <div>
                                            <div className={styles.resetPassword} onClick={() => {
                                                dispatch(openModal({ type: ModalType.RESET_PASSWORD, animation: ModalAnimation.BOTTOM, size: ModalSize.MC }))
                                            }}>Не помню пароль</div>

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
                                    </div>

                                    {/* Элемент crutch всегда отрисовывается, но изначально скрыт */}
                                    <div ref={crutchRef} className={styles.crutch} style={{ display: "none" }}></div>
                                </form>
                            )}

                            {activeTab === 'registration' && (
                                <IdentificationProfileForm />
                            )}
                        </div>
                    </div>
                </AnimateHeightWrapper>
            </div>
            <ResetPasswordModal isOpen={ModalState.isOpen} onClose={() => {
                dispatch(closeModal(ModalType.RESET_PASSWORD))
            }} />
        </>
    );
};

export default AuthorizationPage;
