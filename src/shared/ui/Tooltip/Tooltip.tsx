import React, { useState } from "react";
import styles from "./styles.module.scss";
import { Icon } from "shared/ui/Icon/Icon";
import QuestionIcon from 'shared/assets/svg/question.svg';
import WhiteQuestionIcon from 'shared/assets/svg/questionWhite.svg';
import { classNames, Mods } from "shared/lib/helpers/classNames/classNames";

interface TooltipProps {
    description: string | boolean;
    className?: string;
}

export const Tooltip = ({ description, className }: TooltipProps) => {
    const [isHovered, setIsHovered] = useState(false);

    const mods: Mods = {
        [styles["tooltip__icon--hovered"]]: isHovered,
    };

    return (
        <div
            className={classNames(styles.tooltip__container, {}, [className])}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className={classNames(styles.tooltip__icon, mods)} />
            {isHovered ? (
                <Icon Svg={WhiteQuestionIcon} height={12} width={7} className={styles.tooltip__icon__svg} />
            ) : (
                <Icon Svg={QuestionIcon} height={12} width={7} className={styles.tooltip__icon__svg} />
            )}

            {isHovered && (
                <div className={styles.tooltip__box}>
                    <div className={styles.tooltip__content}>{description}</div>
                    <div className={styles.tooltip__square} />
                </div>
            )}
        </div>
    );
};
