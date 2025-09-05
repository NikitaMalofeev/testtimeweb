import { useCallback } from 'react';

// Конфигурация длин номеров для разных кодов стран
const PHONE_LENGTHS: Record<string, number> = {
    '+1': 10,   // США, Канада
    '+7': 10,   // Россия, Казахстан
    '+33': 9,   // Франция
    '+44': 10,  // Великобритания
    '+49': 11,  // Германия
    '+86': 11,  // Китай
    '+81': 10,  // Япония
    '+82': 10,  // Южная Корея
    '+91': 10,  // Индия
    '+39': 10,  // Италия
    '+34': 9,   // Испания
    '+55': 11,  // Бразилия
    '+52': 10,  // Мексика
    '+61': 9,   // Австралия
    '+64': 9,   // Новая Зеландия
    '+46': 9,   // Швеция
    '+47': 8,   // Норвегия
    '+45': 8,   // Дания
    '+358': 9,  // Финляндия
    '+380': 9,  // Украина
    '+375': 9,  // Беларусь
    '+374': 8,  // Армения
    '+994': 9,  // Азербайджан
    '+995': 9,  // Грузия
};

/**
 * Хук для форматирования номеров телефонов с учетом разных кодов стран
 */
export const usePhoneFormat = () => {
    const formatPhone = useCallback((value: string, countryCode: string = '+7') => {
        // Если значение уже начинается с кода страны, возвращаем как есть
        if (value.startsWith(countryCode)) {
            return value;
        }
        
        // Убираем все символы кроме цифр и плюса
        let cleanValue = value.replace(/[^\d+]/g, "");
        
        // Если начинается с плюса, оставляем как есть
        if (cleanValue.startsWith('+')) {
            return cleanValue;
        }
        
        // Если пустое значение, возвращаем код страны
        if (cleanValue.length === 0) {
            return countryCode;
        }
        
        // Добавляем код страны к цифрам
        return countryCode + cleanValue;
    }, []);

    const handlePhoneChange = useCallback(
        (onChange: (value: string) => void, countryCode: string = '+7') =>
        (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
            const formattedValue = formatPhone(e.target.value, countryCode);
            onChange(formattedValue);
        },
        [formatPhone]
    );

    const getPhoneValidationRegex = useCallback((countryCode: string) => {
        const expectedLength = PHONE_LENGTHS[countryCode] || 10;
        const codeEscaped = countryCode.replace(/[+]/g, '\\+');
        return new RegExp(`^${codeEscaped}\\d{${expectedLength}}$`);
    }, []);

    return { formatPhone, handlePhoneChange, getPhoneValidationRegex };
};