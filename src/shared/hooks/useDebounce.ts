// useDebounce.ts
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        // Запускаем таймер, по завершении которого обновляем состояние
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        // Очищаем таймер при изменении значения или размонтировании
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
}
