import React from "react";
import { Checkbox } from "shared/ui/Checkbox/Checkbox";
import styles from "./styles.module.scss";
import { CheckboxRadio } from "../CheckboxRadio/CheckboxRadio";
import { Icon } from "../Icon/Icon";
import ErrorIcon from "shared/assets/svg/errorCircle.svg";
interface CheckboxOption {
    label: string;
    value: string;
}

interface CheckboxGroupProps {
    name: string;
    label?: string;
    options: CheckboxOption[];
    direction?: 'column' | 'row';
    /**
     * Значение выбранного варианта (строка).
     */
    value?: string;
    needValue?: boolean;
    /**
     * Колбэк, который вызывается при клике.
     * Передаём в него (name, значение выбранного варианта).
     */
    onChange: (name: string, clickedValue: string) => void;
    error?: string | boolean;
}

export const CheckboxGroup: React.FC<CheckboxGroupProps> = ({
    name,
    options,
    label,
    direction,
    value = "",
    error,
    needValue,
    onChange,
}) => {
    // Обрабатываем клик по "радио"-чекбоксу
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value: clickedValue } = e.target;
        onChange(name, clickedValue);
    };

    return (
        <div className={styles.checkboxGroup__container}>
            {label && <span className={styles.checkboxGroup__label}>{label} {needValue && !value && <span style={{ color: 'red', marginLeft: '2px' }}>*</span>}</span>}
            <div className={styles.checkboxGroup} style={direction === 'row' ? { flexDirection: 'row', maxWidth: 'max-content', marginBottom: '10px' } : {}}>

                {options.map((option) => (
                    <CheckboxRadio
                        key={option.value}
                        name={name}
                        /** 
                         * Здесь мы указываем:
                         * - value (строка), которая пойдёт в e.target.value
                         * - checked (булево), определяющее, выбран ли этот вариант
                         */
                        value={option.value}
                        checked={option.value === value}
                        onChange={handleChange}
                        label={<span>{option.label}</span>}
                    />
                ))}
                {error && (
                    <div className={styles.input__error}>
                        <Icon
                            Svg={ErrorIcon}
                            className={styles.input__error__icon}
                            width={16}
                            height={16}
                        />
                        <span>{error}</span>
                    </div>
                )}
            </div>

        </div>
    );
};
