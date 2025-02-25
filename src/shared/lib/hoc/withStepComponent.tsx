import React, { ReactElement } from "react";
import { useSelector } from "react-redux";
import { RootState } from "app/providers/store/config/store";
import IdentificationProfileForm from "features/RiskProfile/IdentificationForm/ui/IdentificationForm";
import { RiskProfileFirstForm } from "features/RiskProfile/RiskProfileFirstForm/RiskProfileFirstForm";
import styles from './styles.module.scss'
import { RiskProfileSecondForm } from "features/RiskProfile/RiskProfileSecondForm/RiskProfileSecondForm";
import { PasportDataForm } from "features/RiskProfile/PasportDataFrom/PasportDataForm";
import { PasportScanForm } from "features/RiskProfile/PassportScanForm/PassportScanForm";
import { ConfirmAllDocs } from "features/RiskProfile/ConfirmationAllDocs/ConfirmationAllDocs";

interface WithStepContentProps {
    onClose: () => void;
}

const stepTitles = [
    "Идентификация",
    "Риск-профилирование",
    "Уточнение риск профиля",
    "Паспортные данные",
    "Отправка документов",
    "Подписание документов",
    "Настройка подключения к брокеру",
    "Отправка документов"
];

const stepContents = [
    <IdentificationProfileForm />,
    <RiskProfileFirstForm />,
    <RiskProfileSecondForm />,
    <PasportDataForm />,
    <PasportScanForm />,
    <ConfirmAllDocs />,
    <span>В работе</span>
];

const stepTooltipDescriptions = [
    'Настройка параметров защиты цифрового профиля от несанкционированного доступа',
    'Пройдите анкетирование для определения вашего инвестиционного профиля',
    <div className={styles.description}>
        <div className={styles.description__container}>
            <span className={styles.description__title}>Текущий риск профиль</span>
            <span className={styles.description__value}>Консервативный</span>
        </div>
        <div className={styles.description__container}>
            <span className={styles.description__title}>Максимально допустимый риск профиль</span>
            <span className={styles.description__value}>Значение с бека</span>
        </div>
    </ div>,
    'Данные вводимые в форму должны совпадать с паспортными данными и свидетельством ИНН',
    ''
]



const withStepContent = (Component: React.FC<{ onClose: () => void; title: string; content: ReactElement, description: string | boolean | ReactElement }>) => {
    return ({ onClose }: WithStepContentProps) => {
        const currentStep = useSelector((state: RootState) => state.ui.additionalMenu.currentStep);

        return (
            <div >
                <Component onClose={onClose} title={stepTitles[currentStep]} content={<>{stepContents[currentStep]}</>} description={stepTooltipDescriptions[currentStep]} />
            </div>
        );
    };
};

export default withStepContent;
