import React, { memo, useState, useRef, useEffect } from "react";
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
import { getUserIdThunk, resetPasswordThunk, setPasswordResetData, setResetCode } from "entities/PersonalAccount/slice/personalAccountSlice";
import { resendConfirmationCode } from "entities/RiskProfile/slice/riskProfileSlice";
import { openModal } from "entities/ui/Modal/slice/modalSlice";
import { CheckboxGroup } from "shared/ui/CheckboxGroup/CheckboxGroup";
import { setTooltipActive } from "entities/ui/Ui/slice/uiSlice";
import { Loader, LoaderSize, LoaderTheme } from "shared/ui/Loader/Loader";

interface ConfirmInfoModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ResetPasswordModal = memo(({ isOpen, onClose }: ConfirmInfoModalProps) => {
    const dispatch = useAppDispatch();
    const modalState = useSelector((state: RootState) => state.modal);
    const loading = useSelector((state: RootState) => state.personalAccount.loading);
    const userIdForReset = useSelector((state: RootState) => state.personalAccount.user_id)
    /**
     * Track which method we send the code by: 'email' or 'phone'.
     * We’ll auto-detect based on whether `contact` has '@'.
     */
    const [selectedMethod, setSelectedMethod] = useState<'email' | 'phone'>('email');

    /** Local state to switch tabs: 'form' (enter contact/password) or 'code' (enter 4-digit code) */
    const [activeTab, setActiveTab] = useState<"form" | "code">("form");

    /**
     * FORM TAB
     */
    const formik = useFormik({
        initialValues: {
            contact: "",
            password: "",
            password2: "",
            type: 'email', // We'll sync this with `selectedMethod`.
        },
        validationSchema: Yup.object({
            // For simplicity, still using `email` for the contact validation,
            // but you could extend or replace it with phone validation logic.
            contact: Yup.string().required("Контакт обязателен").email("Некорректный E-mail"),
            password: Yup.string().min(8, "Пароль минимум 8 символов").required("Пароль обязателен"),
            password2: Yup.string()
                .oneOf([Yup.ref("password")], "Пароли не совпадают")
                .required("Подтверждение пароля обязательно"),
        }),
        onSubmit: (values) => {
            // We won't do the final submission here yet; 
            // we'll do it in `handleSubmit` below based on the activeTab.
        },
    });

    /** Whenever the user changes the contact field, detect if it’s an email or phone */
    const handleContactChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const value = e.target.value.trim();
        formik.setFieldValue("contact", value);

        if (value.includes("@")) {
            handleMethodChange("email");
        } else if (/^[+\d]+$/.test(value)) {  // Только цифры и "+"
            handleMethodChange("phone");
        }
    };


    /** Programmatically set the method in both state and formik */
    const handleMethodChange = (method: 'email' | 'phone') => {
        setSelectedMethod(method);
        formik.setFieldValue("type", method);
    };

    /** Click "Отправить" -> Save data, send code, switch to 'code' tab */
    const handleSubmit = () => {
        if (activeTab === "form") {
            // Определяем, передавать phone или email
            const userData = selectedMethod === "phone"
                ? { phone: formik.values.contact }
                : { email: formik.values.contact };

            // Диспатчим получение user_id
            dispatch(getUserIdThunk({
                ...userData,
                onSuccess: () => {
                    // Переключаемся на вкладку кода после успешного получения user_id
                    setActiveTab("code");
                }
            }));

            // Сохраняем данные сброса пароля в Redux
            dispatch(setPasswordResetData(formik.values));
        }
    };


    useEffect(() => {
        if (userIdForReset) {
            dispatch(resendConfirmationCode({
                user_id: userIdForReset,
                method: selectedMethod
            }));
        }
    }, [userIdForReset, dispatch, selectedMethod]);


    /**
     * CODE TAB
     */
    const codeLength = 4;
    const [codeDigits, setCodeDigits] = useState<string[]>(Array(codeLength).fill(""));
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Handle digit changes
    const handleDigitChange = (value: string, index: number) => {
        const cleanValue = value.slice(0, 1); // only 1 char
        setCodeDigits((prev) => {
            const next = [...prev];
            next[index] = cleanValue;
            return next;
        });
        if (cleanValue && index < codeLength - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    // Handle backspace for code inputs
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

    // Handle paste for code inputs
    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pasteData = e.clipboardData.getData("text");
        const pasteValue = pasteData.slice(0, codeLength).split("");
        const newCode = [...codeDigits];

        for (let i = 0; i < codeLength; i++) {
            newCode[i] = pasteValue[i] || "";
        }
        setCodeDigits(newCode);

        // Move focus to the first empty input
        const firstEmpty = pasteValue.length;
        if (firstEmpty < codeLength) {
            inputRefs.current[firstEmpty]?.focus();
        }
    };

    // Submit the code
    const handleCodeSubmit = () => {
        const code = codeDigits.join("");
        if (code.length === codeLength) {
            // Save code in Redux (or verify)
            dispatch(setResetCode(code));
            // Then close the modal or do more steps
            onClose();
        } {
            dispatch(resetPasswordThunk({ onSuccess: () => { setTooltipActive({ active: true, message: `Пароль для аккаунта ${formik.values.contact} успешно сменен` }) } }))
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size={modalState.resetPassword.size}
            animation={modalState.resetPassword.animation}
            withCloseIcon
            titleWidth="250px"
            type={ModalType.PROBLEM_WITH_CODE}
            withTitle="Восстановление пароля"
        >
            {activeTab === "form" && (
                <form onSubmit={formik.handleSubmit} className={styles.modalContent}>
                    <span className={styles.subtitle}>
                        Укажите e-mail или телефон, с которого была регистрация, и новый пароль
                    </span>

                    <Input
                        name="contact"
                        placeholder="E-mail/Телефон"
                        value={formik.values.contact}
                        autoComplete="new-password"
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
                        placeholder="Повторите пароль"
                        value={formik.values.password2}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.touched.password2 && formik.errors.password2}
                    />

                    <span className={styles.methodTitle}>Код будет отправлен на</span>
                    <div className={styles.method}>
                        {/* If you still want to let the user pick manually, keep this.
                            Otherwise, you can remove it since we auto-detect. */}
                        <CheckboxGroup
                            name="type"
                            label=""
                            direction="row"
                            options={[
                                { label: 'Email', value: 'email' },
                                { label: 'SMS', value: 'phone' },
                            ]}
                            value={selectedMethod}
                            onChange={() => { return }
                            }
                        />
                    </div>

                    <Button
                        theme={ButtonTheme.BLUE}
                        type="button"
                        onClick={handleSubmit}
                        disabled={!(formik.isValid && formik.dirty)}
                        className={styles.submitButton}
                    >
                        {loading ? <Loader size={LoaderSize.SMALL} theme={LoaderTheme.WHITE} /> : 'Отправить'}
                    </Button>
                </form>
            )}

            {activeTab === "code" && (
                <div className={styles.modalContent}>
                    {selectedMethod === 'email' ? (
                        <span className={styles.subtitle}>
                            Введите код подтверждения, который мы отправили на e-mail:<br />
                            <b>{formik.values.contact}</b>
                        </span>
                    ) : (
                        <span className={styles.subtitle}>
                            Введите код подтверждения, который мы отправили на телефон:<br />
                            <b>{formik.values.contact}</b>
                        </span>
                    )}

                    <div className={styles.codeInput__container}>
                        {codeDigits.map((digit, index) => (
                            <input
                                key={`code-${index}`}
                                type="text"
                                maxLength={1}
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={digit}
                                autoComplete="one-time-code"
                                name={`otp-${index}`}
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
                        {loading ? <Loader size={LoaderSize.SMALL} theme={LoaderTheme.WHITE} /> : 'Подтвердить код'}
                    </Button>
                </div>
            )}
        </Modal>
    );
});
