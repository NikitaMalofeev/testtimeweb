import React, { useState, useRef, useCallback, useEffect } from "react";
import styles from "./styles.module.scss";

interface CustomSliderProps {
    sliderValue: number; // Текущее числовое значение
    min: number;
    max: number;
    step?: number;
    disabled?: boolean;
    onChange: (val: number) => void; // Вызывается, когда значение меняется
}

export const CustomSlider: React.FC<CustomSliderProps> = ({
    sliderValue,
    min,
    max,
    step = 1,
    disabled,
    onChange,
}) => {
    const trackRef = useRef<HTMLDivElement | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    // Сохраним «смещение» (offset) между точкой клика и центром ползунка,
    // чтобы при драге «ползунок» не прыгал под курсор:
    const [dragOffset, setDragOffset] = useState();

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

    // Процент заполнения (0% - слева, 100% - справа)
    const calcPercentage = useCallback(
        (val: number) => ((val - min) / (max - min)) * 100,
        [min, max]
    );

    // Переводим координату (clientX) в новое значение по формуле
    const getValueFromClientX = useCallback(
        (clientX: number, withOffset = false) => {
            if (!trackRef.current) return sliderValue;
            const rect = trackRef.current.getBoundingClientRect();
            // Позиция клика внутри трека:
            let x = clientX - rect.left;

            // Если учитываем смещение (для случая, когда тянем ползунок)
            if (withOffset) {
                x -= dragOffset;
            }

            // Ограничим диапазон, чтобы не выходить за трек
            if (x < 0) x = 0;
            if (x > rect.width) x = rect.width;

            // Переводим x в процент, а затем в абсолютное значение
            const percent = x / rect.width;
            const rawVal = min + percent * (max - min);

            return snapToStep(rawVal);
        },
        [trackRef, min, max, dragOffset, snapToStep, sliderValue]
    );

    // Когда двигается мышь/палец
    const handlePointerMove = useCallback(
        (clientX: number, withOffset: boolean) => {
            const newVal = getValueFromClientX(clientX, withOffset);
            onChange(newVal);
        },
        [onChange, getValueFromClientX]
    );

    // Когда нажимаем на дорожку (клик) — сразу ставим ползунок в эту точку
    // (без смещения)
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

    // Когда зажимаем сам «ползунок» (чтобы тянуть):
    const handleThumbPointerDown = useCallback(
        (e: React.MouseEvent | React.TouchEvent) => {
            if (disabled) return;
            e.stopPropagation(); // Чтобы не сработал клик по треку
            e.preventDefault();

            setIsDragging(true);

            let clientX: number;
            if ("clientX" in e) {
                clientX = e.clientX;
            } else {
                clientX = e.touches[0].clientX;
            }

            // Рассчитаем текущее положение thumb, чтобы понять offset:
            if (trackRef.current) {
                const rect = trackRef.current.getBoundingClientRect();
                const thumbX = (calcPercentage(sliderValue) / 100) * rect.width;
                // offset от центра ползунка:
                setDragOffset(clientX - (rect.left + thumbX));
            }
        },
        [disabled, calcPercentage, sliderValue]
    );

    // Когда отпускаем мышь/палец:
    const handlePointerUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    // Document-level events, чтобы следить за движением даже за пределами трека
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

    return (
        <div className={styles.customSlider}>
            {/* Дорожка */}
            <div
                className={styles.customSliderTrack}
                ref={trackRef}
                onMouseDown={handleTrackClick}
                onTouchStart={handleTrackClick}
            >
                {/* Заполненная часть (до ползунка) */}
                <div
                    className={styles.customSliderTrackFill}
                    style={{ width: `${percentage}%` }}
                />
                {/* Ползунок */}
                <div
                    className={styles.customSliderThumb}
                    style={{ left: `${percentage}%` }}
                    onMouseDown={handleThumbPointerDown}
                    onTouchStart={handleThumbPointerDown}
                />
            </div>
        </div>
    );
};
