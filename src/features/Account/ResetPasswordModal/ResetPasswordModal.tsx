import React, { memo, useState, useRef, useEffect, useLayoutEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Modal } from "shared/ui/Modal/Modal";
import styles from "./styles.module.scss";
import { Button, ButtonTheme } from "shared/ui/Button/Button";
import { Input } from "shared/ui/Input/Input";
import { ModalAnimation, ModalSize, ModalType } from "entities/ui/Modal/model/modalTypes";
import { useSelector } from "react-redux";
import { RootState } from "app/providers/store/config/store";
import { useAppDispatch } from "shared/hooks/useAppDispatch";
import {
    getUserIdThunk,
    resetPasswordThunk,
    setPasswordResetData,
    setResetCode
} from "entities/PersonalAccount/slice/personalAccountSlice";
import { resendConfirmationCode } from "entities/RiskProfile/slice/riskProfileSlice";
import { setModalScrolled, openModal } from "entities/ui/Modal/slice/modalSlice";
import { selectModalState } from "entities/ui/Modal/selectors/selectorsModals";
import { CheckboxGroup } from "shared/ui/CheckboxGroup/CheckboxGroup";
import { setTooltipActive } from "entities/ui/Ui/slice/uiSlice";
import { Loader, LoaderSize, LoaderTheme } from "shared/ui/Loader/Loader";

