import React from 'react';
import styles from './styles.module.scss';

export const Loader = () => {
    return (
        <div className={styles.spinner__container}>
            <svg className={styles.spinner} viewBox="25 25 50 50">
                <circle
                    className={styles.path}
                    cx="50"
                    cy="50"
                    r="20"
                    fill="none"
                    strokeWidth="4"
                    strokeLinecap="round" // скруглённые края
                />
            </svg>
        </div>
    );
};
