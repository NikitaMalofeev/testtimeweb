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
import { useSelector } from "react-redux";
import { RootState } from "app/providers/store/config/store";
import { clamp } from "shared/lib/helpers/clamp";

/**
 * Темы нашего инпута
 */
type InputTheme = "default" | "primary" | "secondary" | "gradient";


type CommonHTMLProps = Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "type"
> &
    Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "type">;
/**
 * Расширяем пропсы под все нужные сценарии
 */
interface InputProps extends CommonHTMLProps {
    theme?: InputTheme;
    value: string;
    name?: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    onBlur?: (e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    onFocus?: () => void;
    onClearError?: () => void;
    onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    placeholder?: string;
    disabled?: boolean;
    needValue?: boolean;
    withoutCloudyLabel?: boolean;
    className?: string;

    /**
     * Поддерживаем обычные типы + два ползунковых режима:
     *  - "swiper"         — числовой слайдер (мин, макс, шаг)
     *  - "swiperDiscrete" — дискретный режим (массив строк)
     */
    type?:
    | "text"
    | "textarea"
    | "search"
    | "password"
    | "number"
    | "swiper"
    | "swiperDiscrete"
    | "data";

    error?: string | boolean;

    /**
     * Пределы для «числового» ползунка (type="swiper")
     */
    min?: number;
    max?: number;
    step?: number;
    needShowInput?: boolean;

    /**
     * В режиме "swiperDiscrete" — массив значений,
     * по которым движется слайдер
     */
    discreteValues?: string[];
    extraDescreteValue?: string;
    swiperDiscreteSubtitles?: string[];
    customSliderDivisions?: number;

    /**
     * **Новый проп**: ограничение на количество символов для type="number".
     * Если не указан, то ограничение не действует.
     */
    maxLength?: number;
}

export const Input: React.FC<InputProps> = ({
    theme = "default",
    customSliderDivisions,
    value,
    name,
    onChange,
    onBlur,
    onFocus,
    onClearError,
    onKeyDown,
    error,
    placeholder = "",
    disabled = false,
    needValue = false,
    type = "text",
    min = 0,
    max = 100,
    step = 1,
    needShowInput,
    discreteValues,
    extraDescreteValue,
    swiperDiscreteSubtitles,
    maxLength,
    withoutCloudyLabel,
    ...restProps
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [hideErrorOnFocus, setHideErrorOnFocus] = useState(false);
    const textAreaRef = useRef<HTMLTextAreaElement | null>(null);

    const minAmountInputNumberSlider = useSelector(
        (state: RootState) =>
            state.riskProfile.secondRiskProfileData?.min_amount_expected_replenishment || 200_000
    );

    const handleFocus = () => {
        setIsFocused(true);
        setHideErrorOnFocus(true); // Скрываем ошибку только визуально при фокусе
        onFocus?.();
    };

    const handleBlur = (e: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setIsFocused(!!value);
        setHideErrorOnFocus(false); // Показываем ошибку обратно при потере фокуса
        onBlur?.(e);
    };

    const handleTogglePassword = () => {
        setIsPasswordVisible((prev) => !prev);
    };

    // Сбрасываем скрытие ошибки если ошибка изменилась
    useEffect(() => {
        if (!error) {
            setHideErrorOnFocus(false);
        }
    }, [error]);

    // Определяем, нужно ли показывать ошибку (скрываем только при фокусе)
    const shouldShowError = error && !hideErrorOnFocus;
    const blockNumberSpin = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown'].includes(e.key)) {
            e.preventDefault();
        }
    };

    const blockWheel = (e: React.WheelEvent<HTMLInputElement>) => {
        e.preventDefault();
        e.currentTarget.blur();
    };

    //Если нужно запретить скролл и стрелки в намбер инпуте

    const parseToNumber = useCallback((str: string): number => {
        // Убираем пробелы, знак рубля и т.д.
        const cleaned = str.replace(/\s+/g, "").replace("₽", "");
        const num = parseInt(cleaned, 10);
        if (isNaN(num)) return 0;
        return num;
    }, []);

    // -------------------------------------------------------------------
    // 1) РЕЖИМ ОДНОГО «числового» СЛАЙДЕРА (type="swiper")
    // -------------------------------------------------------------------
    const numericValueForSlider = useMemo(
        () => clamp(parseToNumber(value), min, max),
        [value, min, max, parseToNumber]
    );

