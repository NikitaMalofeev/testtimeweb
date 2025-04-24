import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, ButtonTheme } from 'shared/ui/Button/Button';
import styles from './styles.module.scss';

export interface PaymentsCardProps {
    isSelected?: boolean;
    index: number;
    status: string;
    title: string;
    titleDesc: string;
    descriptionDetail?: string;
    upfront: string;
    fee: string;
    capital: string;
    imageUrl: string;
    onMore: () => void;
}

export const PaymentsCard: React.FC<PaymentsCardProps> = ({
    isSelected = false,
    index,
    status,
    titleDesc,
    title,
    descriptionDetail,
    upfront,
    fee,
    capital,
    imageUrl,
    onMore,
}) => (
    <motion.div layout initial={false} exit={{ opacity: 0 }} className={styles.card}>
        <div className={styles.cardContent}>
            <div className={styles.left}>
                <div className={styles.header}>
                    <span className={styles.subtitle}>
                        {title === 'Долгосрочный инвестор'
                            ? 'для начинающих инвесторов'
                            : 'для опытных инвесторов'}
                    </span>
                    <span className={styles.title}>{title}</span>
                </div>

                <AnimatePresence exitBeforeEnter>
                    {isSelected ? (
                        <motion.div
                            key="detail"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0, transition: { duration: 0 } }}
                            transition={{ duration: 0.3 }}
                            className={styles.detailContent}
                        >
                            <p>{descriptionDetail}</p>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="summary"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className={styles.metrics}
                        >
                            {upfront && (
                                <div className={styles.metric}>
                                    <span className={styles.metricValue}>{upfront}</span>
                                    <span className={styles.metricLabel}>Upfront Fee</span>
                                </div>
                            )}
                            {fee && (
                                <div className={styles.metric}>
                                    <span className={styles.metricValue}>{fee}</span>
                                    <span className={styles.metricLabel}>
                                        Management Fee (90 дней)
                                    </span>
                                </div>
                            )}
                            <div className={styles.metric}>
                                <span className={styles.metricValue}>{capital}</span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className={styles.right}>
                <motion.img
                    src={imageUrl}
                    alt=""
                    className={styles.icon}
                    layout
                    initial={{ scale: 1 }}
                    animate={{ scale: isSelected ? 1.05 : 1 }}
                />
            </div>
        </div>

        <div className={styles.footer}>
            <Button
                theme={ButtonTheme.UNDERLINE}
                className={styles.button}
                padding="10px 62.5px"
                onClick={onMore}
            >
                Подробнее о тарифе
            </Button>
        </div>
    </motion.div>
);
