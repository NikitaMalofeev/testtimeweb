import React, { ReactElement } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Button } from "shared/ui/Button/Button";
import styles from "./styles.module.scss";
import { RootState } from "app/providers/store/config/store";
import { nextStep, prevStep } from "entities/ui/Ui/slice/uiSlice";

const steps = ["Шаг 1 из 5", "Шаг 2 из 5", "Шаг 3 из 5", "Шаг 4 из 5", "Шаг 5 из 5"];

interface AdditionalMenuProps {
    onClose: () => void;
    title: string;
    content: ReactElement
}

export const AdditionalMenu: React.FC<AdditionalMenuProps> = ({ onClose, title, content }) => {
    const dispatch = useDispatch();
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

            <div className={styles.header}>
                <h2>{steps[currentStep]} - {title}</h2>
            </div>

            <div>{content}</div>

            <div className={styles.stepControls}>
                <Button onClick={() => dispatch(prevStep())} disabled={currentStep === 0}>
                    Назад
                </Button>
                <Button onClick={() => {
                    dispatch(nextStep())
                    console.log('нажатие')
                }} disabled={currentStep === steps.length - 1}>
                    Далее
                </Button>
                {currentStep === steps.length - 1 ? (
                    <Button onClick={onClose}>Завершить</Button>
                ) : (
                    <Button onClick={onClose}>Закрыть</Button>
                )}
            </div>
        </div>
    );
};
