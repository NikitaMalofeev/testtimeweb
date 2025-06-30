import React from "react";
import { motion } from "framer-motion";
import clsx from "clsx";
import styles from "./styles.module.scss";

interface BooleanTabsProps {
    /** Заголовок левой вкладки */
    leftTitle: string;
    /** Заголовок правой вкладки */
    rightTitle: string;
    /** `'left' | 'right'` – активная вкладка */
    active: "left" | "right";
    /** Колбэк при клике по левой вкладке */
    onLeftClick: () => void;
    /** Колбэк при клике по правой вкладке */
    onRightClick: () => void;
    /** Дополнительный className, если нужен */
    className?: string;
}

const BooleanTabs: React.FC<BooleanTabsProps> = ({
    leftTitle,
    rightTitle,
    active,
    onLeftClick,
    onRightClick,
    className,
}) => (
    <div className={clsx(styles.tabs, className)}>
        {/* анимированный фон */}
        <div className={styles.tabs__container}>
            <motion.div
                className={styles.activeBg}
                animate={{ x: active === "left" ? "0%" : "100%" }}
                transition={{ duration: 0.4 }}
            />
            <div
                className={clsx(styles.tab, active === "left" && styles.tabActive)}
                onClick={onLeftClick}
            >
                {leftTitle}
            </div>
            <div
                className={clsx(styles.tab, active === "right" && styles.tabActive)}
                onClick={onRightClick}
            >
                {rightTitle}
            </div>
        </div>

    </div>
);

export default BooleanTabs;
