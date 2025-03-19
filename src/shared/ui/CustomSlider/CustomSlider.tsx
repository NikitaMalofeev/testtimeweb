import React, {
    memo,
    useState,
    useRef,
    useEffect,
    useCallback,
    useLayoutEffect
} from "react";
import styles from "./styles.module.scss";

export type SliderTheme = "default" | "gradient";

interface CustomSliderProps {
    sliderValue: number;    // Текущее числовое значение (или индекс в дискретном режиме)
    min: number;
    max: number;
    step?: number;
    disabled?: boolean;
    divisions?: number;
    onChange: (val: number) => void; // Вызывается, когда значение меняется
    sliderTheme?: SliderTheme;       // Тема слайдера
}

export const CustomSlider: React.FC<CustomSliderProps> = memo(({
    sliderValue,
    min,
    max,
    step = 1,
    disabled,
    divisions,
    onChange,
    sliderTheme = "default",
}) => {
    const trackRef = useRef<HTMLDivElement | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState(0);

    // Привязка к диапазону
    const clampValue = useCallback(
        (val: number) => Math.max(min, Math.min(max, val)),
        [min, max]
    );

    // Учёт шага
    const snapToStep = useCallback(
        (val: number) => {
            const stepsCount = Math.round((val - min) / step);
            return clampValue(min + stepsCount * step);
        },
        [min, step, clampValue]
    );

    // Переводим текущее значение в % заполнения трека
    const calcPercentage = useCallback(
        (val: number) => ((val - min) / (max - min)) * 100,
        [min, max]
    );

    // Из clientX вычисляем новое значение
    const getValueFromClientX = useCallback(
        (clientX: number, withOffset: boolean) => {
            if (!trackRef.current) return sliderValue;
            const rect = trackRef.current.getBoundingClientRect();

            let x = clientX - rect.left;
            if (withOffset) {
                x -= dragOffset;
            }

            if (x < 0) x = 0;
            if (x > rect.width) x = rect.width;

            const percent = x / rect.width;
            const rawVal = min + percent * (max - min);

            return snapToStep(rawVal);
        },
        [trackRef, min, max, dragOffset, snapToStep, sliderValue]
    );

    // Движение мыши/пальца
    const handlePointerMove = useCallback(
        (clientX: number, withOffset: boolean) => {
            const newVal = getValueFromClientX(clientX, withOffset);
            onChange(newVal);
        },
        [onChange, getValueFromClientX]
    );

    // Клик по дорожке
    const handleTrackClick = useCallback(
        (e: React.MouseEvent | React.TouchEvent) => {
            if (disabled) return;

            let clientX: number;
            if ("clientX" in e) {
                clientX = e.clientX;
            } else {
                clientX = e.touches[0].clientX;
            }

            const newVal = getValueFromClientX(clientX, false);
            onChange(newVal);
        },
        [disabled, getValueFromClientX, onChange]
    );

    // Зажимаем ползунок
    const handleThumbPointerDown = useCallback(
        (e: React.MouseEvent | React.TouchEvent) => {
            if (disabled) return;
            e.stopPropagation();
            e.preventDefault();

            setIsDragging(true);

            let clientX: number;
            if ("clientX" in e) {
                clientX = e.clientX;
            } else {
                clientX = e.touches[0].clientX;
            }

            if (trackRef.current) {
                const rect = trackRef.current.getBoundingClientRect();
                const thumbX = (calcPercentage(sliderValue) / 100) * rect.width;
                setDragOffset(clientX - (rect.left + thumbX));
            }
        },
        [disabled, calcPercentage, sliderValue]
    );

    const renderTicks = () => {
        if (!divisions || divisions <= 0) return null;

        const ticks = [];
        // Если делим на 7 сегментов, отрисуем 8 тиков (начало + 7 разделителей)
        for (let i = 0; i <= divisions; i++) {
            const leftPercent = (i / divisions) * 100;
            ticks.push(
                <div
                    key={i}
                    className={styles.tick}
                    style={{
                        position: "absolute",
                        left: `calc(${leftPercent}%)`,
                        // Чтобы линия была по центру, можно добавить transform:

                    }}
                />
            );
        }
        return ticks;
    };

    // Отпускаем мышь/палец
    const handlePointerUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    // Ловим движение на документе
    useEffect(() => {
        if (!isDragging) return;

        const onMove = (ev: MouseEvent | TouchEvent) => {
            ev.preventDefault();
            let clientX: number;
            if (ev instanceof MouseEvent) {
                clientX = ev.clientX;
            } else {
                if (!ev.touches[0]) return;
                clientX = ev.touches[0].clientX;
            }
            handlePointerMove(clientX, true);
        };
        const onUp = (ev: MouseEvent | TouchEvent) => {
            ev.preventDefault();
            handlePointerUp();
        };

        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onUp);
        document.addEventListener("touchmove", onMove);
        document.addEventListener("touchend", onUp);

        return () => {
            document.removeEventListener("mousemove", onMove);
            document.removeEventListener("mouseup", onUp);
            document.removeEventListener("touchmove", onMove);
            document.removeEventListener("touchend", onUp);
        };
    }, [isDragging, handlePointerMove, handlePointerUp]);

    const percentage = calcPercentage(sliderValue);

    // Определяем классы для дорожки и ползунка в зависимости от темы
    const trackClass = sliderTheme === "gradient"
        ? `${styles.customSliderTrack} ${styles.gradient}`
        : styles.customSliderTrack;

    const thumbClass = sliderTheme === "gradient"
        ? `${styles.customSliderThumb} ${styles.gradient}`
        : styles.customSliderThumb;

    // Если gradient - убираем отдельную "заливку" (т.к. вся дорожка = градиент)
    // Если default - отображаем залитую часть до значения
    return (
        <div className={styles.customSlider}>
            <div
                className={trackClass}
                ref={trackRef}
                onMouseDown={handleTrackClick}
                onTouchStart={handleTrackClick}
            >

                {sliderTheme !== "gradient" && (
                    <div
                        className={styles.customSliderTrackFill}
                        style={{ width: `${percentage}%` }}
                    />
                )}
                {divisions && (
                    <div className={styles.subline}>
                        <span className={styles.subline__text}>Облигации</span>
                        <span className={styles.subline__text}>Смешанные</span>
                        <span className={styles.subline__text}>Акции</span>
                    </div>
                )}
                <div
                    className={thumbClass}
                    style={{ left: `${percentage}%` }}
                    onMouseDown={handleThumbPointerDown}
                    onTouchStart={handleThumbPointerDown}
                />
            </div>
            {renderTicks()}
        </div>
    );
});
