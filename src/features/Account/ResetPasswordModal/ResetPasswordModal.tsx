import React, { memo, useState, useRef, useEffect, useLayoutEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Modal } from "shared/ui/Modal/Modal";
import styles from "./styles.module.scss";
import { Button, ButtonTheme } from "shared/ui/Button/Button";
import { Input } from "shared/ui/Input/Input";
import { ModalType } from "entities/ui/Modal/model/modalTypes";
import { useSelector } from "react-redux";
import { RootState } from "app/providers/store/config/store";
import { useAppDispatch } from "shared/hooks/useAppDispatch";
import {
    getUserIdThunk,
    resetPasswordThunk,
    setPasswordResetData,
    setResetCode,
} from "entities/PersonalAccount/slice/personalAccountSlice";
import { resendConfirmationCode } from "entities/RiskProfile/slice/riskProfileSlice";
import { setModalScrolled } from "entities/ui/Modal/slice/modalSlice";
import { selectModalState } from "entities/ui/Modal/selectors/selectorsModals";
import { CheckboxGroup } from "shared/ui/CheckboxGroup/CheckboxGroup";
import { setTooltipActive } from "entities/ui/Ui/slice/uiSlice";
import { Loader, LoaderSize, LoaderTheme } from "shared/ui/Loader/Loader";

interface ConfirmInfoModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const RESEND_INTERVAL = 60; // сек

