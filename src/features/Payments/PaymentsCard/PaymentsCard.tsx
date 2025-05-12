import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button, ButtonTheme } from "shared/ui/Button/Button";
import { useScrollShadow } from "shared/hooks/useScrollShadow";
import styles from "./styles.module.scss";

export interface PaymentsCardProps {
    isSelected?: boolean;
    index: number;
    status: string;
    title: string;
    title_additional: string;
    titleDesc: {
        help: string;
        description: string;
    }[];
    descriptionDetail?: {
        help: string;
        description: string;
    }[] | string;
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
    title_additional,
    upfront,
    fee,
    capital,
    imageUrl,
    onMore,
}) => {
    const cardContentRef = useRef<HTMLDivElement>(null);
    const { isScrolled, isBottom } = useScrollShadow(cardContentRef, true);

    return (
        <motion.div initial={false} exit={{ opacity: 0 }} className={`
            ${styles.card}
            ${isScrolled ? styles.cardContent__shadow_top : ""}
            ${!isBottom ? styles.cardContent__shadow_bottom : ""}
          `} ref={cardContentRef}>
            <div

                className={styles.cardContent}
            >
                <div className={styles.left}>
                    <div className={styles.header}>
                        <span className={styles.subtitle}>{title_additional}</span>
                        <span className={styles.title}>{title}</span>
                    </div>

                    <AnimatePresence mode="wait">
                        {isSelected ? (
                            <motion.div
                                key="detail"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0, transition: { duration: 0 } }}
                                transition={{ duration: 0.3 }}
                                className={styles.detailContent}
                            >
                                {typeof descriptionDetail === "string" ? (
                                    <div
                                        className={styles.htmlDescription}
                                        dangerouslySetInnerHTML={{ __html: descriptionDetail }}
                                    />
                                ) : Array.isArray(descriptionDetail) &&
                                    descriptionDetail.length > 0 ? (
                                    <div className={styles.htmlDescription}>
                                        {descriptionDetail.map((item, idx) => (
                                            <div
                                                key={idx}
                                                dangerouslySetInnerHTML={{ __html: item.description }}
                                            />
                                        ))}
                                    </div>
                                ) : null}
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
                                {titleDesc.map((item, idx) => (
                                    <div
                                        key={idx}
                                        dangerouslySetInnerHTML={{ __html: item.description }}
                                        className={styles.innerHtml}
                                    />
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <motion.div layout={false} className={styles.right}>
                    <img src={imageUrl} alt="" className={styles.icon} />
                </motion.div>
            </div>

            {!isSelected && (
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
            )}
        </motion.div>
    );
};
