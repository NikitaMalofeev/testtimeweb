import React, { FocusEvent, ReactElement } from "react";
import styles from "./styles.module.scss";

interface CheckboxProps {
    name: string;
    /** Состояние "отмечен ли чекбокс" */
    checked: boolean;
    /**
     * Строковое значение, которое будет устанавливаться в e.target.value
     * (например, когда это радиокнопки).
     */
    value?: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onBlur?: (e: FocusEvent<HTMLInputElement>) => void;
    label: ReactElement;
    error?: string | boolean;
    disabled?: boolean;
    /**
     * Если `true`, используем стили "radio",
     * иначе классические стили "чекбокс".
     */
}

export const CheckboxRadio: React.FC<CheckboxProps> = ({
    name,
    checked,
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
                className={styles.checkboxLabelRadio}>
                <input
                    type="checkbox"
                    name={name}
                    checked={checked}
                    value={value}
                    onChange={onChange}
                    onBlur={onBlur}
                    disabled={disabled}
                    className={styles.checkboxInput}
                />
                <span
                    className={styles.checkboxCustomRadio}
                />
                {label}
            </label>
            {error && <div className={styles.errorText}>{error}</div>}
        </div>
    );
};
