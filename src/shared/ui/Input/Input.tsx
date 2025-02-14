import React, {
    useState,
    useRef,
    useEffect,
    FocusEvent,
    useCallback,
    useMemo,
} from "react";
import styles from "./styles.module.scss";
import { Icon } from "../Icon/Icon";
import ErrorIcon from "shared/assets/svg/errorCircle.svg";
import OnPasswordIcon from "shared/assets/svg/visibility_on.svg";
import OffPasswordIcon from "shared/assets/svg/visibility_off.svg";
import SearchIcon from "shared/assets/svg/searchIcon.svg";
import { CustomSlider } from "../CustomSlider/CustomSlider";

interface InputProps {
    theme?: "default" | "primary" | "secondary";
    value: string;
    name?: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    onBlur?: (e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    placeholder?: string;
    disabled?: boolean;
    needValue?: boolean;
    className?: string;
    type?: string;
    error?: string | boolean;

    // Для "swiper"
    min?: number;
    max?: number;
    step?: number;
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
    min = 0,
    max = 100,
    step = 1,
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const textAreaRef = useRef<HTMLTextAreaElement | null>(null);

    const handleFocus = () => setIsFocused(true);
    const handleBlur = (e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setIsFocused(!!value);
        onBlur?.(e);
    };

    const handleTogglePassword = () => {
        setIsPasswordVisible((prev) => !prev);
    };

    const parseToNumber = useCallback((str: string): number => {
        const cleaned = str.replace(/\s+/g, "").replace("₽", "");
        const num = parseInt(cleaned, 10);
        if (isNaN(num)) return 0;
        return num;
    }, []);

    // В режиме "swiper" нам нужно, чтобы:
    // 1) в input показывалась форматированная строка (к нам она уже приходит пропом `value`)
    // 2) sliderValue было числом
    const numericValueForSlider = useMemo(() => {
        const parsed = parseToNumber(value);
        // Ограничиваем в пределах min–max:
        return Math.min(Math.max(parsed, min), max);
    }, [value, min, max, parseToNumber]);

    // Автоматическое изменение высоты textarea
    useEffect(() => {
        if (type === "textarea" && textAreaRef.current) {
            textAreaRef.current.style.height = "auto";
            textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;
        }
    }, [value, type]);

    // Функция для обработки ручного ввода числа (в инпуте)
    // с учётом min, max, step (при необходимости).
    const handleNumberChange = (
        e: React.ChangeEvent<HTMLInputElement>,
        localMin: number,
        localMax: number
    ) => {
        const { name: fieldName } = e.target;
        let numericValue = parseInt(e.target.value, 10);
        if (isNaN(numericValue)) numericValue = localMin;

        if (numericValue < localMin) numericValue = localMin;
        if (numericValue > localMax) numericValue = localMax;

        // Генерируем новое событие
        const newEvent = {
            ...e,
            target: {
                ...e.target,
                name: fieldName,
                value: numericValue.toString(),
            },
        };
        onChange(newEvent as React.ChangeEvent<HTMLInputElement>);
    };

    return (
        <div className={`${styles.inputWrapper} ${styles[theme]}`}>
            {type !== "textarea" && (
                <label
                    className={`${styles.label} ${isFocused || value ? styles.active : ""
                        }`}
                >
                    {type === "search" && (
                        <Icon
                            className={styles.input__search__icon}
                            Svg={SearchIcon}
                            width={18}
                            height={18}
                        />
                    )}
                    {placeholder}
                    {needValue && !value.length && <span className={styles.required}>*</span>}
                </label>
            )}

            <div className={styles.inputContainer}>
                {(() => {

                    switch (type) {
                        case "swiper":
                            return (
                                <div className={`${styles.inputWrapper} ${styles[theme]}`}>
                                    <div className={styles.swiperWrapper}>
                                        {/* 
                          Инпут для ручного ввода строки.
                          В onChange мы парсим и передаём чистое число наверх 
                          (Formik), чтобы там оно уже форматировалось заново.
                        */}
                                        <input
                                            type="text"
                                            placeholder={placeholder}
                                            name={name}
                                            value={value}
                                            disabled={disabled}
                                            onFocus={handleFocus}
                                            onBlur={handleBlur}
                                            className={styles.input}
                                            onChange={(e) => {
                                                // Парсим строку в число:
                                                const numericVal = parseToNumber(e.target.value);

                                                // Также ограничим min–max, если нужно:
                                                const clamped = Math.min(Math.max(numericVal, min), max);

                                                // Генерируем новое событие, где в target.value
                                                // положим именно число (в виде строки).
                                                const newEvent = {
                                                    ...e,
                                                    target: {
                                                        ...e.target,
                                                        value: clamped.toString(),
                                                    },
                                                };
                                                onChange(newEvent as React.ChangeEvent<HTMLInputElement>);
                                            }}
                                        />

                                        <CustomSlider
                                            sliderValue={numericValueForSlider}
                                            min={min}
                                            max={max}
                                            step={step}
                                            disabled={disabled}
                                            onChange={(val: number) => {
                                                // Когда двигаем ползунок — возвращаем наверх число в виде строки:
                                                const event = {
                                                    target: {
                                                        name: name || "",
                                                        value: val.toString(),
                                                    },
                                                } as unknown as React.ChangeEvent<HTMLInputElement>;
                                                onChange(event);
                                            }}
                                        />

                                        {/* Если есть ошибка — выводим её */}
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
                            // Кейс, где у нас кастомный ползунок + инпут для числа
                            return (
                                <div className={styles.swiperWrapper}>

                                    {/* Инпут для ручного ввода числа */}
                                    <input
                                        type="text"
                                        placeholder={placeholder}
                                        name={name}
                                        value={value}
                                        disabled={disabled}
                                        onChange={(e) => handleNumberChange(e, min, max)}
                                        onFocus={handleFocus}
                                        onBlur={handleBlur}
                                        className={`${styles.input}`}
                                    />

                                    <CustomSlider
                                        sliderValue={parseInt(value, 10) || min}
                                        min={min}
                                        max={max}
                                        step={step}
                                        disabled={disabled}
                                        onChange={(val) => {
                                            // Когда CustomSlider меняет значение — эмулируем onChange Formik
                                            const event = {
                                                target: {
                                                    name: name || "",
                                                    value: val.toString(),
                                                },
                                            } as unknown as React.ChangeEvent<HTMLInputElement>;
                                            onChange(event);
                                        }}
                                    />
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
                            );

                        // Остальные кейсы...
                        // password, number, search, textarea, default...
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
                                        className={`${styles.input} ${needValue && !value.length ? styles.error : ""
                                            }`}
                                    />
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
                                </>
                            );
                    }
                })()}
            </div>
        </div>
    );
};
