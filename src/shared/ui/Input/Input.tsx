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
import { CustomSlider, SliderTheme } from "../CustomSlider/CustomSlider";
import { useSelector } from "react-redux";
import { RootState } from "app/providers/store/config/store";

// Новое перечисление для тем (при желании можно расширять)
type InputTheme = "default" | "primary" | "secondary" | "gradient";

// Расширяем типы, чтобы добавить "swiperDiscrete"
interface InputProps {
    theme?: InputTheme;                               // <--- Новое
    value: string;
    name?: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    onBlur?: (e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    placeholder?: string;
    disabled?: boolean;
    needValue?: boolean;
    className?: string;

    /**
     * Поддерживаем обычные типы + два наших «ползунковых» режима:
     *  - "swiper"        — числовой слайдер (мин, макс, шаг)
     *  - "swiperDiscrete" — дискретный режим (массив строк)
     */
    type?: "text" | "textarea" | "search" | "password" | "number" | "swiper" | "swiperDiscrete" | 'data';

    error?: string | boolean;

    // Пределы для «числового» ползунка
    min?: number;
    max?: number;
    step?: number;

    // В режиме "swiperDiscrete" — массив значений, по которым движется слайдер
    discreteValues?: string[];
    swiperDiscreteSubtitles?: string[];
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
    discreteValues,
    swiperDiscreteSubtitles
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
    const minAmountInputNumberSlider = useSelector((state: RootState) => state.riskProfile.secondRiskProfileData?.min_amount_expected_replenishment || 200000)

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

    // -----------------------------------------
    // 1) РЕЖИМ ОДНОГО «числового» СЛАЙДЕРА (type="swiper")
    // -----------------------------------------

    // Для "swiper": вычисляем число, ограничиваем в пределах min–max
    const numericValueForSlider = useMemo(() => {
        const parsed = parseToNumber(value);
        return Math.min(Math.max(parsed, min), max);
    }, [value, min, max, parseToNumber]);

    // -----------------------------------------
    // 2) РЕЖИМ "swiperDiscrete" – ограниченный набор значений (discreteValues)
    // -----------------------------------------

    // Если передан массив discreteValues, находим индекс текущего значения:
    const discreteIndex = useMemo(() => {
        if (!discreteValues || !discreteValues.length) {
            return 0;
        }
        const idx = discreteValues.indexOf(value);
        return idx >= 0 ? idx : 0;
    }, [discreteValues, value]);

    // При ручном вводе «числа» в инпут
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

    // Считаем количество интервалов в каждом диапазоне:
    const range1Count = (1000000 - minAmountInputNumberSlider) / 100000;       // 5 шагов
    const range2Count = (10000000 - 1000000) / minAmountInputNumberSlider;       // 18 шагов
    const range3Count = (100000000 - 10000000) / 2000000;     // 45 шагов

    // Общее число шагов (индексов) – можно использовать как max для слайдера:
    const totalSteps = range1Count + range2Count + range3Count; // 5 + 18 + 45 = 68

    // Функция, которая по значению возвращает индекс (для инициализации слайдера)
    const mapValueToSliderIndex = (value: number): number => {
        if (value <= 1000000) {
            return (value - minAmountInputNumberSlider) / 100000;
        } else if (value <= 10000000) {
            return range1Count + (value - 1000000) / minAmountInputNumberSlider;
        } else {
            return range1Count + range2Count + (value - 10000000) / 2000000;
        }
    };

    // Функция, которая по индексу возвращает округлённое значение
    const mapSliderIndexToValue = (index: number): number => {
        if (index <= range1Count) {
            return minAmountInputNumberSlider + index * 100000;
        } else if (index <= range1Count + range2Count) {
            return 1000000 + (index - range1Count) * minAmountInputNumberSlider;
        } else {
            return 10000000 + (index - range1Count - range2Count) * 2000000;
        }
    };


    // Автоматическое изменение высоты textarea
    useEffect(() => {
        if (type === "textarea" && textAreaRef.current) {
            textAreaRef.current.style.height = "auto";
            textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;
        }
    }, [value, type]);

    return (
        <div className={`${styles.inputWrapper} ${styles[theme]}`}>
            {type !== "textarea" && (
                <label
                    className={`${styles.label} ${isFocused || value ? styles.active : ""}`}
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

            {/* {type === "data" && (
                <label
                    className={`${styles.label} ${isFocused || value ? styles.active : ""}`}
                >
                    {placeholder}
                    {needValue && !value.length && <span className={styles.required}>*</span>}
                </label>
            )} */}

            <div className={styles.inputContainer}>
                {(() => {
                    // Ниже – переключение по типу
                    switch (type) {
                        // Импортируем мапперы (если они вынесены в отдельный файл)
                        // import { mapValueToSliderIndex, mapSliderIndexToValue, totalSteps } from "./sliderMapping";

                        case "swiper":
                            // Вычисляем индекс слайдера по текущему значению (из строки парсим число)
                            const currentValue = parseToNumber(value);
                            const sliderIndex = useMemo(() => mapValueToSliderIndex(currentValue), [value]);

                            return (
                                <div className={`${styles.inputWrapper} ${styles[theme]}`}>
                                    <div className={styles.swiperWrapper}>
                                        {theme !== "gradient" && (
                                            <input
                                                type="text"
                                                placeholder={placeholder}
                                                name={name}
                                                value={value}  // Можно показывать отформатированное значение, например через formatMoney()
                                                disabled={disabled}
                                                onFocus={handleFocus}
                                                onBlur={handleBlur}
                                                className={styles.input}
                                                onChange={(e) => {
                                                    // Для ручного ввода можно оставить логику парсинга,
                                                    // либо применять mapSliderIndexToValue для округления.
                                                    const numericVal = parseToNumber(e.target.value);
                                                    // Здесь можно округлить numericVal по вашему алгоритму,
                                                    // например: const clamped = mapValueToSliderIndex(numericVal);
                                                    // И потом преобразовать обратно:
                                                    const rounded = mapSliderIndexToValue(mapValueToSliderIndex(numericVal));
                                                    const newEvent = {
                                                        ...e,
                                                        target: {
                                                            ...e.target,
                                                            value: rounded.toString(),
                                                        },
                                                    };
                                                    onChange(newEvent as React.ChangeEvent<HTMLInputElement>);
                                                }}
                                            />
                                        )}

                                        <CustomSlider
                                            // Передаём индекс слайдера
                                            sliderValue={sliderIndex}
                                            min={0}
                                            max={totalSteps}
                                            step={1}
                                            disabled={disabled}
                                            onChange={(val: number) => {
                                                // При изменении слайдера получаем новый индекс и преобразуем его в значение
                                                const newValue = mapSliderIndexToValue(val);
                                                const event = {
                                                    target: {
                                                        name: name || "",
                                                        value: newValue.toString(),
                                                    },
                                                } as React.ChangeEvent<HTMLInputElement>;
                                                onChange(event);
                                            }}
                                            sliderTheme={theme === "gradient" ? "gradient" : "default"}
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
                                </div>
                            );


                        // -----------------------------------------------------
                        //   НОВЫЙ РЕЖИМ "SWIPERDISCRETE" (3 ШАГА/СТРОКИ И Т.П.)
                        // -----------------------------------------------------
                        case "swiperDiscrete": {
                            // Мапим английские ключи → русские надписи
                            const labelMap = {
                                risk_prof_conservative: "Консервативный",
                                risk_prof_moderate: "Умеренный",
                                risk_prof_aggressive: "Агрессивный",
                            };

                            // discreteValues: ["risk_prof_conservative","risk_prof_moderate","risk_prof_aggressive"]
                            // value: выбранное значение, например "risk_prof_moderate"

                            // Находим индекс текущего ключа
                            const discreteIndex = useMemo(() => {
                                if (!discreteValues || !discreteValues.length) return 0;
                                return discreteValues.indexOf(value);
                            }, [discreteValues, value]);

                            // То, что показываем пользователю (русский текст):
                            const displayValue = labelMap[value as keyof typeof labelMap] || "";

                            return (
                                <div className={`${styles.inputWrapper} ${styles[theme]}`}>
                                    <div className={styles.swiperWrapper}>
                                        {theme !== "gradient" && (
                                            <input
                                                type="text"
                                                placeholder={placeholder}
                                                name={name}
                                                value={displayValue}  // показываем русское название
                                                disabled={disabled}
                                                onFocus={handleFocus}
                                                onBlur={handleBlur}
                                                className={styles.input}
                                                readOnly
                                            />
                                        )}

                                        <div className={styles.input__swiper__container}>
                                            <span
                                                style={{
                                                    position: "absolute",
                                                    top: 0,
                                                    left: 0,
                                                    fontSize: "12px",
                                                    color: "#989898"
                                                }}
                                            >
                                                {swiperDiscreteSubtitles?.[0] || ""}
                                            </span>
                                            <span
                                                style={{
                                                    position: "absolute",
                                                    bottom: 0,
                                                    left: 0,
                                                    fontSize: "12px",
                                                    color: "#989898"
                                                }}
                                            >
                                                {swiperDiscreteSubtitles?.[1] || ""}
                                            </span>

                                            <CustomSlider
                                                // Cоответствующий индекс выбранного ключа
                                                sliderValue={discreteIndex}
                                                min={0}
                                                max={(discreteValues?.length || 1) - 1}
                                                step={1}
                                                disabled={disabled}
                                                onChange={(val: number) => {
                                                    if (!discreteValues || !discreteValues.length) return;
                                                    // Получаем английский ключ по индексу
                                                    const newKey = discreteValues[val];

                                                    // В форму уходит ключ, напр. "risk_prof_moderate"
                                                    const event = {
                                                        target: {
                                                            name: name || "",
                                                            value: newKey,
                                                        },
                                                    } as unknown as React.ChangeEvent<HTMLInputElement>;

                                                    onChange(event);
                                                }}
                                                sliderTheme={theme === "gradient" ? "gradient" : "default"}
                                            />

                                            <span
                                                style={{
                                                    position: "absolute",
                                                    top: 0,
                                                    right: 0,
                                                    fontSize: "12px",
                                                    color: "#989898"
                                                }}
                                            >
                                                {swiperDiscreteSubtitles?.[2] || ""}
                                            </span>
                                            <span
                                                style={{
                                                    position: "absolute",
                                                    bottom: 0,
                                                    right: 0,
                                                    fontSize: "12px",
                                                    color: "#989898"
                                                }}
                                            >
                                                {swiperDiscreteSubtitles?.[3] || ""}
                                            </span>
                                        </div>

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
                        }

                        default:
                            if (type === "textarea") {
                                return (
                                    <textarea
                                        ref={textAreaRef}
                                        name={name}
                                        value={value}
                                        onChange={onChange}
                                        onFocus={handleFocus}
                                        onBlur={handleBlur}
                                        disabled={disabled}
                                        className={`${styles.textarea} ${needValue && !value.length ? styles.error : ""
                                            }`}
                                    />
                                );
                            }

                            if (type === "password") {
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
                                            className={`${styles.input} ${needValue && !value.length ? styles.error : ""
                                                }`}
                                        />
                                        <button
                                            type="button"
                                            className={styles.toggleButton}
                                            onClick={handleTogglePassword}
                                        >
                                            <Icon
                                                Svg={isPasswordVisible ? OnPasswordIcon : OffPasswordIcon}
                                                width={18}
                                                height={18}
                                            />
                                        </button>
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
