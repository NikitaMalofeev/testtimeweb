import { useCallback } from 'react';

/**
 * Хук для форматирования номеров телефонов в формате +7XXXXXXXXXX
 * Всегда начинается с +7, всегда длина 12 символов (+7 + 10 цифр)
 */
export const usePhoneFormat = () => {
    const formatPhone = useCallback((value: string) => {
        // Убираем все не цифры
        const digitsOnly = value.replace(/\D/g, "");
        
        // Если пустая строка, возвращаем пустую строку
        if (digitsOnly.length === 0) return "";
        
        // Если начинается с 8, заменяем на 7
        let processedDigits = digitsOnly;
        if (processedDigits.startsWith("8")) {
            processedDigits = "7" + processedDigits.slice(1);
        }
        
        // Если не начинается с 7, добавляем 7 в начало
        if (!processedDigits.startsWith("7")) {
            processedDigits = "7" + processedDigits;
        }
        
        // Ограничиваем до 11 цифр (7 + 10 цифр)
        if (processedDigits.length > 11) {
            processedDigits = processedDigits.slice(0, 11);
        }
        
        // Возвращаем с плюсом
        return "+" + processedDigits;
    }, []);

    const handlePhoneChange = useCallback(
        (onChange: (value: string) => void) =>
        (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
            const formattedValue = formatPhone(e.target.value);
            onChange(formattedValue);
        },
        [formatPhone]
    );

    return { formatPhone, handlePhoneChange };
};