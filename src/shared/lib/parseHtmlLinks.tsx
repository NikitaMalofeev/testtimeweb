import React from 'react';

export interface ParsedTextElement {
  type: 'text' | 'link';
  content: string;
  href?: string;
}

/**
 * Парсит HTML ссылки в тексте и возвращает массив элементов
 */
export const parseHtmlLinks = (text: string): ParsedTextElement[] => {
  if (!text) return [];

  // Регулярка для поиска <a> тегов
  const linkRegex = /<a\s+[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([^<]*)<\/a>/gi;
  const elements: ParsedTextElement[] = [];
  let lastIndex = 0;
  let match;

  while ((match = linkRegex.exec(text)) !== null) {
    // Добавляем текст до ссылки
    if (match.index > lastIndex) {
      const beforeText = text.slice(lastIndex, match.index);
      if (beforeText) {
        elements.push({
          type: 'text',
          content: beforeText
        });
      }
    }

    // Добавляем ссылку
    elements.push({
      type: 'link',
      content: match[2] || 'Ссылка', // текст ссылки или дефолтный
      href: match[1] // URL
    });

    lastIndex = match.index + match[0].length;
  }

  // Добавляем оставшийся текст после последней ссылки
  if (lastIndex < text.length) {
    const remainingText = text.slice(lastIndex);
    if (remainingText) {
      elements.push({
        type: 'text',
        content: remainingText
      });
    }
  }

  // Если не найдено ссылок, возвращаем весь текст как один элемент
  if (elements.length === 0) {
    elements.push({
      type: 'text',
      content: text
    });
  }

  return elements;
};

/**
 * Рендерит парсированный текст с ссылками
 */
export const renderParsedText = (
  text: string,
  linkStyle?: React.CSSProperties,
  onLinkClick?: (href: string) => void
): React.ReactNode => {
  const elements = parseHtmlLinks(text);

  return elements.map((element, index) => {
    if (element.type === 'link') {
      return (
        <a
          key={index}
          href={element.href}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: '#1890ff',
            textDecoration: 'underline',
            cursor: 'pointer',
            ...linkStyle
          }}
          onClick={(e) => {
            if (onLinkClick) {
              e.preventDefault();
              onLinkClick(element.href!);
            }
          }}
        >
          {element.content}
        </a>
      );
    }

    return (
      <span key={index}>{element.content}</span>
    );
  });
};