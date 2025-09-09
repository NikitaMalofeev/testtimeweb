import { useCallback } from 'react';

/**
 * Хук для автоматической капитализации первой буквы в полях ФИО
 * Делает первую букву заглавной как в визуале, так и в значении формы
 */
export const useCapitalizeName = () => {
    const capitalizeName = useCallback((value: string) => {
        if (!value) return value;
        
        // Заменяем первую букву на заглавную
        return value.charAt(0).toUpperCase() + value.slice(1);
    }, []);

    const handleNameChange = useCallback(
        (onChange: (value: string) => void, sanitizeRegex?: RegExp) =>
        (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
            let value = e.target.value;
            
            // Применяем дополнительную санитизацию если передана
            if (sanitizeRegex) {
                value = value.replace(sanitizeRegex, "");
            }
            
            // Капитализируем первую букву
            const capitalizedValue = capitalizeName(value);
            
            // Передаем обработанное значение в onChange
            onChange(capitalizedValue);
        },
        [capitalizeName]
    );

    return { capitalizeName, handleNameChange };
};