import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from 'shared/ui/Icon/Icon';
import BackIcon from 'shared/assets/svg/ArrowBack.svg';
import Accordion, { AccordionItem } from 'shared/ui/Accordeon/Accordeon';
import styles from './styles.module.scss';
import { highlightText } from 'shared/lib/helpers/highLightText';
import { Input } from 'shared/ui/Input/Input';
import { useDebounce } from 'shared/hooks/useDebounce';

// отдельный интерфейс для исходных данных с title/content строками
interface FAQRawItem {
    id: string;
    title: string;
    content: string;
}

const rawData: FAQRawItem[] = [
    {
        id: 'company',
        title: 'Как регулируется ваша деятельность?',
        content:
            'Надзор за деятельностью ООО «Ранкс», как Инвестиционного советника осуществляет Центральный Банк Российской Федерации. Номер 249 от 4.07.24 в реестре ЦБ.',
    },
    {
        id: 'docs',
        title: 'Как происходит выбор ценных бумаг?',
        content:
            'Алгоритмом отбираем лучшие компании в каждом секторе. Аналитиками Ranks анализируются бизнес-риски отобранных алгоритмом компании. Выбирается наиболее интересная для инвестиций компания и выносится на защиту перед инвестиционным комитетом.\n\nЕсли инвесткомитет проголосует за компанию, то акция попадает в инвестиционные портфели.',
    },
    {
        id: 'accounting',
        title: 'Сколько можно заработать с Ranks.Autopilot?',
        content:
            'Гарантировать доходность невозможно (незаконно), так как на рынок влияет слишком много факторов. Примеры наших кейсов можно посмотреть на сайте https://ranks.pro',
    },
    {
        id: 'affiliates',
        title: 'Что такое Инвестиционный Советник?',
        content:
            'Для регистрации необходимо заключить договор с инвестиционным советником. Договор с советником для получения инвестиционных рекомендаций в любой форме - обязательное требование ЦБ РФ.\n\nМы не передаём Ваши данные третьим лицам и храним в зашифрованном виде. Открытие брокерского счета и заключение договора с советником - две разные процедуры, не пересекающиеся между собой.',
    },
];

const FAQPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    // Подсвечиваем title и content
    const modifiedAccordionData: AccordionItem[] = useMemo(
        () =>
            rawData.map(item => ({
                id: item.id,
                title: highlightText(item.title, debouncedSearchTerm),
                content: highlightText(item.content, debouncedSearchTerm),
            })),
        [debouncedSearchTerm]
    );

    // Определяем, какие раскрыть элементы
    const matchingOpenItems = useMemo(() => {
        const term = debouncedSearchTerm.trim().toLowerCase();
        if (!term) return [];

        return rawData
            .filter(item => {
                return (
                    item.title.toLowerCase().includes(term) ||
                    item.content.toLowerCase().includes(term)
                );
            })
            .map(item => item.id);
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

                <div className={styles.searchContainer}>
                    <Input
                        type="search"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="Поиск"
                        className={styles.searchInput}
                    />
                </div>

                <Accordion
                    items={modifiedAccordionData}
                    allowMultipleOpen
                    defaultOpenItems={matchingOpenItems}
                />
            </div>
        </div>
    );
};

export default FAQPage;
