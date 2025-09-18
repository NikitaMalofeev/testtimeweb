/**
 * Форматирует число в читаемый формат с разделителями
 * @param value - число для форматирования (например, 3000000.0)
 * @returns отформатированная строка (например, "1 000 000")
 */
export const formatNumberWithSpaces = (value: number | string | null | undefined): string => {
    if (value === null || value === undefined) return '';

    // Преобразуем в число и округляем до целого
    const num = typeof value === 'number'
        ? Math.round(value)
        : Math.round(Number(String(value).replace(/[^\d.-]/g, '')));

    if (!isFinite(num)) return '';

    // Добавляем пробелы между тысячами
    return String(num).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

/**
 * Форматирует число для отображения с валютой
 * @param value - число для форматирования
 * @returns отформатированная строка с рублями (например, "1 000 000 ₽")
 */
export const formatCurrency = (value: number | string | null | undefined): string => {
    const formatted = formatNumberWithSpaces(value);
    return formatted ? `${formatted} ₽` : '';
};