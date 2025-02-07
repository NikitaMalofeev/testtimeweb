import React from "react";
import { Checkbox } from "shared/ui/Checkbox/Checkbox";
import styles from "./styles.module.scss";

interface CheckboxOption {
    label: string;
    value: string;
}

interface CheckboxGroupProps {
    name: string;
    options: CheckboxOption[];
    /**
     * Значение выбранного варианта (строка).
     */
    value?: string;
    /**
     * Колбэк, который вызывается при клике.
     * Передаём в него (name, значение выбранного варианта).
     */
    onChange: (name: string, clickedValue: string) => void;
}

export const CheckboxGroup: React.FC<CheckboxGroupProps> = ({
    name,
    options,
    value = "",
    onChange,
}) => {
    // Обрабатываем клик по "радио"-чекбоксу
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value: clickedValue } = e.target;
        onChange(name, clickedValue);
    };

    return (
        <div className={styles.checkboxGroup}>
            {options.map((option) => (
                <Checkbox
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
                    isRadio
                />
            ))}
        </div>
    );
};
