import React, { ReactElement, useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import { RootState } from "app/providers/store/config/store";
import { Tooltip } from "../Tooltip/Tooltip";
import styles from "./styles.module.scss";
import { setIsBottom } from "entities/ui/Ui/slice/uiSlice";
import { useAppDispatch } from "shared/hooks/useAppDispatch";

const steps = ["Шаг 1 из 5", "Шаг 2 из 5", "Шаг 3 из 5", "Шаг 4 из 5", "Шаг 5 из 5"];

interface AdditionalMenuProps {
    onClose: () => void;
    title: string;
    content: ReactElement;
    description: string | boolean;
}

export const AdditionalMenu: React.FC<AdditionalMenuProps> = ({ onClose, title, content, description }) => {
    const currentStep = useSelector((state: RootState) => state.ui.additionalMenu.currentStep);
    const containerRef = useRef<HTMLDivElement>(null);
    const [hasScrolled, setHasScrolled] = useState(false);
    const dispatch = useAppDispatch()

    useEffect(() => {
        const handleScroll = () => {
            if (containerRef.current) {
                const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
                setHasScrolled(scrollTop > 0);

                const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1; // -1 для учета округления
                dispatch(setIsBottom(isAtBottom));
            }
        };

        const container = containerRef.current;
        if (container) {
            container.addEventListener("scroll", handleScroll);
        }

        return () => {
            if (container) {
                container.removeEventListener("scroll", handleScroll);
            }
        };
    }, []);

    return (
        <div className={styles.additionalMenu}>
            <div className={styles.progressBar}>
                {steps.map((_, index) => (
                    <div
                        key={index}
                        className={`${styles.progressStep} ${index <= currentStep ? styles.active : ""}`}
                    />
                ))}
            </div>

            <div ref={containerRef} className={`${styles.additionalMenu__container} ${hasScrolled ? styles.additionalMenu__container_scrolled : ""}`}>
                <div className={`${styles.header} ${hasScrolled ? styles.shadow : ""}`}>
                    <span className={styles.header__steps}>{steps[currentStep]}</span>
                    <h2 className={styles.header__title}>{title}</h2>
                    <Tooltip description={description} className={`${styles.header__tooltip} ${hasScrolled ? styles.header__tooltip_scrolled : ""}`} />
                </div>

                {content}
            </div>
        </div>
    );
};
