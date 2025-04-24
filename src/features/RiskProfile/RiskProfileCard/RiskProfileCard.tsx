import React from 'react';
import styles from './styles.module.scss';
import { RiskProfileData } from 'shared/static/riskProfiles';

export const RiskProfileCard: React.FC<RiskProfileData> = ({
    title,
    description,
    stocks,
    bonds,
    income,
    risk
}) => (
    <div className={styles.card}>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.description}>{description}</p>
        <div className={styles.metrics}>
            <div className={styles.metric}>
                <div className={styles.metricValue}>{stocks}%</div>
                <div className={styles.metricLabel}>Акции</div>
            </div>
            <div className={styles.metric}>
                <div className={styles.metricValue}>{bonds}%</div>
                <div className={styles.metricLabel}>Облигации</div>
            </div>
            <div className={styles.metric}>
                <div className={styles.metricValue}>{income}%</div>
                <div className={styles.metricLabel}>Доход</div>
            </div>
            <div className={styles.metric}>
                <div className={styles.metricValue}>{risk}%</div>
                <div className={styles.metricLabel}>Риск</div>
            </div>
        </div>
    </div>
);
