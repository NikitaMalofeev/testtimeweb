// FAQPage.tsx
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from 'shared/ui/Icon/Icon';
import BackIcon from 'shared/assets/svg/ArrowBack.svg';
import Accordion, { AccordionItem } from 'shared/ui/Accordeon/Accordeon';
import styles from './styles.module.scss';
import { highlightText } from 'shared/lib/helpers/highLightText';
import { Input } from 'shared/ui/Input/Input';
import { useDebounce } from 'shared/hooks/useDebounce';

export const accordionData: AccordionItem[] = [
    {
        id: 'company',
        title: 'Как регулируется ваша деятельность?',
        content: 'Надзор за деятельностью ООО «Ранкс», как Инвестиционного советника осуществляет Центральный Банк Российской Федерации. Номер 249 от 4.07.24 в реестре ЦБ.',
    },
    {
        id: 'docs',
        title: 'Как происходит выбор ценных бумаг?',
        content: 'Алгоритмом отбираем лучшие компании в каждом секторе. Аналитиками Ranks анализируются бизнес-риски отобранных алгоритмом компании. Выбирается наиболее интересная для инвестиций компания и выносится на защиту перед инвестиционным комитетом. \n\n Если инвесткомитет проголосует за компанию, то акция попадает в инвестиционные портфели',
    },
    {
        id: 'accounting',
        title: 'Сколько можно заработать с Ranks.Autopilot?',
        content: (
            <span className={styles.item}>
                Гарантировать доходность невозможно (незаконно), так как на рынок влияет слишком много факторов. Примеры наших кейсов можно посмотреть на сайте{' '}
                <a href='https://ranks.pro' target='_blank' rel="noreferrer">
                    https://ranks.pro
                </a>
            </span>
        ),
    },
    {
        id: 'affiliates',
        title: 'Что такое Инвестиционный Советник?',
        content: 'Для регистрации необходимо заключить договор с инвестиционным советником. Договор с советником для получения инвестиционных рекомендаций в любой форме - обязательное требование ЦБ РФ. \n\n Мы не передаём Ваши данные третьим лицам и храним в зашифрованном виде. Открытие брокерского счета и заключение договора с советником - две разные процедуры, не пересекающиеся между собой.',
    },
];

const FAQPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    // Используем дебаунс с задержкой 500 мс
    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    // Применяем highlightText к контенту, если это строка
    const modifiedAccordionData = accordionData.map(item => {
        if (typeof item.content === 'string') {
            return {
                ...item,
                content: highlightText(item.content, debouncedSearchTerm),
            };
        }
        return item;
    });

    // Находим id элементов, где в title или content (если текст) встречается поисковая строка
    const matchingOpenItems = useMemo(() => {
        if (!debouncedSearchTerm.trim()) return [];
        return accordionData.filter(item => {
            const lowerTerm = debouncedSearchTerm.toLowerCase();
            // Проверяем заголовок и контент (если он строка)
            const titleMatch = item.title.toLowerCase().includes(lowerTerm);
            const contentMatch = typeof item.content === 'string' && item.content.toLowerCase().includes(lowerTerm);
            return titleMatch || contentMatch;
        }).map(item => item.id);
    }, [debouncedSearchTerm]);

    return (
        <div className={styles.page}>
            <div className={styles.page__container}>
                <div className={styles.header}>
                    <Icon
                        Svg={BackIcon}
                        width={24}
                        height={24}
                        onClick={() => navigate(-1)}
                    />
                    <span className={styles.page__title}>FAQ</span>
                </div>

                {/* Поисковый инпут */}
                <div className={styles.searchContainer}>
                    <Input
                        type="search"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Поиск"
                        className={styles.searchInput}
                    />
                </div>

                <div>
                    {/* Передаём найденные для поиска id в Accordion через проп (например, defaultOpenItems) */}
                    <Accordion items={modifiedAccordionData} allowMultipleOpen defaultOpenItems={matchingOpenItems} />
                </div>
            </div>
        </div>
    );
};

export default FAQPage;