interface ConfirmInfoModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ResetPasswordModal = memo(({ isOpen, onClose }: ConfirmInfoModalProps) => {
    const dispatch = useAppDispatch();
    // Используем наш новый ключ под ResetPassword – в store он должен быть.
    const modalState = useSelector((state: RootState) => state.modal);
    const loading = useSelector((state: RootState) => state.personalAccount.loading);
    const userIdForReset = useSelector((state: RootState) => state.personalAccount.user_id);
    const [isBottom, setIsBottom] = useState(false);
    /**
     * =============== ЛОГИКА ОТСЛЕЖИВАНИЯ ПРОКРУТКИ ===============
     */
    const contentRef = useRef<HTMLDivElement>(null);

    // Забираем из store текущее значение isScrolled для нужного типа модалки
    const isScrolled = useSelector((state: RootState) =>
        selectModalState(state, ModalType.RESET_PASSWORD)?.isScrolled
    );

    useLayoutEffect(() => {
        const handleScroll = () => {
            if (contentRef.current) {
                const { scrollTop, scrollHeight, clientHeight } = contentRef.current;

                // Проверяем, находится ли пользователь внизу
                const atBottom = Math.abs(scrollTop + clientHeight - scrollHeight) < 1;
                setIsBottom(atBottom); // Обновляем состояние

                // Проверяем, прокручен ли контент сверху
                dispatch(
                    setModalScrolled({
                        type: ModalType.RESET_PASSWORD,
                        isScrolled: scrollTop > 0,
                    })
                );
            }
        };

        const content = contentRef.current;
        if (content) {
            content.addEventListener("scroll", handleScroll);
            handleScroll(); // проверка положения скролла при первом рендере
        }

        return () => {
            if (content) {
                content.removeEventListener("scroll", handleScroll);
            }
        };
    }, [dispatch]);
    /**
     * ===========================================================
     */

    // Выбор способа отправки кода
    const [selectedMethod, setSelectedMethod] = useState<"email" | "phone">("email");
    // Локальная вкладка: форма или ввод кода
    const [activeTab, setActiveTab] = useState<"form" | "code">("form");

    // Формик для вкладки "form"
    const formik = useFormik({
        initialValues: {
            contact: "",
            password: "",
            password2: "",
            type_confirm: "email"
        },
        validationSchema: Yup.object({
            contact: Yup.string()
                .required("Контакт обязателен")
                .email("Некорректный E-mail"),
            password: Yup.string()
                .min(8, "Пароль минимум 8 символов")
                .required("Пароль обязателен"),
            password2: Yup.string()
                .oneOf([Yup.ref("password")], "Пароли не совпадают")
                .required("Подтверждение пароля обязательно"),
        }),
        onSubmit: () => {
            // Вся логика отправки у нас ниже, внутри handleSubmit
        },
    });

    const handleContactChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const value = e.target.value.trim();
        formik.setFieldValue("contact", value);

        // Определяем метод (email/phone) по наличию "@" или цифр
        if (value.includes("@")) {
            handleMethodChange("email");
        } else if (/^[+\d]+$/.test(value)) {
            handleMethodChange("phone");
        }
    };

    const handleMethodChange = (method: "email" | "phone") => {
        setSelectedMethod(method);
        formik.setFieldValue("type", method);
    };

    const handleSubmit = () => {
        if (activeTab === "form") {
            if (!formik.isValid) return;

            const userData =
                selectedMethod === "phone"
                    ? { phone: formik.values.contact }
                    : { email: formik.values.contact };

            // Запрашиваем user_id
            dispatch(
                getUserIdThunk({
                    ...userData,
                    onSuccess: () => {
                        // Если нашло, переходим на ввод кода
                        setActiveTab("code");
                    },
                })
            );

            // Сохраняем данные для сброса (пароли, контакт и т.п.)
            dispatch(setPasswordResetData(formik.values));
        }
    };

    // Если появился userId, автоматически отправляем код подтверждения
    useEffect(() => {
        if (userIdForReset) {
            dispatch(
                resendConfirmationCode({
                    user_id: userIdForReset,
                    method: selectedMethod,
                })
            );
        }
    }, [userIdForReset, dispatch, selectedMethod]);

    /**
     *  Вкладка "code"
     */
    const codeLength = 4;
    const [codeDigits, setCodeDigits] = useState<string[]>(Array(codeLength).fill(""));
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const handleDigitChange = (value: string, index: number) => {
        const cleanValue = value.slice(0, 1);
        setCodeDigits((prev) => {
            const next = [...prev];
            next[index] = cleanValue;
            return next;
        });
        if (cleanValue && index < codeLength - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === "Backspace" && !codeDigits[index] && index > 0) {
            setCodeDigits((prev) => {
                const next = [...prev];
                next[index - 1] = "";
                return next;
            });
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pasteData = e.clipboardData.getData("text");
        const pasteValue = pasteData.slice(0, codeLength).split("");
        const newCode = [...codeDigits];

        for (let i = 0; i < codeLength; i++) {
            newCode[i] = pasteValue[i] || "";
        }
        setCodeDigits(newCode);

        // Фокус на первое пустое поле
        const firstEmpty = pasteValue.length;
        if (firstEmpty < codeLength) {
            inputRefs.current[firstEmpty]?.focus();
        }
    };

    const handleCodeSubmit = () => {
        const code = codeDigits.join("");
        if (code.length === codeLength) {
            dispatch(setResetCode(code));
            // Отправляем финальный запрос на сброс пароля
            dispatch(
                resetPasswordThunk({
                    onSuccess: () => {
                        dispatch(
                            setTooltipActive({
                                active: true,
                                message: `Пароль для аккаунта ${formik.values.contact} успешно сменен`,
                            })
                        );
                        onClose();
                    },
                })
            );
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            // важный момент: используем ModalType.RESET_PASSWORD
            type={ModalType.RESET_PASSWORD}
            size={modalState[ModalType.RESET_PASSWORD].size}
            animation={modalState[ModalType.RESET_PASSWORD].animation}
            withCloseIcon
            withTitle="Восстановление пароля"
            titleWidth="250px"
        >
            {/* 
              Оборачиваем ВСЁ содержимое в единый скролл-контейнер 
              + вешаем динамический класс для тени 
            */}
            <div
                className={`
                    ${styles.modalContent}
                    ${isScrolled ? styles.modalContent__shadow_top : ""}
                `}
                style={activeTab === 'code' ? {} : { paddingBottom: '88px' }}
                ref={contentRef}

            >
                {activeTab === "form" && (
                    <>
                        <span className={styles.subtitle}>
                            Укажите e-mail или телефон, с которого была регистрация, и новый пароль
                        </span>

                        <Input
                            name="contact"
                            autoComplete="new-password"
                            placeholder="E-mail или Телефон"
                            value={formik.values.contact}
                            onChange={handleContactChange}
                            onBlur={formik.handleBlur}
                            error={formik.touched.contact && formik.errors.contact}
                        />

                        <Input
                            type="password"
                            name="password"
                            autoComplete="new-password"
                            placeholder="Новый пароль"
                            value={formik.values.password}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={formik.touched.password && formik.errors.password}
                        />

                        <Input
                            type="password"
                            name="password2"
                            autoComplete="new-password"
                            placeholder="Повторите пароль"
                            value={formik.values.password2}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={formik.touched.password2 && formik.errors.password2}
                        />

                        <span className={styles.methodTitle}>
                            Куда отправить код подтверждения
                        </span>
                        <CheckboxGroup
                            name="type"
                            label=""
                            direction="row"
                            options={[
                                { label: "Email", value: "email" },
                                { label: "SMS", value: "phone" },
                            ]}
                            value={selectedMethod}
                            onChange={() => {
                                // Если хотите ручную смену - можно реализовать
                                // Пока автодетект через handleContactChange
                            }}
                        />

                        <div className={`${styles.button} ${!isBottom ? styles.shadow : ""}`}>
                            <Button
                                theme={ButtonTheme.BLUE}
                                type="button"
                                onClick={handleSubmit}
                                disabled={!(formik.isValid && formik.dirty)}
                                className={styles.submitButton}
                            >
                                {loading ? (
                                    <Loader size={LoaderSize.SMALL} theme={LoaderTheme.WHITE} />
                                ) : (
                                    "Отправить"
                                )}
                            </Button>
                        </div>
                    </>
                )}

                {activeTab === "code" && (
                    <>
                        <span className={styles.subtitle}>
                            {selectedMethod === "email"
                                ? "Введите код подтверждения, который мы отправили на e-mail:"
                                : "Введите код подтверждения, который мы отправили на телефон:"}
                            <br />
                            <b>{formik.values.contact}</b>
                        </span>

                        <div className={styles.codeInput__container}>
                            {codeDigits.map((digit, index) => (
                                <input
                                    key={`code-${index}`}
                                    type="text"
                                    maxLength={1}
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    value={digit}
                                    onChange={(e) => handleDigitChange(e.target.value, index)}
                                    onKeyDown={(e) => handleKeyDown(e, index)}
                                    onPaste={handlePaste}
                                    ref={(el) => (inputRefs.current[index] = el)}
                                    className={styles.codeInput__box}
                                />
                            ))}
                        </div>

                        <Button
                            theme={ButtonTheme.BLUE}
                            onClick={handleCodeSubmit}
                            className={styles.submitButton}
                        >
                            {loading ? (
                                <Loader size={LoaderSize.SMALL} theme={LoaderTheme.WHITE} />
                            ) : (
                                "Подтвердить код"
                            )}
                        </Button>
                    </>
                )}
            </div>
        </Modal>
    );
});
