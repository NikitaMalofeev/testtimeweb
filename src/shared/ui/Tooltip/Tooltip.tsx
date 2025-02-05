import React, { useState } from "react";
import styles from "./styles.module.scss";
import { Icon } from "shared/ui/Icon/Icon";
import QuestionIcon from 'shared/assets/svg/question.svg'
import WhiteQuestionIcon from 'shared/assets/svg/questionWhite.svg'

const Tooltip: React.FC = () => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div
            className={styles.tooltip__container}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div
                className={`${styles.tooltip__icon} ${isHovered ? styles["tooltip__icon--hovered"] : ""
                    }`}
            />
            {isHovered ? (
                <Icon Svg={WhiteQuestionIcon} height={12} width={7} className={styles.tooltip__icon__svg} />
            ) : (
                <Icon Svg={QuestionIcon} height={12} width={7} className={styles.tooltip__icon__svg} />
            )}


            {isHovered && (
                <div className={styles.tooltip__box}>
                    <div className={styles.tooltip__content}>
                        Настройка параметров защиты цифрового профиля от
                        несанкционированного доступа
                    </div>
                    <div className={styles.tooltip__square} />
                </div>
            )}
        </div>
    );
};

export default Tooltip;
