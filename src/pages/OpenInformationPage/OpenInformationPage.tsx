// OpenInformationPage.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from 'shared/ui/Icon/Icon';
import BackIcon from 'shared/assets/svg/ArrowBack.svg';
import Accordion from 'shared/ui/Accordeon/Accordeon';
import styles from './styles.module.scss';
import { accountingRows, affiliatesRows, appealsRows, companyInfo, docsRows } from 'shared/static/openInfoStatic';
import { InfoSection } from 'shared/ui/InfoSection/InfoSection';

export const accordionData = [
    {
        id: 'company',
        title: 'Информация о компании',
        content: <InfoSection rows={companyInfo} />,
    },
    {
        id: 'docs',
        title: 'Документы',
        content: <InfoSection rows={docsRows} />,
    },
    {
        id: 'accounting',
        title: 'Бухгалтерская (финансовая) отчётность',
        content: <InfoSection rows={accountingRows} />,
    },
    {
        id: 'affiliates',
        title: 'Сведения об аффилированных лицах',
        content: <InfoSection rows={affiliatesRows} />,
    },
    {
        id: 'appeals',
        title: 'Порядок рассмотрения обращений',
        content: <InfoSection rows={appealsRows} />,
    },
];

/** ===== Страница ===== */
const OpenInformationPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className={styles.page}>
            <div className={styles.page__container}>
                <div className={styles.header}>
                    <Icon
                        Svg={BackIcon}
                        width={24}
                        height={24}
                        onClick={() => navigate(-1)}
                        pointer
                    />
                    <span className={styles.page__title}>Раскрытие информации</span>
                </div>

                <div>
                    <Accordion items={accordionData} allowMultipleOpen />
                </div>
            </div>
        </div>
    );
};

export default OpenInformationPage;
