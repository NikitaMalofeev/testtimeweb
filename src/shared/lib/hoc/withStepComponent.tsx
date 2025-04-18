import React, { ReactElement } from "react";
import { useSelector } from "react-redux";
import { RootState } from "app/providers/store/config/store";
import IdentificationProfileForm from "features/RiskProfile/IdentificationForm/ui/IdentificationForm";
import { RiskProfileFirstForm } from "features/RiskProfile/RiskProfileFirstForm/RiskProfileFirstForm";
import styles from './styles.module.scss';
import { RiskProfileSecondForm } from "features/RiskProfile/RiskProfileSecondForm/RiskProfileSecondForm";
import { PasportDataForm } from "features/RiskProfile/PasportDataFrom/PasportDataForm";
import { PasportScanForm } from "features/RiskProfile/PassportScanForm/PassportScanForm";
import { ConfirmAllDocs } from "features/RiskProfile/ConfirmationAllDocs/ConfirmationAllDocs";
import { BrokerConnectionForm } from "features/RiskProfile/BrokerConnectionForm/BrokerConnectionForm";

interface WithStepContentProps {
    onClose: () => void;
}

const stepTitles = [
    "Риск-профилирование",
    "Уточнение риск профиля",
    "Паспортные данные",
    "Отправка документов",
    "Подписание документов",
    "Настройка подключения к брокеру",
    "Отправка документов"
];

const stepContents = [
    <RiskProfileFirstForm />,
    <RiskProfileSecondForm />,
    <PasportDataForm />,
    <PasportScanForm />,
    <ConfirmAllDocs />,
    <BrokerConnectionForm />
];

const withStepContent = (
    Component: React.FC<{
        onClose: () => void;
        title: string;
        content: ReactElement;
        description: string | boolean | ReactElement;
    }>
) => {
    // Возвращаем компонент-функцию, внутри которого можно безопасно использовать хуки
    return ({ onClose }: WithStepContentProps) => {
        // Теперь хуки вызываются внутри тела функционального компонента
        const maxRiskProfile = useSelector((state: RootState) => {
            const profiles = state.riskProfile.secondRiskProfileData?.recommended_risk_profiles;
            if (profiles) {
                const profilesArray = Object.values(profiles);
                return profilesArray.length > 0
                    ? profilesArray[profilesArray.length - 1]
                    : null;
            }
            return null;
        });

        const currentStep = useSelector((state: RootState) => state.ui.additionalMenu.currentStep);

        const stepTooltipDescriptions = [
            'Пройдите анкетирование для определения вашего инвестиционного профиля',
            <div className={styles.description}>
                <div className={styles.description__container}>
                    <span className={styles.description__title}>Максимально допустимый риск профиль</span>
                    {/* Если нужно, можно вставить maxRiskProfile, например:
                    <span className={styles.description__value}>{maxRiskProfile}</span> */}
                </div>
            </div>,
            'Данные вводимые в форму должны совпадать с паспортными данными и свидетельством ИНН',
            'Данные вводимые в форму должны совпадать с паспортными данными и свидетельством ИНН',
            'Подписание документов по "ЭДО"'
        ];

        return (
            <div>
                <Component
                    onClose={onClose}
                    title={stepTitles[currentStep]}
                    content={<>{stepContents[currentStep]}</>}
                    description={stepTooltipDescriptions[currentStep]}
                />
            </div>
        );
    };
};

export default withStepContent;
