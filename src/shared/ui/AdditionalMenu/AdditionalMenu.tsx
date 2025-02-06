import React, { ReactElement } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Button } from "shared/ui/Button/Button";
import styles from "./styles.module.scss";
import { RootState } from "app/providers/store/config/store";
import { nextStep, prevStep } from "entities/ui/Ui/slice/uiSlice";
import { Tooltip } from "../Tooltip/Tooltip";

const steps = ["Шаг 1 из 5", "Шаг 2 из 5", "Шаг 3 из 5", "Шаг 4 из 5", "Шаг 5 из 5"];

interface AdditionalMenuProps {
    onClose: () => void;
    title: string;
    content: ReactElement;
    description: string | boolean;
}

export const AdditionalMenu: React.FC<AdditionalMenuProps> = ({ onClose, title, content, description }) => {
    const currentStep = useSelector((state: RootState) => state.ui.additionalMenu.currentStep);

    return (
        <div className={styles.additionalMenu}>
            <div className={styles.progressBar}>
                {steps.map((_, index) => {
                    const isActive = index <= currentStep;
                    return (
                        <div
                            key={index}
                            className={`${styles.progressStep} ${isActive ? styles.active : ""}`}
                        />
                    );
                })}
            </div>

            <div className={styles.additionalMenu__container}>
                <div className={styles.header}>
                    <span className={styles.header__steps}>{steps[currentStep]} </span>
                    <h2 className={styles.header__title}>{title}</h2>
                    <Tooltip description={description} className={styles.header__tooltip}/>
                </div>

                <div>{content}</div>
            </div>
        </div>
    );
};
