import React, { FocusEvent, ReactElement } from "react";
import styles from "./styles.module.scss";

interface CheckboxProps {
    name: string;
    /** Состояние "отмечен ли чекбокс" */
    /**
     * Строковое значение, которое будет устанавливаться в e.target.value
     * (например, когда это радиокнопки).
     */
    value?: boolean;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onBlur?: (e: FocusEvent<HTMLInputElement>) => void;
    label: ReactElement;
    error?: string | boolean;
    disabled?: boolean;
    fsize?: string;
    /**
     * Если `true`, используем стили "radio",
     * иначе классические стили "чекбокс".
     */
}

export const Checkbox: React.FC<CheckboxProps> = ({
    name,
    value,
    onChange,
    onBlur,
    label,
    error,
    disabled = false,
}) => {
    return (
        <div className={`${styles.checkboxWrapper} ${error ? styles.error : ""}`}>
            <label
                className={styles.checkboxLabel}>
                <input
                    type="checkbox"
                    name={name}
                    checked={value}
                    onChange={onChange}
                    onBlur={onBlur}
                    disabled={disabled}
                    className={styles.checkboxInput}
                />
                <span
                    className={styles.checkboxCustom}
                />
                {label}
            </label>
            {error && <div className={styles.errorText}>{error}</div>}
        </div>
    );
};
