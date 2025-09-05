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
        // Убираем все не цифры
        const digitsOnly = value.replace(/\D/g, "");
        
        // Если пустая строка, возвращаем пустую строку
        if (digitsOnly.length === 0) return "";
        
        // Получаем ожидаемую длину номера без кода страны
        const expectedLength = PHONE_LENGTHS[countryCode] || 10;
        
        // Если это россия и начинается с 8, заменяем на 7
        if (countryCode === '+7' && digitsOnly.startsWith("8")) {
            const processedDigits = "7" + digitsOnly.slice(1);
            const limitedDigits = processedDigits.slice(0, expectedLength + 1); // +1 для цифры 7
            return "+" + limitedDigits;
        }
        
        // Убираем код страны из начала если он есть
        const codeWithoutPlus = countryCode.slice(1);
        let phoneDigits = digitsOnly;
        
        if (phoneDigits.startsWith(codeWithoutPlus)) {
            phoneDigits = phoneDigits.slice(codeWithoutPlus.length);
        }
        
        // Ограничиваем до ожидаемой длины
        if (phoneDigits.length > expectedLength) {
            phoneDigits = phoneDigits.slice(0, expectedLength);
        }
        
        // Возвращаем с кодом страны
        return countryCode + phoneDigits;
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