import React, { useState, FocusEvent } from "react";
import InputMask from "react-input-mask-next";
import styles from "./styles.module.scss";
import { Icon } from "../Icon/Icon";
import ErrorIcon from 'shared/assets/svg/errorCircle.svg'
import OnPasswordIcon from 'shared/assets/svg/visibility_on.svg'
import OffPasswordIcon from 'shared/assets/svg/visibility_off.svg'

interface InputProps {
    theme?: "default" | "primary" | "secondary";
    value: string;
    name: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onBlur?: (e: FocusEvent<HTMLInputElement>) => void;
    placeholder?: string;
    disabled?: boolean;
    needValue?: boolean;
    type?: "text" | "password" | "phone";
    error?: string | boolean | undefined;
}

export const Input: React.FC<InputProps> = ({
    theme = "default",
    value,
    name,
    onChange,
    onBlur,
    error,
    placeholder = "",
    disabled = false,
    needValue = false,
    type = "text",
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    const handleFocus = () => setIsFocused(true);
    const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
        setIsFocused(!!value);
        if (onBlur) onBlur(e);
    };

    const handleTogglePassword = () => {
        setIsPasswordVisible((prev) => !prev);
    };

    return (
        <div className={`${styles.inputWrapper} ${styles[theme]}`}>
            {/* Лейбл */}
            <label className={`${styles.label} ${isFocused || value ? styles.active : ""}`}>
                {placeholder}
                {needValue && !value.length && <span className={styles.required}>*</span>}
            </label>

            {/* Контейнер инпута */}
            <div className={styles.inputContainer}>
                {(() => {
                    switch (type) {
                        case "password":
                            return (
                                <>
                                    <input
                                        type={isPasswordVisible ? "text" : "password"}
                                        name={name}
                                        value={value}
                                        onChange={onChange}
                                        onFocus={handleFocus}
                                        onBlur={handleBlur}
                                        disabled={disabled}
                                        className={`${styles.input} ${needValue && !value.length ? styles.error : ""}`}
                                    />
                                    {error && (
                                        <div className={styles.input__error}><Icon Svg={ErrorIcon} width={16} height={16} className={styles.input__error__icon} /> <span>{error}</span></div>
                                    )}
                                    <button type="button" className={styles.toggleButton} onClick={handleTogglePassword}>
                                        {isPasswordVisible ? <Icon Svg={OnPasswordIcon} width={24} height={24} /> : <Icon Svg={OffPasswordIcon} width={24} height={24} />}
                                    </button>
                                </>
                            );

                        case "phone":
                            return (
                                <InputMask
                                    mask="+7 999 999 99 99"
                                    name={name}
                                    value={value}
                                    onChange={onChange}
                                    onFocus={handleFocus}
                                    onBlur={handleBlur}
                                    disabled={disabled}
                                    className={`${styles.input} ${needValue && !value.length ? styles.error : ""}`}
                                />
                            );

                        default:
                            return (
                                <>
                                    <input
                                        type={type}
                                        name={name}
                                        value={value}
                                        onChange={onChange}
                                        onFocus={handleFocus}
                                        onBlur={handleBlur}
                                        disabled={disabled}
                                        className={`${styles.input} ${needValue && !value.length ? styles.error : ""}`}
                                    />
                                    {error && (
                                        <div className={styles.input__error}>
                                            <Icon Svg={ErrorIcon} className={styles.input__error__icon} width={16} height={16} />
                                            <span>{error}</span>
                                        </div>
                                    )}
                                </>
                            );
                    }
                })()}
            </div>
        </div>
    );
};