    // -------------------------------------------------------------------
    // 2) РЕЖИМ "swiperDiscrete" – ограниченный набор значений (discreteValues)
    // -------------------------------------------------------------------
    const discreteIndex = useMemo(() => {
        if (!discreteValues || !discreteValues.length) {
            return 0;
        }
        const idx = discreteValues.indexOf(value);
        return idx >= 0 ? idx : 0;
    }, [discreteValues, value]);

    // Если нужно, при ручном вводе числа можно делать дополнительную проверку:
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

    // -------------------------------------------------
    // Динамическое вычисление шагов для "swiper"
    // -------------------------------------------------
    // Диапазон 1: от min до 1_000_000 шагом 100_000 (только если min < 1_000_000)
    // Диапазон 2: от 1_000_000 до 10_000_000 шагом 500_000
    // Диапазон 3: от 10_000_000 до 100_000_000 шагом 2_000_000

    const RANGE1_END = 1_000_000;
    const RANGE2_END = 10_000_000;
    const MAX_VALUE = 100_000_000;
    const RANGE1_STEP = 100_000;
    const RANGE2_STEP = 500_000;
    const RANGE3_STEP = 2_000_000;

    // Вычисляем количество шагов для каждого диапазона
    const range1Count = minAmountInputNumberSlider < RANGE1_END
        ? (RANGE1_END - minAmountInputNumberSlider) / RANGE1_STEP
        : 0;

    const range2Start = Math.max(minAmountInputNumberSlider, RANGE1_END);
    const range2Count = minAmountInputNumberSlider < RANGE2_END
        ? (RANGE2_END - range2Start) / RANGE2_STEP
        : 0;

    const range3Start = Math.max(minAmountInputNumberSlider, RANGE2_END);
    const range3Count = (MAX_VALUE - range3Start) / RANGE3_STEP;

    const totalSteps = range1Count + range2Count + range3Count;

    const mapValueToSliderIndex = (val: number): number => {
        // Если значение в первом диапазоне (и он существует)
        if (range1Count > 0 && val <= RANGE1_END) {
            return (val - minAmountInputNumberSlider) / RANGE1_STEP;
        }
        // Если значение во втором диапазоне (и он существует)
        else if (range2Count > 0 && val <= RANGE2_END) {
            return range1Count + (val - range2Start) / RANGE2_STEP;
        }
        // Значение в третьем диапазоне
        else {
            return range1Count + range2Count + (val - range3Start) / RANGE3_STEP;
        }
    };

    const mapSliderIndexToValue = (index: number): number => {
        // Если индекс в первом диапазоне (и он существует)
        if (range1Count > 0 && index <= range1Count) {
            return minAmountInputNumberSlider + index * RANGE1_STEP;
        }
        // Если индекс во втором диапазоне (и он существует)
        else if (range2Count > 0 && index <= range1Count + range2Count) {
            return range2Start + (index - range1Count) * RANGE2_STEP;
        }
        // Индекс в третьем диапазоне
        else {
            return range3Start + (index - range1Count - range2Count) * RANGE3_STEP;
        }
    };

    // Для авто-увеличения textarea по контенту:
    useEffect(() => {
        if (type === "textarea" && textAreaRef.current) {
            textAreaRef.current.style.height = "auto";
            textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;
        }
    }, [value, type]);

