import React, { ReactElement } from "react";
import { useSelector } from "react-redux";
import { RootState } from "app/providers/store/config/store";
import IdentificationProfileForm from "features/RiskProfile/IdentificationForm/ui/IdentificationForm";

interface WithStepContentProps {
    onClose: () => void;
}

const stepTitles = [
    "Идентификация",
    "Картошка",
    "Данные пользователя",
    "Выбор настроек",
    "Подтверждение"
];

const stepContents = [
    <IdentificationProfileForm />,
    <p>Выберите тип картошки</p>,
    <p>Заполните информацию о себе</p>,
    <p>Настройте параметры</p>,
    <p>Подтвердите и завершите</p>
];

const withStepContent = (Component: React.FC<{ onClose: () => void; title: string; content: ReactElement }>) => {
    return ({ onClose }: WithStepContentProps) => {
        const currentStep = useSelector((state: RootState) => state.ui.additionalMenu.currentStep);

        return (
            <div>
                <Component onClose={onClose} title={stepTitles[currentStep]} content={<div>{stepContents[currentStep]}</div>} />
            </div>
        );
    };
};

export default withStepContent;
