export function formatISOToRu(input?: string | null): string | undefined {
    if (!input) return undefined;
    // Берём только дату до "T", если вдруг пришло "2025-04-01T00:00:00"
    const datePart = String(input).split('T')[0];
    const [y, m, d] = datePart.split('-');
    if (!y || !m || !d) return input; // не ISO — возвращаем как есть
    const dd = d.padStart(2, '0');
    const mm = m.padStart(2, '0');
    return `${dd}.${mm}.${y}`;
}