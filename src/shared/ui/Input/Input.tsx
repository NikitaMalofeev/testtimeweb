import React, { useState, useRef, useEffect, FocusEvent } from "react";
import InputMask from "react-input-mask-next";
import styles from "./styles.module.scss";
import { Icon } from "../Icon/Icon";
import ErrorIcon from 'shared/assets/svg/errorCircle.svg';
import OnPasswordIcon from 'shared/assets/svg/visibility_on.svg';
import OffPasswordIcon from 'shared/assets/svg/visibility_off.svg';

interface InputProps {
    theme?: "default" | "primary" | "secondary";
    value: string;
    name: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    onBlur?: (e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    placeholder?: string;
    disabled?: boolean;
    needValue?: boolean;
    type?: "text" | "password" | "phone" | "textarea";
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
    const textAreaRef = useRef<HTMLTextAreaElement | null>(null);

    const handleFocus = () => setIsFocused(true);
    const handleBlur = (e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setIsFocused(!!value);
        if (onBlur) onBlur(e);
    };

    const handleTogglePassword = () => {
        setIsPasswordVisible((prev) => !prev);
    };

    // Автоматическое изменение высоты textarea
    useEffect(() => {
        if (type === "textarea" && textAreaRef.current) {
            textAreaRef.current.style.height = "auto";
            textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;
        }
    }, [value]);

    return (
        <div className={`${styles.inputWrapper} ${styles[theme]}`}>
            {type !== 'textarea' && (
                <label className={`${styles.label} ${isFocused || value ? styles.active : ""}`}>
                    {placeholder}
                    {needValue && !value.length && <span className={styles.required}>*</span>}
                </label>
            )}
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
                                        <div className={styles.input__error}>
                                            <Icon Svg={ErrorIcon} width={16} height={16} className={styles.input__error__icon} />
                                            <span>{error}</span>
                                        </div>
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
                        case "textarea":
                            return (
                                <textarea
                                    ref={textAreaRef}
                                    name={name}
                                    value={value}
                                    placeholder={placeholder}
                                    onChange={onChange}
                                    onFocus={handleFocus}
                                    onBlur={handleBlur}
                                    disabled={disabled}
                                    className={`${styles.input} ${styles.textarea} ${needValue && !value.length ? styles.error : ""}`}
                                    rows={1}
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
