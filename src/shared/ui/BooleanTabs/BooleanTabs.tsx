import React from "react";
import { motion } from "framer-motion";
import clsx from "clsx";
import styles from "./styles.module.scss";
import { Tooltip } from "../Tooltip/Tooltip";
import { useDevice } from "shared/hooks/useDevice";

interface BooleanTabsProps {
    leftTitle: string;
    rightTitle: string;
    active: "left" | "right";
    onLeftClick: () => void;
    onRightClick: () => void;
    className?: string;
    size?: "normal" | "small"; // уже было, используем
    description?: string
}

const BooleanTabs: React.FC<BooleanTabsProps> = ({
    leftTitle,
    rightTitle,
    active,
    onLeftClick,
    onRightClick,
    className,
    description,
    size = "normal",
}) => {
    return (
        <div className={styles.container}>
            <div
                className={clsx(
                    styles.tabs,
                    size === "small" && styles.tabsSmall,
                    className
                )}
            >
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
            {description && <Tooltip
                positionBox={{ top: "16px", left: "30px" }}
                squerePosition={{ top: "6px", left: "-2px" }}
                topForCenteringIcons="24px"
                className={styles.tooltip}
                description={description}
            />}
        </div>
    )
}

export default BooleanTabs;
