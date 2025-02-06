import React, { ReactElement } from "react";
import { useSelector } from "react-redux";
import { RootState } from "app/providers/store/config/store";
import IdentificationProfileForm from "features/RiskProfile/IdentificationForm/ui/IdentificationForm";
import { RiskProfileFirstForm } from "features/RiskProfile/RiskProfileFirstForm/RiskProfileFirstForm";

interface WithStepContentProps {
    onClose: () => void;
}

const stepTitles = [
    "Идентификация",
    "Риск-профилирование",
    "Данные пользователя",
    "Выбор настроек",
    "Подтверждение"
];

const stepContents = [
    <IdentificationProfileForm />,
    <RiskProfileFirstForm />,
    <p>Заполните информацию о себе</p>,
    <p>Настройте параметры</p>,
    <p>Подтвердите и завершите</p>
];



const withStepContent = (Component: React.FC<{ onClose: () => void; title: string; content: ReactElement, description: string | boolean }>) => {
    return ({ onClose }: WithStepContentProps) => {
        const currentStep = useSelector((state: RootState) => state.ui.additionalMenu.currentStep);

        return (
            <div style={{ height: '100%' }}>
                <Component onClose={onClose} title={stepTitles[currentStep]} content={<div>{stepContents[currentStep]}</div>} description={currentStep === 1 && 'Пройдите анкетирование для определения вашего инвестиционного профиля'} />
            </div>
        );
    };
};

export default withStepContent;
