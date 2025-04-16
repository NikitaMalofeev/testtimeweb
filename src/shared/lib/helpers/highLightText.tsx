// utils/highlightText.ts
import React from 'react';

function escapeRegExp(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function highlightText(text: string, query: string): React.ReactNode {
    if (!query) return text; // если запрос пустой, ничего не меняем

    const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, i) =>
        regex.test(part) ? <mark key={i} > {part} </mark> : part
    );
}