export const ResetPasswordModal = memo(({ isOpen, onClose }: ConfirmInfoModalProps) => {
    const dispatch = useAppDispatch();
    const modalState = useSelector((state: RootState) => state.modal);
    const loading = useSelector((state: RootState) => state.personalAccount.loading);
    const userIdForReset = useSelector((state: RootState) => state.personalAccount.user_id);

    const [isBottom, setIsBottom] = useState(true);
    const contentRef = useRef<HTMLDivElement>(null);
    const isScrolled = useSelector((state: RootState) =>
        selectModalState(state, ModalType.RESET_PASSWORD)?.isScrolled
    );

    useLayoutEffect(() => {
        const handleScroll = () => {
            if (contentRef.current) {
                const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
                const atBottom = Math.abs(scrollTop + clientHeight - scrollHeight) < 10;
                setIsBottom(atBottom);
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
            handleScroll();
        }
        return () => {
            if (content) content.removeEventListener("scroll", handleScroll);
        };
    }, [isOpen, dispatch]);

    // выбранный метод (строка)
    const [selectedMethod, setSelectedMethod] = useState<"email" | "phone" | "whatsapp">("email");
    const [activeTab, setActiveTab] = useState<"form" | "code">("form");

    const formik = useFormik({
        initialValues: {
            contact: "",
            password: "",
            password2: "",
            type_confirm: "email",
        },
        validationSchema: Yup.object({
            contact: Yup.string()
                .required("Контакт обязателен")
                .when("type_confirm", (type_confirm, schema) => {
                    const method = Array.isArray(type_confirm) ? type_confirm[0] : type_confirm;
                    return method === "email"
                        ? schema.email("Некорректный E-mail")
                        : schema.matches(/^[+\d]+$/, "Некорректный номер телефона");
                }),
            password: Yup.string().min(8, "Пароль минимум 8 символов").required("Пароль обязателен"),
            password2: Yup.string()
                .oneOf([Yup.ref("password")], "Пароли не совпадают")
                .required("Подтверждение пароля обязательно"),
            type_confirm: Yup.string().oneOf(["email", "phone", 'whatsapp']).required(),
        }),
        onSubmit: () => { },
    });

    const handleContactChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const value = e.target.value.trim();
        formik.setFieldValue("contact", value);

        // Автодетект только если не выбран whatsapp вручную
        if (selectedMethod !== "whatsapp") {
            if (value.includes("@")) {
                handleMethodChange("email");
            } else if (/^[+\d]+$/.test(value)) {
                handleMethodChange("phone");
            }
        }
    };


    const handleMethodChange = (method: "email" | "phone" | "whatsapp") => {
        setSelectedMethod(method);
        formik.setFieldValue("type_confirm", method);
    };

    // ===== resend timer =====
    const [codeTimeLeft, setCodeTimeLeft] = useState(RESEND_INTERVAL);
    const [codeTimerActive, setCodeTimerActive] = useState(false);

    // тикер таймера
    useEffect(() => {
        if (!codeTimerActive) return;
        if (codeTimeLeft <= 0) {
            setCodeTimerActive(false);
            return;
        }
        const id = setInterval(() => {
            setCodeTimeLeft((t) => t - 1);
        }, 1000);
        return () => clearInterval(id);
    }, [codeTimerActive, codeTimeLeft]);

    useEffect(() => {
        console.log('formik.values.type_confirm', formik.values.type_confirm)
    }, [formik.values.type_confirm])

    // вход во вкладку "code" → отправляем код и запускаем таймер
    useEffect(() => {
        if (activeTab === "code" && userIdForReset) {
            dispatch(
                resendConfirmationCode({
                    user_id: userIdForReset,
                    method: selectedMethod,
                })
            );
            setCodeTimeLeft(RESEND_INTERVAL);
            setCodeTimerActive(true);
        }
    }, [activeTab, userIdForReset, selectedMethod, dispatch]);

    const handleResendClick = () => {
        if (codeTimerActive || !userIdForReset) return;
        dispatch(
            resendConfirmationCode({
                user_id: userIdForReset,
                method: selectedMethod,
            })
        );
        setCodeTimeLeft(RESEND_INTERVAL);
        setCodeTimerActive(true);
    };
    // =======================

    const handleSubmit = () => {
        if (activeTab !== "form" || !formik.isValid) return;

        const c = formik.values.contact;
        const userData =
            selectedMethod === "email"
                ? { email: c }
                : selectedMethod === "phone"
                    ? { phone: c }
                    : { whatsapp: c };
        console.log(userData)
        dispatch(
            getUserIdThunk({
                ...userData,
                onSuccess: () => setActiveTab("code"),
            })
        );
        dispatch(setPasswordResetData(formik.values));
    };


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
        if (cleanValue && index < codeLength - 1) inputRefs.current[index + 1]?.focus();
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
        for (let i = 0; i < codeLength; i++) newCode[i] = pasteValue[i] || "";
        setCodeDigits(newCode);
        const firstEmpty = pasteValue.length;
        if (firstEmpty < codeLength) inputRefs.current[firstEmpty]?.focus();
    };

    const handleCodeSubmit = () => {
        const code = codeDigits.join("");
        if (code.length === codeLength) {
            dispatch(setResetCode(code));
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

    const formatTimer = (total: number) => {
        const m = Math.floor(total / 60);
        const s = total % 60;
        return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            type={ModalType.RESET_PASSWORD}
            size={modalState[ModalType.RESET_PASSWORD].size}
            animation={modalState[ModalType.RESET_PASSWORD].animation}
            withCloseIcon
            withTitle={<span>Восстановление пароля</span>}
            titleWidth="250px"
        >
            <div
                className={`${styles.modalContent} ${isScrolled ? styles.modalContent__shadow_top : ""}`}
                style={activeTab === "code" ? {} : { paddingBottom: "88px" }}
                ref={contentRef}
            >
                {activeTab === "form" && (
                    <>
                        <span className={styles.subtitle}>
                            Для восстановления пароля, пожалуйста, введите номер телефона или E-mail, которые были
                            указаны Вами при регистрации, а также новый пароль.
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

                        <span className={styles.methodTitle}>Код подтверждения будет отправлен</span>
                        <CheckboxGroup
                            name="type_confirm"
                            label=""
                            direction="row"
                            options={[
                                { label: "Email", value: "email" },
                                { label: "SMS", value: "phone" },
                                { label: "Whatsapp", value: "whatsapp" },
                            ]}
                            greedOrFlex="flex"
                            value={selectedMethod}
                            onChange={(_name: string, next: string | string[]) => {
                                const v = Array.isArray(next) ? next.at(-1) : next; // берём последнее выбранное
                                if (v) handleMethodChange(v as "email" | "phone" | "whatsapp");
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
                                {loading ? <Loader size={LoaderSize.SMALL} theme={LoaderTheme.WHITE} /> : "Отправить"}
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

                        <div className={styles.modalContent__problems}>
                            <span
                                onClick={handleResendClick}
                                style={!codeTimerActive ? { color: "#045FDD", marginBottom: '20px', display: 'block' } : { marginBottom: '20px', display: 'block' }}
                            >
                                {codeTimerActive
                                    ? `Отправить код снова через: ${formatTimer(codeTimeLeft)}`
                                    : "Отправить код снова"}
                            </span>
                        </div>

                        <Button theme={ButtonTheme.BLUE} onClick={handleCodeSubmit} className={styles.submitButton}>
                            {loading ? <Loader size={LoaderSize.SMALL} theme={LoaderTheme.WHITE} /> : "Подтвердить код"}
                        </Button>
                    </>
                )}
            </div>
        </Modal>
    );
});