    return (
        <div className={`${styles.inputWrapper} ${styles[theme]}`}>
            {/* Заголовок (placeholder) – в виде лейбла, кроме textarea (уже есть встроенный placeholder) */}
            {type !== "textarea" && (withoutCloudyLabel ? value === "" : true) && (
                <label className={`${styles.label} ${!withoutCloudyLabel && (isFocused || value) ? styles.active : ""}`}>
                    {type === "search" && (
                        <Icon
                            className={styles.input__search__icon}
                            Svg={SearchIcon}
                            width={18}
                            height={18}
                        />
                    )}
                    {placeholder}
                    {needValue && !value.length && (
                        <span className={styles.required}>*</span>
                    )}
                </label>
            )}


            <div className={styles.inputContainer}>
                {(() => {

                    switch (type) {
                        // -------------------------------------------
                        // 1) СЛАЙДЕР (type="swiper")
                        // -------------------------------------------
                        case "swiper": {
                            const currentValue = parseToNumber(value);
                            const sliderIndex = useMemo(
                                () => mapValueToSliderIndex(currentValue),
                                [value]
                            );

                            return (
                                <div className={`${styles.inputWrapper} ${styles[theme]}`}>
                                    <div className={styles.swiperWrapper}>
                                        {theme !== "gradient" && needShowInput && (
                                            <input
                                                type="text"
                                                placeholder={placeholder}
                                                name={name}
                                                value={value}
                                                autoComplete={restProps.autoComplete}
                                                disabled={disabled}
                                                readOnly={true}
                                                onFocus={handleFocus}
                                                onBlur={handleBlur}
                                                onKeyDown={onKeyDown}
                                                className={styles.input}
                                                onChange={(e) => {
                                                    const raw = parseToNumber(e.target.value);
                                                    const clamped = clamp(raw, min, max);

                                                    // округляем по твоим шагам
                                                    const rounded = mapSliderIndexToValue(
                                                        clamp(mapValueToSliderIndex(clamped), 0, totalSteps)
                                                    );

                                                    const newEvent = {
                                                        ...e,
                                                        target: { ...e.target, value: rounded.toString() },
                                                    } as React.ChangeEvent<HTMLInputElement>;

                                                    onChange(newEvent);
                                                }}
                                            />
                                        )}

                                        <CustomSlider
                                            sliderValue={sliderIndex}
                                            min={0}
                                            max={totalSteps}
                                            step={1}
                                            disabled={disabled}
                                            onChange={(val: number) => {
                                                const safeIndex = clamp(val, 0, totalSteps);
                                                const newValue = mapSliderIndexToValue(safeIndex);
                                                const event = {
                                                    target: { name: name || "", value: newValue.toString() },
                                                } as React.ChangeEvent<HTMLInputElement>;
                                                onChange(event);
                                            }}
                                        />

                                        {shouldShowError && (
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

                        // -------------------------------------------
                        // 2) ДИСКРЕТНЫЙ СЛАЙДЕР (type="swiperDiscrete")
                        // -------------------------------------------
                        case "swiperDiscrete": {
                            // Можно расширить логику мапинга, если ключей много
                            const labelMap = {
                                risk_prof_conservative: 'Консервативный',
                                risk_prof_conservative_moderately: 'Умеренно-консервативный',
                                risk_prof_balanced: 'Сбалансированный',
                                risk_prof_aggressive_moderately: 'Умеренно-агрессивный',
                                risk_prof_aggressive: 'Агрессивный',
                                risk_prof_aggressive_super: 'Сверх-агрессивный',
                            };



                            // Русское название для текущего значения
                            const displayValue =
                                labelMap[value as keyof typeof labelMap] || value;

                            const discreteIndex = useMemo(() => {
                                if (!discreteValues || !discreteValues.length) return 0;
                                return discreteValues.indexOf(value);
                            }, [discreteValues, value]);

                            // вычисляем индекс extraValue
                            const extraTickIndex = useMemo(() => {
                                if (!extraDescreteValue) return -1;
                                return discreteValues?.indexOf(extraDescreteValue);
                            }, [discreteValues, extraDescreteValue]);

                            return (
                                <div className={`${styles.inputWrapper} ${styles[theme]}`}>
                                    <div className={styles.swiperWrapper}>
                                        {theme !== "gradient" && (
                                            <input
                                                type="text"
                                                placeholder={placeholder}
                                                name={name}
                                                value={displayValue}
                                                disabled={disabled}
                                                onFocus={handleFocus}
                                                onBlur={handleBlur}
                                                onKeyDown={onKeyDown}
                                                className={styles.input}
                                                readOnly
                                            />
                                        )}

                                        <div className={styles.input__swiper__container}>
                                            <span
                                                style={{
                                                    position: "absolute",
                                                    top: -5,
                                                    left: 0,
                                                    fontSize: "12px",
                                                    color: "#989898",
                                                }}
                                            >
                                                {swiperDiscreteSubtitles?.[0] || ""}
                                            </span>
                                            <span
                                                style={{
                                                    position: "absolute",
                                                    bottom: -17,
                                                    left: 0,
                                                    fontSize: "12px",
                                                    color: "#989898",
                                                }}
                                            >
                                                {swiperDiscreteSubtitles?.[1] || ""}
                                            </span>

                                            <CustomSlider
                                                sliderValue={discreteIndex}
                                                min={0}
                                                divisions={customSliderDivisions}
                                                max={(discreteValues?.length || 1) - 1}
                                                step={1}
                                                disabled={disabled}
                                                onChange={(val: number) => {
                                                    if (!discreteValues || !discreteValues.length) return;
                                                    const newKey = discreteValues[val];

                                                    const event = {
                                                        target: {
                                                            name: name || "",
                                                            value: newKey,
                                                        },
                                                    } as unknown as React.ChangeEvent<HTMLInputElement>;

                                                    onChange(event);
                                                }}
                                                extraTickIndex={extraTickIndex}
                                                sliderTheme={theme === "gradient" ? "gradient" : "default"}
                                            />

                                            <span
                                                style={{
                                                    position: "absolute",
                                                    top: -5,
                                                    right: 0,
                                                    fontSize: "12px",
                                                    color: "#989898",
                                                }}
                                            >
                                                {swiperDiscreteSubtitles?.[2] || ""}
                                            </span>
                                            <span
                                                style={{
                                                    position: "absolute",
                                                    bottom: -17,
                                                    right: 0,
                                                    fontSize: "12px",
                                                    color: "#989898",
                                                }}
                                            >
                                                {swiperDiscreteSubtitles?.[3] || ""}
                                            </span>
                                        </div>

                                        {shouldShowError && (
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

                        // -------------------------------------------
                        // 3) ТЕКСТОВАЯ ОБЛАСТЬ (type="textarea")
                        // -------------------------------------------
                        case "textarea":
                            return (
                                <textarea
                                    ref={textAreaRef}
                                    name={name}
                                    value={value}
                                    autoComplete={restProps.autoComplete}
                                    onChange={onChange}
                                    onFocus={handleFocus}
                                    onBlur={handleBlur}
                                    onKeyDown={onKeyDown}
                                    disabled={disabled}
                                    className={`${styles.textarea} ${needValue && !value.length ? styles.error : ""
                                        }`}
                                />
                            );

                        // -------------------------------------------
                        // 4) ПАРОЛЬ (type="password") + иконка глазика
                        // -------------------------------------------
                        case "password":
                            return (
                                <>
                                    <input
                                        type={isPasswordVisible ? "text" : "password"}
                                        name={name}
                                        value={value}
                                        autoComplete={restProps.autoComplete}
                                        onChange={onChange}
                                        onFocus={handleFocus}
                                        onBlur={handleBlur}
                                        onKeyDown={onKeyDown}
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
                                    {shouldShowError && (
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

                        // -------------------------------------------
                        // 5) ПРОСТО ЧИСЛО (type="number") с maxLength
                        // -------------------------------------------
                        case "number":
                            return (
                                <>
                                    <input
                                        type="number"
                                        name={name}
                                        // HTML5-атрибуты min, max, step — используйте по необходимости
                                        min={min}
                                        max={max}
                                        step={step}
                                        value={value}
                                        autoComplete={restProps.autoComplete}
                                        disabled={disabled}
                                        onFocus={handleFocus}
                                        onBlur={handleBlur}
                                        className={`${styles.input} ${needValue && !value.length ? styles.error : ""
                                            }`}
                                        onChange={(e) => {
                                            // Если задано ограничение на кол-во цифр, обрежем при вводе
                                            if (
                                                maxLength &&
                                                e.target.value.replace(/\D+/g, "").length > maxLength
                                            ) {
                                                // Либо полностью блокируем лишние символы...
                                                e.target.value = e.target.value
                                                    .slice(0, maxLength)
                                                    .replace(/\D+/g, "");
                                            }
                                            onChange(e);
                                        }}
                                        // ↓↓↓ блокируем колесо и стрелки ↓↓↓
                                        onWheelCapture={blockWheel}          // <–– важнее, чем onWheel
                                        onKeyDown={(e) => {
                                            blockNumberSpin(e);
                                            onKeyDown?.(e);
                                        }}
                                    />
                                    {shouldShowError && (
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

                        // -------------------------------------------
                        // 6) ПО УМОЛЧАНИЮ: text, search, data и т.д.
                        // -------------------------------------------
                        default:
                            return (
                                <>
                                    <input
                                        type={type}
                                        name={name}
                                        value={value}
                                        autoComplete={restProps.autoComplete}
                                        onChange={onChange}
                                        onFocus={handleFocus}
                                        onBlur={handleBlur}
                                        onKeyDown={onKeyDown}
                                        disabled={disabled}
                                        className={`${styles.input} ${needValue && !value.length ? styles.error : ""
                                            }`}
                                    />
                                    {shouldShowError && (
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
