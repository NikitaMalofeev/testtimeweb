// ProgressBar.tsx
import React from "react";
import styles from "./styles.module.scss";

interface ProgressBarProps {
    progress: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress }) => {
    return (
        <div className={styles.progressBarContainer}>
            <div
                className={styles.progressBarFill}
                style={{ width: `${progress}%` }}
            />
        </div>
    );
};
