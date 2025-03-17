import React, { ReactElement, useState, CSSProperties } from "react";
import styles from "./styles.module.scss";
import { Icon } from "shared/ui/Icon/Icon";
import QuestionIcon from "shared/assets/svg/question.svg";
import WhiteQuestionIcon from "shared/assets/svg/questionWhite.svg";
import { classNames, Mods } from "shared/lib/helpers/classNames/classNames";

// Общие пропсы для тултипа
interface TooltipCommonProps {
    description: string | boolean | ReactElement;
    className?: string;
    topForCenteringIcons: string;
    squerePosition?: {
        top?: string;
        left?: string;
        right?: string;
        bottom?: string
    };
    bigContentSquerePosition?: {
        top: string;
        left?: string;
        right?: string;
    };
}

// Случай, когда тултип используется как раньше (без направления "top"):
interface TooltipDefaultProps extends TooltipCommonProps {
    positionBox: {
        top: string;
        left?: string;
        right?: string;
    };
    direction?: 'bottom' | 'top' | 'left';
}

// Случай, когда передаём direction="top" — позиционирование можно не указывать
interface TooltipTopProps extends TooltipCommonProps {
    direction: "top";
    positionBox?: {
        top?: string;
        left?: string;
        right?: string;
    };
}

type TooltipProps = TooltipDefaultProps | TooltipTopProps;

export const Tooltip = ({
    description,
    className,
    positionBox,
    topForCenteringIcons,
    squerePosition,
    bigContentSquerePosition,
    direction,
}: TooltipProps) => {
    const [isHovered, setIsHovered] = useState(false);

    const mods: Mods = {
        [styles["tooltip__icon--hovered"]]: isHovered,
    };

    // Подготавливаем стили для стрелочки (квадратика)
    let arrowStyle: CSSProperties =
        ((squerePosition ?? bigContentSquerePosition) || {});

    // Если направление "top", используем дефолтное позиционирование для тултип-бокса,
    // позволяя переопределить его через positionBox (если передано)
    let boxStyle: CSSProperties;
    if (direction === "top") {
        boxStyle = {
            bottom: "calc(100% + 8px)", // отступ между иконкой и боксом
            left: "50%",
            transform: "translateX(-50%)",
            ...(positionBox || {}), // если передали свои стили, они будут применены
        };

        arrowStyle = {

            left: "50%",
            transform: "translateX(-50%) rotate(45deg)",
            ...arrowStyle,
        };
    } else if (direction === "bottom") {
        boxStyle = {
            bottom: "calc(100% + 8px)", // отступ между иконкой и боксом
            left: "0",
            transform: "translateX(-50%)",
            ...(positionBox || {}), // если передали свои стили, они будут применены
        };

        arrowStyle = {

            left: "50%",
            transform: "translateX(-50%) rotate(45deg)",
            ...arrowStyle,
        };
    } else if (direction === "left") {
        boxStyle = {
            ...(positionBox || {}), // если передали свои стили, они будут применены
        };

        arrowStyle = {
            top: '35%',
            ...arrowStyle,
        };
    } else {
        // Для остальных вариантов используем переданное позиционирование
        // (оно обязательно для совместимости с уже существующим использованием)
        boxStyle = positionBox as CSSProperties;
    }

    return (
        <div
            className={classNames(styles.tooltip__container, {}, [className])}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className={classNames(styles.tooltip__icon, mods)} />
            {isHovered ? (
                <Icon
                    Svg={WhiteQuestionIcon}
                    height={12}
                    width={7}
                    className={styles.tooltip__icon__svg}
                />
            ) : (
                <Icon
                    Svg={QuestionIcon}
                    height={12}
                    width={7}
                    className={styles.tooltip__icon__svg}
                />
            )}

            {isHovered && (
                <div className={styles.tooltip__box} style={boxStyle} onClick={() => setIsHovered(false)}>
                    <div className={styles.tooltip__content}>{description}</div>
                    <div className={styles.tooltip__square} style={arrowStyle} />
                </div>
            )}
        </div>
    );
};
