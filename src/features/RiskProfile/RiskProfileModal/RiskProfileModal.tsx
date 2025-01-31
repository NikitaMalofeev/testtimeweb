import React, { useState, memo } from 'react';
import { motion } from 'framer-motion';
import { Modal } from 'shared/ui/Modal/Modal';
import { Button } from 'shared/ui/Button/Button';
import styles from './styles.module.scss';

const steps = [
    "Шаг 1 из 5",
    "Шаг 2 из 5",
    "Шаг 3 из 5",
    "Шаг 4 из 5",
    "Шаг 5 из 5",
];

interface RiskProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const modalVariants = {
    hidden: { x: "100%", opacity: 0 }, // Начальное состояние (справа)
    visible: { x: "0%", opacity: 1, transition: { duration: 0.3, ease: "easeOut" } }, // Появление
    exit: { x: "100%", opacity: 0, transition: { duration: 0.3, ease: "easeIn" } }, // Исчезновение
};

export const RiskProfileModal = memo(({ isOpen, onClose }: RiskProfileModalProps) => {
    const [currentStep, setCurrentStep] = useState(0);

    const nextStep = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep((prev) => prev + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep((prev) => prev - 1);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <motion.div
                className={styles.modalContent}
                initial="hidden"
                animate={isOpen ? "visible" : "hidden"}
                exit="exit"
                variants={modalVariants}
            >
                {/* Полоска прогресса */}
                <div className={styles.progressBar}>
                    {steps.map((_, index) => (
                        <div
                            key={index}
                            className={`${styles.progressStep} ${index <= currentStep ? styles.active : ''}`}
                        />
                    ))}
                </div>

                <div className={styles.stepControls}>
                    <Button onClick={prevStep} disabled={currentStep === 0}>
                        Назад
                    </Button>
                    <span>{currentStep + 1} из {steps.length}</span>
                    <Button onClick={nextStep} disabled={currentStep === steps.length - 1}>
                        Далее
                    </Button>
                    <Button onClick={onClose}>
                        Закрыть
                    </Button>
                </div>

                {currentStep === steps.length - 1 && (
                    <Button onClick={onClose}>Завершить</Button>
                )}
            </motion.div>
        </Modal>
    );
});
